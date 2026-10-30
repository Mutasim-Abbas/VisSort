import { useEffect, useRef } from 'react';

const SHORTCUTS = [
  ['Play / pause', 'Space'],
  ['Step forward', '→'],
  ['Step back', '←'],
  ['Reset', 'R'],
  ['Faster / slower', '] / ['],
  ['Show shortcuts', '?'],
] as const;

/** Modal list of the Visualizer's keys. Closes on the backdrop, × or Escape. */
export function ShortcutsDialog({ onClose }: { onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => closeRef.current?.focus(), []);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 grid place-items-center bg-[rgb(10_12_16/0.28)] p-6"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
        onClick={(e) => e.stopPropagation()}
        className="rise-in flex w-[min(380px,100%)] flex-col gap-3.5 rounded-3xl bg-surface p-[22px] shadow-lg"
      >
        <div className="flex items-center justify-between">
          <h2 id="shortcuts-title" className="text-lg font-[650] tracking-[-0.01em]">
            Keyboard shortcuts
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-[30px] w-[30px] place-items-center rounded-full bg-fill text-base text-secondary"
          >
            ×
          </button>
        </div>
        <dl className="flex flex-col">
          {SHORTCUTS.map(([label, key]) => (
            <div
              key={label}
              className="flex items-center justify-between border-b-[0.5px] border-hair py-2.5"
            >
              <dt className="text-sm text-secondary">{label}</dt>
              <dd>
                <kbd className="rounded-md bg-surface-2 px-2 py-[3px] font-mono text-xs text-primary shadow-sm">
                  {key}
                </kbd>
              </dd>
            </div>
          ))}
        </dl>
        <p className="text-xs text-muted">Shortcuts pause while you type in a field.</p>
      </div>
    </div>
  );
}
