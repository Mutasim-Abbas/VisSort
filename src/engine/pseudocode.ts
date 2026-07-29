import type { AlgorithmKey } from './registry';

/**
 * Teaching pseudocode for the Learn page. Indentation is encoded per line so
 * the renderer controls its own spacing; `k` marks keyword-ish lines rendered
 * with the accent tint.
 */
export interface PseudoLine {
  indent: 0 | 1 | 2 | 3;
  text: string;
}

const L = (indent: 0 | 1 | 2 | 3, text: string): PseudoLine => ({ indent, text });

export const PSEUDOCODE: Record<AlgorithmKey, PseudoLine[]> = {
  bubble: [
    L(0, 'procedure bubbleSort(A):'),
    L(1, 'repeat'),
    L(2, 'swapped ← false'),
    L(2, 'for i ← 0 to n − 2:'),
    L(3, 'if A[i] > A[i+1]:'),
    L(3, '    swap A[i], A[i+1];  swapped ← true'),
    L(1, 'until swapped = false'),
  ],
  insertion: [
    L(0, 'procedure insertionSort(A):'),
    L(1, 'for i ← 1 to n − 1:'),
    L(2, 'j ← i'),
    L(2, 'while j > 0 and A[j−1] > A[j]:'),
    L(3, 'swap A[j−1], A[j]'),
    L(3, 'j ← j − 1'),
  ],
  selection: [
    L(0, 'procedure selectionSort(A):'),
    L(1, 'for i ← 0 to n − 2:'),
    L(2, 'min ← i'),
    L(2, 'for j ← i+1 to n − 1:'),
    L(3, 'if A[j] < A[min]:  min ← j'),
    L(2, 'swap A[i], A[min]'),
  ],
  merge: [
    L(0, 'procedure mergeSort(A, lo, hi):'),
    L(1, 'if lo ≥ hi:  return'),
    L(1, 'mid ← ⌊(lo + hi) / 2⌋'),
    L(1, 'mergeSort(A, lo, mid)'),
    L(1, 'mergeSort(A, mid+1, hi)'),
    L(1, 'merge the two sorted halves:'),
    L(2, 'compare the front of each half'),
    L(2, 'write the smaller into place, advance'),
  ],
  quick: [
    L(0, 'procedure quickSort(A, lo, hi):'),
    L(1, 'if lo ≥ hi:  return'),
    L(1, 'pivot ← A[hi]'),
    L(1, 'i ← lo'),
    L(1, 'for j ← lo to hi − 1:'),
    L(2, 'if A[j] < pivot:  swap A[i], A[j];  i ← i+1'),
    L(1, 'swap A[i], A[hi]        ▹ pivot lands home'),
    L(1, 'quickSort(A, lo, i−1);  quickSort(A, i+1, hi)'),
  ],
  heap: [
    L(0, 'procedure heapSort(A):'),
    L(1, 'build a max-heap over A'),
    L(1, 'for end ← n − 1 down to 1:'),
    L(2, 'swap A[0], A[end]      ▹ largest to the back'),
    L(2, 'siftDown(A, 0, end):'),
    L(3, 'swap the root below its larger child'),
    L(3, 'repeat until the heap property holds'),
  ],
};
