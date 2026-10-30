import { useEffect, useState } from 'react';

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
