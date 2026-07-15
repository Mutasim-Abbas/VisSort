import { type CSSProperties } from 'react';
import type { Frame } from '../engine/player';
import { useElementSize } from '../hooks/useElementSize';

interface Props {
  frame: Frame;
  speed: number;
  statusLabel: string;
}

/** Cell transitions snap off at/above this speed, mirroring the bars. */
const SNAP_SPEED = 20;
const GAP = 10;
const CELL_H = 52;
const INDEX_H = 18;

type CellStyle = CSSProperties & Record<string, string | number>;

/**
 * Array view: every element is a numbered cell that keeps its identity (keyed
 * by bar id) and slides to its new slot on swaps, so the real values and index
 * movements are visible. The whole grid is centred in the canvas, and a fixed
 * index label sits under each slot (0, 1, 2 …) so learners can see position.
 */
export function ArrayView({ frame, speed, statusLabel }: Props) {
  const [ref, size] = useElementSize<HTMLDivElement>();
  const n = frame.heights.length;

  // Cell width adapts to the widest value so 3–4 digit numbers still fit.
  let maxVal = 0;
  for (const v of frame.heights) if (v > maxVal) maxVal = v;
  const digits = Math.max(2, String(Math.round(maxVal)).length);
  const cellW = Math.max(46, 26 + digits * 11);

  const cols = Math.max(1, Math.min(n, Math.floor((size.width + GAP) / (cellW + GAP))) || 1);
  const rows = Math.max(1, Math.ceil(n / cols));
  const rowStride = CELL_H + INDEX_H + GAP;

  const gridW = cols * cellW + (cols - 1) * GAP;
  const gridH = rows * rowStride - GAP;

  const stepMs = Math.min(600, Math.round(1000 / Math.max(1, speed)));

  const slotX = (pos: number) => (pos % cols) * (cellW + GAP);
  const slotY = (pos: number) => Math.floor(pos / cols) * rowStride;

  return (
    <section
      aria-label="Array view of the sorting visualization"
      className="liquid-glass relative flex min-h-[300px] flex-1 items-center justify-center overflow-auto rounded-[1.25rem] p-6 lg:min-h-0"
    >
      <p className="sr-only" aria-live="polite">
        {statusLabel}
      </p>
      <div ref={ref} className="flex w-full items-center justify-center">
        <div
          style={
            { width: `${gridW}px`, height: `${gridH}px`, '--step-ms': `${stepMs}ms` } as CellStyle
          }
          className={`relative ${speed >= SNAP_SPEED ? 'no-transitions' : ''}`}
        >
          {size.width > 0 && (
            <>
              {/* Fixed index track — labels belong to slots, not to values. */}
              {Array.from({ length: n }, (_, pos) => (
                <span
                  key={`idx-${pos}`}
                  className="absolute grid place-items-center font-mono text-[11px] text-muted"
                  style={{
                    width: `${cellW}px`,
                    height: `${INDEX_H}px`,
                    transform: `translate(${slotX(pos)}px, ${slotY(pos) + CELL_H}px)`,
                  }}
                >
                  {pos}
                </span>
              ))}

              {/* Value cells — these slide between slots. */}
              {frame.heights.map((value, id) => {
                const pos = frame.posOf[id];
                const state = frame.state[id];
                const stateClass = state !== 'default' ? `cell-${state}` : '';
                return (
                  <div
                    key={id}
                    className={`cell text-[15px] font-semibold ${stateClass}`}
                    style={
                      {
                        width: `${cellW}px`,
                        height: `${CELL_H}px`,
                        transform: `translate(${slotX(pos)}px, ${slotY(pos)}px)`,
                      } as CellStyle
                    }
                  >
                    {value}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
