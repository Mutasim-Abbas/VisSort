import type { Frame } from '../../engine/player';
import type { BarState, StepContext } from '../../engine/types';

interface Props {
  frame: Frame;
  ctx: StepContext;
  valueByPos: readonly number[];
  stateByPos: readonly BarState[];
  snap: boolean;
}

const STATE_FILL: Record<BarState, string> = {
  default: 'var(--color-bar-default)',
  comparing: 'var(--color-bar-comparing)',
  swapping: 'var(--color-bar-swapping)',
  overwriting: 'var(--color-bar-overwriting)',
  pivot: 'var(--color-bar-pivot)',
  sorted: 'var(--color-bar-sorted)',
};

const LEVEL_H = 58;
const R = 15;
/** Below this horizontal spacing nodes would collide; say so instead of overlapping. */
const MIN_SPACING = 2 * R + 6;

/**
 * The live max-heap as a binary tree.
 *
 * Three things the old version got wrong and this does not:
 *  - layout is computed from `n` and depth alone, never from the measured
 *    container height (which was derived from the layout — a circular
 *    dependency that made the tree jitter or collapse);
 *  - it cannot produce negative geometry in a short container;
 *  - extracted elements are no longer drawn as heap nodes. They are final, and
 *    they move to a strip below, because the tree should show the structure the
 *    algorithm actually has.
 */
export function HeapTree({ frame, ctx, valueByPos, stateByPos, snap }: Props) {
  const n = frame.heights.length;
  if (n === 0) return null;

  // The heap extent is declared by the engine; fall back to the whole array
  // before the first context arrives.
  const heapGroup = ctx.groups?.find((g) => g.kind === 'heap');
  const heapSize = heapGroup ? heapGroup.hi + 1 : n;
  const extracted = n - heapSize;

  const depth = heapSize > 0 ? Math.floor(Math.log2(heapSize)) : 0;
  const widestLevel = Math.pow(2, depth);
  const width = Math.max(320, widestLevel * MIN_SPACING);
  const height = (depth + 1) * LEVEL_H + 24;

  const cursors = ctx.cursors ?? {};
  const onPath = new Set<number>();
  if (cursors.root !== undefined) onPath.add(cursors.root);
  if (cursors.child !== undefined) onPath.add(cursors.child);

  const nodeAt = (i: number) => {
    const d = Math.floor(Math.log2(i + 1));
    const indexInLevel = i - (Math.pow(2, d) - 1);
    const slots = Math.pow(2, d);
    const x = ((indexInLevel + 0.5) / slots) * width;
    const y = d * LEVEL_H + R + 12;
    return { x, y, d };
  };

  const cmp = ctx.values;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="min-h-0 flex-1 overflow-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          className="max-w-none"
          role="img"
          aria-label="Binary heap"
        >
          {/* Depth guides */}
          {Array.from({ length: depth + 1 }, (_, d) => (
            <text key={d} x={2} y={d * LEVEL_H + 8} fontSize={9} fill="var(--text-muted)">
              depth {d}
            </text>
          ))}

          {/* Edges */}
          {Array.from({ length: heapSize }, (_, i) => {
            const parent = nodeAt(i);
            return [2 * i + 1, 2 * i + 2]
              .filter((c) => c < heapSize)
              .map((c) => {
                const child = nodeAt(c);
                const hot = onPath.has(i) && onPath.has(c);
                return (
                  <line
                    key={`${i}-${c}`}
                    x1={parent.x}
                    y1={parent.y + R}
                    x2={child.x}
                    y2={child.y - R}
                    stroke={hot ? 'var(--accent)' : 'var(--border-strong)'}
                    strokeWidth={hot ? 2 : 1}
                  />
                );
              });
          })}

          {/* Nodes — only the live heap */}
          {Array.from({ length: heapSize }, (_, i) => {
            const { x, y } = nodeAt(i);
            const state = stateByPos[i] ?? 'default';
            const hot = onPath.has(i);
            return (
              <g key={i} className={snap ? undefined : 'tree-node'}>
                {hot && (
                  <circle
                    cx={x}
                    cy={y}
                    r={R + 4}
                    fill="none"
                    stroke="var(--accent)"
                    opacity={0.5}
                  />
                )}
                <circle
                  cx={x}
                  cy={y}
                  r={R}
                  fill={STATE_FILL[state]}
                  stroke={hot ? 'var(--accent)' : 'var(--border-strong)'}
                  strokeWidth={hot ? 2 : 1}
                />
                <text
                  x={x}
                  y={y + 3.5}
                  textAnchor="middle"
                  fontSize={10}
                  fontFamily="var(--font-mono)"
                  fill="var(--on-state)"
                >
                  {valueByPos[i]}
                </text>
                <text
                  x={x}
                  y={y + R + 9}
                  textAnchor="middle"
                  fontSize={8}
                  fontFamily="var(--font-mono)"
                  fill="var(--text-muted)"
                >
                  {i}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Parent-vs-child comparison, in words */}
      {cmp && (
        <p className="text-center font-mono text-[11px] text-secondary">
          {cmp.a} {cmp.a < cmp.b ? '<' : cmp.a > cmp.b ? '>' : '='} {cmp.b}
          {cmp.a < cmp.b ? ' — swap with the larger child' : ' — heap property holds here'}
        </p>
      )}

      {/* Extracted tail: final, and no longer part of the heap */}
      {extracted > 0 && (
        <div className="shrink-0">
          <p className="mb-1 font-mono text-[10px] text-muted">
            extracted &amp; final — {extracted} {extracted === 1 ? 'value' : 'values'}
          </p>
          <div className="flex gap-[2px]">
            {Array.from({ length: extracted }, (_, k) => (
              <span
                key={k}
                className="flex-1 rounded-[2px] py-0.5 text-center font-mono text-[9px]"
                style={{ background: 'var(--color-bar-sorted)', color: 'var(--on-state)' }}
              >
                {valueByPos[heapSize + k]}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
