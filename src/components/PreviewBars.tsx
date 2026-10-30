import { useEffect, useState } from 'react';
import type { PreviewFrame } from '../engine/preview';

/**
 * Walks an index through `length` frames, one per `intervalMs`, holds on the
 * last frame for `holdTicks` more ticks, then calls `onLoop` and starts over.
 * Restarts from 0 whenever `length` or `resetKey` changes.
 */
export function useLoopingIndex(
  length: number,
  intervalMs: number,
  holdTicks: number,
  onLoop?: () => void,
  resetKey?: unknown,
): number {
  const [tick, setTick] = useState(0);

  useEffect(() => setTick(0), [length, resetKey]);

  useEffect(() => {
    const iv = window.setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => window.clearInterval(iv);
  }, [intervalMs]);

  const end = length - 1 + holdTicks;
  useEffect(() => {
    if (length > 0 && tick > end) {
      setTick(0);
      onLoop?.();
    }
  }, [tick, end, length, onLoop]);

  return Math.min(tick, Math.max(0, length - 1));
}

interface Props {
  frame: PreviewFrame;
  /** Gap between bars, px. */
  gap: number;
  /** CSS border-radius of each bar. */
  radius: string;
  /** Height transition, ms. Colour always changes a touch faster. */
  ms: number;
}

/** A row of bars filling its parent, coloured by each position's state. */
export function PreviewBars({ frame, gap, radius, ms }: Props) {
  return (
    <div aria-hidden="true" className="flex h-full items-end" style={{ gap }}>
      {frame.h.map((h, i) => (
        <div key={i} className="relative h-full flex-1">
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{
              height: `${h}%`,
              background: `var(--s-${frame.st[i]})`,
              borderRadius: radius,
              transition: `height ${ms}ms ease, background-color ${Math.round(ms * 0.8)}ms linear`,
            }}
          />
        </div>
      ))}
    </div>
  );
}
