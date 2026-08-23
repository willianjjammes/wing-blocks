import type { BoardViewState } from "../application/BoardViewState";

/** Short family-friendly beeps. No external audio files. */
export class SfxPlayer {
  private ctx: AudioContext | null = null;
  muted = false;
  private prev: BoardViewState | null = null;

  constructor(private readonly audioContextFactory: () => AudioContext | null) {}

  observe(view: BoardViewState): void {
    const prev = this.prev;
    this.prev = view;
    if (this.muted) return;
    if (view.relicSpawnCount > (prev?.relicSpawnCount ?? 0)) this.relicChime();
    if (!prev) return;
    if (view.lastCleared > 0 && view.lines > prev.lines) this.beep(660, 0.12);
    else if (view.locked.length > prev.locked.length) this.beep(220, 0.06);
    if (view.powerActivationCount > prev.powerActivationCount) this.powerChime();
    if (view.gameOver && !prev.gameOver) this.beep(110, 0.25);
  }

  private relicChime(): void {
    this.beep(740, 0.08, 0, "sine");
    this.beep(1110, 0.12, 0.09, "sine");
  }

  private powerChime(): void {
    this.beep(660, 0.08, 0, "square");
    this.beep(880, 0.08, 0.07, "square");
    this.beep(1320, 0.14, 0.14, "sine");
  }

  private beep(
    freq: number,
    seconds: number,
    delay = 0,
    type: OscillatorType = "square",
  ): void {
    try {
      this.ctx ??= this.audioContextFactory();
      if (!this.ctx) return;
      if (this.ctx.state === "suspended") void this.ctx.resume();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.value = freq;
      osc.type = type;
      gain.gain.value = 0.05;
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      const start = this.ctx.currentTime + delay;
      osc.start(start);
      osc.stop(start + seconds);
    } catch {
      /* autoplay / missing AudioContext */
    }
  }
}
