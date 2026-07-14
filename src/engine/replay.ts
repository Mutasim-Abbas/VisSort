import type { Step } from './types';

/**
 * Pure replay: applies the array-mutating effect of each step to a copy of
 * `input`. Used by unit tests to prove an algorithm's emitted steps really
 * sort the array, and by anything that needs a snapshot at a position.
 */
export function applyStepsToArray(input: readonly number[], steps: Iterable<Step>): number[] {
  const a = input.slice();
  for (const step of steps) {
    if (step.type === 'swap') {
      const tmp = a[step.i];
      a[step.i] = a[step.j];
      a[step.j] = tmp;
    } else if (step.type === 'overwrite') {
      a[step.index] = step.value;
    }
  }
  return a;
}
