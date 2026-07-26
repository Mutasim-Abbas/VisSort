import type { ReactNode } from 'react';
import { ALGORITHMS, type AlgorithmKey } from '../engine/registry';
import { PRESETS, type PresetKey, MIN_SIZE, MAX_SIZE } from '../data/presets';
import { ShuffleIcon } from './icons';

interface Props {
  algorithmKey: AlgorithmKey;
  onAlgorithm: (key: AlgorithmKey) => void;
  preset: PresetKey;
  onPreset: (key: PresetKey) => void;
  size: number;
  onSize: (n: number) => void;
  speed: number;
  onSpeed: (n: number) => void;
  onShuffle: () => void;
  /** True while playing — locks structural controls (DESIGN §7). */
  running: boolean;
}

/**
 * Speed is a 1–5 *level*, not a raw step rate — see `STEP_RATE` in
 * `pages/Visualizer.tsx` for the seconds-per-step each level maps to. The crane
 * plays a whole pick-and-place per step, so the useful range is a handful of
 * slow rates; exposing raw steps/s meant fractional values like 0.25.
 */
const MIN_SPEED = 1;
const MAX_SPEED = 5;
const SPEED_STEP = 1;

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[11px] uppercase tracking-wide text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

function Select({
  id,
  value,
  disabled,
  onChange,
  children,
}: {
  id: string;
  value: string;
  disabled?: boolean;
  onChange: (v: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full appearance-none rounded-md border border-subtle bg-surface-2 px-3 pr-9 text-sm text-primary transition-colors duration-fast hover:border-strong focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-45"
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">
        ▾
      </span>
    </div>
  );
}

function Slider({
  id,
  min,
  max,
  value,
  step = 1,
  disabled,
  onChange,
}: {
  id: string;
  min: number;
  max: number;
  value: number;
  step?: number;
  disabled?: boolean;
  onChange: (n: number) => void;
}) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value))}
      className="vs-slider"
      style={{ ['--fill' as string]: `${fill}%` }}
    />
  );
}

export function Controls({
  algorithmKey,
  onAlgorithm,
  preset,
  onPreset,
  size,
  onSize,
  speed,
  onSpeed,
  onShuffle,
  running,
}: Props) {
  return (
    <div className="liquid-glass grid grid-cols-1 gap-4 rounded-[1.25rem] p-4 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="Algorithm" htmlFor="algo">
        <Select
          id="algo"
          value={algorithmKey}
          disabled={running}
          onChange={(v) => onAlgorithm(v as AlgorithmKey)}
        >
          {ALGORITHMS.map((a) => (
            <option key={a.key} value={a.key}>
              {a.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Data set" htmlFor="preset">
        <div className="flex gap-2">
          <Select
            id="preset"
            value={preset}
            disabled={running}
            onChange={(v) => onPreset(v as PresetKey)}
          >
            {PRESETS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.name}
              </option>
            ))}
          </Select>
          <button
            type="button"
            onClick={onShuffle}
            disabled={running}
            aria-label="Regenerate array"
            title="Regenerate array"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-subtle bg-surface-2 text-secondary transition-colors duration-fast hover:border-strong hover:text-primary disabled:cursor-not-allowed disabled:opacity-45"
          >
            <ShuffleIcon />
          </button>
        </div>
      </Field>

      <Field label={`Array size — ${size}`} htmlFor="size">
        <Slider
          id="size"
          min={MIN_SIZE}
          max={MAX_SIZE}
          value={size}
          disabled={running}
          onChange={onSize}
        />
      </Field>

      <Field label={`Speed — ${speed} of ${MAX_SPEED}`} htmlFor="speed">
        <Slider
          id="speed"
          min={MIN_SPEED}
          max={MAX_SPEED}
          step={SPEED_STEP}
          value={speed}
          onChange={onSpeed}
        />
      </Field>
    </div>
  );
}
