import { describe, it, expect } from 'vitest';
import { ALGORITHMS } from '../../engine/registry';
import { buildSteps } from '../../engine/player';
import { generateArray } from '../../data/presets';
import { buildShelf, comparedSlots } from './shelf';

/**
 * The crane stages boxes, not cells: a box may change slot but must never be
 * duplicated or lost. That broke on merge sort, whose writes left the shelf
 * holding two copies of one value and none of another mid-merge.
 */

function shelfAt(input: number[], k: number, t: ReturnType<typeof buildShelf>): number[] {
  const out = new Array<number>(input.length);
  t.posOf[k].forEach((slot, id) => {
    out[slot] = t.values[k][id];
  });
  return out;
}

const inputs: number[][] = [
  [5, 2, 9, 1, 7, 3],
  [3, 1, 3, 2, 1, 2, 3, 1],
  [7, 7, 7, 7],
  generateArray(16, 'random'),
  generateArray(16, 'reversed'),
  generateArray(20, 'few-unique'),
];

describe('buildShelf', () => {
  for (const algo of ALGORITHMS) {
    it(`${algo.key}: every box stays on the shelf exactly once and ends sorted`, () => {
      for (const input of inputs) {
        const steps = buildSteps(algo.generator, input);
        const t = buildShelf(input, steps);
        expect(t.posOf).toHaveLength(steps.length + 1);
        for (let k = 0; k <= steps.length; k++) {
          expect([...t.posOf[k]].sort((a, b) => a - b)).toEqual(input.map((_, i) => i));
          expect([...t.values[k]].sort((a, b) => a - b)).toEqual([...input].sort((a, b) => a - b));
        }
        expect(shelfAt(input, steps.length, t)).toEqual([...input].sort((a, b) => a - b));
      }
    });
  }

  it('merge: each write lands the written value in its slot', () => {
    const input = [5, 2, 9, 1, 7, 3];
    const merge = ALGORITHMS.find((a) => a.key === 'merge')!;
    const steps = buildSteps(merge.generator, input);
    const t = buildShelf(input, steps);
    steps.forEach((step, k) => {
      if (step.type === 'overwrite') expect(shelfAt(input, k + 1, t)[step.index]).toBe(step.value);
      if (step.type === 'compare') {
        const [a, b] = comparedSlots(step);
        const shelf = shelfAt(input, k, t);
        expect([shelf[a], shelf[b]]).toEqual([step.ctx!.values!.a, step.ctx!.values!.b]);
      }
    });
  });
});
