import { useMemo } from 'react';
import type { Frame } from '../engine/player';
import type { AlgorithmKey } from '../engine/registry';
import type { BarState, Step } from '../engine/types';
import { contextAt, invariantOf } from '../engine/stepContext';
import { activeNode, buildTreeModel, callPath } from '../engine/treeProgress';
import { ArrayRibbon } from './tree/ArrayRibbon';
import { RecursionTree } from './tree/RecursionTree';
import { HeapTree } from './tree/HeapTree';
import { PassLadder } from './tree/PassLadder';

interface Props {
  algorithmKey: AlgorithmKey;
  frame: Frame;
  steps: readonly Step[];
  speed: number;
  statusLabel: string;
}

const SNAP_SPEED = 20;

/** Which structure each algorithm actually has. */
function structureOf(key: AlgorithmKey): 'recursion' | 'heap' | 'passes' {
  if (key === 'merge' || key === 'quick') return 'recursion';
  if (key === 'heap') return 'heap';
  return 'passes';
}

/**
 * Structure view: the shape the running algorithm actually has — a recursion
 * tree for merge and quick, a binary heap for heapsort, a pass ladder for the
 * three that run in flat passes.
 *
 * Everything derives from the emitted steps via `treeProgress`, built once per
 * run rather than rescanned per frame, and the array ribbon at the top keeps the
 * abstract ranges tied to the concrete elements they refer to.
 */
export function TreeView({ algorithmKey, frame, steps, speed, statusLabel }: Props) {
  const n = frame.heights.length;
  const snap = speed >= SNAP_SPEED;
  const kind = structureOf(algorithmKey);

  const ctx = useMemo(() => contextAt(steps, frame.index), [steps, frame.index]);
  const model = useMemo(() => buildTreeModel(steps), [steps]);

  const { valueByPos, stateByPos, maxVal } = useMemo(() => {
    const values = new Array<number>(n).fill(0);
    const states = new Array<BarState>(n).fill('default');
    let max = 0;
    for (let id = 0; id < n; id++) {
      values[frame.posOf[id]] = frame.heights[id];
      states[frame.posOf[id]] = frame.state[id];
      if (frame.heights[id] > max) max = frame.heights[id];
    }
    return { valueByPos: values, stateByPos: states, maxVal: max };
  }, [frame, n]);

  const active = useMemo(
    () => (kind === 'recursion' ? activeNode(model, frame.index) : null),
    [kind, model, frame.index],
  );
  const path = useMemo(
    () => (kind === 'recursion' ? callPath(model, frame.index) : []),
    [kind, model, frame.index],
  );

  const invariant = invariantOf(algorithmKey, ctx, frame);

  // What range the ribbon should bracket, per structure.
  const range = useMemo(() => {
    if (kind === 'recursion') return active ? { lo: active.lo, hi: active.hi } : null;
    if (kind === 'heap') {
      const g = ctx.groups?.find((x) => x.kind === 'heap');
      return g ? { lo: g.lo, hi: g.hi } : null;
    }
    const g = ctx.groups?.filter((x) => x.kind !== 'outside');
    if (!g || g.length === 0) return null;
    return { lo: g[0].lo, hi: g[g.length - 1].hi };
  }, [kind, active, ctx.groups]);

  return (
    <section
      aria-label="Structure view of the sorting visualization"
      className="liquid-glass relative flex min-h-[300px] flex-1 flex-col gap-3 overflow-hidden rounded-[1.25rem] p-5 lg:min-h-0"
    >
      <p className="sr-only" aria-live="polite">
        {statusLabel}
      </p>

      {/* Phase + call-stack rail */}
      <div className="flex flex-wrap items-center gap-2">
        {ctx.phase && (
          <span className="rounded-full border border-subtle bg-surface-2 px-3 py-1 font-mono text-[11px] text-primary">
            {ctx.phase}
          </span>
        )}
        {path.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            {path.map((node, i) => (
              <span key={node.id} className="flex items-center gap-1">
                {i > 0 && <span className="text-[10px] text-muted">›</span>}
                <span
                  className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${
                    i === path.length - 1
                      ? 'bg-accent-soft text-accent'
                      : 'border border-subtle text-secondary'
                  }`}
                >
                  d{node.depth} · {node.lo}–{node.hi}
                </span>
              </span>
            ))}
          </div>
        )}
        <span className="rounded-full border border-subtle px-3 py-1 font-mono text-[11px] text-muted">
          step {frame.index} / {frame.total}
        </span>
      </div>

      {/* The tree↔array link */}
      <ArrayRibbon frame={frame} range={range} />

      <p className="min-h-[2.5em] text-[13px] leading-snug text-secondary">
        {invariant || (
          <span className="text-muted">Press play to watch the structure build itself.</span>
        )}
      </p>

      {n === 0 ? (
        <p className="grid flex-1 place-items-center text-sm text-muted">No data yet.</p>
      ) : kind === 'recursion' ? (
        <RecursionTree
          model={model}
          frame={frame}
          valueByPos={valueByPos}
          maxVal={maxVal}
          activeId={active?.id ?? null}
          snap={snap}
        />
      ) : kind === 'heap' ? (
        <HeapTree
          frame={frame}
          ctx={ctx}
          valueByPos={valueByPos}
          stateByPos={stateByPos}
          snap={snap}
        />
      ) : (
        <PassLadder steps={steps} frame={frame} n={n} />
      )}
    </section>
  );
}
