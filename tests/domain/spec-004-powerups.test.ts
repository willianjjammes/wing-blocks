import { describe, expect, it } from "vitest";
import { cyclingPieces } from "../../src/domain/deal";
import { Game } from "../../src/domain/game";
import { shouldSpawnRelic } from "../../src/domain/powerups";
import { alwaysZeroRng } from "../../src/domain/rng";
import type { PieceId } from "../../src/domain/types";

function fillRow(y: number, except: number[] = [], relicX?: number): Array<{
  x: number;
  y: number;
  pieceId: PieceId;
  relic?: boolean;
}> {
  const cells = [];
  for (let x = 0; x < 10; x += 1) {
    if (!except.includes(x)) cells.push({ x, y, pieceId: "block" as const, relic: x === relicX });
  }
  return cells;
}

describe("SPEC-004 power-ups", () => {
  it("Halo clears the lowest partial row", () => {
    const locked = [0, 1, 2, 3, 4, 5].map((x) => ({
      x,
      y: 19,
      pieceId: "block" as const,
    }));
    const game = new Game({
      mode: "classic",
      rng: alwaysZeroRng,
      locked,
      dealPiece: cyclingPieces(),
    });
    game.applyPower("halo");
    expect(game.snapshot().locked.some((c) => c.y === 19)).toBe(false);
  });

  it("Sky Shield ignores one illegal spawn", () => {
    const locked = [
      { x: 3, y: -1, pieceId: "block" as const },
      { x: 6, y: -1, pieceId: "block" as const },
    ];
    const game = new Game({
      mode: "classic",
      rng: alwaysZeroRng,
      locked,
      dealPiece: cyclingPieces(),
      skipInitialSpawn: true,
    });
    game.applyPower("skyShield");
    game.spawn();
    const s = game.snapshot();
    expect(s.gameOver).toBe(false);
    expect(s.active).not.toBeNull();
    expect(s.powerup).toBeNull();
  });

  it("replaces Time Wing when another power activates", () => {
    const game = new Game({ mode: "classic", rng: alwaysZeroRng, dealPiece: cyclingPieces() });
    game.applyPower("timeWing");
    expect(game.snapshot().powerup).toBe("timeWing");
    expect(game.snapshot().gravityMs).toBe(1000);
    game.applyPower("skyShield");
    expect(game.snapshot().powerup).toBe("skyShield");
    expect(game.snapshot().powerupMs).toBe(0);
  });

  it("Gust clears a 2×2 at the last lock origin", () => {
    const locked = [
      { x: 0, y: 0, pieceId: "block" as const },
      { x: 1, y: 0, pieceId: "block" as const },
      { x: 0, y: 1, pieceId: "block" as const },
      { x: 1, y: 1, pieceId: "block" as const },
    ];
    const game = new Game({
      mode: "classic",
      rng: alwaysZeroRng,
      locked,
      dealPiece: cyclingPieces(),
    });
    game.applyPower("gust");
    expect(game.snapshot().locked.some((c) => c.x <= 1 && c.y <= 1)).toBe(false);
  });

  it("Plume Swap exchanges hold without spending hold", () => {
    const game = new Game({ mode: "classic", rng: alwaysZeroRng, dealPiece: cyclingPieces() });
    expect(game.snapshot().active?.id).toBe("plume");
    game.holdPiece();
    const afterHold = game.snapshot();
    expect(afterHold.hold).toBe("plume");
    const current = afterHold.active!.id;
    game.applyPower("plumeSwap");
    const s = game.snapshot();
    expect(s.active?.id).toBe("plume");
    expect(s.hold).toBe(current);
    expect(s.holdUsedThisPiece).toBe(false);
    expect(game.holdPiece()).toBe(true);
  });

  it("Royal Strike destroys the most occupied row", () => {
    const locked = [0, 1, 2, 3, 4, 5].map((x) => ({
      x,
      y: 18,
      pieceId: "block" as const,
    }));
    locked.push({ x: 9, y: 17, pieceId: "block" as const });
    const game = new Game({
      mode: "classic",
      rng: alwaysZeroRng,
      locked,
      dealPiece: cyclingPieces(),
    });
    game.applyPower("royalStrike");
    expect(game.snapshot().locked).toHaveLength(1);
  });

  it("Royal Strike destroys the most occupied column", () => {
    const locked = [14, 15, 16, 17, 18, 19].map((y) => ({
      x: 8,
      y,
      pieceId: "block" as const,
    }));
    locked.push({ x: 1, y: 19, pieceId: "block" as const });
    const game = new Game({
      mode: "classic",
      rng: alwaysZeroRng,
      locked,
      dealPiece: cyclingPieces(),
    });
    game.applyPower("royalStrike");
    expect(game.snapshot().locked).toHaveLength(1);
  });

  it("keeps instant power activation observable for feedback", () => {
    const game = new Game({ mode: "classic", rng: alwaysZeroRng, dealPiece: cyclingPieces() });
    game.applyPower("halo");
    const snapshot = game.snapshot();
    expect(snapshot.powerup).toBeNull();
    expect(snapshot.lastActivatedPowerup).toBe("halo");
    expect(snapshot.powerActivationCount).toBe(1);
  });

  it("counts relic spawns for visual and audio feedback", () => {
    const game = new Game({
      mode: "calm",
      rng: alwaysZeroRng,
      dealPiece: cyclingPieces(),
      forceRelic: true,
    });
    expect(game.snapshot().relicSpawnCount).toBe(1);
  });

  it("activates pickPower when a relic line is cleared", () => {
    const locked = fillRow(19, [3, 4, 5, 6], 0);
    const game = new Game({
      mode: "classic",
      rng: alwaysZeroRng,
      locked,
      dealPiece: cyclingPieces(),
      pickPower: () => "timeWing",
    });
    game.hardDrop();
    expect(game.snapshot().relicLineCleared).toBe(true);
    expect(game.snapshot().powerup).toBe("timeWing");
  });
});

describe("SPEC-005 relic chance", () => {
  it("marks a relic in Calma at roll 0.10 but not in Classic", () => {
    expect(shouldSpawnRelic("calm", 0.1, 0)).toBe(true);
    expect(shouldSpawnRelic("classic", 0.1, 0)).toBe(false);
  });
});
