import { useMemo } from 'react';
import type { Frame } from '../engine/player';
import type { BarState, Step } from '../engine/types';
import type { AlgorithmKey } from '../engine/registry';
import { buildMergeSegments, buildQuickSegments, flatten, maxDepth } from '../engine/treeModel';
import { useElementSize } from '../hooks/useElementSize';

interface Props {
  algorithmKey: AlgorithmKey;
  input: readonly number[];
  frame: Frame;
  steps: readonly Step[];
  speed: number;
  statusLabel: string;
}

const SNAP_SPEED = 20;

const STATE_FILL: Record<BarState, string> = {
  default: 'var(--color-bar-default)',
  comparing: 'var(--color-bar-comparing)',
  swapping: 'var(--color-bar-swapping)',
  overwriting: 'var(--color-bar-overwriting)',
  pivot: 'var(--color-bar-pivot)',
  sorted: 'var(--color-bar-sorted)',
};

const key = (lo: number, hi: number) => `${lo}-${hi}`;

/** Per-position values/states derived from the id-indexed frame. */
function byPosition(frame: Frame): { values: number[]; states: BarState[] } {
  const n = frame.heights.length;
  const values = new Array<number>(n);
  const states = new Array<BarState>(n);
  for (let id = 0; id < n; id++) {
    values[frame.posOf[id]] = frame.heights[id];
    states[frame.posOf[id]] = frame.state[id];
  }
  return { values, states };
}

/**
 * Which ranges have been divided (and which are combining) as of the current
 * step. This is what makes the tree *grow* — a node only exists once its
 * `divide` step has actually executed.
 */
function useRecursionProgress(steps: readonly Step[], index: number) {
  return useMemo(() => {
    const divided = new Set<string>();
    const combining = new Set<string>();
    let current: string | null = null;
    for (let k = 0; k < index && k < steps.length; k++) {
      const s = steps[k];
      if (s.type === 'divide') {
        divided.add(key(s.lo, s.hi));
        current = key(s.lo, s.hi);
      } else if (s.type === 'combine') {
        combining.add(key(s.lo, s.hi));
        current = key(s.lo, s.hi);
      }
    }
    return { divided, combining, current };
  }, [steps, index]);
}

/** Heapsort: the array *is* a binary tree (children of p are 2p+1 / 2p+2). */
function HeapTree({ frame, width, height }: { frame: Frame; width: number; height: number }) {
  const n = frame.heights.length;
  const { values, states } = byPosition(frame);
  const depth = Math.floor(Math.log2(Math.max(1, n))) + 1;
  const levelH = Math.min(72, (height - 40) / Math.max(1, depth - 1) || 72);
  const bottomCount = 2 ** (depth - 1);
  const r = Math.max(5, Math.min(17, (width / bottomCount) * 0.36));
  const showValues = r >= 11;

  const cx = (p: number): number => {
    const d = Math.floor(Math.log2(p + 1));
    const k = p + 1 - 2 ** d;
    return ((k + 0.5) / 2 ** d) * width;
  };
  const cy = (p: number): number => Math.floor(Math.log2(p + 1)) * levelH + r + 12;

  return (
    <svg width="100%" height={cy(n - 1) + r + 12} role="img" aria-label="Heap as a binary tree">
      {Array.from({ length: n }, (_, p) => {
        const parent = p > 0 ? (p - 1) >> 1 : null;
        return parent === null ? null : (
          <line
            key={`e${p}`}
            className="tree-edge"
            x1={cx(parent)}
            y1={cy(parent)}
            x2={cx(p)}
            y2={cy(p)}
          />
        );
      })}
      {Array.from({ length: n }, (_, p) => (
        <g key={`n${p}`}>
          <circle className="tree-node" cx={cx(p)} cy={cy(p)} r={r} fill={STATE_FILL[states[p]]} />
          {showValues && (
            <text
              className="tree-value"
              x={cx(p)}
              y={cy(p)}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={Math.min(11, r * 0.85)}
            >
              {values[p]}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

/**
 * Merge / Quicksort: a real recursion tree that is *built as it runs*. Each
 * node pops in exactly when its `divide` step executes, edges draw from parent
 * to child, the node currently combining glows, and finished ranges go green.
 * Stepping backwards un-draws the tree, because it is derived purely from the
 * step index.
 */
function RecursionTree({
  algorithmKey,
  input,
  frame,
  steps,
  width,
}: {
  algorithmKey: AlgorithmKey;
  input: readonly number[];
  frame: Frame;
  steps: readonly Step[];
  width: number;
}) {
  const root = useMemo(
    () => (algorithmKey === 'quick' ? buildQuickSegments(input) : buildMergeSegments(input.length)),
    [algorithmKey, input],
  );
  const segments = useMemo(() => flatten(root), [root]);
  const depth = maxDepth(root) + 1;
  const { divided, combining, current } = useRecursionProgress(steps, frame.index);
  const { states } = byPosition(frame);

  const n = input.length;
  const nodeH = Math.max(18, Math.min(30, 280 / depth));
  const gapY = Math.max(14, Math.min(26, 200 / depth));
  const rowH = nodeH + gapY;

  const xOf = (lo: number) => (lo / n) * width + 1;
  const wOf = (lo: number, hi: number) => Math.max(3, ((hi - lo + 1) / n) * width - 2);
  const yOf = (d: number) => d * rowH + 6;

  return (
    <svg width="100%" height={depth * rowH + 12} role="img" aria-label="Recursion tree">
      {/* Edges: only drawn once both parent and child have been divided. */}
      {segments.map((seg) =>
        seg.children.map((child) => {
          if (!divided.has(key(seg.lo, seg.hi)) || !divided.has(key(child.lo, child.hi))) {
            return null;
          }
          const px = xOf(seg.lo) + wOf(seg.lo, seg.hi) / 2;
          const py = yOf(seg.depth) + nodeH;
          const cxp = xOf(child.lo) + wOf(child.lo, child.hi) / 2;
          const cyp = yOf(child.depth);
          return (
            <path
              key={`e-${key(seg.lo, seg.hi)}-${key(child.lo, child.hi)}`}
              className="tree-edge tree-grow"
              d={`M ${px} ${py} C ${px} ${py + gapY / 2}, ${cxp} ${cyp - gapY / 2}, ${cxp} ${cyp}`}
              fill="none"
            />
          );
        }),
      )}

      {segments.map((seg) => {
        const k = key(seg.lo, seg.hi);
        if (!divided.has(k)) return null; // not divided yet → not on screen

        let allSorted = true;
        for (let p = seg.lo; p <= seg.hi; p++) {
          if (states[p] !== 'sorted') {
            allSorted = false;
            break;
          }
        }
        const isCurrent = current === k;
        const isCombining = combining.has(k) && !allSorted;

        const fill = allSorted
          ? 'var(--color-bar-sorted)'
          : isCurrent
            ? 'var(--accent)'
            : isCombining
              ? 'var(--color-bar-overwriting)'
              : 'var(--bg-surface-3)';

        const x = xOf(seg.lo);
        const w = wOf(seg.lo, seg.hi);
        const y = yOf(seg.depth);
        const label = seg.hi === seg.lo ? `${seg.lo}` : `${seg.lo}–${seg.hi}`;
        const showLabel = w >= label.length * 7 + 10 && nodeH >= 18;

        return (
          <g key={`n-${k}`} className="tree-grow">
            <rect
              className="tree-node"
              x={x}
              y={y}
              width={w}
              height={nodeH}
              rx={5}
              fill={fill}
              stroke={isCurrent ? 'var(--accent)' : 'var(--border-subtle)'}
              strokeWidth={isCurrent ? 2 : 1}
            />
            {showLabel && (
              <text
                x={x + w / 2}
                y={y + nodeH / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={11}
                fontFamily="var(--font-mono)"
                fill={
                  allSorted || isCurrent || isCombining
                    ? 'var(--on-state)'
                    : 'var(--text-secondary)'
                }
              >
                {label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function TreeView({ algorithmKey, input, frame, steps, speed, statusLabel }: Props) {
  const [ref, size] = useElementSize<HTMLDivElement>();
  const n = input.length;
  const isRecursive = algorithmKey === 'merge' || algorithmKey === 'quick';

  return (
    <section
      aria-label="Tree view of the sorting visualization"
      className="liquid-glass relative flex min-h-[300px] flex-1 overflow-y-auto rounded-[1.25rem] p-4 lg:min-h-0"
    >
      <p className="sr-only" aria-live="polite">
        {statusLabel}
      </p>
      <div
        ref={ref}
        style={{
          ['--step-ms' as string]: `${Math.min(600, Math.round(1000 / Math.max(1, speed)))}ms`,
        }}
        className={`w-full ${speed >= SNAP_SPEED ? 'no-transitions' : ''}`}
      >
        {isRecursive && frame.index === 0 && (
          <p className="tree-hint mb-2 text-xs">
            Press play or step forward — the tree splits apart one recursive call at a time.
          </p>
        )}
        {algorithmKey === 'heap' && n > 63 && (
          <p className="tree-hint mb-2 text-xs">
            Tip: the heap tree is clearest with 63 elements or fewer.
          </p>
        )}
        {size.width > 0 &&
          (algorithmKey === 'heap' ? (
            <HeapTree frame={frame} width={size.width} height={size.height} />
          ) : (
            <RecursionTree
              algorithmKey={algorithmKey}
              input={input}
              frame={frame}
              steps={steps}
              width={size.width}
            />
          ))}
      </div>
    </section>
  );
}
