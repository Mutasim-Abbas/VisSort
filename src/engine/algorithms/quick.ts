import type { Group, Step, SortGenerator, StepContext } from '../types';
import { range } from './shared';

/**
 * Quicksort (Lomuto partition, last element as pivot) — the pivot is marked so
 * the visualization highlights it while the partition scan slides smaller
 * elements left. Each pivot lands in its final position (marked sorted).
 */

/**
 * The three live partitions of a Lomuto scan. This is the best teaching visual
 * in the feature: `< pivot` grows from the left, `>= pivot` trails it, and the
 * unexamined tail shrinks — all inside the current call's range, with the rest
 * of the array explicitly marked as another branch.
 */
function quickGroups(n: number, lo: number, hi: number, i: number, j: number, pivot: number) {
  const groups: Group[] = [];
  if (lo > 0) groups.push({ lo: 0, hi: lo - 1, kind: 'outside', label: 'another branch' });
  if (i - 1 >= lo) groups.push({ lo, hi: i - 1, kind: 'lessThan', label: `< ${pivot}` });
  if (j - 1 >= i) groups.push({ lo: i, hi: j - 1, kind: 'greaterThan', label: `>= ${pivot}` });
  if (hi - 1 >= j)
    groups.push({ lo: j, hi: hi - 1, kind: 'unexamined', label: 'not compared yet' });
  groups.push({ lo: hi, hi, kind: 'pivot', label: `pivot = ${pivot}` });
  if (hi + 1 <= n - 1)
    groups.push({ lo: hi + 1, hi: n - 1, kind: 'outside', label: 'another branch' });
  return groups;
}

/**
 * After the closing swap the pivot no longer sits at `hi` — it has been moved to
 * its final position `p`, with everything below it smaller and everything above
 * it at least as large. Using the pre-swap grouping here would point the pivot
 * marker at a cell that no longer holds the pivot.
 */
function settledGroups(n: number, lo: number, hi: number, p: number, pivot: number): Group[] {
  const groups: Group[] = [];
  if (lo > 0) groups.push({ lo: 0, hi: lo - 1, kind: 'outside', label: 'another branch' });
  if (p - 1 >= lo) groups.push({ lo, hi: p - 1, kind: 'lessThan', label: `< ${pivot}` });
  groups.push({ lo: p, hi: p, kind: 'pivot', label: `pivot = ${pivot}` });
  if (hi >= p + 1) groups.push({ lo: p + 1, hi, kind: 'greaterThan', label: `>= ${pivot}` });
  if (hi + 1 <= n - 1)
    groups.push({ lo: hi + 1, hi: n - 1, kind: 'outside', label: 'another branch' });
  return groups;
}

/** A call range with no partition in flight (opening, or a single cell). */
function callGroups(n: number, lo: number, hi: number, label: string): Group[] {
  const groups: Group[] = [];
  if (lo > 0) groups.push({ lo: 0, hi: lo - 1, kind: 'outside', label: 'another branch' });
  groups.push({ lo, hi, kind: 'unsorted', label });
  if (hi + 1 <= n - 1)
    groups.push({ lo: hi + 1, hi: n - 1, kind: 'outside', label: 'another branch' });
  return groups;
}

export const quick: SortGenerator = function* quick(input) {
  const a = input.slice();
  const n = a.length;

  function* qsort(lo: number, hi: number): Generator<Step, void, undefined> {
    if (lo > hi) return;
    const phase = `Partition ${lo}-${hi}`;
    // Node appears as the recursive call opens (Tree view watches it divide).
    yield {
      type: 'divide',
      lo,
      hi,
      line: 0,
      ctx: { groups: callGroups(n, lo, hi, 'this call'), phase },
    };
    if (lo === hi) {
      yield {
        type: 'markSorted',
        indices: [lo],
        line: 1,
        ctx: { groups: callGroups(n, lo, hi, 'single cell — already in place'), phase },
      };
      return;
    }
    const pivot = a[hi];
    yield {
      type: 'markPivot',
      index: hi,
      line: 2,
      ctx: { groups: quickGroups(n, lo, hi, lo, lo, pivot), cursors: { p: hi }, phase },
    };
    let i = lo;
    for (let j = lo; j < hi; j++) {
      const ctx: StepContext = {
        groups: quickGroups(n, lo, hi, i, j, pivot),
        cursors: { i, j, p: hi },
        phase,
      };
      yield {
        type: 'compare',
        i: j,
        j: hi,
        line: 5,
        ctx: { ...ctx, values: { a: a[j], b: pivot } },
      };
      if (a[j] < pivot) {
        if (i !== j) {
          // Post-swap the boundary has advanced: a[j] joined the `< pivot` run
          // and the element it displaced now sits at j on the `>=` side.
          yield {
            type: 'swap',
            i,
            j,
            line: 5,
            ctx: {
              groups: quickGroups(n, lo, hi, i + 1, j + 1, pivot),
              cursors: { i: i + 1, j, p: hi },
              phase,
            },
          };
          [a[i], a[j]] = [a[j], a[i]];
        }
        i++;
      }
    }
    // The closing swap lands the pivot on its final index, so both it and the
    // markSorted that follows describe the settled partition.
    const settled: StepContext = {
      groups: settledGroups(n, lo, hi, i, pivot),
      cursors: { p: i },
      phase,
    };
    if (i !== hi) {
      yield { type: 'swap', i, j: hi, line: 6, ctx: settled };
      [a[i], a[hi]] = [a[hi], a[i]];
    }
    yield { type: 'markSorted', indices: [i], line: 6, ctx: settled };
    yield* qsort(lo, i - 1);
    yield* qsort(i + 1, hi);
  }

  yield* qsort(0, n - 1);
  yield {
    type: 'markSorted',
    indices: range(n),
    line: 7,
    ctx:
      n > 0
        ? { groups: [{ lo: 0, hi: n - 1, kind: 'outside', label: 'sorted' }], phase: 'Sorted' }
        : { groups: [], phase: 'Sorted' },
  };
};
