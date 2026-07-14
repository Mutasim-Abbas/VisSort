import type { SortGenerator } from '../types';
import { range } from './shared';

/**
 * Shell sort — gapped insertion sort using Knuth's `3h+1` gap sequence. Wide
 * gaps move elements a long way early; the final gap of 1 is ordinary
 * insertion sort on a nearly-sorted array. Swap-based (gapped swaps).
 */
export const shell: SortGenerator = function* shell(input) {
  const a = input.slice();
  const n = a.length;

  let gap = 1;
  while (gap < Math.floor(n / 3)) gap = gap * 3 + 1;

  for (; gap > 0; gap = Math.floor(gap / 3)) {
    for (let i = gap; i < n; i++) {
      let j = i;
      while (j >= gap) {
        yield { type: 'compare', i: j - gap, j };
        if (a[j - gap] > a[j]) {
          yield { type: 'swap', i: j - gap, j };
          [a[j - gap], a[j]] = [a[j], a[j - gap]];
          j -= gap;
        } else {
          break;
        }
      }
    }
  }
  yield { type: 'markSorted', indices: range(n) };
};
