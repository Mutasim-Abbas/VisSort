import type { PlaybackStatus } from '../../hooks/usePlayback';
import { PauseIcon, PlayIcon, ResetIcon, StepBackIcon, StepForwardIcon } from '../icons';

interface Props {
  status: PlaybackStatus;
  index: number;
  total: number;
  onToggle: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
  onReset: () => void;
  onSeek: (index: number) => void;
  rateLabel: string;
  onSlower: () => void;
  onFaster: () => void;
}

function GhostButton({
  onClick,
  label,
  dim,
  children,
}: {
  onClick: () => void;
  label: string;
  dim?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid h-10 w-10 flex-none place-items-center rounded-full text-secondary transition-colors duration-fast hover:bg-fill hover:text-primary ${
        dim ? 'opacity-35' : ''
      }`}
    >
      {children}
    </button>
  );
}

/**
 * The floating playback pill at the foot of the stage: reset, step, play,
 * a scrubbable timeline, and a speed stepper.
 */
export function Transport({
  status,
  index,
  total,
  onToggle,
  onStepBack,
  onStepForward,
  onReset,
  onSeek,
  rateLabel,
  onSlower,
  onFaster,
}: Props) {
  const playing = status === 'playing';
  const playLabel = playing ? 'Pause (Space)' : status === 'done' ? 'Replay (Space)' : 'Play (Space)';

  return (
    <div className="absolute bottom-[18px] left-1/2 z-[3] flex w-[min(720px,calc(100%-24px))] -translate-x-1/2 items-center gap-1 rounded-full bg-surface p-[7px] shadow-lg">
      <GhostButton onClick={onReset} label="Reset (R)">
        <ResetIcon width={18} height={18} />
      </GhostButton>
      <GhostButton onClick={onStepBack} label="Step back (←)" dim={index === 0}>
        <StepBackIcon width={18} height={18} />
      </GhostButton>
      <button
        type="button"
        onClick={onToggle}
        aria-label={playLabel}
        title={playLabel}
        className="grid h-12 w-12 flex-none place-items-center rounded-full bg-accent text-on-accent transition-[transform,filter] duration-base ease-spring hover:brightness-[1.07] active:scale-[0.94]"
      >
        {playing ? (
          <PauseIcon width={22} height={22} />
        ) : (
          <PlayIcon width={22} height={22} className="ml-0.5" />
        )}
      </button>
      <GhostButton onClick={onStepForward} label="Step forward (→)" dim={index >= total}>
        <StepForwardIcon width={18} height={18} />
      </GhostButton>

      <div className="flex min-w-[60px] flex-1 items-center gap-2.5 px-1.5 sm:px-2.5">
        <input
          type="range"
          min={0}
          max={total}
          value={index}
          onChange={(e) => onSeek(Number(e.target.value))}
          aria-label="Timeline"
          title="Timeline"
          className="m-0 min-w-0 flex-1 accent-accent"
        />
        <span className="hidden flex-none whitespace-nowrap font-mono text-xs text-secondary sm:inline">
          {index.toLocaleString('en-US')}
          <span className="text-muted"> / {total.toLocaleString('en-US')}</span>
        </span>
      </div>

      <div className="flex flex-none items-center gap-0.5 rounded-full bg-fill p-[3px]">
        <button
          type="button"
          onClick={onSlower}
          aria-label="Slower ([)"
          title="Slower"
          className="grid h-[30px] w-[30px] place-items-center rounded-full text-[17px] leading-none text-secondary transition-colors duration-fast hover:bg-surface hover:text-primary"
        >
          −
        </button>
        <span
          title="Playback speed"
          className="hidden min-w-[84px] text-center font-mono text-xs text-primary sm:inline"
        >
          {rateLabel}
        </span>
        <button
          type="button"
          onClick={onFaster}
          aria-label="Faster (])"
          title="Faster"
          className="grid h-[30px] w-[30px] place-items-center rounded-full text-[17px] leading-none text-secondary transition-colors duration-fast hover:bg-surface hover:text-primary"
        >
          +
        </button>
      </div>
    </div>
  );
}
