import { describe, it, expect } from 'vitest';
import { Player, buildSteps, type Frame } from './player';
import { countersAt } from './counters';
import { ALGORITHMS } from './registry';
import { generateArray } from '../data/presets';

/** Reconstruct the array in position order from a frame. */
function frameArray(frame: Frame): number[] {
  const out = new Array<number>(frame.heights.length);
  for (let id = 0; id < frame.heights.length; id++) {
    out[frame.posOf[id]] = frame.heights[id];
  }
  return out;
}

const ascending = (a: readonly number[]) => a.slice().sort((x, y) => x - y);

describe('Player (playback engine)', () => {
  for (const algo of ALGORITHMS) {
    describe(algo.name, () => {
      const input = generateArray(35, 'random');
      const steps = buildSteps(algo.generator, input);

      it('stepping forward to the end (auto-play path) sorts the array', () => {
        const player = new Player(input, steps);
        // Mirror exactly what usePlayback does when playing.
        let guard = 0;
        while (player.forward()) {
          if (++guard > steps.length + 1) throw new Error('forward() ran past total');
        }
        expect(player.atEnd).toBe(true);
        expect(player.index).toBe(steps.length);
        expect(frameArray(player.frame())).toEqual(ascending(input));
      });

      it('final counters match the derived totals', () => {
        const player = new Player(input, steps);
        player.seekTo(steps.length);
        expect(player.frame().counters).toEqual(countersAt(steps, steps.length));
      });

      it('markAllSorted marks every bar sorted for the celebration', () => {
        const player = new Player(input, steps);
        player.seekTo(steps.length);
        player.markAllSorted();
        const frame = player.frame();
        expect(frame.state.every((s) => s === 'sorted')).toBe(true);
        // Array is still sorted after the cosmetic mark.
        expect(frameArray(frame)).toEqual(ascending(input));
      });

      it('seekTo(k) equals stepping forward k times (scrub correctness)', () => {
        const k = Math.floor(steps.length / 2);
        const byStep = new Player(input, steps);
        for (let i = 0; i < k; i++) byStep.forward();
        const bySeek = new Player(input, steps);
        bySeek.seekTo(k);
        const a = byStep.frame();
        const b = bySeek.frame();
        expect(frameArray(a)).toEqual(frameArray(b));
        expect(a.counters).toEqual(b.counters);
        expect(a.state).toEqual(b.state);
        expect(a.index).toBe(b.index);
      });

      it('step-back (seek to index-1) lowers the step index and counters', () => {
        const player = new Player(input, steps);
        player.seekTo(steps.length);
        const before = player.frame();
        if (steps.length > 0) {
          player.seekTo(player.index - 1);
          const after = player.frame();
          expect(after.index).toBe(before.index - 1);
          expect(after.counters.comparisons).toBeLessThanOrEqual(before.counters.comparisons);
        }
      });
    });
  }

  it('reset returns to the exact initial array', () => {
    const input = generateArray(50, 'reversed');
    const steps = buildSteps(ALGORITHMS[0].generator, input);
    const player = new Player(input, steps);
    player.seekTo(steps.length);
    player.reset();
    const frame = player.frame();
    expect(frame.index).toBe(0);
    expect(frameArray(frame)).toEqual(input);
    expect(frame.counters).toEqual({ comparisons: 0, swaps: 0, writes: 0, accesses: 0 });
  });
});
