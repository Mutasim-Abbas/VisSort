/**
 * "Columns" is the 3D crane stage — it replaced the flat 2D bar canvas as the
 * Visualizer's primary view. (`BarCanvas` still backs the Compare page's race.)
 *
 * "Structure" (mode id `tree`, kept for URL/state compatibility) shows whatever
 * shape the running algorithm actually has: a recursion tree for merge and
 * quick, a binary heap for heapsort, and a pass ladder for the three that run in
 * flat passes. It is available for every algorithm, so switching algorithm can
 * no longer silently kick the user back to Columns.
 */
export type ViewMode = 'columns' | 'array' | 'tree';
