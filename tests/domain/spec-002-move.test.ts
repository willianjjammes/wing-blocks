import { describe, expect, it } from "vitest";
import { cyclingPieces } from "../../src/domain/deal";
import { Game } from "../../src/domain/game";
import { alwaysZeroRng } from "../../src/domain/rng";

const plumeFirst = () => cyclingPieces();

describe("SPEC-002 movement, rotation, lock", () => {
  it("does not move Plume through the left wall", () => {
    const game = new Game({ mode: "classic", rng: alwaysZeroRng, dealPiece: plumeFirst() });
    expect(game.snapshot().active?.id).toBe("plume");
    for (let i = 0; i < 8; i += 1) game.move(-1);
    const xBefore = game.snapshot().active?.x;
    expect(game.move(-1)).toBe(false);
    expect(game.snapshot().active?.x).toBe(xBefore);
    expect(Math.min(...game.worldCells().map((c) => c.x))).toBe(0);
  });

  it("hard-drops Plume onto the floor and spawns the next piece", () => {
    const game = new Game({ mode: "classic", rng: alwaysZeroRng, dealPiece: plumeFirst() });
    game.hardDrop();
    const s = game.snapshot();
    expect(s.gameOver).toBe(false);
    expect(s.active).not.toBeNull();
    expect(s.active?.id).not.toBe("plume");
    const locked = s.locked.filter((c) => c.pieceId === "plume");
    expect(locked).toHaveLength(4);
    expect(Math.max(...locked.map((c) => c.y))).toBe(19);
  });

  it("applies a wall kick so Asa stays on the board", () => {
    const game = new Game({ mode: "classic", rng: alwaysZeroRng, dealPiece: plumeFirst() });
    while (game.snapshot().active?.id !== "wing") {
      game.hardDrop();
      if (game.snapshot().gameOver) throw new Error("ended before wing");
    }
    for (let i = 0; i < 12; i += 1) game.move(1);
    expect(Math.max(...game.worldCells().map((c) => c.x))).toBe(9);
    const ok = game.rotate(1);
    expect(ok).toBe(true);
    const xs = game.worldCells().map((c) => c.x);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...xs)).toBeLessThanOrEqual(9);
  });

  it("rejects a second hold on the same piece", () => {
    const game = new Game({ mode: "classic", rng: alwaysZeroRng, dealPiece: plumeFirst() });
    expect(game.holdPiece()).toBe(true);
    expect(game.snapshot().hold).toBe("plume");
    expect(game.holdPiece()).toBe(false);
  });
});
