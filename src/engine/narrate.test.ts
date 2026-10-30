import { describe, it, expect } from 'vitest';
import { narrate, phaseOf } from './narrate';
import { Player, buildSteps } from './player';
import { getAlgorithm } from './registry';

function run(key: Parameters<typeof getAlgorithm>[0], input: number[]) {
  const algo = getAlgorithm(key);
  const steps = buildSteps(algo.generator, input);
  const player = new Player(input, steps);
  return { algo, steps, player };
}

describe('narrate', () => {
  it('invites the visitor to start before the first step', () => {
    const { algo, steps, player } = run('bubble', [3, 1, 2]);
    expect(narrate(algo, steps, player.frame(), false)).toMatch(/^Press play/);
    expect(phaseOf(steps, player.frame(), false)).toBe('Ready');
  });

  it('names the two values of a compare', () => {
    const { algo, steps, player } = run('bubble', [3, 1, 2]);
    player.forward();
    expect(narrate(algo, steps, player.frame(), false)).toBe('Compared a[0] = 3 with a[1] = 1');
  });

  it('uses the values merge sort actually compared, not the cells it highlights', () => {
    const { algo, steps, player } = run('merge', [4, 3, 2, 1]);
    const k = steps.findIndex((s) => s.type === 'compare');
    player.seekTo(k + 1);
    const v = steps[k].ctx!.values!;
    expect(narrate(algo, steps, player.frame(), false)).toContain(`= ${v.a} with`);
  });

  it('reports swaps for swap sorts and writes for merge sort when done', () => {
    const bubble = run('bubble', [3, 1, 2]);
    bubble.player.seekTo(bubble.steps.length);
    expect(narrate(bubble.algo, bubble.steps, bubble.player.frame(), true)).toMatch(/swaps\.$/);
    const merge = run('merge', [3, 1, 2]);
    merge.player.seekTo(merge.steps.length);
    expect(narrate(merge.algo, merge.steps, merge.player.frame(), true)).toMatch(/writes\.$/);
    expect(phaseOf(merge.steps, merge.player.frame(), true)).toBe('Done');
  });
});
