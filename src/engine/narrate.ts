import type { Frame } from './player';
import type { AlgorithmMeta } from './registry';
import type { Step } from './types';

const fmt = (n: number) => n.toLocaleString('en-US');

/** The value standing at array position `p` in this frame. */
function valueAt(frame: Frame, p: number): number {
  for (let id = 0; id < frame.posOf.length; id++) {
    if (frame.posOf[id] === p) return frame.heights[id];
  }
  return 0;
}

/**
 * One plain sentence for the step that produced the current frame — the
 * Visualizer's headline. `done` is the playback status, not `index === total`,
 * so scrubbing onto the last step and finishing a run read the same.
 */
export function narrate(
  algo: AlgorithmMeta,
  steps: readonly Step[],
  frame: Frame,
  done: boolean,
): string {
  if (frame.total === 0) return 'This array is already trivial — add more numbers.';
  if (done) {
    const swaps = algo.writesModel === 'swap';
    const moves = swaps ? frame.counters.swaps : frame.counters.writes;
    return `Sorted in ${fmt(frame.counters.comparisons)} comparisons and ${fmt(moves)} ${swaps ? 'swaps' : 'writes'}.`;
  }
  if (frame.index === 0) return 'Press play — or step with the arrow keys — to begin.';
  const step = steps[frame.index - 1];
  if (!step) return '';
  switch (step.type) {
    case 'compare': {
      // Merge sort compares values held in scratch buffers, which the cells it
      // highlights may no longer hold — the step carries the real pair.
      const v = step.ctx?.values;
      return `Compared a[${step.i}] = ${v ? v.a : valueAt(frame, step.i)} with a[${step.j}] = ${v ? v.b : valueAt(frame, step.j)}`;
    }
    case 'swap':
      return `Swapped positions ${step.i} ↔ ${step.j}`;
    case 'overwrite':
      return `Wrote ${step.value} into a[${step.index}]`;
    case 'markPivot':
      return `Chose pivot a[${step.index}] = ${valueAt(frame, step.index)}`;
    case 'markSorted':
      return step.indices.length > 1
        ? 'Everything is locked in final position'
        : `a[${step.indices[0]}] locked in its final position`;
    case 'divide':
      return step.lo === step.hi
        ? `Divided down to a single element a[${step.lo}]`
        : `Divided into the range a[${step.lo}…${step.hi}]`;
    case 'combine':
      return `Merging the range a[${step.lo}…${step.hi}] back together`;
  }
}

/** The short phase label above the headline: 'Ready', 'Pass 2 of 7', 'Done'. */
export function phaseOf(steps: readonly Step[], frame: Frame, done: boolean): string {
  if (done) return 'Done';
  const step = frame.index > 0 ? steps[frame.index - 1] : undefined;
  return step?.ctx?.phase ?? 'Ready';
}
