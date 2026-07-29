import type { Group, SortGenerator, StepContext } from '../types';

/**
 * Selection sort — each pass scans the unsorted tail for its minimum and swaps
 * it into the boundary position, which then becomes permanently sorted.
 */

/**
 * Pass `i` scans `j` rightwards holding the best-so-far at `min`. Unlike
 * insertion's prefix, a[0…i-1] here really is permanent, so it is `outside` and
 * the view renders it as final from `frame.state`.
 */
function selectionGroups(n: number, i: number, j: number, best: number): Group[] {
  const groups: Group[] = [];
  if (i > 0) groups.push({ lo: 0, hi: i - 1, kind: 'outside', label: 'locked' });
  if (j - 1 >= i)
    groups.push({
      lo: i,
      hi: j - 1,
      kind: 'scanned',
      label: `searched — smallest so far is ${best}`,
    });
  if (j <= n - 1) groups.push({ lo: j, hi: n - 1, kind: 'unexamined', label: 'still to search' });
  return groups;
}

export const selection: SortGenerator = function* selection(input) {
  const a = input.slice();
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let min = i;
    for (let j = i + 1; j < n; j++) {
      const ctx: StepContext = {
        groups: selectionGroups(n, i, j, a[min]),
        cursors: { i, j, min },
        phase: `Pass ${i + 1} of ${n - 1}`,
        pass: { index: i + 1, total: n - 1 },
      };
      yield {
        type: 'compare',
        i: min,
        j,
        line: 4,
        ctx: { ...ctx, values: { a: a[min], b: a[j] } },
      };
      if (a[j] < a[min]) min = j;
    }
    const settled: StepContext = {
      groups: selectionGroups(n, i, n, a[min]),
      cursors: { i, min },
      phase: `Pass ${i + 1} of ${n - 1}`,
      pass: { index: i + 1, total: n - 1 },
    };
    if (min !== i) {
      yield { type: 'swap', i, j: min, line: 5, ctx: settled };
      [a[i], a[min]] = [a[min], a[i]];
    }
    yield { type: 'markSorted', indices: [i], line: 5, ctx: settled };
  }
  if (n > 0)
    yield {
      type: 'markSorted',
      indices: [n - 1],
      line: 5,
      ctx: { groups: [{ lo: 0, hi: n - 1, kind: 'outside', label: 'locked' }], phase: 'Sorted' },
    };
};
