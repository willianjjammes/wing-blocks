import { Game } from "../domain/game";
import type { Rng } from "../domain/rng";
import type { GameMode } from "../domain/types";
import type { BoardViewState } from "./BoardViewState";
import { persistBestIfOver } from "./persistBestIfOver";
import type { ScoreRepository } from "./ports/ScoreRepository";

export type StartGameInput = {
  mode: GameMode;
};

export class PlayGame {
  private game: Game | null = null;
  private bestScore = 0;
  private persistedOver = false;

  constructor(
    private readonly rng: Rng,
    private readonly scores?: ScoreRepository,
  ) {}

  async startGame(input: StartGameInput): Promise<BoardViewState> {
    this.game = new Game({ mode: input.mode, rng: this.rng });
    this.persistedOver = false;
    this.bestScore = this.scores ? await this.scores.getBest(input.mode) : 0;
    return this.view();
  }

  tick(dtMs: number): BoardViewState {
    this.require().tick(dtMs);
    return this.view();
  }

  move(dx: -1 | 1): BoardViewState {
    this.require().move(dx);
    return this.view();
  }

  rotate(dir: -1 | 1): BoardViewState {
    this.require().rotate(dir);
    return this.view();
  }

  softDrop(): BoardViewState {
    this.require().softDrop();
    return this.view();
  }

  hardDrop(): BoardViewState {
    this.require().hardDrop();
    return this.view();
  }

  hold(): BoardViewState {
    this.require().holdPiece();
    return this.view();
  }

  async persistIfOver(): Promise<void> {
    const s = this.require().snapshot();
    if (!this.scores || this.persistedOver || !s.gameOver) return;
    this.persistedOver = true;
    this.bestScore = await persistBestIfOver(this.scores, s.mode, s.score, true);
  }

  view(): BoardViewState {
    const s = this.require().snapshot();
    const g = this.require();
    return {
      mode: s.mode,
      score: s.score,
      lines: s.lines,
      level: s.level,
      gameOver: s.gameOver,
      gravityMs: s.gravityMs,
      hold: s.hold,
      next: s.next,
      lastCleared: s.lastCleared,
      locked: s.locked.filter((c) => c.y >= 0).map((c) => ({ ...c })),
      active: s.active
        ? g.worldCells(s.active).map((c) => ({
            x: c.x,
            y: c.y,
            pieceId: s.active!.id,
            relic: s.active!.relic,
          }))
        : [],
      ghost: g.ghostCells().map((c) => ({
        x: c.x,
        y: c.y,
        pieceId: s.active?.id ?? "plume",
        relic: false,
        ghost: true,
      })),
      powerup: s.powerup,
      powerupMs: s.powerupMs,
      lastActivatedPowerup: s.lastActivatedPowerup,
      powerActivationCount: s.powerActivationCount,
      relicSpawnCount: s.relicSpawnCount,
      bestScore: this.bestScore,
    };
  }

  private require(): Game {
    if (!this.game) throw new Error("StartGame first");
    return this.game;
  }
}
