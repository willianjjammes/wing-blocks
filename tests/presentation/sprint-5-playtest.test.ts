import { describe, expect, it } from "vitest";
import { pickPowerup } from "../../src/domain/powerups";
import { isHudClusterHit } from "../../src/presentation/input/hudHit";

describe("Sprint 5 playtest tweaks", () => {
  it("does not randomly roll Gust in Classic", () => {
    const rng = { next: () => 0.55 };
    expect(pickPowerup(rng, "calm")).toBe("gust");
    expect(pickPowerup(rng, "classic")).not.toBe("gust");
  });

  it("ignores only the right HUD cluster for touch", () => {
    expect(isHudClusterHit(20, 40, 390)).toBe(false);
    expect(isHudClusterHit(360, 40, 390)).toBe(true);
    expect(isHudClusterHit(300, 90, 390)).toBe(true);
    expect(isHudClusterHit(360, 112, 390)).toBe(false);
  });
});
