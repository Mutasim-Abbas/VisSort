import { useMemo } from 'react';
import type { Frame } from '../../engine/player';
import {
  combineProgress,
  layoutTree,
  nodeStateAt,
  type NodeState,
  type TreeModel,
} from '../../engine/treeProgress';

interface Props {
  model: TreeModel;
  frame: Frame;
  /** Values by array position, for the per-node sparklines. */
  valueByPos: readonly number[];
  maxVal: number;
  activeId: string | null;
  snap: boolean;
}

/** Node geometry in SVG user units. The viewBox scales it to the container. */
const NODE_W = 78;
const NODE_H = 30;
const LEVEL_H = 62;
const SLOT_W = 92;
/** Beyond this depth the tree is clipped with an honest notice rather than
 *  rendering a 5000px column (quicksort's worst case is depth ~n). */
const MAX_DEPTH = 12;

const STATE_STYLE: Record<NodeState, { fill: string; stroke: string; dash?: string }> = {
  pending: { fill: 'transparent', stroke: 'var(--border-strong)', dash: '3 3' },
  active: { fill: 'color-mix(in srgb, var(--accent) 22%, transparent)', stroke: 'var(--accent)' },
  combining: {
    fill: 'color-mix(in srgb, var(--color-bar-overwriting) 18%, transparent)',
    stroke: 'var(--color-bar-overwriting)',
  },
  returned: {
    fill: 'color-mix(in srgb, var(--lime) 14%, transparent)',
    stroke: 'color-mix(in srgb, var(--lime) 55%, transparent)',
  },
};

/**
 * The recursion tree for merge sort and quicksort, laid out as an actual tree —
 * children centred beneath their parent, siblings spaced by subtree width.
 *
 * Every node's state comes from `treeProgress`, which derives it from the real
 * emitted steps. That is what makes merge nodes turn green one at a time as
 * their merge completes, instead of the whole tree flipping at the final step.
 */
export function RecursionTree({ model, frame, valueByPos, maxVal, activeId, snap }: Props) {
  const layout = useMemo(() => layoutTree(model.root), [model.root]);
  const idx = frame.index;

  const visible = layout.placed.filter((p) => p.depth <= MAX_DEPTH);
  const clipped = layout.placed.length - visible.length;

  const width = Math.max(1, layout.width) * SLOT_W;
  const height = (Math.min(layout.depth, MAX_DEPTH) + 1) * LEVEL_H + 20;

  const cx = (x: number) => x * SLOT_W + SLOT_W / 2;
  const cy = (d: number) => d * LEVEL_H + NODE_H / 2 + 10;

  const byId = new Map(layout.placed.map((p) => [p.node.id, p]));

  return (
    <div className="relative min-h-0 flex-1 overflow-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className="max-w-none"
        role="img"
        aria-label="Recursion tree"
      >
        {/* Depth guides */}
        {Array.from({ length: Math.min(layout.depth, MAX_DEPTH) + 1 }, (_, d) => {
          const count = visible.filter((p) => p.depth === d).length;
          return (
            <g key={`d-${d}`}>
              <line
                x1={0}
                x2={width}
                y1={cy(d) + NODE_H / 2 + 12}
                y2={cy(d) + NODE_H / 2 + 12}
                stroke="var(--border-subtle)"
                strokeWidth={1}
              />
              <text x={4} y={cy(d) - NODE_H / 2 - 4} fontSize={9} fill="var(--text-muted)">
                depth {d} · {count} {count === 1 ? 'call' : 'calls'}
              </text>
            </g>
          );
        })}

        {/* Edges, drawn before nodes so they sit behind */}
        {visible.map(({ node, depth }) =>
          node.children.map((child) => {
            const c = byId.get(child.id);
            if (!c || c.depth > MAX_DEPTH) return null;
            const parentPlaced = byId.get(node.id)!;
            const open = idx > child.openedAt;
            return (
              <line
                key={`e-${node.id}-${child.id}`}
                x1={cx(parentPlaced.x)}
                y1={cy(depth) + NODE_H / 2}
                x2={cx(c.x)}
                y2={cy(c.depth) - NODE_H / 2}
                stroke={open ? 'var(--border-strong)' : 'var(--border-subtle)'}
                strokeWidth={open ? 1.5 : 1}
                strokeDasharray={open ? undefined : '2 3'}
              />
            );
          }),
        )}

        {/* Nodes */}
        {visible.map(({ node, x, depth }) => {
          const state = nodeStateAt(node, idx);
          const style = STATE_STYLE[state];
          const isActive = node.id === activeId;
          const progress = combineProgress(node, idx);
          const left = cx(x) - NODE_W / 2;
          const top = cy(depth) - NODE_H / 2;
          const size = node.hi - node.lo + 1;

          return (
            <g key={node.id} className={snap ? undefined : 'tree-node'}>
              {isActive && (
                <rect
                  x={left - 4}
                  y={top - 4}
                  width={NODE_W + 8}
                  height={NODE_H + 8}
                  rx={9}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth={1}
                  opacity={0.45}
                />
              )}
              <rect
                x={left}
                y={top}
                width={NODE_W}
                height={NODE_H}
                rx={6}
                fill={style.fill}
                stroke={style.stroke}
                strokeWidth={isActive ? 1.8 : 1}
                strokeDasharray={style.dash}
              />
              {/* Merge progress fill — a real proportion of cells written */}
              {progress !== null && progress > 0 && (
                <rect
                  x={left}
                  y={top + NODE_H - 3}
                  width={NODE_W * progress}
                  height={3}
                  rx={1.5}
                  fill="var(--color-bar-overwriting)"
                />
              )}
              {/* Micro sparkline of the values this call owns */}
              {size > 0 &&
                state !== 'pending' &&
                Array.from({ length: Math.min(size, 14) }, (_, s) => {
                  const step = size / Math.min(size, 14);
                  const pos = node.lo + Math.floor(s * step);
                  const v = valueByPos[pos] ?? 0;
                  const h = maxVal > 0 ? Math.max(2, (v / maxVal) * 11) : 2;
                  const bw = (NODE_W - 12) / Math.min(size, 14);
                  return (
                    <rect
                      key={s}
                      x={left + 6 + s * bw}
                      y={top + NODE_H - 6 - h}
                      width={Math.max(1, bw - 1)}
                      height={h}
                      rx={0.5}
                      fill={
                        state === 'returned'
                          ? 'color-mix(in srgb, var(--lime) 70%, transparent)'
                          : 'var(--color-bar-default)'
                      }
                    />
                  );
                })}
              <text
                x={cx(x)}
                y={top + 11}
                textAnchor="middle"
                fontSize={10}
                fontFamily="var(--font-mono)"
                fill="var(--text-primary)"
              >
                {node.lo}–{node.hi}
              </text>
              {/* Quicksort: show what the partition was actually about */}
              {node.pivotPos !== null && idx > (node.pivotAt ?? 0) && (
                <g>
                  <rect
                    x={left + NODE_W - 26}
                    y={top - 7}
                    width={26}
                    height={13}
                    rx={6}
                    fill="color-mix(in srgb, var(--color-bar-pivot) 85%, transparent)"
                  />
                  <text
                    x={left + NODE_W - 13}
                    y={top + 2.5}
                    textAnchor="middle"
                    fontSize={8}
                    fontFamily="var(--font-mono)"
                    fill="var(--on-state)"
                  >
                    {valueByPos[node.pivotPos]}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {clipped > 0 && (
        <p className="pointer-events-none absolute bottom-1 left-1 rounded bg-surface-2 px-2 py-1 font-mono text-[10px] text-muted">
          {clipped} deeper {clipped === 1 ? 'call' : 'calls'} hidden below depth {MAX_DEPTH}
        </p>
      )}
    </div>
  );
}
