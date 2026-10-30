import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ALGORITHMS } from '../engine/registry';
import { previewArray, previewFrames } from '../engine/preview';
import { useLoopingIndex } from '../hooks/useLoopingIndex';
import { PreviewBars } from '../components/PreviewBars';
import { StateLegend } from '../components/StateLegend';

const ArrowRight = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/** Opens on Quicksort — the most eventful of the six to land on. */
const FIRST_DEMO = 4;

/**
 * A 32-bar run of one algorithm, looping. When it finishes it holds on the
 * sorted row for a beat, then hands over to the next algorithm; the tabs jump
 * straight to any of the six.
 */
function SortDemo() {
  const runs = useMemo(
    () => ALGORITHMS.map((a, i) => previewFrames(a, previewArray(32, i + 7))),
    [],
  );
  const [algo, setAlgo] = useState(FIRST_DEMO);
  const next = useCallback(() => setAlgo((i) => (i + 1) % ALGORITHMS.length), []);
  const frames = runs[algo];
  const idx = useLoopingIndex(frames.length, 75, 22, next, algo);
  const meta = ALGORITHMS[algo];

  return (
    <div className="flex flex-col gap-5 rounded-[28px] bg-surface px-5 pb-6 pt-5 shadow-md sm:px-7 sm:pb-7 sm:pt-6">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex items-baseline gap-3">
          <span className="text-[19px] font-[650] tracking-[-0.01em]">{meta.name}</span>
          <span className="font-mono text-[13px] text-muted">{meta.complexity.average}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ALGORITHMS.map((a, i) => (
            <button
              key={a.key}
              type="button"
              onClick={() => setAlgo(i)}
              aria-pressed={i === algo}
              title={a.name}
              className={`rounded-full px-[11px] py-[5px] text-[13px] font-medium transition-colors duration-base ${
                i === algo ? 'bg-primary text-surface' : 'bg-fill text-secondary hover:text-primary'
              }`}
            >
              {a.short}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[clamp(220px,34vw,340px)]">
        <PreviewBars
          frame={frames[idx]}
          gap="clamp(2px, 0.55vw, 6px)"
          radius="7px 7px 3px 3px"
          ms={110}
        />
      </div>
      <StateLegend states={meta.states} className="text-[13px]" />
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col">
      <section className="mx-auto flex w-full max-w-[1120px] flex-col items-center px-6 pt-24 text-center">
        <p className="mb-[18px] text-[15px] font-medium text-secondary">
          Six sorting algorithms, one decision at a time
        </p>
        <h1 className="text-balance text-[clamp(44px,7vw,80px)] font-bold leading-[1.02] tracking-[-0.04em]">
          See how sorting thinks.
        </h1>
        <p className="mt-[22px] max-w-[600px] text-pretty text-[clamp(17px,1.6vw,21px)] leading-[1.45] text-secondary">
          Watch every comparison, swap and write happen on your own numbers — as flat bars, or with
          a 3D crane that physically moves each value into place.
        </p>
        <Link
          to="/visualize"
          className="mt-[34px] flex items-center gap-2 rounded-full bg-accent px-[26px] py-3.5 text-[17px] font-semibold text-on-accent shadow-[0_6px_18px_color-mix(in_srgb,var(--accent)_30%,transparent)] transition-[transform,filter] duration-base ease-spring hover:-translate-y-px hover:brightness-[1.06] active:scale-[0.98]"
        >
          Open the visualizer
          <ArrowRight />
        </Link>
      </section>

      <section className="mx-auto mt-16 w-full max-w-[1120px] px-4 sm:px-6">
        <SortDemo />
      </section>
    </div>
  );
}
