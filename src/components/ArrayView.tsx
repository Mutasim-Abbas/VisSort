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
const GAP = 6;
const CELL_H = 40;

type CellStyle = CSSProperties & Record<string, string | number>;

/**
 * Array view: every element is a numbered cell in a wrapping grid. Cells keep
 * their identity (keyed by bar id) and slide to their new grid slot on swaps,
 * so the actual values and index movements are visible — the clearest view for
 * teaching what an algorithm really does to the array.
 */
export function ArrayView({ frame, speed, statusLabel }: Props) {
  const [ref, size] = useElementSize<HTMLDivElement>();
  const n = frame.heights.length;

  // Cell width adapts to the widest value so 4-digit numbers still fit.
  let maxVal = 0;
  for (const v of frame.heights) if (v > maxVal) maxVal = v;
  const digits = Math.max(2, String(Math.round(maxVal)).length);
  const cellW = 26 + digits * 8;

  const cols = Math.max(1, Math.floor((size.width + GAP) / (cellW + GAP)));
  const rows = Math.ceil(n / cols);
  const gridH = rows * (CELL_H + GAP) - GAP;

  const stepMs = Math.min(600, Math.round(1000 / Math.max(1, speed)));

  return (
    <section
      aria-label="Array view of the sorting visualization"
      className="relative flex min-h-[300px] flex-1 overflow-y-auto rounded-lg border border-subtle bg-canvas p-4 shadow-e1 lg:min-h-0"
    >
      <p className="sr-only" aria-live="polite">
        {statusLabel}
      </p>
      <div
        ref={ref}
        style={{ height: `${gridH}px`, '--step-ms': `${stepMs}ms` } as CellStyle}
        className={`relative w-full ${speed >= SNAP_SPEED ? 'no-transitions' : ''}`}
      >
        {size.width > 0 &&
          frame.heights.map((value, id) => {
            const pos = frame.posOf[id];
            const x = (pos % cols) * (cellW + GAP);
            const y = Math.floor(pos / cols) * (CELL_H + GAP);
            const state = frame.state[id];
            const stateClass = state !== 'default' ? `cell-${state}` : '';
            return (
              <div
                key={id}
                className={`cell ${stateClass}`}
                style={
                  {
                    width: `${cellW}px`,
                    height: `${CELL_H}px`,
                    transform: `translate(${x}px, ${y}px)`,
                  } as CellStyle
                }
              >
                {value}
              </div>
            );
          })}
      </div>
    </section>
  );
}
