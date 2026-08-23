import { describe, expect, it } from "vitest";
import { cyclingPieces } from "../../src/domain/deal";
import { Game } from "../../src/domain/game";
import { alwaysZeroRng } from "../../src/domain/rng";
import { BOARD_WIDTH, VISIBLE_HEIGHT } from "../../src/domain/types";

const deal = () => cyclingPieces();

describe("SPEC-001 board and spawn", () => {
  it("spawns Plume on an empty well without game over", () => {
    const game = new Game({ mode: "classic", rng: alwaysZeroRng, dealPiece: deal() });
    const s = game.snapshot();
    expect(s.gameOver).toBe(false);
    expect(s.active?.id).toBe("plume");
    const cells = game.worldCells();
    expect(cells).toHaveLength(4);
    expect(game.snapshot().next).toHaveLength(3);
    expect(cells.every((c) => c.x >= 3 && c.x <= 6)).toBe(true);
  });

  it("ends the game when spawn cells are occupied", () => {
    const locked = [3, 4, 5, 6].map((x) => ({
      x,
      y: -1,
      pieceId: "block" as const,
    }));
    const game = new Game({ mode: "classic", rng: alwaysZeroRng, locked, dealPiece: deal() });
    const s = game.snapshot();
    expect(s.gameOver).toBe(true);
    expect(s.active).toBeNull();
  });

  it("uses a 10×20 visible well", () => {
    expect(BOARD_WIDTH).toBe(10);
    expect(VISIBLE_HEIGHT).toBe(20);
  });
});
