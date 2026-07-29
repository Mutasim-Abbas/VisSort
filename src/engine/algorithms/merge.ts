import type { Group, Step, SortGenerator, StepContext } from '../types';
import { range } from './shared';

/**
 * Merge sort (top-down) — recursively sort halves, then merge them back into
 * place. Overwrite-based: values are written into their target slots (bars
 * morph height in place rather than sliding), so the swap counter stays at 0.
 */

/** The range being split, before any combining starts. */
function divideGroups(n: number, lo: number, hi: number): Group[] {
  if (hi < lo) return [];
  const groups: Group[] = [];
  if (lo > 0) groups.push({ lo: 0, hi: lo - 1, kind: 'outside', label: 'another branch' });
  groups.push({ lo, hi, kind: 'unsorted', label: 'being split' });
  if (hi + 1 <= n - 1)
    groups.push({ lo: hi + 1, hi: n - 1, kind: 'outside', label: 'another branch' });
  return groups;
}

/**
 * Mid-merge: everything below the write head `k` already holds merged output;
 * from `k` rightwards the cells still hold stale values that are about to be
 * overwritten. The two *source* runs cannot be shown by the array's own cells at
 * all — they only exist in the scratch copies — which is what `ctx.merge` is for.
 */
function combineGroups(n: number, lo: number, hi: number, k: number): Group[] {
  const groups: Group[] = [];
  if (lo > 0) groups.push({ lo: 0, hi: lo - 1, kind: 'outside', label: 'another branch' });
  if (k - 1 >= lo) groups.push({ lo, hi: k - 1, kind: 'merged', label: 'merged, in order' });
  if (k <= hi)
    groups.push({ lo: k, hi, kind: 'unexamined', label: 'destination — being overwritten' });
  if (hi + 1 <= n - 1)
    groups.push({ lo: hi + 1, hi: n - 1, kind: 'outside', label: 'another branch' });
  return groups;
}

export const merge: SortGenerator = function* merge(input) {
  const a = input.slice();
  const n = a.length;

  function* mergeSort(lo: number, hi: number): Generator<Step, void, undefined> {
    // The node for this range appears the moment the call opens, so the Tree
    // view shows the array being split apart step by step.
    yield {
      type: 'divide',
      lo,
      hi,
      line: 0,
      ctx: { groups: divideGroups(n, lo, hi), phase: `Split ${lo}-${hi}` },
    };
    if (hi - lo < 1) return;
    const mid = (lo + hi) >> 1;
    yield* mergeSort(lo, mid);
    yield* mergeSort(mid + 1, hi);

    const phase = `Merge ${lo}-${hi}`;
    yield {
      type: 'combine',
      lo,
      hi,
      line: 5,
      ctx: {
        groups: combineGroups(n, lo, hi, lo),
        phase,
        merge: { lo, mid, hi, takeLeft: 0, takeRight: 0, write: lo },
      },
    };
    const left = a.slice(lo, mid + 1);
    const right = a.slice(mid + 1, hi + 1);
    let i = 0;
    let j = 0;
    let k = lo;

    /** Context for the write head at `k`, having consumed `i`/`j` from each run. */
    const at = (): StepContext => ({
      groups: combineGroups(n, lo, hi, k),
      cursors: { k, L: lo + i, R: mid + 1 + j },
      phase,
      merge: { lo, mid, hi, takeLeft: i, takeRight: j, write: k },
    });

    /**
     * Context for the state a write leaves behind: cell `k` has just been filled,
     * so it belongs to the merged run and the head has moved on. Steps describe
     * the array *after* they apply (see the contract on `StepContext`).
     */
    const after = (takeLeft: number, takeRight: number): StepContext => ({
      groups: combineGroups(n, lo, hi, k + 1),
      cursors: { k: Math.min(k + 1, hi), L: lo + takeLeft, R: mid + 1 + takeRight },
      phase,
      merge: { lo, mid, hi, takeLeft, takeRight, write: k + 1 },
    });

    while (i < left.length && j < right.length) {
      // The compared values come from the scratch runs, NOT from a[lo+i] /
      // a[mid+1+j]: the write head has already overwritten part of that range,
      // so those cells routinely no longer hold what is being compared.
      yield {
        type: 'compare',
        i: lo + i,
        j: mid + 1 + j,
        line: 6,
        ctx: { ...at(), values: { a: left[i], b: right[j] } },
      };
      if (left[i] <= right[j]) {
        yield { type: 'overwrite', index: k, value: left[i], line: 7, ctx: after(i + 1, j) };
        a[k] = left[i];
        i++;
      } else {
        yield { type: 'overwrite', index: k, value: right[j], line: 7, ctx: after(i, j + 1) };
        a[k] = right[j];
        j++;
      }
      k++;
    }
    while (i < left.length) {
      yield { type: 'overwrite', index: k, value: left[i], line: 7, ctx: after(i + 1, j) };
      a[k] = left[i];
      i++;
      k++;
    }
    while (j < right.length) {
      yield { type: 'overwrite', index: k, value: right[j], line: 7, ctx: after(i, j + 1) };
      a[k] = right[j];
      j++;
      k++;
    }
  }

  yield* mergeSort(0, n - 1);
  yield {
    type: 'markSorted',
    indices: range(n),
    line: 5,
    ctx: {
      groups: n > 0 ? [{ lo: 0, hi: n - 1, kind: 'merged', label: 'sorted' }] : [],
      phase: 'Sorted',
    },
  };
};
