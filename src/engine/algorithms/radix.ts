import type { SortGenerator } from '../types';
import { range } from './shared';

/**
 * Radix sort (LSD, base 10) — a non-comparison distribution sort. For each
 * digit it counts, computes offsets, then writes every element into its bucket
 * position. Overwrite-based, so the swap counter stays at 0 by design. Assumes
 * non-negative integers (VisSort bar heights always are).
 */
export const radix: SortGenerator = function* radix(input) {
  const a = input.slice();
  const n = a.length;
  if (n === 0) return;

  let max = a[0];
  for (let i = 1; i < n; i++) if (a[i] > max) max = a[i];

  for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
    const output = new Array<number>(n);
    const count = new Array<number>(10).fill(0);
    for (let i = 0; i < n; i++) {
      yield { type: 'compare', i, j: i, line: 2 };
      count[Math.floor(a[i] / exp) % 10]++;
    }
    for (let d = 1; d < 10; d++) count[d] += count[d - 1];
    for (let i = n - 1; i >= 0; i--) {
      const d = Math.floor(a[i] / exp) % 10;
      output[--count[d]] = a[i];
    }
    for (let i = 0; i < n; i++) {
      yield { type: 'overwrite', index: i, value: output[i], line: 4 };
      a[i] = output[i];
    }
  }
  yield { type: 'markSorted', indices: range(n), line: 5 };
};
