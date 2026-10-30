import type { BarState } from './types';
import type { AlgorithmMeta } from './registry';
import { Player, buildSteps } from './player';

/** One rendered moment of a looping preview, already laid out by position. */
export interface PreviewFrame {
  /** h[pos] — bar height (12…100) at each array position. */
  h: number[];
  /** st[pos] — bar state at each array position. */
  st: BarState[];
}

/** Small deterministic LCG so every preview is distinct but identical on each visit. */
function seeded(seed: number): () => number {
  let s = (seed * 2654435761) >>> 0;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x80000000;
  };
}

/**
 * `n` evenly spaced heights from 12 to 100, shuffled by `seed`. Every value is
 * distinct, so a preview never shows two bars at the same height.
 */
export function previewArray(n: number, seed: number): number[] {
  const rnd = seeded(seed);
  const a = Array.from({ length: n }, (_, i) => 12 + Math.round((88 * i) / (n - 1)));
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Every frame of a whole run, precomputed once. The Home demo and the Gallery
 * cards loop through these on a timer instead of each owning a live Player, so
 * a dozen previews cost one array lookup per tick.
 */
export function previewFrames(algo: AlgorithmMeta, input: readonly number[]): PreviewFrame[] {
  const player = new Player(input, buildSteps(algo.generator, input));
  const frames: PreviewFrame[] = [];
  const snap = () => {
    const f = player.frame();
    const h: number[] = [];
    const st: BarState[] = [];
    for (let id = 0; id < f.heights.length; id++) {
      h[f.posOf[id]] = f.heights[id];
      st[f.posOf[id]] = f.state[id];
    }
    frames.push({ h, st });
  };
  snap();
  while (player.forward()) {
    if (player.atEnd) player.markAllSorted();
    snap();
  }
  return frames;
}
