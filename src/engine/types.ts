/**
 * The typed step model (PLAN.md §4). Every algorithm is a pure generator
 * that yields these steps; the playback driver and all statistics are
 * derived from them. No DOM, no React in this module.
 */
export type Step =
  | { type: 'compare'; i: number; j: number }
  | { type: 'swap'; i: number; j: number }
  | { type: 'overwrite'; index: number; value: number }
  | { type: 'markPivot'; index: number }
  | { type: 'markSorted'; indices: number[] }
  /**
   * Recursion annotations for the Tree view. `divide` fires when a recursive
   * call opens on the range [lo..hi] — the tree node appears at that moment, so
   * the division is watched happening rather than shown pre-built. `combine`
   * fires when that range starts merging back together. Neither touches the
   * array nor costs a comparison/write.
   */
  | { type: 'divide'; lo: number; hi: number }
  | { type: 'combine'; lo: number; hi: number };

/** A pure sorting step generator: same input → same step sequence. */
export type SortGenerator = (input: readonly number[]) => Generator<Step, void, undefined>;

/** Visual state of a single bar, in rendering-priority order. */
export type BarState = 'comparing' | 'swapping' | 'overwriting' | 'pivot' | 'sorted' | 'default';
