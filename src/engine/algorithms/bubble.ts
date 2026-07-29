import type { Group, SortGenerator, StepContext } from '../types';

/**
 * Bubble sort — repeatedly swap adjacent out-of-order pairs. Swap-based, so
 * bars slide past each other. Each pass floats the largest unsorted element
 * to its final position (marked sorted). Early-exits when a pass makes no swap.
 */

/**
 * Groups for pass `i` with the scan sitting at `j`.
 *
 * The inner loop runs `j` from 0 to `n-2-i` and compares `j` with `j+1`, so the
 * highest index this pass can touch is `n-1-i`. Everything from `n-i` rightwards
 * was bubbled into place by earlier passes — which is correctly empty on pass 0.
 */
function bubbleGroups(n: number, i: number, j: number): Group[] {
  const lastInPlay = n - 1 - i;
  const groups: Group[] = [];
  if (j >= 0) groups.push({ lo: 0, hi: j, kind: 'scanned', label: 'swept this pass' });
  if (j + 1 <= lastInPlay)
    groups.push({ lo: j + 1, hi: lastInPlay, kind: 'unexamined', label: 'not reached yet' });
  if (lastInPlay + 1 <= n - 1)
    groups.push({ lo: lastInPlay + 1, hi: n - 1, kind: 'outside', label: 'bubbled into place' });
  return groups;
}

export const bubble: SortGenerator = function* bubble(input) {
  const a = input.slice();
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - 1 - i; j++) {
      const ctx: StepContext = {
        groups: bubbleGroups(n, i, j - 1),
        cursors: { i: j, 'i+1': j + 1 },
        phase: `Pass ${i + 1}`,
        pass: { index: i + 1, total: n - 1 },
      };
      yield {
        type: 'compare',
        i: j,
        j: j + 1,
        line: 4,
        ctx: { ...ctx, values: { a: a[j], b: a[j + 1] } },
      };
      if (a[j] > a[j + 1]) {
        // Post-swap this pair is settled relative to each other, so the sweep
        // has now genuinely covered position j.
        yield {
          type: 'swap',
          i: j,
          j: j + 1,
          line: 5,
          ctx: { ...ctx, groups: bubbleGroups(n, i, j) },
        };
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swapped = true;
      }
    }
    yield {
      type: 'markSorted',
      indices: [n - 1 - i],
      line: 6,
      ctx: {
        groups: bubbleGroups(n, i, n - 1 - i),
        phase: `Pass ${i + 1}`,
        pass: { index: i + 1, total: n - 1 },
      },
    };
    if (!swapped) break;
  }
};
