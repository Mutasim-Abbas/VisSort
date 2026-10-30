import { describe, it, expect } from 'vitest';
import { previewArray, previewFrames } from './preview';
import { ALGORITHMS } from './registry';

describe('previewArray', () => {
  it('is a permutation of evenly spaced heights from 12 to 100', () => {
    const a = previewArray(14, 3);
    expect(a).toHaveLength(14);
    const sorted = a.slice().sort((x, y) => x - y);
    expect(sorted[0]).toBe(12);
    expect(sorted[13]).toBe(100);
    expect(new Set(a).size).toBe(14);
  });

  it('is deterministic per seed and differs across seeds', () => {
    expect(previewArray(32, 7)).toEqual(previewArray(32, 7));
    expect(previewArray(32, 7)).not.toEqual(previewArray(32, 8));
  });
});

describe('previewFrames', () => {
  it.each(ALGORITHMS.map((a) => [a.key, a] as const))(
    '%s starts on the input and ends sorted with every bar marked sorted',
    (_key, algo) => {
      const input = previewArray(14, 1);
      const frames = previewFrames(algo, input);
      expect(frames[0].h).toEqual(input);
      const last = frames[frames.length - 1];
      expect(last.h).toEqual(input.slice().sort((x, y) => x - y));
      expect(last.st.every((s) => s === 'sorted')).toBe(true);
    },
  );
});
