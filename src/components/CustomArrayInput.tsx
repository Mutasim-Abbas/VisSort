import { useState } from 'react';

interface Props {
  onApply: (values: number[]) => void;
  disabled?: boolean;
}

const MAX_COUNT = 200;

function parse(raw: string): number[] | { error: string } {
  const parts = raw.split(/[\s,]+/).filter(Boolean);
  if (parts.length < 2) return { error: 'Enter at least 2 numbers, separated by spaces or commas.' };
  if (parts.length > MAX_COUNT) return { error: `That's too many — max ${MAX_COUNT} numbers.` };
  const nums: number[] = [];
  for (const p of parts) {
    const n = Number(p);
    if (!Number.isFinite(n)) return { error: `"${p}" isn't a number.` };
    if (n <= 0) return { error: 'Use positive numbers only (they set the bar heights).' };
    nums.push(Math.round(n));
  }
  return nums;
}

export function CustomArrayInput({ onApply, disabled }: Props) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const result = parse(value);
    if ('error' in result) {
      setError(result.error);
      return;
    }
    setError(null);
    onApply(result);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="custom-array" className="text-[11px] uppercase tracking-wide text-muted">
        Your own numbers
      </label>
      <div className="flex gap-2">
        <input
          id="custom-array"
          type="text"
          inputMode="numeric"
          value={value}
          disabled={disabled}
          placeholder="e.g. 5, 2, 9, 1, 7, 3"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          className="h-11 w-full rounded-md border border-subtle bg-surface-2 px-3 font-mono text-sm text-primary transition-colors duration-fast hover:border-strong focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-45"
        />
        <button
          type="button"
          onClick={submit}
          disabled={disabled}
          className="shrink-0 rounded-md bg-lime px-4 font-medium text-on-lime transition-[transform,background-color] duration-fast hover:bg-lime-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Use
        </button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
