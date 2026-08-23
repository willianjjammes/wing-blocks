import { describe, expect, it, vi } from "vitest";
import { HeldKeyRepeater } from "../../src/presentation/input/HeldKeyRepeater";

describe("SPEC-007 DAS/ARR", () => {
  it("fires immediately, then after DAS, then on ARR", () => {
    const fire = vi.fn();
    const rep = new HeldKeyRepeater(170, 50, fire);
    rep.press();
    expect(fire).toHaveBeenCalledTimes(1);
    rep.tick(169);
    expect(fire).toHaveBeenCalledTimes(1);
    rep.tick(1);
    expect(fire).toHaveBeenCalledTimes(2);
    rep.tick(50);
    expect(fire).toHaveBeenCalledTimes(3);
  });
});
