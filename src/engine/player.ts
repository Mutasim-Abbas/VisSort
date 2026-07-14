import type { Step, BarState } from './types';
import { type Counters, zeroCounters, accumulateStep } from './counters';

/**
 * A rendered snapshot of the visualization at one step index. All arrays are
 * indexed by *bar id* (a bar's stable identity), so React can key bars by id
 * and let CSS transition their `--tx` as they slide between positions.
 */
export interface Frame {
  /** heights[id] — the value carried by bar `id` (its pixel/percent height). */
  heights: number[];
  /** posOf[id] — the current array position (0…n-1) of bar `id`. */
  posOf: number[];
  /** state[id] — the visual state of bar `id` at this step. */
  state: BarState[];
  /** Bar id currently marked as the pivot, or null. */
  pivotId: number | null;
  counters: Counters;
  /** Number of steps applied so far (0 = initial array). */
  index: number;
  /** Total number of steps in the run. */
  total: number;
}

/**
 * Drives a precomputed step list over a mutable visual model. Swap steps move
 * bars between positions (they keep their height and slide); overwrite steps
 * change the height of whichever bar sits at a position (it morphs in place).
 *
 * The Player owns no timing and no React state — {@link usePlayback} wraps it
 * with a requestAnimationFrame loop and publishes {@link Frame}s.
 */
export class Player {
  private readonly base: number[];
  private readonly steps: readonly Step[];
  private readonly n: number;

  private heights: number[] = [];
  private posOf: number[] = []; // id -> position
  private idAtPos: number[] = []; // position -> id
  private sortedPos: boolean[] = [];
  private pivotPos: number | null = null;
  private counters: Counters = zeroCounters();
  private idx = 0;

  // Transient highlight for the most recently applied step (positions).
  private cmpA = -1;
  private cmpB = -1;
  private swpA = -1;
  private swpB = -1;
  private ovr = -1;

  constructor(input: readonly number[], steps: readonly Step[]) {
    this.base = input.slice();
    this.steps = steps;
    this.n = input.length;
    this.reset();
  }

  get total(): number {
    return this.steps.length;
  }

  get index(): number {
    return this.idx;
  }

  get atEnd(): boolean {
    return this.idx >= this.steps.length;
  }

  reset(): void {
    this.heights = this.base.slice();
    this.posOf = this.base.map((_, i) => i);
    this.idAtPos = this.base.map((_, i) => i);
    this.sortedPos = new Array<boolean>(this.n).fill(false);
    this.pivotPos = null;
    this.counters = zeroCounters();
    this.idx = 0;
    this.clearHighlight();
  }

  private clearHighlight(): void {
    this.cmpA = this.cmpB = this.swpA = this.swpB = this.ovr = -1;
  }

  /** Apply one step's effect to the model and record its highlight. */
  private apply(step: Step): void {
    this.clearHighlight();
    switch (step.type) {
      case 'compare':
        this.cmpA = step.i;
        this.cmpB = step.j;
        break;
      case 'swap': {
        this.swpA = step.i;
        this.swpB = step.j;
        const a = this.idAtPos[step.i];
        const b = this.idAtPos[step.j];
        this.idAtPos[step.i] = b;
        this.idAtPos[step.j] = a;
        this.posOf[a] = step.j;
        this.posOf[b] = step.i;
        break;
      }
      case 'overwrite':
        this.ovr = step.index;
        this.heights[this.idAtPos[step.index]] = step.value;
        break;
      case 'markPivot':
        this.pivotPos = step.index;
        break;
      case 'markSorted':
        for (const p of step.indices) this.sortedPos[p] = true;
        if (this.pivotPos !== null && this.sortedPos[this.pivotPos]) {
          this.pivotPos = null;
        }
        break;
      case 'divide':
      case 'combine':
        // Tree-view annotations only — no array effect, no counter cost.
        break;
    }
    accumulateStep(this.counters, step, 1);
  }

  /** Advance one step. Returns false if already at the end. */
  forward(): boolean {
    if (this.idx >= this.steps.length) return false;
    this.apply(this.steps[this.idx]);
    this.idx++;
    return true;
  }

  /** Jump to an absolute step index by replaying from the start (O(target)). */
  seekTo(target: number): void {
    const clamped = Math.max(0, Math.min(target, this.steps.length));
    this.reset();
    for (let k = 0; k < clamped; k++) this.apply(this.steps[k]);
    this.idx = clamped;
  }

  /** Force every position sorted (used for the completion celebration). */
  markAllSorted(): void {
    this.sortedPos.fill(true);
    this.pivotPos = null;
    this.clearHighlight();
  }

  private stateOfPos(p: number): BarState {
    if (p === this.swpA || p === this.swpB) return 'swapping';
    if (p === this.cmpA || p === this.cmpB) return 'comparing';
    if (p === this.ovr) return 'overwriting';
    if (this.pivotPos === p) return 'pivot';
    if (this.sortedPos[p]) return 'sorted';
    return 'default';
  }

  /** Build an immutable snapshot for rendering. */
  frame(): Frame {
    const state = new Array<BarState>(this.n);
    for (let id = 0; id < this.n; id++) {
      state[id] = this.stateOfPos(this.posOf[id]);
    }
    return {
      heights: this.heights.slice(),
      posOf: this.posOf.slice(),
      state,
      pivotId: this.pivotPos === null ? null : this.idAtPos[this.pivotPos],
      counters: { ...this.counters },
      index: this.idx,
      total: this.steps.length,
    };
  }
}

/** Materialize an algorithm's generator into a flat step array. */
export function buildSteps(
  gen: (input: readonly number[]) => Generator<Step, void, undefined>,
  input: readonly number[],
): Step[] {
  return Array.from(gen(input));
}
