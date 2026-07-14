import { Link } from 'react-router-dom';
import { ALGORITHMS } from '../engine/registry';
import { PSEUDOCODE } from '../engine/pseudocode';

function ComplexityCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="liquid-glass flex flex-col gap-0.5 rounded-xl px-3 py-2">
      <span className="text-[10px] uppercase tracking-wide text-muted">{label}</span>
      <span className="font-mono text-sm text-primary">{value}</span>
    </div>
  );
}

function Pseudocode({ algoKey }: { algoKey: keyof typeof PSEUDOCODE }) {
  const lines = PSEUDOCODE[algoKey];
  return (
    <pre
      aria-label="Pseudocode"
      className="liquid-glass overflow-x-auto rounded-xl p-4 font-mono text-[13px] leading-6 text-primary/90"
    >
      {lines.map((line, i) => (
        <div key={i} className="flex gap-3">
          <span className="w-5 select-none text-right text-[11px] leading-6 text-muted">
            {i + 1}
          </span>
          <code style={{ paddingLeft: `${line.indent * 16}px` }}>
            {line.text.startsWith('procedure') ? (
              <>
                <span className="text-accent">procedure</span>
                {line.text.slice('procedure'.length)}
              </>
            ) : (
              line.text
            )}
          </code>
        </div>
      ))}
    </pre>
  );
}

export default function Learn() {
  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 pb-16 pt-28">
      <p className="mb-2 font-mono text-xs uppercase tracking-[0.25em] text-accent">Learn</p>
      <h1 className="font-display text-4xl italic tracking-[-1px] text-primary md:text-5xl">
        How the algorithms work
      </h1>
      <p className="mt-2 mb-12 max-w-2xl text-secondary">
        Every algorithm in VisSort — what it does, its pseudocode, how it scales, and whether it
        preserves the order of equal elements. Read here, then watch it happen in the
        visualizer.
      </p>

      <div className="flex flex-col gap-10">
        {ALGORITHMS.map((algo) => (
          <article key={algo.key} className="liquid-glass rounded-[1.25rem] p-6 md:p-8">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-3xl italic tracking-[-1px] text-primary">
                {algo.name}
              </h2>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs ${
                    algo.stable ? 'border-lime/40 text-lime' : 'border-subtle text-muted'
                  }`}
                >
                  {algo.stable ? 'Stable' : 'Unstable'}
                </span>
                <Link
                  to={`/visualize?algo=${algo.key}`}
                  className="rounded-full bg-accent px-3.5 py-1 text-xs font-semibold text-on-accent transition-transform duration-fast active:scale-95"
                >
                  Watch it →
                </Link>
              </div>
            </div>

            <p className="mb-5 max-w-3xl leading-relaxed text-secondary">{algo.description}</p>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
              <Pseudocode algoKey={algo.key} />
              <div className="grid grid-cols-2 content-start gap-2">
                <ComplexityCell label="Best" value={algo.complexity.best} />
                <ComplexityCell label="Average" value={algo.complexity.average} />
                <ComplexityCell label="Worst" value={algo.complexity.worst} />
                <ComplexityCell label="Space" value={algo.complexity.space} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
