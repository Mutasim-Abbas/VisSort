import { useMemo, type CSSProperties } from 'react';
import type { Frame } from '../engine/player';
import type { PlaybackStatus } from '../hooks/usePlayback';
import { useElementSize } from '../hooks/useElementSize';

interface Props {
  frame: Frame;
  speed: number;
  status: PlaybackStatus;
  statusLabel: string;
}

/** Bar transitions are snapped off at/above this speed (DESIGN §10). */
const SNAP_SPEED = 20;
const MARKER_STRIP = 12;

type BarStyle = CSSProperties & Record<string, string | number>;

export function BarCanvas({ frame, speed, status, statusLabel }: Props) {
  const [ref, size] = useElementSize<HTMLDivElement>();
  const n = frame.heights.length;

  const { width, height } = size;
  const slot = n > 0 ? width / n : 0;
  const barWidth = Math.max(1, slot * 0.72);
  const gap = slot - barWidth;
  const availH = Math.max(0, height - MARKER_STRIP - 4);
  const rounded = barWidth >= 5;
  const celebrating = status === 'done';

  const stepMs = Math.min(600, Math.round(1000 / Math.max(1, speed)));
  const canvasStyle = { '--step-ms': `${stepMs}ms` } as BarStyle;

  // Scale bar heights to the largest value present, so custom arrays of any
  // range (e.g. [3, 500, 42]) fill the canvas proportionally.
  const maxValue = useMemo(() => {
    let m = 1;
    for (const v of frame.heights) if (v > m) m = v;
    return m;
  }, [frame.heights]);

  const bars = useMemo(() => {
    const ids: number[] = [];
    for (let id = 0; id < n; id++) ids.push(id);
    return ids;
  }, [n]);

  const pivotX =
    frame.pivotId !== null && slot > 0 ? frame.posOf[frame.pivotId] * slot + slot / 2 - 6 : null;

  return (
    <section
      aria-label="Sorting visualization"
      className="relative flex min-h-[300px] flex-1 overflow-hidden rounded-lg border border-subtle bg-canvas p-3 shadow-e1 lg:min-h-0"
    >
      <p className="sr-only" aria-live="polite">
        {statusLabel}
      </p>
      <div
        ref={ref}
        style={canvasStyle}
        className={`relative h-full w-full ${speed >= SNAP_SPEED ? 'no-transitions' : ''}`}
      >
        {slot > 0 &&
          bars.map((id) => {
            const pos = frame.posOf[id];
            const x = pos * slot + gap / 2;
            const h = (frame.heights[id] / maxValue) * availH;
            const state = frame.state[id];
            const style: BarStyle = {
              width: `${barWidth}px`,
              height: `${h}px`,
              '--tx': `${x}px`,
            };
            if (celebrating) style.animationDelay = `${pos * 8}ms`;
            const stateClass = state !== 'default' ? `bar-${state}` : '';
            return (
              <div
                key={id}
                className={`bar ${rounded ? 'bar-rounded' : ''} ${stateClass} ${
                  celebrating ? 'bar-celebrate' : ''
                }`}
                style={style}
              />
            );
          })}
        {pivotX !== null && (
          <div className="pivot-marker" style={{ '--tx': `${pivotX}px` } as BarStyle} />
        )}
      </div>
    </section>
  );
}
