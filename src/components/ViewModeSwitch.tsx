import type { AlgorithmKey } from '../engine/registry';
import { TREE_CAPABLE, type ViewMode } from './viewMode';

interface Props {
  mode: ViewMode;
  onMode: (mode: ViewMode) => void;
  algorithmKey: AlgorithmKey;
}

const OPTIONS: { key: ViewMode; label: string }[] = [
  { key: 'columns', label: 'Columns' },
  { key: 'array', label: 'Array' },
  { key: 'tree', label: 'Tree' },
  { key: 'crane', label: '3D Crane' },
];

export function ViewModeSwitch({ mode, onMode, algorithmKey }: Props) {
  const treeEnabled = TREE_CAPABLE.includes(algorithmKey);
  return (
    <div
      role="radiogroup"
      aria-label="View mode"
      className="liquid-glass flex items-center gap-1 rounded-full p-1"
    >
      {OPTIONS.map((opt) => {
        const disabled = opt.key === 'tree' && !treeEnabled;
        const active = mode === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            title={
              disabled
                ? 'Tree view is available for Merge Sort, Quicksort and Heapsort'
                : `${opt.label} view`
            }
            onClick={() => onMode(opt.key)}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors duration-fast ${
              active
                ? 'bg-accent text-on-accent'
                : 'text-secondary hover:text-primary disabled:hover:text-secondary'
            } disabled:cursor-not-allowed disabled:opacity-40`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
