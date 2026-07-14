import type { Step, SortGenerator } from '../types';
import { range } from './shared';

/**
 * Quicksort (Lomuto partition, last element as pivot) — the pivot is marked so
 * the visualization highlights it while the partition scan slides smaller
 * elements left. Each pivot lands in its final position (marked sorted).
 */
export const quick: SortGenerator = function* quick(input) {
  const a = input.slice();
  const n = a.length;

  function* qsort(lo: number, hi: number): Generator<Step, void, undefined> {
    if (lo > hi) return;
    // Node appears as the recursive call opens (Tree view watches it divide).
    yield { type: 'divide', lo, hi };
    if (lo === hi) {
      yield { type: 'markSorted', indices: [lo] };
      return;
    }
    const pivot = a[hi];
    yield { type: 'markPivot', index: hi };
    let i = lo;
    for (let j = lo; j < hi; j++) {
      yield { type: 'compare', i: j, j: hi };
      if (a[j] < pivot) {
        if (i !== j) {
          yield { type: 'swap', i, j };
          [a[i], a[j]] = [a[j], a[i]];
        }
        i++;
      }
    }
    if (i !== hi) {
      yield { type: 'swap', i, j: hi };
      [a[i], a[hi]] = [a[hi], a[i]];
    }
    yield { type: 'markSorted', indices: [i] };
    yield* qsort(lo, i - 1);
    yield* qsort(i + 1, hi);
  }

  yield* qsort(0, n - 1);
  yield { type: 'markSorted', indices: range(n) };
};
