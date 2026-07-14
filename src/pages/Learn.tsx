import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ALGORITHMS, type AlgorithmKey } from '../engine/registry';
import { CodeRunner } from '../components/CodeRunner';
import { Practice } from '../components/Practice';
import { Playground } from '../components/Playground';

function ComplexityCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="liquid-glass flex flex-col gap-0.5 rounded-xl px-3 py-2">
      <span className="text-[10px] uppercase tracking-wide text-muted">{label}</span>
      <span className="font-mono text-sm text-primary">{value}</span>
    </div>
  );
}

type Tab = 'code' | 'practice';

function AlgorithmCard({ algoKey }: { algoKey: AlgorithmKey }) {
  const algo = ALGORITHMS.find((a) => a.key === algoKey)!;
  const [tab, setTab] = useState<Tab>('code');

  return (
    <article className="liquid-glass rounded-[1.25rem] p-5 md:p-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl italic tracking-[-1px] text-primary md:text-3xl">
          {algo.name}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
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

      <p className="mb-5 max-w-3xl text-sm leading-relaxed text-secondary md:text-base">
        {algo.description}
      </p>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <ComplexityCell label="Best" value={algo.complexity.best} />
        <ComplexityCell label="Average" value={algo.complexity.average} />
        <ComplexityCell label="Worst" value={algo.complexity.worst} />
        <ComplexityCell label="Space" value={algo.complexity.space} />
      </div>

      {/* Tabs: run the code, or test yourself on it. */}
      <div
        role="tablist"
        aria-label={`${algo.name} learning mode`}
        className="mb-4 flex w-fit items-center gap-1 rounded-full border border-subtle bg-surface-2 p-1"
      >
        {(
          [
            ['code', 'Run the code'],
            ['practice', 'Practice'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors duration-fast ${
              tab === key ? 'bg-accent text-on-accent' : 'text-secondary hover:text-primary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'code' ? (
        <CodeRunner algorithmKey={algo.key} />
      ) : (
        <Practice algorithmKey={algo.key} />
      )}
    </article>
  );
}

export default function Learn() {
  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 pb-16 pt-[150px] md:px-6 md:pt-28">
      <p className="mb-2 font-mono text-xs uppercase tracking-[0.25em] text-accent">Learn</p>
      <h1 className="font-display text-3xl italic tracking-[-1px] text-primary sm:text-4xl md:text-5xl">
        How the algorithms work
      </h1>
      <p className="mb-10 mt-2 max-w-2xl text-sm text-secondary md:text-base">
        Press <span className="text-accent">Run</span> and watch the pseudocode execute line by
        line against a real array — the highlighted line is the one doing the work right now. Then
        switch to <span className="text-accent">Practice</span> to test yourself.
      </p>

      {/* ---- Write-your-own playground ---- */}
      <section className="liquid-glass mb-10 rounded-[1.25rem] p-5 md:p-8">
        <div className="mb-1 flex items-center gap-2">
          <span className="rounded-full bg-lime px-3 py-1 text-xs font-semibold text-on-lime">
            Try it
          </span>
          <h2 className="font-display text-2xl italic tracking-[-1px] text-primary md:text-3xl">
            Write your own sorting code
          </h2>
        </div>
        <p className="mb-5 max-w-3xl text-sm leading-relaxed text-secondary md:text-base">
          This is a real (tiny) pseudocode interpreter. Type an algorithm, press{' '}
          <span className="text-lime">Run</span>, and your own code sorts the bars — same engine as
          the rest of VisSort. If something is off, it tells you which line.
        </p>

        <Playground />

        <details className="mt-5 text-sm text-secondary">
          <summary className="cursor-pointer font-medium text-primary">Syntax cheat-sheet</summary>
          <ul className="mt-3 grid gap-1.5 font-mono text-[13px] md:grid-cols-2">
            <li>
              <span className="text-accent">A</span> — the array · <span className="text-accent">n</span>{' '}
              — its length
            </li>
            <li>
              <span className="text-accent">x ← 5</span> — assign (or type <code>&lt;-</code>)
            </li>
            <li>
              <span className="text-accent">A[i] ← A[j]</span> — write into a slot
            </li>
            <li>
              <span className="text-accent">swap A[i], A[j]</span> — exchange two slots
            </li>
            <li>
              <span className="text-accent">for i ← 0 to n - 1:</span> — count up
            </li>
            <li>
              <span className="text-accent">for i ← n - 1 downto 0:</span> — count down
            </li>
            <li>
              <span className="text-accent">while cond:</span> · <span className="text-accent">if cond:</span> /{' '}
              <span className="text-accent">else:</span>
            </li>
            <li>
              compare with <span className="text-accent">{'< > <= >= == !='}</span>, join with{' '}
              <span className="text-accent">and / or</span>
            </li>
          </ul>
          <p className="mt-2 text-xs text-muted">
            Blocks are defined by indentation, like Python. Lines starting with # are comments.
          </p>
        </details>
      </section>

      <div className="flex flex-col gap-8">
        {ALGORITHMS.map((algo) => (
          <AlgorithmCard key={algo.key} algoKey={algo.key} />
        ))}
      </div>
    </div>
  );
}
