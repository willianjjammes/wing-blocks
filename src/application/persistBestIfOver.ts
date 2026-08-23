import type { GameMode } from "../domain/types";
import type { ScoreRepository } from "./ports/ScoreRepository";

export async function persistBestIfOver(
  repo: ScoreRepository,
  mode: GameMode,
  score: number,
  gameOver: boolean,
): Promise<number> {
  if (!gameOver) return repo.getBest(mode);
  return repo.saveIfBest(mode, score);
}
