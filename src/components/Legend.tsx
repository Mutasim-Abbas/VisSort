import type { BarState } from '../engine/types';

const ITEMS: { state: Exclude<BarState, 'default'> | 'default'; label: string; varName: string }[] = [
  { state: 'default', label: 'Unsorted', varName: '--color-bar-default' },
  { state: 'comparing', label: 'Comparing', varName: '--color-bar-comparing' },
  { state: 'swapping', label: 'Swapping', varName: '--color-bar-swapping' },
  { state: 'overwriting', label: 'Writing', varName: '--color-bar-overwriting' },
  { state: 'pivot', label: 'Pivot', varName: '--color-bar-pivot' },
  { state: 'sorted', label: 'Sorted', varName: '--color-bar-sorted' },
];

export function Legend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-subtle bg-surface-1 px-4 py-2.5 text-xs text-secondary shadow-e1">
      {ITEMS.map((item) => (
        <li key={item.state} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="h-3 w-3 rounded-sm"
            style={{ backgroundColor: `var(${item.varName})` }}
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
