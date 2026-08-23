import { cellsFor } from "./pieces";
import type { PieceId } from "./types";

export type Rotation = 0 | 1 | 2 | 3;

export function rotateCellCw(x: number, y: number): { x: number; y: number } {
  return { x: 3 - y, y: x };
}

export function cellsAtRotation(id: PieceId, rotation: Rotation): Array<{ x: number; y: number }> {
  if (id === "shield") {
    return cellsFor(id);
  }
  let cells = cellsFor(id);
  for (let i = 0; i < rotation; i += 1) {
    cells = cells.map((c) => rotateCellCw(c.x, c.y));
  }
  return cells;
}

export const WALL_KICKS: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [-1, 0],
  [1, 0],
  [0, -1],
  [-1, -1],
  [1, -1],
];
