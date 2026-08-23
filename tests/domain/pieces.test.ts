import { describe, expect, it } from "vitest";
import { cellsFor } from "../../src/domain/pieces";
import { BOARD_WIDTH, VISIBLE_HEIGHT } from "../../src/domain/types";

describe("SPEC-001 board constants", () => {
  it("uses a 10×20 visible well", () => {
    expect(BOARD_WIDTH).toBe(10);
    expect(VISIBLE_HEIGHT).toBe(20);
  });
});

describe("SPEC-001 Wings pieces", () => {
  it("defines four cells for Plume (I)", () => {
    expect(cellsFor("plume")).toHaveLength(4);
  });

  it("defines a 2×2 square for Shield", () => {
    const cells = cellsFor("shield");
    expect(cells).toEqual([
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ]);
  });
});
