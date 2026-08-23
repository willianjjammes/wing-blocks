import type { PieceId } from "./types";

const shapes: Record<PieceId, readonly string[]> = {
  plume: ["....", "####", "....", "...."],
  shield: ["....", ".##.", ".##.", "...."],
  wing: ["....", ".###", "..#.", "...."],
  halo: ["....", "..##", ".##.", "...."],
  lance: ["....", ".##.", "..##", "...."],
  cross: ["....", "#...", "###.", "...."],
  block: ["....", "...#", ".###", "...."],
};

/** Rotation-0 occupancy in local 4×4 space (SPEC-001). */
export function cellsFor(id: PieceId): Array<{ x: number; y: number }> {
  const grid = shapes[id];
  const cells: Array<{ x: number; y: number }> = [];
  for (let y = 0; y < 4; y += 1) {
    for (let x = 0; x < 4; x += 1) {
      if (grid[y][x] === "#") cells.push({ x, y });
    }
  }
  return cells;
}

export const PIECE_IDS = Object.keys(shapes) as PieceId[];
