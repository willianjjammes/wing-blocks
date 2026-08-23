import { describe, expect, it } from "vitest";
import { cyclingPieces } from "../../src/domain/deal";
import { Game } from "../../src/domain/game";
import { alwaysZeroRng } from "../../src/domain/rng";
import { gravityMs, lockDelayMs } from "../../src/domain/timing";

describe("SPEC-005 modes", () => {
  it("uses 1000ms gravity on Calma level 1", () => {
    const game = new Game({ mode: "calm", rng: alwaysZeroRng, dealPiece: cyclingPieces() });
    expect(game.snapshot().gravityMs).toBe(1000);
    expect(gravityMs("classic", 1)).toBe(800);
    expect(lockDelayMs("calm")).toBe(800);
    expect(lockDelayMs("classic")).toBe(500);
  });

  it("Time Wing forces Calma level-1 gravity even in Classic", () => {
    const game = new Game({ mode: "classic", rng: alwaysZeroRng, dealPiece: cyclingPieces() });
    expect(game.snapshot().gravityMs).toBe(800);
    game.applyPower("timeWing");
    expect(game.snapshot().gravityMs).toBe(1000);
  });
});
