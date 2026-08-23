import { describe, expect, it } from "vitest";
import { Board } from "../../src/domain/board";
import { cyclingPieces } from "../../src/domain/deal";
import { Game } from "../../src/domain/game";
import { alwaysZeroRng } from "../../src/domain/rng";
import type { PieceId } from "../../src/domain/types";

const plumeFirst = () => cyclingPieces();

function fillRow(
  y: number,
  except: number[] = [],
  pieceId: PieceId = "block",
): Array<{ x: number; y: number; pieceId: PieceId }> {
  const cells = [];
  for (let x = 0; x < 10; x += 1) {
    if (!except.includes(x)) cells.push({ x, y, pieceId });
  }
  return cells;
}

describe("SPEC-003 line clear and score", () => {
  it("clears the bottom row and scores 100 plus hard-drop points at level 1", () => {
    const locked = fillRow(19, [3, 4, 5, 6]);
    const game = new Game({ mode: "classic", rng: alwaysZeroRng, locked, dealPiece: plumeFirst() });
    game.hardDrop();
    const s = game.snapshot();
    expect(s.lastCleared).toBe(1);
    expect(s.lines).toBe(1);
    expect(s.level).toBe(1);
    expect(s.score).toBeGreaterThanOrEqual(100);
    expect(s.locked.filter((c) => c.y === 19 && c.pieceId === "block")).toHaveLength(0);
  });

  it("scores Asa Quadrupla as 800 * level", () => {
    const locked = [
      ...fillRow(16, [5]),
      ...fillRow(17, [5]),
      ...fillRow(18, [5]),
      ...fillRow(19, [5]),
    ];
    const game = new Game({ mode: "classic", rng: alwaysZeroRng, locked, dealPiece: plumeFirst() });
    expect(game.rotate(1)).toBe(true);
    game.hardDrop();
    const s = game.snapshot();
    expect(s.lastCleared).toBe(4);
    expect(s.lines).toBe(4);
    expect(s.score).toBeGreaterThanOrEqual(800);
    expect(s.score - 800).toBeLessThan(800);
  });

  it("compacts blocks above a cleared middle line", () => {
    const board = new Board();
    board.set(0, 10, { pieceId: "cross", relic: false });
    for (let x = 0; x < 10; x += 1) {
      board.set(x, 12, { pieceId: "block", relic: false });
    }
    const { cleared } = board.clearFullLines();
    expect(cleared).toBe(1);
    expect(board.get(0, 12)).toBeUndefined();
    expect(board.get(0, 11)).toEqual({ pieceId: "cross", relic: false });
  });
});
