import type { BarState } from '../engine/types';

const LABEL: Record<BarState, string> = {
  default: 'Unsorted',
  comparing: 'Comparing',
  swapping: 'Swapping',
  overwriting: 'Writing',
  pivot: 'Pivot',
  sorted: 'Sorted',
};

/** Colour key for the states the running algorithm can produce — no others. */
export function StateLegend({
  states,
  className = '',
}: {
  states: readonly BarState[];
  className?: string;
}) {
  return (
    <ul className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 text-secondary ${className}`}>
      {states.map((s) => (
        <li key={s} className="flex items-center gap-[7px]">
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 rounded-[3px]"
            style={{ background: `var(--s-${s})` }}
          />
          {LABEL[s]}
        </li>
      ))}
    </ul>
  );
}
