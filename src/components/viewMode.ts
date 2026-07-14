import type { AlgorithmKey } from '../engine/registry';

export type ViewMode = 'columns' | 'array' | 'tree';

/** Tree view only makes sense for divide-and-conquer / heap algorithms. */
export const TREE_CAPABLE: readonly AlgorithmKey[] = ['merge', 'quick', 'heap'];
