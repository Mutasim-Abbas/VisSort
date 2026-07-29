import type { Frame } from './player';
import type { AlgorithmKey } from './registry';
import type { Step, StepContext } from './types';

/**
 * Read-only derivations over the step list's teaching context (`Step.ctx`).
 * Pure: no DOM, no React, no mutation of the steps it is handed.
 */

const EMPTY: StepContext = {};

/**
 * The `ctx` of the step that produced the frame at `index`. A frame at index
 * `k` is the state *after* `steps[k-1]` ran, so that is the step whose context
 * describes what the viewer is looking at.
 */
export function contextAt(steps: readonly Step[], index: number): StepContext {
  if (index <= 0 || index > steps.length) return EMPTY;
  return steps[index - 1].ctx ?? EMPTY;
}

/** What a comparison decided. `null` when the step at `index-1` was not a compare. */
export type CompareOutcome = 'swap' | 'write-left' | 'write-right' | 'keep' | null;

/**
 * Look ahead past pure annotation steps (`divide`/`combine`/`markPivot`) to see
 * what the comparison actually caused. `keep` means the algorithm looked and
 * chose to do nothing — which is a real teaching moment, not a non-event.
 */
export function compareOutcome(steps: readonly Step[], index: number): CompareOutcome {
  if (index <= 0 || index > steps.length) return null;
  const cmp = steps[index - 1];
  if (cmp.type !== 'compare') return null;

  for (let k = index; k < steps.length; k++) {
    const s = steps[k];
    switch (s.type) {
      case 'swap':
        return 'swap';
      case 'overwrite': {
        // Merge writes the winner of the comparison; which side won is decided
        // by whether the written value came from the left or right run.
        const m = cmp.ctx?.merge;
        const v = cmp.ctx?.values;
        if (!v) return 'write-left';
        if (s.value === v.a && s.value !== v.b) return 'write-left';
        if (s.value === v.b && s.value !== v.a) return 'write-right';
        // Equal values: merge sort is stable, so the left run wins ties.
        return m ? 'write-left' : 'write-left';
      }
      case 'compare':
        return 'keep';
      case 'markSorted':
        return 'keep';
      // divide / combine / markPivot are annotations — keep looking.
      default:
        break;
    }
  }
  return 'keep';
}

/**
 * One true sentence about the array's current state, or `''` when nothing true
 * can be said. A false invariant is worse than none in a teaching tool, so every
 * branch here is guarded by the data it needs actually being present.
 */
export function invariantOf(key: AlgorithmKey, ctx: StepContext, frame: Frame): string {
  const n = frame.heights.length;
  if (n === 0) return '';
  const c = ctx.cursors ?? {};

  switch (key) {
    case 'bubble': {
      const g = (ctx.groups ?? []).find((x) => x.kind === 'outside');
      if (!g) return 'No value has reached its final place yet — the first pass is still running.';
      return `Everything from index ${g.lo} rightwards is final; the largest value still in play is being pushed right.`;
    }
    case 'insertion': {
      const g = (ctx.groups ?? []).find((x) => x.kind === 'ordered');
      if (!g) return '';
      if (g.hi < 1) return '';
      return `a[0…${g.hi}] is in order, but nothing here is final yet — a later value can still slide into the middle of it.`;
    }
    case 'selection': {
      const i = c.i;
      if (i === undefined || i <= 0) return '';
      return `a[0…${i - 1}] holds the ${i} smallest ${i === 1 ? 'value' : 'values'}, in order, permanently.`;
    }
    case 'quick': {
      const groups = ctx.groups ?? [];
      const pivot = groups.find((x) => x.kind === 'pivot');
      if (!pivot) return '';
      const less = groups.find((x) => x.kind === 'lessThan');
      const ge = groups.find((x) => x.kind === 'greaterThan');
      const value = pivot.label.replace('pivot = ', '');
      if (!less && !ge) return `Partitioning around ${value}; nothing has been classified yet.`;
      const leftPart = less
        ? `a[${less.lo}…${less.hi}] is < ${value}`
        : `nothing is < ${value} yet`;
      const rightPart = ge ? `a[${ge.lo}…${ge.hi}] is >= ${value}` : `nothing is >= ${value} yet`;
      return `${leftPart}; ${rightPart}.`;
    }
    case 'merge': {
      const m = ctx.merge;
      if (!m) return '';
      return `a[${m.lo}…${m.mid}] and a[${m.mid + 1}…${m.hi}] were each already sorted; they are being fused into a[${m.lo}…${m.hi}].`;
    }
    case 'heap': {
      const g = (ctx.groups ?? []).find((x) => x.kind === 'heap');
      if (!g) return '';
      const extracted = (ctx.groups ?? []).find((x) => x.kind === 'outside');
      const heapPart = `a[0…${g.hi}] satisfies the max-heap property`;
      if (!extracted) return `${heapPart}.`;
      return `${heapPart}; a[${extracted.lo}…${extracted.hi}] holds the largest values, final.`;
    }
    default:
      return '';
  }
}

/** One row per pass of a pass-structured algorithm. */
export interface PassRow {
  /** 1-based pass number, as declared by `ctx.pass.index`. */
  index: number;
  total?: number;
  label: string;
  /** Step range this pass covers, as [first, last] indices into `steps`. */
  from: number;
  to: number;
  comparisons: number;
  swaps: number;
  /** The span of the array this pass was still working on. */
  window: { lo: number; hi: number } | null;
}

/**
 * Pass ladder over the whole run: one row per `ctx.pass`, with its step range,
 * comparisons, swaps and active window. Single linear scan — callers should
 * memoize on `steps`, which never changes identity for a given run.
 */
export function buildPassLadder(steps: readonly Step[]): PassRow[] {
  const rows: PassRow[] = [];
  let cur: PassRow | null = null;

  for (let k = 0; k < steps.length; k++) {
    const s = steps[k];
    const pass = s.ctx?.pass;
    if (!pass) continue;

    if (cur === null || cur.index !== pass.index) {
      cur = {
        index: pass.index,
        total: pass.total,
        label: s.ctx?.phase ?? `Pass ${pass.index}`,
        from: k,
        to: k,
        comparisons: 0,
        swaps: 0,
        window: null,
      };
      rows.push(cur);
    }

    cur.to = k;
    if (s.type === 'compare') cur.comparisons++;
    else if (s.type === 'swap') cur.swaps++;

    // The working window is everything the pass has not already finalised.
    const groups = s.ctx?.groups;
    if (groups) {
      for (const g of groups) {
        if (g.kind === 'outside') continue;
        if (cur.window === null) cur.window = { lo: g.lo, hi: g.hi };
        else {
          if (g.lo < cur.window.lo) cur.window.lo = g.lo;
          if (g.hi > cur.window.hi) cur.window.hi = g.hi;
        }
      }
    }
  }

  return rows;
}
