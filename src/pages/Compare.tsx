import { useEffect, useMemo, useRef, useState } from 'react';
import { BarCanvas } from '../components/BarCanvas';
import { Player, buildSteps, type Frame } from '../engine/player';
import { ALGORITHMS, getAlgorithm, type AlgorithmKey } from '../engine/registry';
import { generateArray } from '../data/presets';
import { PlayIcon, PauseIcon, ResetIcon, ShuffleIcon } from '../components/icons';

const RACE_SIZE = 60;
const RACE_SPEED = 120; // steps/s — a race should feel like a race

/* ------------------------------------------------------------------ */
/* Race engine: two Players advanced by one shared clock so the        */
/* comparison is fair — same array, same step rate, first to finish    */
/* wins because it needs FEWER operations, not because it ran faster.  */
/* ------------------------------------------------------------------ */

interface Lane {
  key: AlgorithmKey;
  frame: Frame;
  done: boolean;
}

function useRace(keyA: AlgorithmKey, keyB: AlgorithmKey, regenToken: number) {
  // regenToken deliberately re-runs generateArray for a fresh random array.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const array = useMemo(() => generateArray(RACE_SIZE, 'random'), [regenToken]);
  const players = useMemo(() => {
    const a = new Player(array, buildSteps(getAlgorithm(keyA).generator, array));
    const b = new Player(array, buildSteps(getAlgorithm(keyB).generator, array));
    return { a, b };
  }, [array, keyA, keyB]);

  const [running, setRunning] = useState(false);
  const [lanes, setLanes] = useState<[Lane, Lane]>(() => [
    { key: keyA, frame: players.a.frame(), done: false },
    { key: keyB, frame: players.b.frame(), done: false },
  ]);
  const [winner, setWinner] = useState<AlgorithmKey | null>(null);

  const rafRef = useRef<number | null>(null);
  const lastRef = useRef(0);
  const accRef = useRef(0);
  const winnerRef = useRef<AlgorithmKey | null>(null);

  const publish = () => {
    setLanes([
      { key: keyA, frame: players.a.frame(), done: players.a.atEnd },
      { key: keyB, frame: players.b.frame(), done: players.b.atEnd },
    ]);
  };

  const stop = () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setRunning(false);
  };

  // Rebuild lanes when players change (algorithm/array switched).
  useEffect(() => {
    stop();
    winnerRef.current = null;
    setWinner(null);
    setLanes([
      { key: keyA, frame: players.a.frame(), done: false },
      { key: keyB, frame: players.b.frame(), done: false },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players]);

  useEffect(() => stop, []);

  const tick = (ts: number) => {
    const dt = ts - lastRef.current;
    lastRef.current = ts;
    accRef.current += (dt * RACE_SPEED) / 1000;
    const todo = Math.floor(accRef.current);
    if (todo > 0) {
      accRef.current -= todo;
      for (let k = 0; k < Math.min(todo, 400); k++) {
        const aMoved = players.a.forward();
        const bMoved = players.b.forward();
        if (winnerRef.current === null) {
          if (players.a.atEnd && !players.b.atEnd) winnerRef.current = keyA;
          else if (players.b.atEnd && !players.a.atEnd) winnerRef.current = keyB;
          else if (players.a.atEnd && players.b.atEnd) winnerRef.current = keyA;
        }
        if (!aMoved && !bMoved) break;
      }
      if (players.a.atEnd) players.a.markAllSorted();
      if (players.b.atEnd) players.b.markAllSorted();
      publish();
      if (winnerRef.current !== null) setWinner(winnerRef.current);
    }
    if (players.a.atEnd && players.b.atEnd) {
      stop();
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  };

  const play = () => {
    if (rafRef.current !== null) return;
    if (players.a.atEnd && players.b.atEnd) return;
    setRunning(true);
    lastRef.current = performance.now();
    accRef.current = 0;
    rafRef.current = requestAnimationFrame(tick);
  };

  const reset = () => {
    stop();
    players.a.reset();
    players.b.reset();
    winnerRef.current = null;
    setWinner(null);
    publish();
  };

  return { lanes, running, winner, play, stop, reset };
}

/* ------------------------------------------------------------------ */
/* Empirical growth chart: run every algorithm for real at several     */
/* sizes on the SAME arrays and plot measured operations. Honest data, */
/* measured live in the browser — not a textbook sketch.               */
/* ------------------------------------------------------------------ */

const CHART_SIZES = [10, 25, 50, 75, 100, 150, 200] as const;
const CHART_COLORS: Record<string, string> = {
  bubble: '#ff6b4a',
  insertion: '#f5c518',
  selection: '#c77dff',
  merge: '#45c4ff',
  quick: '#8ce046',
  heap: '#22c58b',
  shell: '#f5b417',
  radix: '#5a9bff',
};

interface Series {
  key: AlgorithmKey;
  name: string;
  points: number[]; // ops per CHART_SIZES entry
}

function measureSeries(keys: readonly AlgorithmKey[]): Series[] {
  const arrays = CHART_SIZES.map((n) => generateArray(n, 'random'));
  return keys.map((key) => {
    const meta = getAlgorithm(key);
    const points = arrays.map((arr) => {
      let ops = 0;
      for (const step of meta.generator(arr)) {
        if (step.type === 'compare' || step.type === 'swap' || step.type === 'overwrite') ops++;
      }
      return ops;
    });
    return { key, name: meta.name, points };
  });
}

function GrowthChart({ selected }: { selected: readonly AlgorithmKey[] }) {
  const series = useMemo(() => measureSeries(selected), [selected]);
  const W = 720;
  const H = 300;
  const PAD = { l: 56, r: 16, t: 12, b: 30 };
  const maxOps = Math.max(1, ...series.flatMap((s) => s.points));
  const x = (i: number) =>
    PAD.l + (CHART_SIZES[i] / CHART_SIZES[CHART_SIZES.length - 1]) * (W - PAD.l - PAD.r);
  const y = (v: number) => H - PAD.b - (v / maxOps) * (H - PAD.t - PAD.b);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="Measured operations against array size for the selected algorithms"
    >
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <g key={f}>
          <line
            x1={PAD.l}
            x2={W - PAD.r}
            y1={y(maxOps * f)}
            y2={y(maxOps * f)}
            stroke="var(--border-subtle)"
            strokeDasharray="3 5"
          />
          <text
            x={PAD.l - 8}
            y={y(maxOps * f)}
            textAnchor="end"
            dominantBaseline="central"
            fontSize="10"
            fontFamily="var(--font-mono)"
            fill="var(--text-muted)"
          >
            {Math.round(maxOps * f).toLocaleString('en-US')}
          </text>
        </g>
      ))}
      {CHART_SIZES.map((n, i) => (
        <text
          key={n}
          x={x(i)}
          y={H - 10}
          textAnchor="middle"
          fontSize="10"
          fontFamily="var(--font-mono)"
          fill="var(--text-muted)"
        >
          {n}
        </text>
      ))}
      {series.map((s) => (
        <g key={s.key}>
          <polyline
            fill="none"
            stroke={CHART_COLORS[s.key]}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={s.points.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
          />
          {s.points.map((v, i) => (
            <circle key={i} cx={x(i)} cy={y(v)} r="3" fill={CHART_COLORS[s.key]} />
          ))}
        </g>
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */

function AlgoSelect({
  id,
  value,
  onChange,
  disabled,
}: {
  id: string;
  value: AlgorithmKey;
  onChange: (k: AlgorithmKey) => void;
  disabled: boolean;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as AlgorithmKey)}
        className="h-11 w-full appearance-none rounded-full border border-subtle bg-surface-2 px-4 pr-9 text-sm text-primary transition-colors duration-fast hover:border-strong disabled:cursor-not-allowed disabled:opacity-45"
      >
        {ALGORITHMS.map((a) => (
          <option key={a.key} value={a.key}>
            {a.name}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted">
        ▾
      </span>
    </div>
  );
}

function fmt(n: number): string {
  return n.toLocaleString('en-US');
}

/**
 * Head-to-head scoreboard: the same metric from both lanes, side by side, with
 * the cheaper one highlighted and the ratio spelled out. This is the bit that
 * turns "two pretty animations" into an argument about cost.
 */
function Scoreboard({ lanes }: { lanes: readonly [Lane, Lane] }) {
  const [a, b] = lanes;
  const metaA = getAlgorithm(a.key);
  const metaB = getAlgorithm(b.key);

  const rows = [
    {
      label: 'Comparisons',
      a: a.frame.counters.comparisons,
      b: b.frame.counters.comparisons,
    },
    { label: 'Swaps', a: a.frame.counters.swaps, b: b.frame.counters.swaps },
    { label: 'Array writes', a: a.frame.counters.writes, b: b.frame.counters.writes },
    { label: 'Array accesses', a: a.frame.counters.accesses, b: b.frame.counters.accesses },
    { label: 'Total steps', a: a.frame.total, b: b.frame.total },
  ];

  const ratio =
    a.frame.total > 0 && b.frame.total > 0
      ? Math.max(a.frame.total, b.frame.total) / Math.min(a.frame.total, b.frame.total)
      : 1;
  const leaner = a.frame.total <= b.frame.total ? metaA : metaB;
  const heavier = a.frame.total <= b.frame.total ? metaB : metaA;

  return (
    <div className="liquid-glass mt-6 rounded-[1.25rem] p-5">
      <h2 className="mb-4 font-display text-2xl italic text-primary">Head to head</h2>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-sm">
          <thead>
            <tr className="text-left">
              <th className="pb-2 text-[11px] font-medium uppercase tracking-wide text-muted">
                Metric
              </th>
              <th className="pb-2 text-right font-display text-lg italic text-primary">
                {metaA.name}
              </th>
              <th className="pb-2 text-right font-display text-lg italic text-primary">
                {metaB.name}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              // Lower is better. Only call a winner once both have a value.
              const aWins = r.a < r.b;
              const bWins = r.b < r.a;
              return (
                <tr key={r.label} className="border-t border-subtle">
                  <td className="py-2 text-secondary">{r.label}</td>
                  <td
                    className={`py-2 text-right font-mono tabular-nums ${aWins ? 'text-lime' : 'text-primary'}`}
                  >
                    {fmt(r.a)}
                  </td>
                  <td
                    className={`py-2 text-right font-mono tabular-nums ${bWins ? 'text-lime' : 'text-primary'}`}
                  >
                    {fmt(r.b)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {ratio > 1.05 && (
        <p className="mt-4 rounded-xl bg-surface-3/60 px-4 py-3 text-sm leading-snug text-secondary">
          On this array <span className="font-semibold text-lime">{leaner.name}</span> needs{' '}
          <span className="font-mono text-primary">{ratio.toFixed(1)}×</span> fewer operations than{' '}
          <span className="text-primary">{heavier.name}</span> — {leaner.complexity.average} versus{' '}
          {heavier.complexity.average}. Grow the array and that gap widens fast; that is exactly
          what Big-O predicts.
        </p>
      )}
    </div>
  );
}

export default function Compare() {
  const [keyA, setKeyA] = useState<AlgorithmKey>('bubble');
  const [keyB, setKeyB] = useState<AlgorithmKey>('quick');
  const [regenToken, setRegenToken] = useState(0);
  const [chartKeys, setChartKeys] = useState<AlgorithmKey[]>(['bubble', 'quick', 'merge']);

  const { lanes, running, winner, play, stop, reset } = useRace(keyA, keyB, regenToken);

  const toggleChartKey = (k: AlgorithmKey) => {
    setChartKeys((keys) =>
      keys.includes(k) ? keys.filter((x) => x !== k) : keys.length >= 5 ? keys : [...keys, k],
    );
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] px-6 pb-16 pt-24 md:pt-28">
      <p className="mb-2 font-mono text-xs uppercase tracking-[0.25em] text-accent">Compare</p>
      <h1 className="font-display text-4xl italic tracking-[-1px] text-primary md:text-5xl">
        Race &amp; performance
      </h1>
      <p className="mt-2 max-w-2xl text-secondary">
        Two algorithms, the same shuffled array, one shared clock. The winner isn&apos;t faster —
        it simply needs fewer operations. That difference <em>is</em> Big-O.
      </p>

      {/* -------- Race controls -------- */}
      <div className="liquid-glass mt-8 flex flex-wrap items-center gap-3 rounded-[1.25rem] p-4">
        <div className="min-w-[180px] flex-1">
          <label htmlFor="algoA" className="mb-1 block text-[11px] uppercase tracking-wide text-muted">
            Lane A
          </label>
          <AlgoSelect id="algoA" value={keyA} onChange={setKeyA} disabled={running} />
        </div>
        <span className="mt-5 font-display text-2xl italic text-accent">vs</span>
        <div className="min-w-[180px] flex-1">
          <label htmlFor="algoB" className="mb-1 block text-[11px] uppercase tracking-wide text-muted">
            Lane B
          </label>
          <AlgoSelect id="algoB" value={keyB} onChange={setKeyB} disabled={running} />
        </div>
        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            onClick={running ? stop : play}
            aria-label={running ? 'Pause race' : 'Start race'}
            className="flex items-center gap-2 rounded-full bg-lime px-5 py-2.5 text-sm font-semibold text-on-lime transition-transform duration-fast active:scale-95"
          >
            {running ? <PauseIcon width={18} height={18} /> : <PlayIcon width={18} height={18} />}
            {running ? 'Pause' : 'Race'}
          </button>
          <button
            type="button"
            onClick={reset}
            aria-label="Reset race"
            className="grid h-11 w-11 place-items-center rounded-full border border-subtle bg-surface-2 text-secondary transition-colors duration-fast hover:border-strong hover:text-primary"
          >
            <ResetIcon />
          </button>
          <button
            type="button"
            onClick={() => setRegenToken((t) => t + 1)}
            disabled={running}
            aria-label="New random array"
            className="grid h-11 w-11 place-items-center rounded-full border border-subtle bg-surface-2 text-secondary transition-colors duration-fast hover:border-strong hover:text-primary disabled:cursor-not-allowed disabled:opacity-45"
          >
            <ShuffleIcon />
          </button>
        </div>
      </div>

      {/* -------- Winner banner -------- */}
      {winner && (
        <div className="rise-in mt-4">
          <div className="liquid-glass-strong inline-flex items-center gap-3 rounded-full px-5 py-2.5">
            <span className="rounded-full bg-lime px-3 py-1 text-xs font-semibold text-on-lime">
              Finished 1st
            </span>
            <span className="font-display text-xl italic text-primary">
              {getAlgorithm(winner).name}
            </span>
          </div>
        </div>
      )}

      {/* -------- Lanes -------- */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {lanes.map((lane) => {
          const meta = getAlgorithm(lane.key);
          return (
            <div key={lane.key} className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2 px-1">
                <h2 className="font-display text-xl italic text-primary">{meta.name}</h2>
                <span className="font-mono text-xs tabular-nums text-muted">
                  {fmt(lane.frame.index)} / {fmt(lane.frame.total)} steps
                  {lane.done && <span className="ml-2 text-lime">done</span>}
                </span>
              </div>
              <div className="h-[260px]">
                <BarCanvas
                  frame={lane.frame}
                  speed={RACE_SPEED}
                  status={lane.done ? 'done' : running ? 'playing' : 'paused'}
                  statusLabel={`${meta.name}: step ${lane.frame.index} of ${lane.frame.total}`}
                />
              </div>
              <div className="flex gap-2 px-1 font-mono text-xs text-secondary">
                <span>{fmt(lane.frame.counters.comparisons)} comparisons</span>
                <span>·</span>
                <span>{fmt(lane.frame.counters.writes)} writes</span>
                <span>·</span>
                <span>{meta.complexity.average} avg</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* -------- Head-to-head scoreboard -------- */}
      <Scoreboard lanes={lanes} />

      {/* -------- Growth chart -------- */}
      <section className="mt-16">
        <h2 className="font-display text-3xl italic tracking-[-1px] text-primary">
          Execution scaling
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-secondary">
          Measured live in your browser: every selected algorithm really sorts random arrays of
          each size, and we plot the actual operations performed. Watch O(n²) curves leave the
          O(n&nbsp;log&nbsp;n) family behind.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {ALGORITHMS.map((a) => {
            const on = chartKeys.includes(a.key);
            return (
              <button
                key={a.key}
                type="button"
                onClick={() => toggleChartKey(a.key)}
                aria-pressed={on}
                className={`liquid-glass rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors duration-fast ${
                  on ? 'text-primary' : 'text-muted hover:text-secondary'
                }`}
                style={on ? { boxShadow: `inset 0 0 0 1.5px ${CHART_COLORS[a.key]}` } : undefined}
              >
                <span
                  className="mr-1.5 inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: on ? CHART_COLORS[a.key] : 'var(--border-strong)' }}
                />
                {a.name}
              </button>
            );
          })}
        </div>

        <div className="liquid-glass mt-4 rounded-[1.25rem] p-5">
          <GrowthChart selected={chartKeys} />
          <p className="mt-2 text-right font-mono text-[11px] text-muted">
            operations vs array size (n) · random data · measured, not simulated
          </p>
        </div>
      </section>
    </div>
  );
}
