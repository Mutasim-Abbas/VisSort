import type { Counters } from '../../engine/counters';
import type { AlgorithmMeta } from '../../engine/registry';
import { PSEUDOCODE } from '../../engine/pseudocode';
import { StableBadge } from '../StableBadge';

interface Props {
  algorithm: AlgorithmMeta;
  counters: Counters;
  /** Pseudocode line (0-based) that produced the current step, or -1. */
  activeLine: number;
  className?: string;
}

const fmt = (n: number) => n.toLocaleString('en-US');

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xs font-semibold text-muted">{children}</h2>;
}

/**
 * Everything about the run that is not the picture: live counts, the
 * algorithm's complexity, and its pseudocode with the executing line lit in
 * lock-step with playback — forwards and backwards.
 */
export function DetailsPanel({ algorithm, counters, activeLine, className = '' }: Props) {
  const { complexity } = algorithm;
  const stats = [
    ['Comparisons', counters.comparisons],
    ['Swaps', counters.swaps],
    ['Array writes', counters.writes],
    ['Array accesses', counters.accesses],
  ] as const;
  const rows = [
    ['Best', complexity.best],
    ['Average', complexity.average],
    ['Worst', complexity.worst],
    ['Space', complexity.space],
  ] as const;

  return (
    <aside
      aria-label="Details"
      className={`flex flex-col gap-5 overflow-y-auto rounded-[22px] bg-surface p-[18px] shadow-sm ${className}`}
    >
      <section className="flex flex-col gap-2.5">
        <SectionLabel>Live statistics</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          {stats.map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1 rounded-[14px] bg-surface-2 p-3">
              <span className="text-xs text-muted">{label}</span>
              <span className="font-mono text-[19px] font-medium tabular-nums">{fmt(value)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <SectionLabel>Complexity</SectionLabel>
          <StableBadge stable={algorithm.stable} className="px-[9px] py-[3px] text-[11.5px]" />
        </div>
        <dl className="flex flex-col rounded-[14px] bg-surface-2 px-3 py-1">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="flex justify-between border-b-[0.5px] border-hair py-2 last:border-b-0"
            >
              <dt className="text-[13px] text-secondary">{label}</dt>
              <dd className="font-mono text-[13px]">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="flex flex-col gap-2.5">
        <SectionLabel>Pseudocode</SectionLabel>
        <ol className="flex flex-col gap-px rounded-[14px] bg-surface-2 p-2">
          {PSEUDOCODE[algorithm.key].map((ln, i) => {
            const on = i === activeLine;
            return (
              <li
                key={i}
                aria-current={on ? 'step' : undefined}
                className={`flex gap-2.5 rounded-[7px] px-1.5 py-[3px] transition-colors duration-fast ${
                  on ? 'bg-accent-soft' : ''
                }`}
              >
                <span
                  className={`w-3.5 flex-none text-right font-mono text-[11px] leading-[1.7] ${
                    on ? 'text-accent' : 'text-muted'
                  }`}
                >
                  {i + 1}
                </span>
                <span
                  className={`whitespace-pre-wrap font-mono text-[11.5px] leading-[1.7] ${
                    on ? 'text-primary' : 'text-secondary'
                  }`}
                  style={{ paddingLeft: ln.indent * 14 }}
                >
                  {ln.text}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <p className="text-pretty text-[13.5px] leading-[1.55] text-secondary">
        {algorithm.description}
      </p>
    </aside>
  );
}
