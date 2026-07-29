import type { Group, SortGenerator, StepContext } from '../types';
import { range } from './shared';

/**
 * Insertion sort — grow a sorted prefix by walking each new element left past
 * larger neighbours. Implemented with adjacent swaps (rather than shifts) so it
 * stays in the "sliding bars" family and remains stable.
 */

/**
 * The `ordered` prefix is the whole point of this algorithm's visual: a[0…i] is
 * in order, but it is emphatically NOT final — a later element can still slide
 * into the middle of it. That is why it is `ordered` and not `outside`, and why
 * the view must render the two differently.
 */
function insertionGroups(n: number, i: number, sliding: number | null): Group[] {
  const groups: Group[] = [];
  const label = sliding === null ? 'sorted so far' : `sorted so far — ${sliding} sliding in`;
  if (i >= 0) groups.push({ lo: 0, hi: i, kind: 'ordered', label });
  if (i + 1 <= n - 1)
    groups.push({ lo: i + 1, hi: n - 1, kind: 'unsorted', label: 'not yet inserted' });
  return groups;
}

export const insertion: SortGenerator = function* insertion(input) {
  const a = input.slice();
  const n = a.length;
  for (let i = 1; i < n; i++) {
    // The value being inserted travels with `j`; capture it before it moves.
    const moving = a[i];
    let j = i;
    while (j > 0) {
      const ctx: StepContext = {
        groups: insertionGroups(n, i, moving),
        cursors: { i, j },
        phase: `Pass ${i} of ${n - 1}`,
        pass: { index: i, total: n - 1 },
      };
      yield {
        type: 'compare',
        i: j - 1,
        j,
        line: 3,
        ctx: { ...ctx, values: { a: a[j - 1], b: a[j] } },
      };
      if (a[j - 1] > a[j]) {
        yield { type: 'swap', i: j - 1, j, line: 4, ctx };
        [a[j - 1], a[j]] = [a[j], a[j - 1]];
        j--;
      } else {
        break;
      }
    }
  }
  yield {
    type: 'markSorted',
    indices: range(n),
    line: 1,
    ctx: { groups: insertionGroups(n, n - 1, null), phase: 'Sorted' },
  };
};
