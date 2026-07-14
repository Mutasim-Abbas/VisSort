import type { Step, SortGenerator } from '../types';

/**
 * Heapsort — build a max-heap in place, then repeatedly swap the root (largest)
 * to the end of the unsorted region and sift the new root down. Swap-based.
 */
export const heap: SortGenerator = function* heap(input) {
  const a = input.slice();
  const n = a.length;

  function* siftDown(lo: number, hi: number): Generator<Step, void, undefined> {
    let root = lo;
    for (;;) {
      let child = 2 * root + 1;
      if (child >= hi) break;
      if (child + 1 < hi) {
        yield { type: 'compare', i: child, j: child + 1 };
        if (a[child + 1] > a[child]) child++;
      }
      yield { type: 'compare', i: root, j: child };
      if (a[root] < a[child]) {
        yield { type: 'swap', i: root, j: child };
        [a[root], a[child]] = [a[child], a[root]];
        root = child;
      } else {
        break;
      }
    }
  }

  for (let i = (n >> 1) - 1; i >= 0; i--) {
    yield* siftDown(i, n);
  }
  for (let end = n - 1; end > 0; end--) {
    yield { type: 'swap', i: 0, j: end };
    [a[0], a[end]] = [a[end], a[0]];
    yield { type: 'markSorted', indices: [end] };
    yield* siftDown(0, end);
  }
  if (n > 0) yield { type: 'markSorted', indices: [0] };
};
