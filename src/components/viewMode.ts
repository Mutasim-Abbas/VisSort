import type { AlgorithmKey } from '../engine/registry';

/**
 * "Columns" is the 3D crane stage — it replaced the flat 2D bar canvas as the
 * Visualizer's primary view. (`BarCanvas` still backs the Compare page's race.)
 */
export type ViewMode = 'columns' | 'array' | 'tree';

/** Tree view only makes sense for divide-and-conquer / heap algorithms. */
export const TREE_CAPABLE: readonly AlgorithmKey[] = ['merge', 'quick', 'heap'];
