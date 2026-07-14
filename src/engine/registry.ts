import type { SortGenerator } from './types';
import { bubble } from './algorithms/bubble';
import { insertion } from './algorithms/insertion';
import { selection } from './algorithms/selection';
import { merge } from './algorithms/merge';
import { quick } from './algorithms/quick';
import { heap } from './algorithms/heap';
import { shell } from './algorithms/shell';
import { radix } from './algorithms/radix';

export type AlgorithmKey =
  | 'bubble'
  | 'insertion'
  | 'selection'
  | 'merge'
  | 'quick'
  | 'heap'
  | 'shell'
  | 'radix';

export interface Complexity {
  best: string;
  average: string;
  worst: string;
  space: string;
}

export interface AlgorithmMeta {
  key: AlgorithmKey;
  name: string;
  generator: SortGenerator;
  /** How the algorithm mutates the array — drives the "swaps vs writes" stat. */
  writesModel: 'swap' | 'overwrite';
  stable: boolean;
  complexity: Complexity;
  /** One-paragraph plain-language explanation shown in the info panel. */
  description: string;
}

export const ALGORITHMS: readonly AlgorithmMeta[] = [
  {
    key: 'bubble',
    name: 'Bubble Sort',
    generator: bubble,
    writesModel: 'swap',
    stable: true,
    complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
    description:
      'Repeatedly steps through the list, comparing adjacent items and swapping them when out of order. After each pass the largest remaining value has “bubbled” to its final place. Simple and stable, but quadratic — best used only to teach the idea of sorting.',
  },
  {
    key: 'insertion',
    name: 'Insertion Sort',
    generator: insertion,
    writesModel: 'swap',
    stable: true,
    complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
    description:
      'Builds the sorted array one element at a time, taking each new value and sliding it back past larger neighbours until it sits in the right spot. Excellent on small or nearly-sorted data, where it approaches linear time.',
  },
  {
    key: 'selection',
    name: 'Selection Sort',
    generator: selection,
    writesModel: 'swap',
    stable: false,
    complexity: { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
    description:
      'Scans the unsorted region for its smallest value and swaps it into the next sorted slot. It always does the same number of comparisons regardless of input, but performs at most n−1 swaps — handy when writes are expensive.',
  },
  {
    key: 'merge',
    name: 'Merge Sort',
    generator: merge,
    writesModel: 'overwrite',
    stable: true,
    complexity: {
      best: 'O(n log n)',
      average: 'O(n log n)',
      worst: 'O(n log n)',
      space: 'O(n)',
    },
    description:
      'A divide-and-conquer sort: recursively split the array in half, sort each half, then merge the two sorted halves back together. Guarantees O(n log n) in every case and is stable, at the cost of O(n) extra memory.',
  },
  {
    key: 'quick',
    name: 'Quicksort',
    generator: quick,
    writesModel: 'swap',
    stable: false,
    complexity: {
      best: 'O(n log n)',
      average: 'O(n log n)',
      worst: 'O(n²)',
      space: 'O(log n)',
    },
    description:
      'Picks a pivot (here, the last element), partitions the array so smaller values sit left of it and larger values right, then recurses on each side. Very fast in practice with excellent cache behaviour, though a bad pivot streak degrades it to O(n²).',
  },
  {
    key: 'heap',
    name: 'Heapsort',
    generator: heap,
    writesModel: 'swap',
    stable: false,
    complexity: {
      best: 'O(n log n)',
      average: 'O(n log n)',
      worst: 'O(n log n)',
      space: 'O(1)',
    },
    description:
      'Turns the array into a binary max-heap, then repeatedly swaps the largest element to the end and restores the heap over the shrinking front. O(n log n) worst-case with no extra memory, though its scattered access pattern makes it slower than quicksort in practice.',
  },
  {
    key: 'shell',
    name: 'Shell Sort',
    generator: shell,
    writesModel: 'swap',
    stable: false,
    complexity: {
      best: 'O(n log n)',
      average: 'O(n^1.25)',
      worst: 'O(n²)',
      space: 'O(1)',
    },
    description:
      'A generalisation of insertion sort that first sorts elements far apart (a large “gap”), then narrows the gap until it reaches 1. The early long-distance moves clear most disorder, so the final pass is nearly linear. Performance depends on the gap sequence (Knuth’s 3h+1 here).',
  },
  {
    key: 'radix',
    name: 'Radix Sort (LSD)',
    generator: radix,
    writesModel: 'overwrite',
    stable: true,
    complexity: {
      best: 'O(nk)',
      average: 'O(nk)',
      worst: 'O(nk)',
      space: 'O(n + k)',
    },
    description:
      'A non-comparison sort for integers: it distributes values into buckets by their least-significant digit, then the next digit, and so on. With a fixed number of digits k it runs in linear O(nk) time — no element is ever compared to another, so its swap count is always zero.',
  },
];

export const ALGORITHM_MAP: Readonly<Record<AlgorithmKey, AlgorithmMeta>> = Object.fromEntries(
  ALGORITHMS.map((a) => [a.key, a]),
) as Record<AlgorithmKey, AlgorithmMeta>;

export function getAlgorithm(key: AlgorithmKey): AlgorithmMeta {
  return ALGORITHM_MAP[key];
}
