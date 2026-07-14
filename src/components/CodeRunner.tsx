import { useEffect, useMemo, useState } from 'react';
import { PSEUDOCODE } from '../engine/pseudocode';
import { buildSteps } from '../engine/player';
import { usePlayback } from '../hooks/usePlayback';
import { getAlgorithm, type AlgorithmKey } from '../engine/registry';
import { PlayIcon, PauseIcon, StepForwardIcon, StepBackIcon, ResetIcon } from './icons';

interface Props {
  algorithmKey: AlgorithmKey;
}

const DEMO = [8, 3, 5, 1, 9, 2] as const;
const MAX_H = 9;

/**
 * The Learn page's live code runner: a small array sorted step by step, with
 * the pseudocode line that produced the current step highlighted in lock-step.
 * Scrubbing backwards moves the highlight back too — the code and the animation
 * are the same object, not two things placed side by side.
 */
export function CodeRunner({ algorithmKey }: Props) {
  const algo = getAlgorithm(algorithmKey);
  const lines = PSEUDOCODE[algorithmKey];

  const [input, setInput] = useState<number[]>([...DEMO]);
  const steps = useMemo(() => buildSteps(algo.generator, input), [algo, input]);
  const { frame, status, toggle, stepForward, stepBack, reset } = usePlayback(input, steps, 3);

  // Re-shuffle gives a fresh demo array (and implicitly resets playback).
  const shuffle = () => {
    const next = [...DEMO];
    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    setInput(next);
  };

  // The line that produced the step we are currently showing.
  const activeLine = frame.index > 0 ? steps[frame.index - 1]?.line : undefined;

  // Keep the code panel scrolled to the executing line.
  useEffect(() => {
    if (activeLine === undefined) return;
    document
      .getElementById(`ln-${algorithmKey}-${activeLine}`)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeLine, algorithmKey]);

  const playing = status === 'playing';

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      {/* ---- Pseudocode, with the executing line lit ---- */}
      <div className="overflow-hidden rounded-[1rem] border border-subtle bg-surface-2/50">
        <pre className="max-h-[300px] overflow-auto p-4 font-mono text-[13px] leading-[1.9]">
          {lines.map((l, i) => {
            const active = i === activeLine;
            return (
              <div
                key={i}
                id={`ln-${algorithmKey}-${i}`}
                className={`code-line flex gap-3 rounded px-2 ${active ? 'code-line-active' : ''}`}
              >
                <span className="select-none text-right text-muted" style={{ minWidth: '1.4em' }}>
                  {i + 1}
                </span>
                <span
                  className={active ? 'text-primary' : 'text-secondary'}
                  style={{ paddingLeft: `${l.indent * 1.15}em` }}
                >
                  {l.text}
                </span>
              </div>
            );
          })}
        </pre>
      </div>

      {/* ---- The array it is actually operating on ---- */}
      <div className="flex flex-col gap-3 rounded-[1rem] border border-subtle bg-surface-2/50 p-4">
        <div className="flex h-[132px] items-end justify-center gap-2">
          {frame.heights.map((v, id) => {
            const state = frame.state[id];
            const color =
              state === 'default' ? 'var(--color-bar-default)' : `var(--color-bar-${state})`;
            return (
              <div
                key={id}
                className="flex flex-1 flex-col items-center gap-1"
                style={{ order: frame.posOf[id] }}
              >
                <div
                  className="w-full rounded-t-[3px] transition-[height,background-color] duration-200"
                  style={{ height: `${(v / MAX_H) * 96}px`, backgroundColor: color }}
                />
                <span className="font-mono text-[11px] tabular-nums text-secondary">{v}</span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={reset}
            aria-label="Reset"
            className="grid h-9 w-9 place-items-center rounded-full text-secondary transition-colors duration-fast hover:bg-accent-soft hover:text-primary"
          >
            <ResetIcon width={16} height={16} />
          </button>
          <button
            type="button"
            onClick={stepBack}
            disabled={frame.index === 0}
            aria-label="Step back"
            className="grid h-9 w-9 place-items-center rounded-full text-secondary transition-colors duration-fast hover:bg-accent-soft hover:text-primary disabled:opacity-40"
          >
            <StepBackIcon width={16} height={16} />
          </button>
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? 'Pause' : 'Run the code'}
            className="mx-1 flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-on-accent transition-transform duration-fast active:scale-95"
          >
            {playing ? <PauseIcon width={14} height={14} /> : <PlayIcon width={14} height={14} />}
            {playing ? 'Pause' : 'Run'}
          </button>
          <button
            type="button"
            onClick={stepForward}
            disabled={frame.index >= frame.total}
            aria-label="Step forward"
            className="grid h-9 w-9 place-items-center rounded-full text-secondary transition-colors duration-fast hover:bg-accent-soft hover:text-primary disabled:opacity-40"
          >
            <StepForwardIcon width={16} height={16} />
          </button>
          <button
            type="button"
            onClick={shuffle}
            className="ml-1 rounded-full border border-subtle px-3 py-1.5 text-[11px] text-secondary transition-colors duration-fast hover:border-strong hover:text-primary"
          >
            Shuffle
          </button>
        </div>

        <p className="text-center font-mono text-[11px] text-muted">
          step {frame.index} / {frame.total} · {frame.counters.comparisons} comparisons
        </p>
      </div>
    </div>
  );
}
