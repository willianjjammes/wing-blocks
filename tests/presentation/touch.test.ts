import { describe, expect, it } from "vitest";
import { commandFromPointer } from "../../src/presentation/input/touch";

const field = { left: 0, top: 0, width: 100, height: 200 };

describe("SPEC-007 touch mapping", () => {
  it("maps left-zone tap relative to the zone center", () => {
    expect(
      commandFromPointer(field, { startX: 10, startY: 80, endX: 10, endY: 80 }),
    ).toEqual({ type: "move", dx: -1 });
    expect(
      commandFromPointer(field, { startX: 30, startY: 80, endX: 30, endY: 80 }),
    ).toEqual({ type: "move", dx: 1 });
  });

  it("maps right-zone tap to rotate clockwise", () => {
    expect(
      commandFromPointer(field, { startX: 80, startY: 80, endX: 80, endY: 80 }),
    ).toEqual({ type: "rotate", dir: 1 });
  });

  it("maps swipe down to hard drop", () => {
    expect(
      commandFromPointer(field, { startX: 50, startY: 40, endX: 50, endY: 90 }),
    ).toEqual({ type: "hardDrop" });
  });
});
