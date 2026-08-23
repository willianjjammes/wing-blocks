/** DAS / ARR repeater (SPEC-007). Fires once on press, then after dasMs, then every arrMs. */
export class HeldKeyRepeater {
  private elapsed = 0;
  private phase: "idle" | "das" | "arr" = "idle";
  private held = false;

  constructor(
    private readonly dasMs: number,
    private readonly arrMs: number,
    private readonly fire: () => void,
  ) {}

  press(): void {
    this.held = true;
    this.elapsed = 0;
    this.phase = "das";
    this.fire();
  }

  release(): void {
    this.held = false;
    this.phase = "idle";
    this.elapsed = 0;
  }

  tick(dtMs: number): void {
    if (!this.held) return;
    this.elapsed += dtMs;
    if (this.phase === "das" && this.elapsed >= this.dasMs) {
      this.elapsed -= this.dasMs;
      this.phase = "arr";
      this.fire();
    }
    while (this.phase === "arr" && this.elapsed >= this.arrMs) {
      this.elapsed -= this.arrMs;
      this.fire();
    }
  }
}
