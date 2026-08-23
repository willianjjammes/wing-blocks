import type { GameMode, PieceId, PowerupId } from "../domain/types";

export type ViewCell = {
  x: number;
  y: number;
  pieceId: PieceId;
  relic: boolean;
  ghost?: boolean;
};

export type BoardViewState = {
  mode: GameMode;
  score: number;
  lines: number;
  level: number;
  gameOver: boolean;
  gravityMs: number;
  hold: PieceId | null;
  next: PieceId[];
  lastCleared: number;
  locked: ViewCell[];
  active: ViewCell[];
  ghost: ViewCell[];
  powerup: PowerupId | null;
  powerupMs: number;
  lastActivatedPowerup: PowerupId | null;
  powerActivationCount: number;
  relicSpawnCount: number;
  bestScore: number;
};
