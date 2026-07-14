import type { Counters } from '../engine/counters';

interface Props {
  counters: Counters;
  index: number;
  total: number;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-subtle bg-surface-2 px-3 py-2">
      <span className="text-[11px] uppercase tracking-wide text-muted">{label}</span>
      <span className="font-mono text-lg tabular-nums text-primary">{value}</span>
    </div>
  );
}

const fmt = (n: number) => n.toLocaleString('en-US');

export function StatsPanel({ counters, index, total }: Props) {
  return (
    <div className="liquid-glass rounded-[1.25rem] p-3">
      <h2 className="mb-3 px-1 font-display text-lg italic text-secondary">Live statistics</h2>
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Comparisons" value={fmt(counters.comparisons)} />
        <StatCard label="Swaps" value={fmt(counters.swaps)} />
        <StatCard label="Array writes" value={fmt(counters.writes)} />
        <StatCard label="Array accesses" value={fmt(counters.accesses)} />
      </div>
      <div className="mt-2">
        <StatCard label="Step" value={`${fmt(index)} / ${fmt(total)}`} />
      </div>
    </div>
  );
}
