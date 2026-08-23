import { describe, expect, it } from "vitest";
import { commandFromKey } from "../../src/presentation/input/commands";

describe("SPEC-007 keyboard map", () => {
  it("maps arrows and rotation keys to commands", () => {
    expect(commandFromKey("ArrowLeft", "ArrowLeft")).toEqual({ type: "move", dx: -1 });
    expect(commandFromKey("ArrowRight", "ArrowRight")).toEqual({ type: "move", dx: 1 });
    expect(commandFromKey("ArrowDown", "ArrowDown")).toEqual({ type: "softDrop" });
    expect(commandFromKey("Space", " ")).toEqual({ type: "hardDrop" });
    expect(commandFromKey("KeyZ", "z")).toEqual({ type: "rotate", dir: -1 });
    expect(commandFromKey("KeyX", "x")).toEqual({ type: "rotate", dir: 1 });
    expect(commandFromKey("ArrowUp", "ArrowUp")).toEqual({ type: "rotate", dir: 1 });
    expect(commandFromKey("KeyC", "c")).toEqual({ type: "hold" });
    expect(commandFromKey("Escape", "Escape")).toEqual({ type: "togglePause" });
  });
});
