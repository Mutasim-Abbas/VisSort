/**
 * VisSort sound engine (Web Audio). Designed to feel satisfying, not noisy:
 * soft sine/triangle blips whose pitch follows the element's value, a gentle
 * duotone for swaps, and a warm major-chord arpeggio when the sort completes.
 * Everything runs through one master gain + compressor so rapid step bursts
 * never clip. The AudioContext is created lazily inside a user gesture (the
 * sound toggle) to satisfy autoplay policies.
 */

const MIN_GAP_MS = 24; // throttle: at high speeds play at most ~40 blips/s

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private lastTick = 0;

  /** Create/resume the context. MUST be called from a user gesture. */
  enable(): void {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      const compressor = this.ctx.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.ratio.value = 6;
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.14;
      this.master.connect(compressor);
      compressor.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  suspend(): void {
    if (this.ctx && this.ctx.state === 'running') void this.ctx.suspend();
  }

  /** value/max → frequency on a gentle two-octave curve (A3 220Hz → A5 880Hz). */
  private freq(ratio: number): number {
    const r = Math.max(0, Math.min(1, ratio));
    return 220 * 2 ** (r * 2);
  }

  private blip(
    frequency: number,
    opts: { type: OscillatorType; gain: number; duration: number; detune?: number },
  ): void {
    if (!this.ctx || !this.master || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = opts.type;
    osc.frequency.value = frequency;
    if (opts.detune) osc.detune.value = opts.detune;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(opts.gain, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + opts.duration);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + opts.duration + 0.02);
  }

  private throttled(): boolean {
    const now = performance.now();
    if (now - this.lastTick < MIN_GAP_MS) return true;
    this.lastTick = now;
    return false;
  }

  compare(ratio: number): void {
    if (this.throttled()) return;
    this.blip(this.freq(ratio), { type: 'sine', gain: 0.5, duration: 0.09 });
  }

  swap(ratio: number): void {
    if (this.throttled()) return;
    const f = this.freq(ratio);
    this.blip(f, { type: 'triangle', gain: 0.55, duration: 0.1 });
    this.blip(f, { type: 'triangle', gain: 0.35, duration: 0.1, detune: 7 });
  }

  overwrite(ratio: number): void {
    if (this.throttled()) return;
    this.blip(this.freq(ratio), { type: 'sine', gain: 0.45, duration: 0.07 });
  }

  /** Warm ascending major arpeggio + soft octave to close a finished sort. */
  done(): void {
    if (!this.ctx || !this.master || this.ctx.state !== 'running') return;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((f, i) => {
      const t = this.ctx!.currentTime + i * 0.09;
      const osc = this.ctx!.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const g = this.ctx!.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.5, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      osc.connect(g);
      g.connect(this.master!);
      osc.start(t);
      osc.stop(t + 0.55);
    });
  }
}

/** App-wide singleton — one context, one master chain. */
export const sound = new SoundEngine();
