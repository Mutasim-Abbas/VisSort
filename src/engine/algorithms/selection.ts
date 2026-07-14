import type { SortGenerator } from '../types';

/**
 * Selection sort — each pass scans the unsorted tail for its minimum and swaps
 * it into the boundary position, which then becomes permanently sorted.
 */
export const selection: SortGenerator = function* selection(input) {
  const a = input.slice();
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let min = i;
    for (let j = i + 1; j < n; j++) {
      yield { type: 'compare', i: min, j };
      if (a[j] < a[min]) min = j;
    }
    if (min !== i) {
      yield { type: 'swap', i, j: min };
      [a[i], a[min]] = [a[min], a[i]];
    }
    yield { type: 'markSorted', indices: [i] };
  }
  if (n > 0) yield { type: 'markSorted', indices: [n - 1] };
};
