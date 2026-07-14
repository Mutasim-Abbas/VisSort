import type { Step } from './types';

/**
 * Statistics are *derived from steps*, never hand-maintained per algorithm
 * (TODO F2). Convention:
 *  - compare:   +1 comparison, +2 accesses (two reads)
 *  - swap:      +1 swap, +2 writes, +4 accesses (two reads + two writes)
 *  - overwrite: +1 write, +1 access (one write; source reads are counted
 *               at compare time)
 *  - markPivot / markSorted: free (annotations, not array operations)
 */
export interface Counters {
  comparisons: number;
  swaps: number;
  writes: number;
  accesses: number;
}

export function zeroCounters(): Counters {
  return { comparisons: 0, swaps: 0, writes: 0, accesses: 0 };
}

/** Mutates `counters` by the cost of one step. `sign` -1 reverses it. */
export function accumulateStep(counters: Counters, step: Step, sign: 1 | -1 = 1): void {
  switch (step.type) {
    case 'compare':
      counters.comparisons += sign;
      counters.accesses += 2 * sign;
      break;
    case 'swap':
      counters.swaps += sign;
      counters.writes += 2 * sign;
      counters.accesses += 4 * sign;
      break;
    case 'overwrite':
      counters.writes += sign;
      counters.accesses += sign;
      break;
    case 'markPivot':
    case 'markSorted':
    case 'divide':
    case 'combine':
      break;
  }
}

/** Pure: counters after the first `index` steps have been applied. */
export function countersAt(steps: readonly Step[], index: number): Counters {
  const c = zeroCounters();
  const end = Math.min(index, steps.length);
  for (let k = 0; k < end; k++) {
    accumulateStep(c, steps[k]);
  }
  return c;
}
