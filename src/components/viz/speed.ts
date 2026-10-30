/**
 * Playback speeds, in steps per second. The low end is slow enough for the
 * crane to stage a full pick-and-place per step; the top end races through a
 * 200-value run. From {@link SNAP_RATE} up, views snap instead of animating.
 */
export const RATES = [0.4, 0.7, 1.1, 1.7, 2.5, 3.5, 6, 12, 24, 48] as const;

/** Opens at 1.1 steps/s — about one crane move a second. */
export const DEFAULT_SPEED = 2;

export const SNAP_RATE = 20;

export const clampSpeed = (i: number) => Math.max(0, Math.min(RATES.length - 1, i));

export function formatRate(rate: number): string {
  return `${rate < 10 ? rate.toFixed(1) : Math.round(rate)} steps/s`;
}
