import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrayView } from '../components/ArrayView';
import { TreeView } from '../components/TreeView';
import { ViewModeSwitch } from '../components/ViewModeSwitch';
import { TREE_CAPABLE, type ViewMode } from '../components/viewMode';
import { Controls } from '../components/Controls';
import { CustomArrayInput } from '../components/CustomArrayInput';
import { StatsPanel } from '../components/StatsPanel';
import { InfoPanel } from '../components/InfoPanel';
import { Transport } from '../components/Transport';
import { Legend } from '../components/Legend';
import { usePlayback } from '../hooks/usePlayback';
import { buildSteps } from '../engine/player';
import { getAlgorithm, ALGORITHM_MAP, type AlgorithmKey } from '../engine/registry';
import { generateArray, type PresetKey } from '../data/presets';
import { sound } from '../audio/sound';
import { SoundOnIcon, SoundOffIcon } from '../components/icons';

// Three.js ships only to visitors who actually open the 3D Crane view, keeping
// the Visualizer chunk as light as it was before the view existed.
const CraneView = lazy(() =>
  import('../components/three/CraneView').then((m) => ({ default: m.CraneView })),
);

function isAlgorithmKey(v: string | null): v is AlgorithmKey {
  return v !== null && v in ALGORITHM_MAP;
}

/**
 * Shown until the visitor supplies data. VisSort never invents an array on
 * their behalf — they either type their own numbers or explicitly ask for a
 * generated set.
 */
function EmptyState({ onGenerate }: { onGenerate: () => void }) {
  return (
    <section
      aria-label="No data yet"
      className="liquid-glass flex min-h-[300px] flex-1 flex-col items-center justify-center gap-4 rounded-[1.25rem] p-8 text-center"
    >
      <h2 className="font-display text-3xl italic text-primary md:text-4xl">
        Enter your numbers to begin
      </h2>
      <p className="max-w-md text-sm font-light leading-snug text-secondary">
        Type any list of values into the field above — for example{' '}
        <span className="font-mono text-accent">5, 2, 9, 1, 7</span> — and watch{' '}
        {' them get sorted step by step.'}
      </p>
      <button
        type="button"
        onClick={onGenerate}
        className="rounded-full border border-strong px-5 py-2.5 text-sm font-medium text-primary transition-colors duration-fast hover:border-accent hover:text-accent"
      >
        Or generate a random array
      </button>
    </section>
  );
}

export default function Visualizer() {
  const [searchParams] = useSearchParams();
  const initialAlgo = searchParams.get('algo');

  const [algorithmKey, setAlgorithmKey] = useState<AlgorithmKey>(
    isAlgorithmKey(initialAlgo) ? initialAlgo : 'bubble',
  );
  const [preset, setPreset] = useState<PresetKey>('random');
  // The crane stages one physical pick-and-place per step, so the defaults are
  // a demo-sized shelf at one step a second rather than 40 bars at 8.
  const [size, setSize] = useState(16);
  const [speed, setSpeed] = useState(1);
  const [regenToken, setRegenToken] = useState(0);
  const [customArray, setCustomArray] = useState<number[] | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('columns');
  const [soundOn, setSoundOn] = useState(false);
  const [cinema, setCinema] = useState(false);
  // The visualizer starts EMPTY — no numbers are invented for the user. Data
  // appears only when they type their own, or explicitly generate a set.
  const [useGenerated, setUseGenerated] = useState(false);

  const algorithm = getAlgorithm(algorithmKey);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const generated = useMemo(() => generateArray(size, preset), [size, preset, regenToken]);
  const array = useMemo<number[]>(
    () => customArray ?? (useGenerated ? generated : []),
    [customArray, useGenerated, generated],
  );
  const isEmpty = array.length === 0;

  const steps = useMemo(() => buildSteps(algorithm.generator, array), [algorithm, array]);
  const playback = usePlayback(array, steps, speed);
  const { frame, status } = playback;

  // Changing structural inputs abandons a custom array (they're mutually exclusive).
  const clearCustom = () => setCustomArray(null);

  const playbackRef = useRef(playback);
  playbackRef.current = playback;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;
      const pb = playbackRef.current;
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        pb.toggle();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        pb.stepForward();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        pb.stepBack();
      } else if (e.key === 'r' || e.key === 'R') {
        pb.reset();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Sound: pitch each applied step by the value it touches. Reads the step
  // that produced the current frame (index-1); counters/positions stay
  // scrub-correct because sound is a pure side effect of the index changing.
  const prevIndexRef = useRef(0);
  useEffect(() => {
    const idx = frame.index;
    const prev = prevIndexRef.current;
    prevIndexRef.current = idx;
    if (!soundOn || idx === 0 || idx <= prev) return;
    const step = steps[idx - 1];
    if (!step) return;
    let maxVal = 1;
    for (const v of array) if (v > maxVal) maxVal = v;
    const valueAtPos = (p: number): number => {
      for (let id = 0; id < frame.posOf.length; id++) {
        if (frame.posOf[id] === p) return frame.heights[id];
      }
      return 0;
    };
    if (step.type === 'compare') sound.compare(valueAtPos(step.j) / maxVal);
    else if (step.type === 'swap') sound.swap(valueAtPos(step.i) / maxVal);
    else if (step.type === 'overwrite') sound.overwrite(step.value / maxVal);
  }, [frame, steps, array, soundOn]);

  useEffect(() => {
    if (soundOn && status === 'done') sound.done();
  }, [status, soundOn]);

  const toggleSound = () => {
    setSoundOn((on) => {
      const next = !on;
      if (next) sound.enable();
      else sound.suspend();
      return next;
    });
  };

  // Plain-language narration of the step that produced the current frame —
  // reads like a lecturer talking through the algorithm.
  const narration = useMemo(() => {
    if (frame.total === 0) return 'This array is already trivial — add more numbers.';
    if (frame.index === 0) return 'Press play — or step with the arrow keys — to begin.';
    const step = steps[frame.index - 1];
    if (!step) return '';
    const valueAt = (p: number): number => {
      for (let id = 0; id < frame.posOf.length; id++) {
        if (frame.posOf[id] === p) return frame.heights[id];
      }
      return 0;
    };
    switch (step.type) {
      case 'compare':
        return `Compared a[${step.i}] = ${valueAt(step.i)} with a[${step.j}] = ${valueAt(step.j)}`;
      case 'swap':
        return `Swapped positions ${step.i} ↔ ${step.j}`;
      case 'overwrite':
        return `Wrote ${step.value} into a[${step.index}]`;
      case 'markPivot':
        return `Chose pivot a[${step.index}] = ${valueAt(step.index)}`;
      case 'markSorted':
        return step.indices.length > 1
          ? 'Everything is locked in final position'
          : `a[${step.indices[0]}] locked in its final position`;
      case 'divide':
        return step.lo === step.hi
          ? `Divided down to a single element a[${step.lo}]`
          : `Divided into the range a[${step.lo}…${step.hi}]`;
      case 'combine':
        return `Merging the range a[${step.lo}…${step.hi}] back together`;
    }
  }, [frame, steps]);

  const statusLabel = useMemo(() => {
    const verb =
      status === 'done'
        ? 'Sorted'
        : status === 'playing'
          ? 'Sorting'
          : status === 'paused'
            ? 'Paused'
            : 'Ready';
    return `${algorithm.name}. ${verb}. ${frame.counters.comparisons.toLocaleString('en-US')} comparisons, step ${frame.index.toLocaleString('en-US')} of ${frame.total.toLocaleString('en-US')}.`;
  }, [algorithm.name, status, frame.counters.comparisons, frame.index, frame.total]);

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-4 pb-28 pt-24 md:pt-28">
      {!cinema && (
        <div>
          <p className="mb-1 font-mono text-xs uppercase tracking-[0.25em] text-accent">
            Visualizer
          </p>
          <h1 className="font-display text-3xl italic tracking-[-1px] text-primary md:text-4xl">
            {algorithm.name}
          </h1>
        </div>
      )}

      {!cinema && (
        <div className="liquid-glass grid gap-4 rounded-[1.25rem] p-4 lg:grid-cols-2">
          <CustomArrayInput onApply={setCustomArray} disabled={status === 'playing'} />
          {customArray && (
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  clearCustom();
                  setUseGenerated(true);
                }}
                className="rounded-full border border-subtle px-3.5 py-2 text-sm text-secondary transition-colors duration-fast hover:border-strong hover:text-primary"
              >
                Back to generated arrays
              </button>
            </div>
          )}
        </div>
      )}

      {!cinema && (
        <Controls
          algorithmKey={algorithmKey}
          onAlgorithm={(k) => {
            setAlgorithmKey(k);
            // Tree view only exists for divide-and-conquer/heap algorithms.
            if (!TREE_CAPABLE.includes(k) && viewMode === 'tree') setViewMode('columns');
          }}
          preset={preset}
          onPreset={(p) => {
            setPreset(p);
            clearCustom();
            setUseGenerated(true);
          }}
          size={size}
          onSize={(n) => {
            setSize(n);
            clearCustom();
            setUseGenerated(true);
          }}
          speed={speed}
          onSpeed={setSpeed}
          onShuffle={() => {
            setRegenToken((t) => t + 1);
            clearCustom();
            setUseGenerated(true);
          }}
          running={status === 'playing'}
        />
      )}

      <div className={`grid flex-1 gap-4 ${cinema ? '' : 'lg:grid-cols-[minmax(0,1fr)_340px]'}`}>
        <div
          className={`flex flex-col gap-3 ${cinema ? 'min-h-[calc(100vh-260px)]' : 'min-h-[340px] lg:min-h-0'}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ViewModeSwitch mode={viewMode} onMode={setViewMode} algorithmKey={algorithmKey} />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCinema((c) => !c)}
                aria-pressed={cinema}
                aria-label={cinema ? 'Exit cinema mode' : 'Cinema mode — hide panels'}
                title={cinema ? 'Exit cinema mode' : 'Cinema mode — hide panels'}
                className={`grid h-11 w-11 place-items-center rounded-full border transition-colors duration-fast ${
                  cinema
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-subtle bg-surface-2 text-secondary hover:border-strong hover:text-primary'
                }`}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {cinema ? (
                    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                  ) : (
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                  )}
                </svg>
              </button>
              <button
                type="button"
                onClick={toggleSound}
                aria-pressed={soundOn}
                aria-label={soundOn ? 'Turn sound off' : 'Turn sound on'}
                title={soundOn ? 'Turn sound off' : 'Turn sound on'}
                className={`grid h-11 w-11 place-items-center rounded-full border transition-colors duration-fast ${
                  soundOn
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-subtle bg-surface-2 text-secondary hover:border-strong hover:text-primary'
                }`}
              >
                {soundOn ? <SoundOnIcon /> : <SoundOffIcon />}
              </button>
            </div>
          </div>
          {isEmpty ? (
            <EmptyState onGenerate={() => setUseGenerated(true)} />
          ) : (
            <>
              {viewMode === 'columns' && (
                <Suspense
                  fallback={
                    <div className="flex min-h-[440px] flex-1 items-center justify-center rounded-lg border border-subtle bg-canvas text-sm text-secondary">
                      Loading the crane…
                    </div>
                  }
                >
                  <CraneView
                    frame={frame}
                    steps={steps}
                    speed={speed}
                    status={status}
                    statusLabel={statusLabel}
                    algorithmKey={algorithmKey}
                    onShrink={(n) => {
                      setSize(n);
                      clearCustom();
                      setUseGenerated(true);
                    }}
                  />
                </Suspense>
              )}
              {viewMode === 'array' && (
                <ArrayView frame={frame} speed={speed} statusLabel={statusLabel} />
              )}
              {viewMode === 'tree' && (
                <TreeView
                  algorithmKey={algorithmKey}
                  input={array}
                  frame={frame}
                  steps={steps}
                  speed={speed}
                  statusLabel={statusLabel}
                />
              )}
              <div
                aria-live="off"
                className="liquid-glass self-start rounded-full px-4 py-2 font-mono text-xs text-secondary"
              >
                {narration}
              </div>
            </>
          )}
          {!cinema && <Legend />}
        </div>
        {!cinema && (
          <aside className="flex flex-col gap-4">
            <StatsPanel counters={frame.counters} index={frame.index} total={frame.total} />
            <InfoPanel algorithm={algorithm} />
          </aside>
        )}
      </div>

      <Transport
        status={status}
        index={frame.index}
        total={frame.total}
        onToggle={playback.toggle}
        onStepBack={playback.stepBack}
        onStepForward={playback.stepForward}
        onReset={playback.reset}
      />
    </div>
  );
}
