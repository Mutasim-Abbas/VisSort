import { describe, it, expect } from 'vitest';
import { ALGORITHMS } from './registry';
import { buildSteps } from './player';
import { applyStepsToArray } from './replay';
import { buildPassLadder, compareOutcome, contextAt } from './stepContext';
import { generateArray } from '../data/presets';
import type { Step } from './types';

/**
 * The Array view is built entirely on `ctx.groups`, and every group is a claim
 * made to a student. These tests exist to stop the view telling a confident lie:
 * the cover invariant keeps the picture complete, and the "group truth" tests
 * check that each region really holds what its label says it holds.
 */

function inputShapes(): { name: string; data: number[] }[] {
  const shapes: { name: string; data: number[] }[] = [
    { name: 'empty', data: [] },
    { name: 'single', data: [42] },
    { name: 'two-sorted', data: [1, 2] },
    { name: 'two-reversed', data: [2, 1] },
    { name: 'all-equal', data: [7, 7, 7, 7, 7] },
    { name: 'small-random', data: [5, 3, 8, 1, 9, 2, 7, 4, 6] },
    { name: 'duplicates', data: [3, 1, 3, 2, 1, 2, 3, 1] },
  ];
  for (const size of [5, 17, 64]) {
    for (const preset of ['random', 'nearly-sorted', 'reversed', 'few-unique'] as const) {
      shapes.push({ name: `${preset}-${size}`, data: generateArray(size, preset) });
    }
  }
  return shapes;
}

/** The array as it stands immediately before `steps[k]` executes. */
function arrayBefore(input: readonly number[], steps: readonly Step[], k: number): number[] {
  return applyStepsToArray(input, steps.slice(0, k));
}

/**
 * The array a viewer is looking at while `steps[k]`'s context is on screen.
 * Per the `StepContext` contract a step's ctx describes the array *after* that
 * step applies, which is the frame at index k+1 — so group claims must be
 * checked against this, not against the pre-step array.
 */
function arrayAfter(input: readonly number[], steps: readonly Step[], k: number): number[] {
  return applyStepsToArray(input, steps.slice(0, k + 1));
}

describe('ctx.groups cover invariant', () => {
  for (const algo of ALGORITHMS) {
    describe(algo.name, () => {
      for (const shape of inputShapes()) {
        it(`covers 0…n-1 exactly on ${shape.name}`, () => {
          const n = shape.data.length;
          const steps = buildSteps(algo.generator, shape.data);

          for (let k = 0; k < steps.length; k++) {
            const groups = steps[k].ctx?.groups;
            if (!groups) continue;

            if (n === 0) {
              expect(groups.length).toBe(0);
              continue;
            }

            let cursor = 0;
            for (const g of groups) {
              expect(g.hi).toBeGreaterThanOrEqual(g.lo);
              expect(g.lo).toBe(cursor);
              expect(g.lo).toBeGreaterThanOrEqual(0);
              expect(g.hi).toBeLessThanOrEqual(n - 1);
              expect(g.label.length).toBeGreaterThan(0);
              cursor = g.hi + 1;
            }
            expect(cursor).toBe(n);
          }
        });
      }
    });
  }
});

describe('group truth — each region really holds what its label claims', () => {
  const data = [5, 3, 8, 1, 9, 2, 7, 4, 6, 3, 8, 2];

  it('quicksort: lessThan is really < pivot and greaterThan really >= pivot', () => {
    const steps = buildSteps(ALGORITHMS.find((a) => a.key === 'quick')!.generator, data);
    let checked = 0;
    for (let k = 0; k < steps.length; k++) {
      const groups = steps[k].ctx?.groups;
      if (!groups) continue;
      const pivotGroup = groups.find((g) => g.kind === 'pivot');
      if (!pivotGroup) continue;

      const a = arrayAfter(data, steps, k);
      const pivot = a[pivotGroup.lo];

      for (const g of groups) {
        if (g.kind === 'lessThan') {
          for (let p = g.lo; p <= g.hi; p++) expect(a[p]).toBeLessThan(pivot);
          checked++;
        } else if (g.kind === 'greaterThan') {
          for (let p = g.lo; p <= g.hi; p++) expect(a[p]).toBeGreaterThanOrEqual(pivot);
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('insertion: the ordered prefix is really non-decreasing', () => {
    const steps = buildSteps(ALGORITHMS.find((a) => a.key === 'insertion')!.generator, data);
    let checked = 0;
    for (let k = 0; k < steps.length; k++) {
      const g = steps[k].ctx?.groups?.find((x) => x.kind === 'ordered');
      if (!g) continue;
      // The prefix is only settled before the travelling value re-enters it, so
      // check it at compare steps, where the claim is actually on screen.
      if (steps[k].type !== 'compare') continue;
      const a = arrayAfter(data, steps, k);
      for (let p = g.lo; p < g.hi; p++) {
        if (p + 1 > g.hi) break;
        // The cell holding the travelling value is exempt: it is mid-insertion.
        const j = steps[k].ctx?.cursors?.j;
        if (j !== undefined && (p === j || p + 1 === j)) continue;
        expect(a[p]).toBeLessThanOrEqual(a[p + 1]);
      }
      checked++;
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('heapsort: the heap group really satisfies the max-heap property', () => {
    const steps = buildSteps(ALGORITHMS.find((a) => a.key === 'heap')!.generator, data);
    // The heap is only *settled* at the moment an extraction begins: during
    // sift-down it is transiently broken by design, which is the thing being
    // animated. So two separate claims are checked here.
    let checked = 0;
    for (let k = 0; k < steps.length; k++) {
      const s = steps[k];
      if (s.type !== 'swap' || !s.ctx?.phase?.startsWith('Extract')) continue;
      // Sift-down swaps carry the same Extract phase and can also sit at root 0,
      // so identify the extract swap by its cursors: `end`, never `root`.
      const cur = s.ctx?.cursors ?? {};
      if (cur.end === undefined || cur.root !== undefined) continue;

      // 1. Before the extract swap the previous sift has finished, so the heap
      //    that is about to be raided really does satisfy the property.
      const before = arrayBefore(data, steps, k);
      const settled = s.j + 1;
      for (let root = 0; root < settled; root++) {
        for (const child of [2 * root + 1, 2 * root + 2]) {
          if (child < settled) expect(before[root]).toBeGreaterThanOrEqual(before[child]);
        }
      }

      // 2. The group's *extent* after the swap excludes the extracted maximum.
      const g = s.ctx?.groups?.find((x) => x.kind === 'heap');
      expect(g ? g.hi : -1).toBe(s.j - 1);
      checked++;
    }
    expect(checked).toBeGreaterThan(0);
  });
});

describe('compare steps carry the values actually compared', () => {
  for (const algo of ALGORITHMS) {
    it(`${algo.name} reports true compared values`, () => {
      const data = [5, 3, 8, 1, 9, 2, 7, 4, 6];
      const steps = buildSteps(algo.generator, data);
      let seen = 0;

      for (let k = 0; k < steps.length; k++) {
        const s = steps[k];
        if (s.type !== 'compare') continue;
        expect(s.ctx?.values).toBeDefined();
        seen++;

        if (algo.key === 'merge') continue; // checked explicitly below
        // A compare mutates nothing, so before and after are the same array.
        const a = arrayAfter(data, steps, k);
        const pair = [s.ctx!.values!.a, s.ctx!.values!.b].sort((x, y) => x - y);
        const cells = [a[s.i], a[s.j]].sort((x, y) => x - y);
        expect(pair).toEqual(cells);
      }
      expect(seen).toBeGreaterThan(0);
    });
  }

  /**
   * The bug this whole field exists for: merge overwrites in place while
   * comparing values held in scratch copies, so a[lo+i] / a[mid+1+j] routinely
   * no longer hold what was compared. Hand-traced on [5,3,8,1].
   */
  it('merge on [5,3,8,1] reports scratch-run values, not stale cells', () => {
    const data = [5, 3, 8, 1];
    const steps = buildSteps(ALGORITHMS.find((a) => a.key === 'merge')!.generator, data);

    const compares = steps
      .map((s, k) => ({ s, k }))
      .filter(({ s }) => s.type === 'compare')
      .map(({ s, k }) => {
        const a = arrayBefore(data, steps, k);
        const cmp = s as Extract<Step, { type: 'compare' }>;
        return {
          reported: [s.ctx!.values!.a, s.ctx!.values!.b],
          cells: [a[cmp.i], a[cmp.j]],
        };
      });

    // merge sort of [5,3,8,1]: merge [5]+[3] -> [3,5]; merge [8]+[1] -> [1,8];
    // then merge [3,5]+[1,8] -> 3vs1, 3vs8, 5vs8.
    expect(compares.map((c) => c.reported)).toEqual([
      [5, 3],
      [8, 1],
      [3, 1],
      [3, 8],
      [5, 8],
    ]);

    // At least one comparison must disagree with the raw cells — otherwise this
    // test would pass even if the old buggy behaviour came back.
    const divergent = compares.filter(
      (c) => c.reported[0] !== c.cells[0] || c.reported[1] !== c.cells[1],
    );
    expect(divergent.length).toBeGreaterThan(0);
  });
});

describe('derived helpers', () => {
  const data = [5, 3, 8, 1, 9, 2, 7, 4, 6];

  it('contextAt returns the ctx of the step that produced the frame', () => {
    const steps = buildSteps(ALGORITHMS.find((a) => a.key === 'bubble')!.generator, data);
    expect(contextAt(steps, 0)).toEqual({});
    expect(contextAt(steps, steps.length + 5)).toEqual({});
    expect(contextAt(steps, 1)).toBe(steps[0].ctx);
  });

  it('compareOutcome distinguishes a swap from a deliberate keep', () => {
    const steps = buildSteps(ALGORITHMS.find((a) => a.key === 'bubble')!.generator, data);
    const outcomes = steps
      .map((s, k) => (s.type === 'compare' ? compareOutcome(steps, k + 1) : null))
      .filter(Boolean);
    expect(outcomes).toContain('swap');
    expect(outcomes).toContain('keep');
    expect(outcomes.every((o) => o !== null)).toBe(true);
  });

  it('compareOutcome reports null for non-compare steps', () => {
    const steps = buildSteps(ALGORITHMS.find((a) => a.key === 'bubble')!.generator, data);
    const swapIndex = steps.findIndex((s) => s.type === 'swap');
    expect(compareOutcome(steps, swapIndex + 1)).toBeNull();
  });

  it('buildPassLadder produces one ascending row per pass with real counts', () => {
    const steps = buildSteps(ALGORITHMS.find((a) => a.key === 'selection')!.generator, data);
    const ladder = buildPassLadder(steps);
    expect(ladder.length).toBeGreaterThan(0);

    let total = 0;
    for (let r = 0; r < ladder.length; r++) {
      const row = ladder[r];
      expect(row.index).toBe(r + 1);
      expect(row.to).toBeGreaterThanOrEqual(row.from);
      if (r > 0) expect(row.from).toBeGreaterThan(ladder[r - 1].to);
      total += row.comparisons;
    }
    // Selection sort does exactly n(n-1)/2 comparisons, all inside passes.
    const n = data.length;
    expect(total).toBe((n * (n - 1)) / 2);
  });

  it('buildPassLadder handles bubble at n=200 well under 50ms', () => {
    const big = generateArray(200, 'reversed');
    const steps = buildSteps(ALGORITHMS.find((a) => a.key === 'bubble')!.generator, big);
    const t0 = performance.now();
    const ladder = buildPassLadder(steps);
    const elapsed = performance.now() - t0;
    expect(ladder.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(50);
  });
});

describe('determinism', () => {
  for (const algo of ALGORITHMS) {
    it(`${algo.name} builds identical steps including ctx`, () => {
      const data = generateArray(24, 'random');
      expect(buildSteps(algo.generator, data)).toEqual(buildSteps(algo.generator, data));
    });
  }
});
