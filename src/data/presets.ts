/**
 * Array generation for the visualizer. Heights live in a fixed domain
 * (`MIN_HEIGHT`…`MAX_HEIGHT`) independent of array size, so bars look
 * consistent whether there are 5 or 200 of them. Multi-digit values keep radix
 * sort meaningful.
 */

export type PresetKey = 'random' | 'nearly-sorted' | 'reversed' | 'few-unique';

export interface Preset {
  key: PresetKey;
  name: string;
}

export const PRESETS: readonly Preset[] = [
  { key: 'random', name: 'Random' },
  { key: 'nearly-sorted', name: 'Nearly sorted' },
  { key: 'reversed', name: 'Reversed' },
  { key: 'few-unique', name: 'Few unique' },
];

export const MIN_SIZE = 5;
export const MAX_SIZE = 200;
export const MIN_HEIGHT = 8;
export const MAX_HEIGHT = 100;

/** Evenly-spaced ascending heights across the fixed domain, one per index. */
function ascendingHeights(size: number): number[] {
  if (size === 1) return [MAX_HEIGHT];
  const span = MAX_HEIGHT - MIN_HEIGHT;
  return Array.from({ length: size }, (_, i) => Math.round(MIN_HEIGHT + (span * i) / (size - 1)));
}

/** In-place Fisher–Yates shuffle. */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateArray(size: number, preset: PresetKey): number[] {
  const clampedSize = Math.max(MIN_SIZE, Math.min(MAX_SIZE, Math.round(size)));
  const asc = ascendingHeights(clampedSize);

  switch (preset) {
    case 'random':
      return shuffle(asc.slice());

    case 'reversed':
      return asc.slice().reverse();

    case 'nearly-sorted': {
      // Start sorted, then perturb ~10% of positions with local swaps.
      const a = asc.slice();
      const swaps = Math.max(1, Math.floor(clampedSize * 0.1));
      for (let s = 0; s < swaps; s++) {
        const i = Math.floor(Math.random() * clampedSize);
        const j = Math.min(clampedSize - 1, i + 1 + Math.floor(Math.random() * 2));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    case 'few-unique': {
      // Draw from ~5 distinct heights spread across the domain, then shuffle.
      const buckets = 5;
      const values = Array.from({ length: buckets }, (_, b) =>
        Math.round(MIN_HEIGHT + ((MAX_HEIGHT - MIN_HEIGHT) * b) / (buckets - 1)),
      );
      const a = Array.from(
        { length: clampedSize },
        () => values[Math.floor(Math.random() * buckets)],
      );
      return shuffle(a);
    }

    default:
      return shuffle(asc.slice());
  }
}
