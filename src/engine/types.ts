/**
 * The typed step model (PLAN.md §4). Every algorithm is a pure generator
 * that yields these steps; the playback driver and all statistics are
 * derived from them. No DOM, no React in this module.
 */
/**
 * Every step carries the pseudocode line (0-indexed into
 * `PSEUDOCODE[algorithm]`) that produced it. That is what lets the Learn page
 * highlight the executing line in lock-step with the animation — forwards and
 * backwards — instead of showing static code beside a moving picture.
 */
export type Step = StepKind & { line?: number; ctx?: StepContext };

/** How one contiguous run of positions is classified by the running algorithm. */
export type GroupKind =
  | 'ordered' // sorted so far but NOT final (insertion's prefix)
  | 'unsorted' // in play, no finer structure known
  | 'scanned' // already examined during this pass
  | 'unexamined' // not yet reached during this pass
  | 'lessThan' // quicksort: proven < pivot
  | 'greaterThan' // quicksort: proven >= pivot
  | 'pivot' // quicksort: the pivot cell itself
  | 'merged' // merge: destination slots already written this merge
  | 'heap' // heapsort: the live max-heap
  | 'outside'; // not part of the call/pass currently executing

export interface Group {
  /** Inclusive position range. */
  lo: number;
  hi: number;
  kind: GroupKind;
  /** Short human label shown on the group's bracket, e.g. 'sorted so far', '< 41'. */
  label: string;
}

/**
 * Optional teaching context attached to a step. Purely descriptive: it never
 * touches the array, the counters, or replay. `applyStepsToArray` and
 * `accumulateStep` continue to ignore everything except `type`.
 *
 * CONTRACT — a step's `ctx` describes the array **after that step has been
 * applied**. Views read it via `contextAt(steps, frame.index)`, and the frame at
 * index `k` is the state after `steps[k-1]`, so a swap's groups must reflect the
 * post-swap array. Building them from the pre-step state puts the labels one
 * step behind and makes them lie (a `>= pivot` bracket spanning a smaller value).
 *
 * The "final" region is deliberately NOT a group kind — it is derived by the
 * view from `frame.state[id] === 'sorted'`, which the existing `markSorted`
 * steps already drive. One source of truth, not two.
 */
export interface StepContext {
  /**
   * How the algorithm currently carves up the array. INVARIANT: groups are
   * non-overlapping, sorted ascending by `lo`, and together cover exactly
   * 0…n-1. This is the field the Array view is built around.
   */
  groups?: readonly Group[];
  /**
   * Named cursors → array positions. Keys are DISPLAY LABELS and match the
   * identifiers used in the pseudocode ('i', 'j', 'min', 'end', 'k', 'root').
   */
  cursors?: Readonly<Record<string, number>>;
  /** Short phase label: 'Pass 2 of 7', 'Build max-heap', 'Merge 0-3'. */
  phase?: string;
  /** 1-based pass number (and total when known) for algorithms that run in passes. */
  pass?: { index: number; total?: number };
  /**
   * The two values ACTUALLY compared. Merge sort compares values held in
   * scratch buffers while overwriting the same range, so the highlighted cells
   * may no longer hold them. Required on every `compare` step.
   */
  values?: { a: number; b: number };
  /** Merge sort only: the merge in flight, so the view can draw both source runs. */
  merge?: {
    lo: number;
    mid: number;
    hi: number;
    /** Elements consumed from each half so far. */
    takeLeft: number;
    takeRight: number;
    /** Destination index the next write lands on. */
    write: number;
  };
}

type StepKind =
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
