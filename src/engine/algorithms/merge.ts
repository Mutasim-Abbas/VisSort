import type { Step, SortGenerator } from '../types';
import { range } from './shared';

/**
 * Merge sort (top-down) — recursively sort halves, then merge them back into
 * place. Overwrite-based: values are written into their target slots (bars
 * morph height in place rather than sliding), so the swap counter stays at 0.
 */
export const merge: SortGenerator = function* merge(input) {
  const a = input.slice();
  const n = a.length;

  function* mergeSort(lo: number, hi: number): Generator<Step, void, undefined> {
    // The node for this range appears the moment the call opens, so the Tree
    // view shows the array being split apart step by step.
    yield { type: 'divide', lo, hi };
    if (hi - lo < 1) return;
    const mid = (lo + hi) >> 1;
    yield* mergeSort(lo, mid);
    yield* mergeSort(mid + 1, hi);

    yield { type: 'combine', lo, hi };
    const left = a.slice(lo, mid + 1);
    const right = a.slice(mid + 1, hi + 1);
    let i = 0;
    let j = 0;
    let k = lo;
    while (i < left.length && j < right.length) {
      yield { type: 'compare', i: lo + i, j: mid + 1 + j };
      if (left[i] <= right[j]) {
        yield { type: 'overwrite', index: k, value: left[i] };
        a[k] = left[i];
        i++;
      } else {
        yield { type: 'overwrite', index: k, value: right[j] };
        a[k] = right[j];
        j++;
      }
      k++;
    }
    while (i < left.length) {
      yield { type: 'overwrite', index: k, value: left[i] };
      a[k] = left[i];
      i++;
      k++;
    }
    while (j < right.length) {
      yield { type: 'overwrite', index: k, value: right[j] };
      a[k] = right[j];
      j++;
      k++;
    }
  }

  yield* mergeSort(0, n - 1);
  yield { type: 'markSorted', indices: range(n) };
};
