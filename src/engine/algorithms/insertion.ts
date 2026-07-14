import type { SortGenerator } from '../types';
import { range } from './shared';

/**
 * Insertion sort — grow a sorted prefix by walking each new element left past
 * larger neighbours. Implemented with adjacent swaps (rather than shifts) so it
 * stays in the "sliding bars" family and remains stable.
 */
export const insertion: SortGenerator = function* insertion(input) {
  const a = input.slice();
  const n = a.length;
  for (let i = 1; i < n; i++) {
    let j = i;
    while (j > 0) {
      yield { type: 'compare', i: j - 1, j, line: 3 };
      if (a[j - 1] > a[j]) {
        yield { type: 'swap', i: j - 1, j, line: 4 };
        [a[j - 1], a[j]] = [a[j], a[j - 1]];
        j--;
      } else {
        break;
      }
    }
  }
  yield { type: 'markSorted', indices: range(n), line: 1 };
};
