import { useMemo } from 'react';
import type { Frame } from '../../engine/player';
import type { Step } from '../../engine/types';
import { buildPassLadder } from '../../engine/stepContext';

interface Props {
  steps: readonly Step[];
  frame: Frame;
  n: number;
}

/**
 * Bubble, insertion and selection have no recursion tree — they run in flat
 * passes. Their structure is the *ladder of passes*: how many there are, how
 * much of the array each one still had to touch, and how the work shrinks.
 *
 * The old view simply disabled the Tree tab for these three, which taught
 * nothing. This shows the shape they actually have, and makes the quadratic
 * cost visible as an area rather than as a number in a stats panel.
 */
export function PassLadder({ steps, frame, n }: Props) {
  const rows = useMemo(() => buildPassLadder(steps), [steps]);
  const idx = frame.index;

  if (rows.length === 0 || n === 0) {
    return (
      <p className="grid flex-1 place-items-center text-sm text-muted">
        Step through the sort to build its pass ladder.
      </p>
    );
  }

  const maxComparisons = rows.reduce((m, r) => Math.max(m, r.comparisons), 1);
  const totalComparisons = rows.reduce((sum, r) => sum + r.comparisons, 0);
  const doneRows = rows.filter((r) => idx > r.to).length;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex items-center justify-between font-mono text-[10px] text-muted">
        <span>
          {rows.length} {rows.length === 1 ? 'pass' : 'passes'} · {doneRows} complete
        </span>
        <span>{totalComparisons} comparisons total</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {rows.map((row) => {
          const active = idx > row.from && idx <= row.to;
          const done = idx > row.to;
          const windowLo = row.window ? row.window.lo : 0;
          const windowHi = row.window ? row.window.hi : n - 1;
          const leftPct = (windowLo / n) * 100;
          const widthPct = ((windowHi - windowLo + 1) / n) * 100;
          // Progress within the active pass, so the current row fills as it runs.
          const within = active ? (idx - row.from) / Math.max(1, row.to - row.from) : done ? 1 : 0;

          return (
            <div
              key={row.index}
              className={`mb-1 rounded-md border px-2 py-1.5 transition-colors duration-fast ${
                active
                  ? 'border-accent bg-accent-soft'
                  : done
                    ? 'border-subtle'
                    : 'border-subtle opacity-55'
              }`}
            >
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="font-mono text-[11px] text-primary">{row.label}</span>
                <span className="font-mono text-[10px] text-muted">
                  {row.comparisons} cmp · {row.swaps} swap
                </span>
              </div>

              {/* The span of the array this pass still had to work on */}
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-surface-2">
                <span
                  className="absolute inset-y-0 rounded-full"
                  style={{
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                    background: done
                      ? 'color-mix(in srgb, var(--lime) 45%, transparent)'
                      : 'color-mix(in srgb, var(--accent) 45%, transparent)',
                  }}
                />
                {active && (
                  <span
                    className="absolute inset-y-0 rounded-full bg-accent"
                    style={{ left: `${leftPct}%`, width: `${widthPct * within}%` }}
                  />
                )}
              </div>

              {/* Comparison cost of this pass, relative to the busiest one */}
              <div className="mt-1 h-1 w-full rounded-full bg-surface-2">
                <span
                  className="block h-1 rounded-full"
                  style={{
                    width: `${(row.comparisons / maxComparisons) * 100}%`,
                    background: 'color-mix(in srgb, var(--color-bar-comparing) 60%, transparent)',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
