import type { GameMode, PowerupId } from "./types";
import type { Rng } from "./rng";

export const POWERUP_IDS: PowerupId[] = [
  "timeWing",
  "skyShield",
  "halo",
  "gust",
  "plumeSwap",
  "royalStrike",
];

export const TIME_WING_MS = 8000;

export function relicChance(mode: GameMode): number {
  return mode === "calm" ? 0.18 : 0.08;
}

export function maxRelicPieces(mode: GameMode): number {
  return mode === "calm" ? 3 : 2;
}

export function pickPowerup(rng: Rng, mode: GameMode = "calm"): PowerupId {
  const pool = mode === "classic" ? POWERUP_IDS.filter((id) => id !== "gust") : POWERUP_IDS;
  const i = Math.min(pool.length - 1, Math.floor(rng.next() * pool.length));
  return pool[i]!;
}

export function shouldSpawnRelic(
  mode: GameMode,
  roll: number,
  relicPiecesOnBoard: number,
): boolean {
  return roll < relicChance(mode) && relicPiecesOnBoard < maxRelicPieces(mode);
}
