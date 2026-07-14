import type { AlgorithmMeta } from '../engine/registry';

interface Props {
  algorithm: AlgorithmMeta;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-subtle py-1.5 last:border-0">
      <span className="text-secondary">{label}</span>
      <span className="font-mono text-primary">{value}</span>
    </div>
  );
}

export function InfoPanel({ algorithm }: Props) {
  const { name, description, complexity, stable } = algorithm;
  return (
    <div className="liquid-glass rounded-[1.25rem] p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="font-display text-2xl italic text-primary">{name}</h2>
        <span
          className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
            stable
              ? 'border-bar-sorted/40 text-bar-sorted'
              : 'border-subtle text-muted'
          }`}
        >
          {stable ? 'Stable' : 'Unstable'}
        </span>
      </div>
      <p className="mb-4 text-[13px] leading-relaxed text-secondary">{description}</p>
      <h3 className="mb-1 text-[11px] uppercase tracking-wide text-muted">Time & space complexity</h3>
      <div className="text-[13px]">
        <Row label="Best case" value={complexity.best} />
        <Row label="Average case" value={complexity.average} />
        <Row label="Worst case" value={complexity.worst} />
        <Row label="Space" value={complexity.space} />
      </div>
    </div>
  );
}
