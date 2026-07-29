import type { Group, Step, SortGenerator, StepContext } from '../types';

/**
 * Heapsort — build a max-heap in place, then repeatedly swap the root (largest)
 * to the end of the unsorted region and sift the new root down. Swap-based.
 */

/**
 * `end` is the heap size: a[0…end-1] is the live max-heap, a[end…n-1] holds the
 * already-extracted largest values and renders as final from `frame.state`.
 */
function heapGroups(n: number, end: number): Group[] {
  const groups: Group[] = [];
  if (end - 1 >= 0) groups.push({ lo: 0, hi: end - 1, kind: 'heap', label: 'max-heap' });
  if (end <= n - 1) groups.push({ lo: end, hi: n - 1, kind: 'outside', label: 'extracted' });
  return groups;
}

export const heap: SortGenerator = function* heap(input) {
  const a = input.slice();
  const n = a.length;

  function* siftDown(lo: number, hi: number, phase: string): Generator<Step, void, undefined> {
    let root = lo;
    for (;;) {
      let child = 2 * root + 1;
      if (child >= hi) break;
      const ctx = (): StepContext => ({
        groups: heapGroups(n, hi),
        cursors: { root, child },
        phase,
      });
      if (child + 1 < hi) {
        yield {
          type: 'compare',
          i: child,
          j: child + 1,
          line: 5,
          ctx: { ...ctx(), values: { a: a[child], b: a[child + 1] } },
        };
        if (a[child + 1] > a[child]) child++;
      }
      yield {
        type: 'compare',
        i: root,
        j: child,
        line: 5,
        ctx: { ...ctx(), values: { a: a[root], b: a[child] } },
      };
      if (a[root] < a[child]) {
        yield { type: 'swap', i: root, j: child, line: 5, ctx: ctx() };
        [a[root], a[child]] = [a[child], a[root]];
        root = child;
      } else {
        break;
      }
    }
  }

  for (let i = (n >> 1) - 1; i >= 0; i--) {
    yield* siftDown(i, n, 'Build max-heap');
  }
  for (let end = n - 1; end > 0; end--) {
    const phase = `Extract ${n - end} of ${n}`;
    // Post-swap the maximum has left the heap and sits at `end`, so the heap
    // extent is already 0…end-1 — it is merely unrepaired until siftDown runs.
    const ctx: StepContext = { groups: heapGroups(n, end), cursors: { end }, phase };
    yield { type: 'swap', i: 0, j: end, line: 3, ctx };
    [a[0], a[end]] = [a[end], a[0]];
    yield {
      type: 'markSorted',
      indices: [end],
      line: 3,
      ctx: { groups: heapGroups(n, end), cursors: { end }, phase },
    };
    yield* siftDown(0, end, phase);
  }
  if (n > 0)
    yield {
      type: 'markSorted',
      indices: [0],
      line: 3,
      ctx: { groups: heapGroups(n, 0), phase: 'Sorted' },
    };
};
