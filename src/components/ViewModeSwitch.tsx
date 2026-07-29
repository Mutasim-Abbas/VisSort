import type { ViewMode } from './viewMode';

interface Props {
  mode: ViewMode;
  onMode: (mode: ViewMode) => void;
}

const OPTIONS: { key: ViewMode; label: string; title: string }[] = [
  { key: 'columns', label: 'Columns', title: 'The crane stage' },
  { key: 'array', label: 'Array', title: 'The array, grouped as the algorithm sees it' },
  { key: 'tree', label: 'Structure', title: 'Recursion tree, heap, or pass ladder' },
];

export function ViewModeSwitch({ mode, onMode }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="View mode"
      className="liquid-glass flex items-center gap-1 rounded-full p-1"
    >
      {OPTIONS.map((opt) => {
        const active = mode === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            role="radio"
            aria-checked={active}
            title={opt.title}
            onClick={() => onMode(opt.key)}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors duration-fast ${
              active ? 'bg-accent text-on-accent' : 'text-secondary hover:text-primary'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
