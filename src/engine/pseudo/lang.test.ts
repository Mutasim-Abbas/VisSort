import { describe, it, expect } from 'vitest';
import { runPseudocode } from './lang';
import { applyStepsToArray } from '../replay';

const BUBBLE = `for i ← 0 to n - 2:
  for j ← 0 to n - 2 - i:
    if A[j] > A[j+1]:
      swap A[j], A[j+1]`;

const INSERTION = `for i ← 1 to n - 1:
  j ← i
  while j > 0 and A[j-1] > A[j]:
    swap A[j-1], A[j]
    j ← j - 1`;

const SELECTION = `for i ← 0 to n - 2:
  min ← i
  for j ← i + 1 to n - 1:
    if A[j] < A[min]:
      min ← j
  swap A[i], A[min]`;

const ascending = (a: readonly number[]) => a.slice().sort((x, y) => x - y);

describe('pseudocode interpreter', () => {
  const inputs = [
    [5, 2, 8, 1, 9],
    [3, 1, 2],
    [1],
    [9, 8, 7, 6, 5, 4],
    [4, 4, 2, 2, 1],
  ];

  for (const [name, src] of [
    ['bubble', BUBBLE],
    ['insertion', INSERTION],
    ['selection', SELECTION],
  ] as const) {
    for (const input of inputs) {
      it(`user ${name} sorts ${JSON.stringify(input)}`, () => {
        const { steps, result, sorted, error } = runPseudocode(src, input);
        expect(error).toBeUndefined();
        expect(result).toEqual(ascending(input));
        expect(sorted).toBe(true);
        // The emitted steps must reproduce the same result when replayed.
        expect(applyStepsToArray(input, steps)).toEqual(ascending(input));
      });
    }
  }

  it('emits compare steps only when two array slots are compared', () => {
    const { steps } = runPseudocode('if A[0] > A[1]:\n  swap A[0], A[1]', [2, 1]);
    expect(steps.some((s) => s.type === 'compare')).toBe(true);
    expect(steps.some((s) => s.type === 'swap')).toBe(true);
  });

  it('every step carries its source line', () => {
    const { steps } = runPseudocode(BUBBLE, [3, 1, 2]);
    for (const s of steps) {
      if (s.type === 'markSorted') continue;
      expect(s.line).toBeGreaterThanOrEqual(1);
    }
  });

  it('reports a friendly error for an out-of-range index, with the line', () => {
    const { error } = runPseudocode('x ← A[999]', [1, 2, 3]);
    expect(error).toBeDefined();
    expect(error!.line).toBe(1);
    expect(error!.message).toMatch(/outside the array/i);
  });

  it('reports an unknown variable', () => {
    const { error } = runPseudocode('x ← y + 1', [1]);
    expect(error).toBeDefined();
    expect(error!.message).toMatch(/no value yet/i);
  });

  it('does not hang on an infinite loop — it bails with an error', () => {
    const { error } = runPseudocode('while 1 == 1:\n  x ← 1', [1, 2]);
    expect(error).toBeDefined();
    expect(error!.message).toMatch(/too long|infinite/i);
  });

  it('accepts textbook arrows (←) and unicode comparisons (≤ ≥ ≠)', () => {
    const src = 'for i ← 0 to n - 2:\n  if A[i] ≥ A[i+1]:\n    swap A[i], A[i+1]';
    const { error, result } = runPseudocode(src, [1, 3, 2]);
    expect(error).toBeUndefined();
    // Note: >= (not >) is not a correct bubble pass, but it must at least run.
    expect(result.length).toBe(3);
  });

  it('flags a header with no indented body', () => {
    const { error } = runPseudocode('for i ← 0 to n - 1:\nx ← 1', [1, 2]);
    expect(error).toBeDefined();
    expect(error!.message).toMatch(/indented/i);
  });

  it('an empty program is a friendly error, not a crash', () => {
    const { error } = runPseudocode('   \n  # just a comment\n', [1, 2]);
    expect(error).toBeDefined();
  });
});
