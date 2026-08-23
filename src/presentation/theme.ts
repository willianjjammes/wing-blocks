import type { PieceId } from "../domain/types";

export const INK = 0x040914;
export const NAVY = 0x07152a;
export const NAVY_MID = 0x0d2442;
export const NAVY_LIGHT = 0x173b67;
export const GOLD_DARK = 0x9e681c;
export const GOLD = 0xf0c75e;
export const GOLD_LIGHT = 0xffedac;
export const IVORY = 0xfff8df;
export const MIST = 0xaec8e8;
export const WELL = 0x091a31;
export const WELL_GRID = 0x24456f;
export const DANGER = 0xc95b67;

export const DISPLAY_FONT = '"Trebuchet MS", "Arial Narrow", sans-serif';
export const BODY_FONT = '"Courier New", Courier, monospace';

export const PIECE_COLORS: Record<PieceId, number> = {
  plume: 0x54c7f4,
  shield: 0xf3c94f,
  wing: 0xb78cf4,
  halo: 0x55d992,
  lance: 0xf06b74,
  cross: 0x5a8ff0,
  block: 0xf29b50,
};

export const LAYOUT = {
  cell: 24,
  boardX: 12,
  boardY: 176,
  hudButton: 48,
  sideX: 268,
  btnXs: [318, 366] as const,
  btnYs: [28, 82] as const,
};

export function shade(hex: number, factor: number): number {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  const r = clamp(((hex >> 16) & 255) * factor);
  const g = clamp(((hex >> 8) & 255) * factor);
  const b = clamp((hex & 255) * factor);
  return (r << 16) | (g << 8) | b;
}
