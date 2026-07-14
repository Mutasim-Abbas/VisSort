import { useMemo, useState } from 'react';
import { runPseudocode, type PseudoError } from '../engine/pseudo/lang';
import { usePlayback } from '../hooks/usePlayback';
import type { Step } from '../engine/types';
import { PlayIcon, PauseIcon, StepForwardIcon, StepBackIcon, ResetIcon } from './icons';

const STARTERS: { name: string; code: string }[] = [
  {
    name: 'Blank',
    code: '# Write your own sorting pseudocode.\n# The array is called A, its length is n.\n# Try:  for, while, if, swap A[i], A[j], and  ←  for assignment.\n\n',
  },
  {
    name: 'Bubble sort',
    code: `for i ← 0 to n - 2:
  for j ← 0 to n - 2 - i:
    if A[j] > A[j+1]:
      swap A[j], A[j+1]`,
  },
  {
    name: 'Selection sort',
    code: `for i ← 0 to n - 2:
  min ← i
  for j ← i + 1 to n - 1:
    if A[j] < A[min]:
      min ← j
  swap A[i], A[min]`,
  },
  {
    name: 'Insertion sort',
    code: `for i ← 1 to n - 1:
  j ← i
  while j > 0 and A[j-1] > A[j]:
    swap A[j-1], A[j]
    j ← j - 1`,
  },
];

const DEFAULT_INPUT = [5, 2, 8, 1, 9, 3];
const MAX_H = 9;

/**
 * The Playground: a real (tiny) pseudocode interpreter. The student writes an
 * algorithm, presses Run, and *their own code* drives the bars — same Step
 * stream and same engine as the built-in algorithms. Errors point at the line.
 */
export function Playground() {
  const [code, setCode] = useState(STARTERS[1].code);
  const [input] = useState<number[]>([...DEFAULT_INPUT]);
  const [mode, setMode] = useState<'edit' | 'run'>('edit');
  const [error, setError] = useState<PseudoError | null>(null);
  const [ranSteps, setRanSteps] = useState<Step[]>([]);
  const [outcome, setOutcome] = useState<'sorted' | 'unsorted' | null>(null);

  const { frame, status, toggle, stepForward, stepBack, reset } = usePlayback(input, ranSteps, 4);
  const activeLine = frame.index > 0 ? ranSteps[frame.index - 1]?.line : undefined;

  const run = () => {
    const res = runPseudocode(code, input);
    if (res.error) {
      setError(res.error);
      setMode('edit');
      return;
    }
    setError(null);
    setRanSteps(res.steps);
    setOutcome(res.sorted ? 'sorted' : 'unsorted');
    setMode('run');
  };

  const codeLines = useMemo(() => code.split('\n'), [code]);
  const playing = status === 'playing';

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      {/* ---------------- Editor / running code ---------------- */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-[11px] uppercase tracking-wide text-muted">Starter</label>
          <select
            onChange={(e) => {
              const s = STARTERS[Number(e.target.value)];
              setCode(s.code);
              setMode('edit');
              setError(null);
            }}
            className="h-9 rounded-full border border-subtle bg-surface-2 px-3 text-xs text-primary"
            defaultValue="1"
          >
            {STARTERS.map((s, i) => (
              <option key={s.name} value={i}>
                {s.name}
              </option>
            ))}
          </select>
          {mode === 'run' && (
            <button
              type="button"
              onClick={() => setMode('edit')}
              className="ml-auto rounded-full border border-subtle px-3 py-1.5 text-[11px] text-secondary transition-colors duration-fast hover:border-strong hover:text-primary"
            >
              ← Edit code
            </button>
          )}
        </div>

        {mode === 'edit' ? (
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            rows={12}
            aria-label="Pseudocode editor"
            className="w-full resize-y rounded-[1rem] border border-subtle bg-surface-2/50 p-4 font-mono text-[13px] leading-[1.8] text-primary outline-none focus-visible:border-accent"
          />
        ) : (
          <div className="overflow-hidden rounded-[1rem] border border-subtle bg-surface-2/50">
            <pre className="max-h-[280px] overflow-auto p-4 font-mono text-[13px] leading-[1.8]">
              {codeLines.map((line, i) => {
                const active = i + 1 === activeLine;
                return (
                  <div
                    key={i}
                    className={`code-line flex gap-3 rounded px-2 ${active ? 'code-line-active' : ''}`}
                  >
                    <span className="select-none text-right text-muted" style={{ minWidth: '1.6em' }}>
                      {i + 1}
                    </span>
                    <span className={active ? 'text-primary' : 'text-secondary'}>
                      {line || ' '}
                    </span>
                  </div>
                );
              })}
            </pre>
          </div>
        )}

        {error && (
          <p className="rise-in rounded-lg border border-bar-swapping/40 bg-bar-swapping/10 px-3 py-2 text-xs text-bar-swapping">
            Line {error.line}: {error.message}
          </p>
        )}

        {mode === 'edit' && (
          <button
            type="button"
            onClick={run}
            className="flex w-fit items-center gap-2 rounded-full bg-lime px-5 py-2.5 text-sm font-semibold text-on-lime transition-transform duration-fast active:scale-95"
          >
            <PlayIcon width={16} height={16} />
            Run my code
          </button>
        )}
      </div>

      {/* ---------------- The bars their code drives ---------------- */}
      <div className="flex flex-col gap-3 rounded-[1rem] border border-subtle bg-surface-2/50 p-4">
        <div className="flex h-[150px] items-end justify-center gap-2">
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
                  style={{ height: `${(v / MAX_H) * 110}px`, backgroundColor: color }}
                />
                <span className="font-mono text-[11px] tabular-nums text-secondary">{v}</span>
              </div>
            );
          })}
        </div>

        {mode === 'run' ? (
          <>
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
                aria-label={playing ? 'Pause' : 'Play'}
                className="mx-1 flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-on-accent transition-transform duration-fast active:scale-95"
              >
                {playing ? <PauseIcon width={14} height={14} /> : <PlayIcon width={14} height={14} />}
                {playing ? 'Pause' : 'Play'}
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
            </div>

            <div
              className={`rounded-lg px-3 py-2 text-center text-xs ${
                outcome === 'sorted'
                  ? 'bg-lime/10 text-lime'
                  : 'bg-bar-comparing/10 text-bar-comparing'
              }`}
            >
              {outcome === 'sorted'
                ? '✓ Your code sorted the array! ' +
                  `${frame.counters.comparisons} comparisons, ${frame.counters.swaps} swaps.`
                : "Your code ran, but the array isn't sorted yet — keep tweaking."}
            </div>
          </>
        ) : (
          <p className="text-center text-xs text-muted">
            Press <span className="text-lime">Run my code</span> to watch your algorithm sort these
            bars.
          </p>
        )}
      </div>
    </div>
  );
}
