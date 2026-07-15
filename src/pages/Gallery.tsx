import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ALGORITHMS, type AlgorithmMeta } from '../engine/registry';
import { Player, buildSteps, type Frame } from '../engine/player';

const PREVIEW_N = 14;
const PREVIEW_STEP_MS = 140;
const PREVIEW_PAUSE_MS = 1600;

const STATE_BG: Record<string, string> = {
  default: 'var(--color-bar-default)',
  comparing: 'var(--color-bar-comparing)',
  swapping: 'var(--color-bar-swapping)',
  overwriting: 'var(--color-bar-overwriting)',
  pivot: 'var(--color-bar-pivot)',
  sorted: 'var(--color-bar-sorted)',
};

/** Deterministic shuffled heights so every card looks distinct but stable. */
function previewArray(seed: number): number[] {
  const arr = Array.from({ length: PREVIEW_N }, (_, i) => 12 + Math.round((88 * i) / (PREVIEW_N - 1)));
  let s = seed * 2654435761;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * A living preview: the card's own algorithm genuinely sorting 14 bars on
 * loop, driven by the real step engine. setInterval (not rAF) so previews
 * stay simple; ~7 steps/s across 8 cards is negligible work.
 */
function MiniSort({ algo, seed }: { algo: AlgorithmMeta; seed: number }) {
  const input = useMemo(() => previewArray(seed), [seed]);
  const playerRef = useRef<Player | null>(null);
  if (playerRef.current === null) {
    playerRef.current = new Player(input, buildSteps(algo.generator, input));
  }
  const [frame, setFrame] = useState<Frame>(() => playerRef.current!.frame());

  useEffect(() => {
    let timeout: number | undefined;
    const interval = window.setInterval(() => {
      const player = playerRef.current!;
      if (player.forward()) {
        if (player.atEnd) player.markAllSorted();
        setFrame(player.frame());
        if (player.atEnd) {
          timeout = window.setTimeout(() => {
            player.reset();
            setFrame(player.frame());
          }, PREVIEW_PAUSE_MS);
        }
      }
    }, PREVIEW_STEP_MS);
    return () => {
      window.clearInterval(interval);
      if (timeout !== undefined) window.clearTimeout(timeout);
    };
  }, []);

  // Render by position: cheap flex row, bar identity not needed at this size.
  const byPos = useMemo(() => {
    const heights = new Array<number>(frame.heights.length);
    const states = new Array<string>(frame.heights.length);
    for (let id = 0; id < frame.heights.length; id++) {
      heights[frame.posOf[id]] = frame.heights[id];
      states[frame.posOf[id]] = frame.state[id];
    }
    return { heights, states };
  }, [frame]);

  return (
    <div className="flex h-16 items-end gap-1" aria-hidden="true">
      {byPos.heights.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm"
          style={{
            height: `${16 + (h / 100) * 48}px`,
            backgroundColor: STATE_BG[byPos.states[i]] ?? STATE_BG.default,
            transition: 'height 120ms ease, background-color 90ms linear',
          }}
        />
      ))}
    </div>
  );
}

export default function Gallery() {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-6 pb-16 pt-24 md:pt-28">
      <p className="mb-2 font-mono text-xs uppercase tracking-[0.25em] text-accent">Gallery</p>
      <h1 className="font-display text-4xl italic tracking-[-1px] text-primary md:text-5xl">
        Choose an algorithm
      </h1>
      <p className="mt-2 mb-10 max-w-2xl text-secondary">
        Eight classic sorting algorithms, from the simple to the clever — each card is really
        sorting, right now, with its own method. Pick one to take the controls.
      </p>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {ALGORITHMS.map((algo, idx) => (
          <Link
            key={algo.key}
            to={`/visualize?algo=${algo.key}`}
            className="liquid-glass group flex flex-col gap-3 rounded-[1.25rem] p-5 transition-transform duration-fast hover:-translate-y-0.5"
          >
            <MiniSort algo={algo} seed={idx + 1} />
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-2xl italic tracking-tight text-primary">
                {algo.name}
              </h2>
              <span className="font-mono text-xs text-muted">{algo.complexity.average}</span>
            </div>
            <p className="line-clamp-3 text-sm font-light leading-relaxed text-secondary">
              {algo.description}
            </p>
            <div className="mt-auto flex items-center gap-2 pt-1">
              <span className="liquid-glass rounded-full px-2.5 py-0.5 text-[11px] text-muted">
                {algo.stable ? 'Stable' : 'Unstable'}
              </span>
              <span className="liquid-glass rounded-full px-2.5 py-0.5 text-[11px] text-muted">
                {algo.writesModel === 'swap' ? 'Swap-based' : 'Write-based'}
              </span>
              <span className="ml-auto font-mono text-xs text-accent transition-transform duration-fast group-hover:translate-x-0.5">
                Visualize →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
