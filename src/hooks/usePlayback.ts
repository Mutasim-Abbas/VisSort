import { useCallback, useEffect, useRef, useState } from 'react';
import type { Step } from '../engine/types';
import { Player, type Frame } from '../engine/player';

export type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'done';

export interface Playback {
  frame: Frame;
  status: PlaybackStatus;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  stepForward: () => void;
  stepBack: () => void;
  reset: () => void;
  seekTo: (index: number) => void;
}

/** Guard against huge bursts after the tab was backgrounded. */
const MAX_STEPS_PER_FRAME = 400;

/**
 * requestAnimationFrame playback driver (PLAN F4). Owns a {@link Player} and
 * advances it at `speed` steps/second, reading the speed live from a ref so the
 * slider takes effect mid-run. Rebuilds cleanly whenever the array or algorithm
 * (i.e. `input`/`steps`) changes.
 */
export function usePlayback(input: readonly number[], steps: readonly Step[], speed: number): Playback {
  const playerRef = useRef<Player>(new Player(input, steps));
  const [frame, setFrame] = useState<Frame>(() => playerRef.current.frame());
  const [status, setStatus] = useState<PlaybackStatus>('idle');

  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number>(0);
  const accRef = useRef<number>(0);
  const speedRef = useRef<number>(speed);
  const playingRef = useRef<boolean>(false);

  speedRef.current = speed;

  const publish = useCallback(() => {
    setFrame(playerRef.current.frame());
  }, []);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    playingRef.current = false;
  }, []);

  const finish = useCallback(() => {
    stopLoop();
    playerRef.current.markAllSorted();
    setStatus('done');
    publish();
  }, [publish, stopLoop]);

  // Rebuild the player when the run definition changes.
  useEffect(() => {
    stopLoop();
    playerRef.current = new Player(input, steps);
    accRef.current = 0;
    setStatus('idle');
    setFrame(playerRef.current.frame());
  }, [input, steps, stopLoop]);

  // Tear down the animation frame on unmount.
  useEffect(() => stopLoop, [stopLoop]);

  const tick = useCallback(
    (ts: number) => {
      const player = playerRef.current;
      const dt = ts - lastTsRef.current;
      lastTsRef.current = ts;

      accRef.current += (dt * speedRef.current) / 1000;
      let toDo = Math.floor(accRef.current);
      if (toDo > 0) {
        accRef.current -= toDo;
        toDo = Math.min(toDo, MAX_STEPS_PER_FRAME);
        let advanced = false;
        for (let k = 0; k < toDo; k++) {
          if (!player.forward()) break;
          advanced = true;
        }
        if (advanced) publish();
      }

      if (player.atEnd) {
        finish();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    },
    [finish, publish],
  );

  const play = useCallback(() => {
    const player = playerRef.current;
    if (player.total === 0) return;
    if (player.atEnd) {
      player.seekTo(0);
      publish();
    }
    if (playingRef.current) return;
    playingRef.current = true;
    setStatus('playing');
    lastTsRef.current = performance.now();
    accRef.current = 0;
    rafRef.current = requestAnimationFrame(tick);
  }, [publish, tick]);

  const pause = useCallback(() => {
    if (!playingRef.current) return;
    stopLoop();
    setStatus('paused');
  }, [stopLoop]);

  const toggle = useCallback(() => {
    if (playingRef.current) pause();
    else play();
  }, [pause, play]);

  const stepForward = useCallback(() => {
    stopLoop();
    const player = playerRef.current;
    if (player.forward()) {
      if (player.atEnd) finish();
      else {
        setStatus('paused');
        publish();
      }
    }
  }, [finish, publish, stopLoop]);

  const stepBack = useCallback(() => {
    stopLoop();
    const player = playerRef.current;
    if (player.index === 0) return;
    player.seekTo(player.index - 1);
    setStatus(player.index === 0 ? 'idle' : 'paused');
    publish();
  }, [publish, stopLoop]);

  const reset = useCallback(() => {
    stopLoop();
    playerRef.current.reset();
    accRef.current = 0;
    setStatus('idle');
    publish();
  }, [publish, stopLoop]);

  const seekTo = useCallback(
    (index: number) => {
      stopLoop();
      const player = playerRef.current;
      player.seekTo(index);
      if (player.atEnd) setStatus('done');
      else if (player.index === 0) setStatus('idle');
      else setStatus('paused');
      publish();
    },
    [publish, stopLoop],
  );

  return { frame, status, play, pause, toggle, stepForward, stepBack, reset, seekTo };
}
