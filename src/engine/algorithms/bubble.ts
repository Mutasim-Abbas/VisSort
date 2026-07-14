import type { SortGenerator } from '../types';

/**
 * Bubble sort — repeatedly swap adjacent out-of-order pairs. Swap-based, so
 * bars slide past each other. Each pass floats the largest unsorted element
 * to its final position (marked sorted). Early-exits when a pass makes no swap.
 */
export const bubble: SortGenerator = function* bubble(input) {
  const a = input.slice();
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - 1 - i; j++) {
      yield { type: 'compare', i: j, j: j + 1 };
      if (a[j] > a[j + 1]) {
        yield { type: 'swap', i: j, j: j + 1 };
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swapped = true;
      }
    }
    yield { type: 'markSorted', indices: [n - 1 - i] };
    if (!swapped) break;
  }
};
