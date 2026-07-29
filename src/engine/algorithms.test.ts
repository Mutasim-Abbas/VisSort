import { describe, it, expect } from 'vitest';
import { ALGORITHMS } from './registry';
import { buildSteps } from './player';
import { applyStepsToArray } from './replay';
import { countersAt } from './counters';
import { generateArray } from '../data/presets';

/**
 * Input shapes covering the matrix in TODO F3: edge sizes plus each data
 * distribution at a few sizes. Correctness is proven by *replaying the emitted
 * steps* — if the steps sort the array, the generator is faithful to itself.
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

const ascending = (a: readonly number[]) => a.slice().sort((x, y) => x - y);

describe('sorting algorithms', () => {
  for (const algo of ALGORITHMS) {
    describe(algo.name, () => {
      for (const shape of inputShapes()) {
        it(`sorts ${shape.name}`, () => {
          const steps = buildSteps(algo.generator, shape.data);
          const result = applyStepsToArray(shape.data, steps);
          expect(result).toEqual(ascending(shape.data));
        });
      }

      it('is deterministic (same input → identical steps)', () => {
        const input = generateArray(30, 'random');
        const a = buildSteps(algo.generator, input);
        const b = buildSteps(algo.generator, input);
        expect(b).toEqual(a);
      });

      it('never produces negative counters and respects its writes model', () => {
        const input = generateArray(40, 'random');
        const steps = buildSteps(algo.generator, input);
        const c = countersAt(steps, steps.length);
        expect(c.comparisons).toBeGreaterThanOrEqual(0);
        expect(c.swaps).toBeGreaterThanOrEqual(0);
        expect(c.writes).toBeGreaterThanOrEqual(0);
        expect(c.accesses).toBeGreaterThanOrEqual(0);
        if (algo.writesModel === 'overwrite') {
          // Overwrite-model sorts (merge) must never emit a swap step.
          expect(c.swaps).toBe(0);
        }
      });
    });
  }
});

describe('counter cross-checks', () => {
  it('selection sort does exactly n(n-1)/2 comparisons', () => {
    const n = 20;
    const input = generateArray(n, 'random');
    const selection = ALGORITHMS.find((a) => a.key === 'selection')!;
    const steps = buildSteps(selection.generator, input);
    const c = countersAt(steps, steps.length);
    expect(c.comparisons).toBe((n * (n - 1)) / 2);
  });

  it('countersAt(0) is all zero and grows monotonically', () => {
    const input = generateArray(25, 'reversed');
    const bubble = ALGORITHMS.find((a) => a.key === 'bubble')!;
    const steps = buildSteps(bubble.generator, input);
    const zero = countersAt(steps, 0);
    expect(zero).toEqual({ comparisons: 0, swaps: 0, writes: 0, accesses: 0 });
    const mid = countersAt(steps, Math.floor(steps.length / 2));
    const end = countersAt(steps, steps.length);
    expect(end.comparisons).toBeGreaterThanOrEqual(mid.comparisons);
    expect(end.swaps).toBeGreaterThanOrEqual(mid.swaps);
  });
});

describe('recursion annotations (Tree view)', () => {
  it('merge sort divides before it combines, and combines every internal range', () => {
    const input = [5, 3, 8, 1];
    const steps = buildSteps(ALGORITHMS.find((a) => a.key === 'merge')!.generator, input);
    const divides = steps.filter((s) => s.type === 'divide');
    const combines = steps.filter((s) => s.type === 'combine');

    // Every recursive call on [0..3] emits a node: 4 leaves + 3 internal ranges.
    expect(divides).toHaveLength(7);
    // Only ranges with >1 element merge back together.
    expect(combines).toHaveLength(3);

    // The root divides first, and each range is divided BEFORE it combines.
    expect(steps[0]).toMatchObject({ type: 'divide', lo: 0, hi: 3 });
    for (const c of combines) {
      const dIdx = steps.findIndex((s) => s.type === 'divide' && s.lo === c.lo && s.hi === c.hi);
      const cIdx = steps.indexOf(c);
      expect(dIdx).toBeGreaterThanOrEqual(0);
      expect(dIdx).toBeLessThan(cIdx);
    }
  });

  it('quicksort opens a node for every partition range', () => {
    const input = generateArray(16, 'random');
    const steps = buildSteps(ALGORITHMS.find((a) => a.key === 'quick')!.generator, input);
    const divides = steps.filter((s) => s.type === 'divide');
    expect(divides.length).toBeGreaterThan(0);
    expect(steps.find((s) => s.type === 'divide')).toMatchObject({ type: 'divide', lo: 0, hi: 15 });
    // Ranges are always well-formed.
    for (const d of divides) {
      if (d.type !== 'divide') continue;
      expect(d.lo).toBeLessThanOrEqual(d.hi);
    }
  });

  it('annotations cost nothing — they never inflate the counters', () => {
    const input = generateArray(20, 'random');
    const steps = buildSteps(ALGORITHMS.find((a) => a.key === 'merge')!.generator, input);
    const annotations = steps.filter((s) => s.type === 'divide' || s.type === 'combine');
    expect(annotations.length).toBeGreaterThan(0);
    const c = countersAt(steps, steps.length);
    // Merge is overwrite-based: annotations must not have added swaps/writes.
    expect(c.swaps).toBe(0);
    expect(c.writes).toBeGreaterThan(0);
  });
});

describe('pseudocode line mapping', () => {
  it('every emitted step points at a real line of its algorithm pseudocode', async () => {
    const { PSEUDOCODE } = await import('./pseudocode');
    for (const algo of ALGORITHMS) {
      const lines = PSEUDOCODE[algo.key];
      expect(lines.length).toBeGreaterThan(0);
      const steps = buildSteps(algo.generator, generateArray(24, 'random'));
      const tagged = steps.filter((s) => s.line !== undefined);
      // The steps a learner watches must be traceable to code.
      expect(tagged.length).toBeGreaterThan(0);
      for (const s of steps) {
        if (s.line === undefined) continue;
        expect(s.line).toBeGreaterThanOrEqual(0);
        expect(s.line).toBeLessThan(lines.length);
      }
    }
  });

  it('the executing line changes as the algorithm runs (it is not stuck)', () => {
    const steps = buildSteps(
      ALGORITHMS.find((a) => a.key === 'bubble')!.generator,
      generateArray(12, 'random'),
    );
    const distinct = new Set(steps.map((s) => s.line).filter((l) => l !== undefined));
    expect(distinct.size).toBeGreaterThan(1);
  });
});
