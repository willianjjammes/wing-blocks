import { describe, expect, it } from "vitest";
import { PauseGate } from "../../src/presentation/input/PauseGate";

describe("SPEC-007 pause gate", () => {
  it("stops ticks and play input while paused", () => {
    const gate = new PauseGate();
    expect(gate.shouldTick()).toBe(true);
    gate.toggle();
    expect(gate.isPaused).toBe(true);
    expect(gate.shouldTick()).toBe(false);
    expect(gate.shouldAcceptPlayInput()).toBe(false);
    gate.toggle();
    expect(gate.shouldTick()).toBe(true);
  });
});
