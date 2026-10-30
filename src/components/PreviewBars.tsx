import type { PreviewFrame } from '../engine/preview';

interface Props {
  frame: PreviewFrame;
  /** Gap between bars (px, or any CSS length). */
  gap: number | string;
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
