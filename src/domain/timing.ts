import type { GameMode } from "./types";

export function gravityMs(mode: GameMode, level: number): number {
  const base = mode === "calm" ? 1000 : 800;
  const step = mode === "calm" ? 40 : 60;
  const min = mode === "calm" ? 400 : 120;
  return Math.max(min, base - Math.max(0, level - 1) * step);
}

export function lockDelayMs(mode: GameMode): number {
  return mode === "calm" ? 800 : 500;
}

export const LINE_SCORE = [0, 100, 300, 500, 800] as const;

export function scoreForLines(cleared: number, level: number): number {
  const base = LINE_SCORE[cleared] ?? 0;
  return base * level;
}

export function levelForLines(totalLines: number): number {
  return 1 + Math.floor(totalLines / 10);
}
