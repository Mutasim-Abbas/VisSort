import type { Frame } from '../../engine/player';
import type { BarState } from '../../engine/types';

const STATE_FILL: Record<BarState, string> = {
  default: 'var(--color-bar-default)',
  comparing: 'var(--color-bar-comparing)',
  swapping: 'var(--color-bar-swapping)',
  overwriting: 'var(--color-bar-overwriting)',
  pivot: 'var(--color-bar-pivot)',
  sorted: 'var(--color-bar-sorted)',
};

interface Props {
  frame: Frame;
  /** Inclusive range of the call currently executing, bracketed on the strip. */
  range?: { lo: number; hi: number } | null;
  label?: string;
}

/**
 * A compact one-row strip of the live array in the same state colours the other
 * views use, with the active call's range bracketed underneath.
 *
 * This is the link the old Tree view was missing entirely: the tree drew ranges
 * like `4–7` with nothing on screen tying those numbers back to the actual
 * elements they refer to.
 */
export function ArrayRibbon({ frame, range, label }: Props) {
  const n = frame.heights.length;
  if (n === 0) return null;

  const byPos = new Array<BarState>(n).fill('default');
  const valueByPos = new Array<number>(n).fill(0);
  for (let id = 0; id < n; id++) {
    byPos[frame.posOf[id]] = frame.state[id];
    valueByPos[frame.posOf[id]] = frame.heights[id];
  }
  let maxVal = 0;
  for (const v of valueByPos) if (v > maxVal) maxVal = v;

  const pct = (x: number) => `${(x / n) * 100}%`;

  return (
    <div className="shrink-0">
      <div className="relative flex h-9 w-full items-end gap-[1px]">
        {byPos.map((s, pos) => (
          <span
            key={pos}
            className="ribbon-cell min-w-0 flex-1 rounded-[2px]"
            style={{
              height: `${maxVal > 0 ? Math.max(12, (valueByPos[pos] / maxVal) * 100) : 100}%`,
              background: STATE_FILL[s],
              opacity: range && (pos < range.lo || pos > range.hi) ? 0.28 : 1,
            }}
          />
        ))}
      </div>
      <div className="relative h-4">
        {range && (
          <div
            className="ribbon-bracket absolute top-0 border-l border-r border-t border-accent"
            style={{ left: pct(range.lo), width: pct(range.hi - range.lo + 1), height: '5px' }}
          />
        )}
        {range && (
          <span
            className="absolute top-[5px] -translate-x-1/2 font-mono text-[9px] text-accent"
            style={{ left: pct(range.lo + (range.hi - range.lo + 1) / 2) }}
          >
            {label ?? `${range.lo}–${range.hi}`}
          </span>
        )}
      </div>
    </div>
  );
}
