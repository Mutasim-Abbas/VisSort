import type { Step } from '../../engine/types';

/**
 * The crane's own model of the shelf: physical boxes that keep their number
 * and only ever change slot.
 *
 * The engine's {@link Frame} cannot be staged as-is. Merge sort writes values
 * out of scratch buffers, so mid-merge the frame holds the same value twice and
 * has lost another one entirely — on a shelf that reads as a box silently
 * repainting itself while the crane hovers over it doing nothing. Physically, a
 * merge write `a[k] = v` is the box carrying `v` being lifted out of the
 * unmerged run and set down at `k`, with the boxes it passes shuffling one slot
 * right to make room. Replaying the steps that way keeps every box on the shelf
 * exactly once and still lands on the same sorted order.
 */
export interface ShelfTimeline {
  /** posOf[k][id] — the slot box `id` stands in after `k` steps. */
  posOf: number[][];
  /** values[k][id] — the number printed on box `id` after `k` steps. */
  values: number[][];
}

export function buildShelf(input: readonly number[], steps: readonly Step[]): ShelfTimeline {
  const n = input.length;
  let value = input.slice();
  const posOf = input.map((_, i) => i);
  const idAt = input.map((_, i) => i);
  const timeline: ShelfTimeline = { posOf: [posOf.slice()], values: [value] };

  for (const step of steps) {
    if (step.type === 'swap') {
      const a = idAt[step.i];
      const b = idAt[step.j];
      idAt[step.i] = b;
      idAt[step.j] = a;
      posOf[a] = step.j;
      posOf[b] = step.i;
    } else if (step.type === 'overwrite') {
      const k = step.index;
      // Everything left of the write head is already placed, so the box being
      // written is the first one at or after `k` that carries the value. In a
      // merge that is the head of whichever run won the comparison.
      let from = -1;
      for (let p = k; p < n; p++) {
        if (value[idAt[p]] === step.value) {
          from = p;
          break;
        }
      }
      if (from > k) {
        const id = idAt[from];
        for (let p = from; p > k; p--) {
          idAt[p] = idAt[p - 1];
          posOf[idAt[p]] = p;
        }
        idAt[k] = id;
        posOf[id] = k;
      } else if (from < 0) {
        // No box carries this value — a genuine repaint, not a move.
        value = value.slice();
        value[idAt[k]] = step.value;
      }
    }
    timeline.posOf.push(posOf.slice());
    timeline.values.push(value);
  }
  return timeline;
}

/**
 * The two slots a compare actually reads on the crane's shelf. Merge sort
 * reports the left run's head at its original index, but on the shelf that box
 * has already been shuffled up to the write head.
 */
export function comparedSlots(step: Extract<Step, { type: 'compare' }>): [number, number] {
  const merge = step.ctx?.merge;
  return merge ? [merge.write, step.j] : [step.i, step.j];
}
