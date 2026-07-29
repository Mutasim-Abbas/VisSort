import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { Frame } from '../engine/player';
import type { AlgorithmKey } from '../engine/registry';
import type { Group, GroupKind, Step } from '../engine/types';
import { compareOutcome, contextAt, invariantOf } from '../engine/stepContext';
import { useElementSize } from '../hooks/useElementSize';

interface Props {
  algorithmKey: AlgorithmKey;
  frame: Frame;
  steps: readonly Step[];
  speed: number;
  statusLabel: string;
  onShrink: (n: number) => void;
}

/** Cell transitions snap off at/above this speed, mirroring the bars. */
const SNAP_SPEED = 20;
/** Gap between cells inside one group. */
const GAP = 6;
/** Extra separation between two adjacent groups — this is what makes the
 *  algorithm's carve-up physically visible rather than a colour wash. */
const GROUP_GAP = 22;
const CELL_H = 46;
const INDEX_H = 18;
const BRACKET_H = 26;
const CURSOR_H = 24;
/** Below this cell width the numbers stop fitting and cells become state chips. */
const MIN_LABELLED_W = 22;
/** How long a manual scroll suppresses cursor auto-follow. */
const USER_SCROLL_GRACE_MS = 3000;

type CellStyle = CSSProperties & Record<string, string | number>;

/**
 * A low arc between two exchanging positions, drawn above the row. Without it a
 * swap reads as two cells teleporting past each other; the arc makes the
 * exchange legible as a single motion.
 */
function arcPath(x1: number, x2: number, baseY: number): string {
  const lift = Math.min(30, 10 + Math.abs(x2 - x1) * 0.16);
  const midX = (x1 + x2) / 2;
  return `M ${x1} ${baseY} Q ${midX} ${baseY - lift} ${x2} ${baseY}`;
}

/** Per-kind tint. Deliberately low-saturation: the cell state colours must win. */
const GROUP_TINT: Record<GroupKind, string> = {
  ordered: 'color-mix(in srgb, var(--lime) 12%, transparent)',
  unsorted: 'color-mix(in srgb, var(--color-bar-default) 22%, transparent)',
  scanned: 'color-mix(in srgb, var(--accent) 10%, transparent)',
  unexamined: 'color-mix(in srgb, var(--color-bar-default) 14%, transparent)',
  lessThan: 'color-mix(in srgb, var(--color-bar-overwriting) 14%, transparent)',
  greaterThan: 'color-mix(in srgb, var(--color-bar-swapping) 13%, transparent)',
  pivot: 'color-mix(in srgb, var(--color-bar-pivot) 20%, transparent)',
  merged: 'color-mix(in srgb, var(--lime) 12%, transparent)',
  heap: 'color-mix(in srgb, var(--accent) 12%, transparent)',
  outside: 'transparent',
};

const GROUP_EDGE: Record<GroupKind, string> = {
  ordered: 'color-mix(in srgb, var(--lime) 34%, transparent)',
  unsorted: 'var(--border-subtle)',
  scanned: 'color-mix(in srgb, var(--accent) 30%, transparent)',
  unexamined: 'var(--border-subtle)',
  lessThan: 'color-mix(in srgb, var(--color-bar-overwriting) 34%, transparent)',
  greaterThan: 'color-mix(in srgb, var(--color-bar-swapping) 32%, transparent)',
  pivot: 'color-mix(in srgb, var(--color-bar-pivot) 45%, transparent)',
  merged: 'color-mix(in srgb, var(--lime) 30%, transparent)',
  heap: 'color-mix(in srgb, var(--accent) 30%, transparent)',
  outside: 'transparent',
};

/** Verdict chip copy + tint for the comparison callout. */
const VERDICT: Record<string, { text: string; color: string }> = {
  swap: { text: '→ swap', color: 'var(--color-bar-swapping)' },
  keep: { text: '→ keep', color: 'var(--lime)' },
  'write-left': { text: '→ write left', color: 'var(--color-bar-overwriting)' },
  'write-right': { text: '→ write right', color: 'var(--color-bar-overwriting)' },
};

/**
 * Array view: the array drawn as one row, physically divided into the groups the
 * running algorithm actually maintains (`ctx.groups`). Cells keep their identity
 * (keyed by bar id) and slide between slots, so a swap reads as an exchange.
 *
 * The point of this view is that the structure on screen is *true*: a bracket
 * saying "< 41" spans cells that really are below the pivot, and the invariant
 * line under the phase strip is a sentence a student could be examined on. The
 * engine supplies all of it — see `src/engine/stepContext.ts`.
 */
export function ArrayView({ algorithmKey, frame, steps, speed, statusLabel, onShrink }: Props) {
  const [ref, size] = useElementSize<HTMLDivElement>();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const userScrolledAt = useRef(0);
  const [scrollX, setScrollX] = useState(0);
  const n = frame.heights.length;

  const ctx = useMemo(() => contextAt(steps, frame.index), [steps, frame.index]);
  const outcome = useMemo(() => compareOutcome(steps, frame.index), [steps, frame.index]);
  const invariant = useMemo(
    () => invariantOf(algorithmKey, ctx, frame),
    [algorithmKey, ctx, frame],
  );

  // Cell width adapts to the widest value so 3–4 digit numbers still fit.
  let maxVal = 0;
  for (const v of frame.heights) if (v > maxVal) maxVal = v;
  const digits = Math.max(2, String(Math.round(maxVal)).length);
  const idealW = Math.max(34, 20 + digits * 10);

  // Groups cover 0…n-1 by engine invariant; fall back to one block when a step
  // carries no context (the initial frame, and any future step that opts out).
  const groups: readonly Group[] = useMemo(() => {
    if (ctx.groups && ctx.groups.length > 0) return ctx.groups;
    return n > 0 ? [{ lo: 0, hi: n - 1, kind: 'unsorted' as GroupKind, label: '' }] : [];
  }, [ctx.groups, n]);

  /**
   * x offset per *position*. Groups add an extra gap between them, which is what
   * turns "one uniform strip" into visibly separate blocks.
   */
  const { xOf, contentW, cellW, labelled } = useMemo(() => {
    const gapCount = Math.max(0, groups.length - 1);
    const available = Math.max(120, size.width - 8);
    // Shrink cells only as far as needed to fit; never grow past ideal.
    const raw = (available - gapCount * GROUP_GAP - Math.max(0, n - 1) * GAP) / Math.max(1, n);
    const w = Math.max(8, Math.min(idealW, Math.floor(raw)));
    const width = n > 0 ? w : idealW;

    const xs = new Array<number>(n).fill(0);
    let x = 0;
    for (const g of groups) {
      for (let p = g.lo; p <= g.hi && p < n; p++) {
        xs[p] = x;
        x += width + GAP;
      }
      x += GROUP_GAP - GAP;
    }
    const total = n > 0 ? xs[n - 1] + width : 0;
    return { xOf: xs, contentW: total, cellW: width, labelled: width >= MIN_LABELLED_W };
  }, [groups, n, size.width, idealW]);

  const stepMs = Math.min(600, Math.round(1000 / Math.max(1, speed)));
  const snap = speed >= SNAP_SPEED;

  // The step that produced this frame, so a swap can be drawn as an exchange
  // and a write can pulse. Both are per-step and must not linger.
  const swapArc = useMemo(() => {
    const s = frame.index > 0 ? steps[frame.index - 1] : undefined;
    return s && s.type === 'swap' ? { a: s.i, b: s.j } : null;
  }, [steps, frame.index]);
  const writeAt = useMemo(() => {
    const s = frame.index > 0 ? steps[frame.index - 1] : undefined;
    return s && s.type === 'overwrite' ? s.index : null;
  }, [steps, frame.index]);
  const overflowing = contentW > size.width + 1;

  const cursors = ctx.cursors ?? {};
  const cursorEntries = useMemo(
    () =>
      Object.entries(cursors)
        .filter(([, p]) => p >= 0 && p < n)
        .sort((a, b) => a[1] - b[1]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ctx.cursors, n],
  );

  // Auto-follow: keep the cursors on screen, but a manual scroll wins for a
  // few seconds so the user can look around without being yanked back.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !overflowing || cursorEntries.length === 0) return;
    if (Date.now() - userScrolledAt.current < USER_SCROLL_GRACE_MS) return;
    const positions = cursorEntries.map(([, p]) => p);
    const lo = xOf[Math.min(...positions)] ?? 0;
    const hi = (xOf[Math.max(...positions)] ?? 0) + cellW;
    const pad = cellW * 2;
    if (lo - pad < el.scrollLeft) el.scrollTo({ left: Math.max(0, lo - pad), behavior: 'smooth' });
    else if (hi + pad > el.scrollLeft + el.clientWidth)
      el.scrollTo({ left: hi + pad - el.clientWidth, behavior: 'smooth' });
  }, [cursorEntries, xOf, cellW, overflowing]);

  const gridH = BRACKET_H + CURSOR_H + CELL_H + INDEX_H;

  return (
    <section
      aria-label="Array view of the sorting visualization"
      className="liquid-glass relative flex min-h-[300px] flex-1 flex-col gap-3 overflow-hidden rounded-[1.25rem] p-5 lg:min-h-0"
    >
      <p className="sr-only" aria-live="polite">
        {statusLabel}
      </p>

      {/* 1 — phase strip */}
      <div className="flex flex-wrap items-center gap-2">
        {ctx.phase && (
          <span className="rounded-full border border-subtle bg-surface-2 px-3 py-1 font-mono text-[11px] text-primary">
            {ctx.phase}
          </span>
        )}
        {ctx.pass && (
          <span className="rounded-full border border-subtle px-3 py-1 font-mono text-[11px] text-secondary">
            pass {ctx.pass.index}
            {ctx.pass.total ? ` / ${ctx.pass.total}` : ''}
          </span>
        )}
        <span className="rounded-full border border-subtle px-3 py-1 font-mono text-[11px] text-muted">
          step {frame.index} / {frame.total}
        </span>
      </div>

      {/* 2 — invariant line: the highest-value element on the screen */}
      <p className="min-h-[2.5em] text-[13px] leading-snug text-secondary">
        {invariant || <span className="text-muted">Press play to watch the structure form.</span>}
      </p>

      {/* Row + its brackets, cursors and index track */}
      <div ref={ref} className="min-h-0 flex-1">
        <div
          ref={scrollRef}
          onScroll={(e) => {
            userScrolledAt.current = Date.now();
            setScrollX(e.currentTarget.scrollLeft);
          }}
          className="scrollbar-thin h-full overflow-x-auto overflow-y-hidden"
        >
          <div
            style={
              {
                width: `${Math.max(contentW, size.width - 8)}px`,
                height: `${gridH}px`,
                '--step-ms': `${stepMs}ms`,
              } as CellStyle
            }
            className={`relative ${snap ? 'no-transitions' : ''}`}
          >
            {size.width > 0 && n > 0 && (
              <>
                {/* Group backing panels + 3 — labelled brackets */}
                {groups.map((g, gi) => {
                  if (g.hi < g.lo) return null;
                  const left = xOf[g.lo] ?? 0;
                  const right = (xOf[Math.min(g.hi, n - 1)] ?? 0) + cellW;
                  const w = Math.max(cellW, right - left);
                  return (
                    <div key={`g-${gi}-${g.kind}-${g.lo}`}>
                      <div
                        className="group-panel absolute rounded-md"
                        style={{
                          transform: `translate(${left - 3}px, ${BRACKET_H + CURSOR_H - 3}px)`,
                          width: `${w + 6}px`,
                          height: `${CELL_H + 6}px`,
                          background: GROUP_TINT[g.kind],
                          border: `1px solid ${GROUP_EDGE[g.kind]}`,
                        }}
                      />
                      {g.label && g.kind !== 'outside' && (
                        <div
                          className="group-bracket absolute flex items-end justify-center overflow-hidden"
                          style={{
                            transform: `translate(${left}px, 0px)`,
                            width: `${w}px`,
                            height: `${BRACKET_H}px`,
                          }}
                        >
                          <span
                            className="truncate px-1 font-mono text-[10px] leading-none"
                            style={{ color: GROUP_EDGE[g.kind] }}
                            title={g.label}
                          >
                            {g.label}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* 4 — cursor rail */}
                {cursorEntries.map(([name, pos], ci) => (
                  <div
                    key={`cur-${name}`}
                    className="cursor-pill absolute flex flex-col items-center"
                    style={{
                      transform: `translate(${xOf[pos] ?? 0}px, ${BRACKET_H + (ci % 2) * 2}px)`,
                      width: `${cellW}px`,
                    }}
                  >
                    <span className="max-w-full truncate rounded-full bg-surface-3 px-1.5 py-0.5 font-mono text-[9px] leading-none text-accent">
                      {labelled ? `${name}=${pos}` : name}
                    </span>
                  </div>
                ))}

                {/* 5 — the row itself */}
                {frame.heights.map((value, id) => {
                  const pos = frame.posOf[id];
                  const state = frame.state[id];
                  const stateClass = state !== 'default' ? `cell-${state}` : '';
                  const fill = maxVal > 0 ? Math.max(0.06, value / maxVal) : 0;
                  return (
                    <div
                      key={id}
                      className={`cell ${stateClass}`}
                      style={
                        {
                          width: `${cellW}px`,
                          height: `${CELL_H}px`,
                          fontSize: cellW >= 30 ? '12px' : '10px',
                          transform: `translate(${xOf[pos] ?? 0}px, ${BRACKET_H + CURSOR_H}px)`,
                        } as CellStyle
                      }
                    >
                      {/* proportional value fill, tying this view back to Columns */}
                      <span
                        aria-hidden="true"
                        className="cell-fill"
                        style={{ height: `${fill * 100}%` }}
                      />
                      {/* write pulse — keyed on the step so it replays each write */}
                      {!snap && writeAt === pos && (
                        <span key={`w-${frame.index}`} aria-hidden="true" className="write-pulse" />
                      )}
                      {labelled && <span className="relative z-[1]">{value}</span>}
                    </div>
                  );
                })}

                {/* 9 — swap arc: a swap is an exchange, not a teleport */}
                {!snap && swapArc && (
                  <svg
                    className="pointer-events-none absolute left-0 top-0 overflow-visible"
                    width={contentW}
                    height={BRACKET_H + CURSOR_H}
                    aria-hidden="true"
                  >
                    <path
                      key={`arc-${frame.index}`}
                      className="swap-arc"
                      d={arcPath(
                        (xOf[swapArc.a] ?? 0) + cellW / 2,
                        (xOf[swapArc.b] ?? 0) + cellW / 2,
                        BRACKET_H + CURSOR_H,
                      )}
                      fill="none"
                      stroke="var(--color-bar-swapping)"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                    />
                  </svg>
                )}

                {/* 6 — index track */}
                {labelled &&
                  Array.from({ length: n }, (_, pos) => {
                    const active = cursorEntries.some(([, p]) => p === pos);
                    return (
                      <span
                        key={`idx-${pos}`}
                        className={`absolute grid place-items-center font-mono text-[10px] ${
                          active ? 'text-accent' : 'text-muted'
                        }`}
                        style={{
                          width: `${cellW}px`,
                          height: `${INDEX_H}px`,
                          transform: `translate(${xOf[pos] ?? 0}px, ${
                            BRACKET_H + CURSOR_H + CELL_H
                          }px)`,
                        }}
                      >
                        {pos}
                      </span>
                    );
                  })}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 7 — comparison callout */}
      <ComparisonCallout ctx={ctx} outcome={outcome} />

      {/* 8 — merge source runs */}
      {ctx.merge && <MergeRuns merge={ctx.merge} />}

      {/* 10 — overflow aids */}
      {overflowing && (
        <Minimap
          n={n}
          frame={frame}
          contentW={contentW}
          xOf={xOf}
          cellW={cellW}
          scrollX={scrollX}
          viewW={size.width}
        />
      )}
      {!labelled && (
        <p className="text-center text-[11px] text-muted">
          Too many elements to show values.{' '}
          <button
            type="button"
            onClick={() => onShrink(24)}
            className="underline decoration-dotted underline-offset-2 hover:text-accent"
          >
            Shrink to 24
          </button>{' '}
          to read the numbers.
        </p>
      )}
    </section>
  );
}

/** The comparison being made, in words, with what it decided. */
function ComparisonCallout({
  ctx,
  outcome,
}: {
  ctx: ReturnType<typeof contextAt>;
  outcome: ReturnType<typeof compareOutcome>;
}) {
  const v = ctx.values;
  if (!v) return <div className="min-h-[2.25rem]" aria-hidden="true" />;
  const op = v.a > v.b ? '>' : v.a < v.b ? '<' : '=';
  const verdict = outcome ? VERDICT[outcome] : undefined;
  return (
    <div className="flex min-h-[2.25rem] items-center justify-center gap-3">
      <div className="flex items-center gap-2 rounded-lg border border-subtle bg-surface-2 px-3 py-1.5 font-mono text-[13px] text-primary">
        <span>{v.a}</span>
        <span className="text-lg leading-none text-accent">{op}</span>
        <span>{v.b}</span>
      </div>
      {verdict && (
        <span
          className="rounded-full px-2.5 py-1 font-mono text-[11px]"
          style={{
            color: verdict.color,
            background: `color-mix(in srgb, ${verdict.color} 14%, transparent)`,
          }}
        >
          {verdict.text}
        </span>
      )}
    </div>
  );
}

/**
 * Merge's two source runs. These cannot be read off the array itself — the write
 * head has already overwritten part of the range — so they are drawn separately.
 */
function MergeRuns({ merge }: { merge: NonNullable<ReturnType<typeof contextAt>['merge']> }) {
  const { lo, mid, hi, takeLeft, takeRight } = merge;
  const leftLen = mid - lo + 1;
  const rightLen = hi - mid;
  const strip = (len: number, taken: number, label: string) => (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-[10px] text-muted">{label}</span>
      <div className="flex gap-0.5">
        {Array.from({ length: Math.max(0, len) }, (_, k) => (
          <span
            key={k}
            className="h-2.5 w-2.5 rounded-[2px]"
            style={{
              background:
                k < taken
                  ? 'color-mix(in srgb, var(--color-bar-default) 40%, transparent)'
                  : 'color-mix(in srgb, var(--lime) 55%, transparent)',
            }}
          />
        ))}
      </div>
    </div>
  );
  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      {strip(leftLen, takeLeft, `left ${lo}–${mid}`)}
      {strip(rightLen, takeRight, `right ${mid + 1}–${hi}`)}
    </div>
  );
}

/** Slim state-coloured tick strip with a viewport rectangle, only when overflowing. */
function Minimap({
  n,
  frame,
  contentW,
  xOf,
  cellW,
  scrollX,
  viewW,
}: {
  n: number;
  frame: Frame;
  contentW: number;
  xOf: number[];
  cellW: number;
  scrollX: number;
  viewW: number;
}) {
  const stateColor: Record<string, string> = {
    comparing: 'var(--color-bar-comparing)',
    swapping: 'var(--color-bar-swapping)',
    overwriting: 'var(--color-bar-overwriting)',
    pivot: 'var(--color-bar-pivot)',
    sorted: 'var(--color-bar-sorted)',
    default: 'var(--color-bar-default)',
  };
  const byPos = new Array<string>(n).fill('default');
  for (let id = 0; id < n; id++) byPos[frame.posOf[id]] = frame.state[id];
  const scale = contentW > 0 ? 100 / contentW : 0;

  return (
    <div className="relative h-3 w-full overflow-hidden rounded-full bg-surface-2">
      {byPos.map((s, pos) => (
        <span
          key={pos}
          className="absolute top-1 h-1 rounded-full"
          style={{
            left: `${(xOf[pos] ?? 0) * scale}%`,
            width: `${Math.max(0.4, cellW * scale)}%`,
            background: stateColor[s] ?? stateColor.default,
          }}
        />
      ))}
      <span
        className="absolute inset-y-0 rounded-full border border-accent/60"
        style={{ left: `${scrollX * scale}%`, width: `${Math.min(100, viewW * scale)}%` }}
      />
    </div>
  );
}
