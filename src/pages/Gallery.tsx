import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ALGORITHMS, type AlgorithmMeta } from '../engine/registry';
import { previewArray, previewFrames } from '../engine/preview';
import { useLoopingIndex } from '../hooks/useLoopingIndex';
import { PreviewBars } from '../components/PreviewBars';
import { StableBadge } from '../components/StableBadge';

/** The card's own algorithm genuinely sorting 14 bars, on loop. */
function MiniSort({ algo, seed }: { algo: AlgorithmMeta; seed: number }) {
  const frames = useMemo(() => previewFrames(algo, previewArray(14, seed)), [algo, seed]);
  const idx = useLoopingIndex(frames.length, 150, 11);
  return (
    <div className="h-[132px] rounded-2xl bg-surface-2 px-[18px] pb-3.5 pt-[18px]">
      <PreviewBars frame={frames[idx]} gap={5} radius="4px 4px 2px 2px" ms={120} />
    </div>
  );
}

function AlgorithmCard({ algo, seed }: { algo: AlgorithmMeta; seed: number }) {
  return (
    <Link
      to={`/visualize?algo=${algo.key}`}
      className="flex flex-col gap-[18px] rounded-3xl bg-surface px-4 pb-[22px] pt-4 text-primary shadow-sm transition-[transform,box-shadow] duration-[250ms] ease-spring hover:-translate-y-[3px] hover:shadow-md"
    >
      <MiniSort algo={algo} seed={seed} />
      <div className="flex flex-col gap-2 px-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-xl font-[650] tracking-[-0.015em]">{algo.name}</h2>
          <span className="font-mono text-sm">{algo.complexity.average}</span>
        </div>
        <p className="text-pretty text-[15px] leading-[1.45] text-secondary">{algo.blurb}</p>
      </div>
      <dl className="mx-1.5 grid grid-cols-3 gap-2 border-t-[0.5px] border-hair pt-3.5">
        {(
          [
            ['Best', algo.complexity.best],
            ['Worst', algo.complexity.worst],
            ['Space', algo.complexity.space],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="flex flex-col gap-[3px]">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="font-mono text-[13px]">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mx-1.5 flex items-center gap-2">
        <StableBadge stable={algo.stable} className="px-2.5 py-1 text-xs" />
        <span className="rounded-full bg-fill px-2.5 py-1 text-xs font-medium text-secondary">
          {algo.writesModel === 'swap' ? 'Swap-based' : 'Write-based'}
        </span>
        <span className="ml-auto text-sm font-medium text-accent">Visualize →</span>
      </div>
    </Link>
  );
}

export default function Gallery() {
  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 pb-24 pt-[72px] sm:px-6">
      <h1 className="text-[clamp(36px,5vw,52px)] font-bold tracking-[-0.035em]">Six algorithms</h1>
      <p className="mb-10 mt-3.5 max-w-[560px] text-pretty text-lg leading-[1.45] text-secondary">
        Each preview is really sorting, right now, with its own method. Pick one to take the
        controls.
      </p>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-5">
        {ALGORITHMS.map((algo, i) => (
          <AlgorithmCard key={algo.key} algo={algo} seed={i + 1} />
        ))}
      </div>
    </div>
  );
}
