export class PauseGate {
  private paused = false;
  private gameOver = false;

  get isPaused(): boolean {
    return this.paused;
  }

  setGameOver(value: boolean): void {
    this.gameOver = value;
    if (value) this.paused = false;
  }

  toggle(): boolean {
    if (this.gameOver) return this.paused;
    this.paused = !this.paused;
    return this.paused;
  }

  shouldTick(): boolean {
    return !this.paused && !this.gameOver;
  }

  shouldAcceptPlayInput(): boolean {
    return !this.paused && !this.gameOver;
  }
}
