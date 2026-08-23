import { describe, expect, it } from "vitest";
import { PlayGame } from "../../src/application/PlayGame";
import { alwaysZeroRng } from "../../src/domain/rng";

describe("PlayGame use cases", () => {
  it("starts Calma with 1000ms gravity at level 1", async () => {
    const play = new PlayGame(alwaysZeroRng);
    const view = await play.startGame({ mode: "calm" });
    expect(view.gravityMs).toBe(1000);
    expect(view.gameOver).toBe(false);
    expect(view.active.length).toBe(4);
    expect(view.next).toHaveLength(3);
  });

  it("ticks gravity without crashing", async () => {
    const play = new PlayGame(alwaysZeroRng);
    await play.startGame({ mode: "classic" });
    const view = play.tick(10_000);
    expect(view.locked.length + view.active.length).toBeGreaterThan(0);
  });

  it("hardDrop locks and keeps a snapshot for presentation", async () => {
    const play = new PlayGame(alwaysZeroRng);
    await play.startGame({ mode: "classic" });
    const view = play.hardDrop();
    expect(view.locked.length).toBeGreaterThanOrEqual(4);
    expect(view.ghost.length).toBe(4);
  });
});
