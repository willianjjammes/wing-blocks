import type { InputCommand } from "./commands";

export type PlayField = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type PointerStroke = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

export function commandFromPointer(field: PlayField, stroke: PointerStroke): InputCommand | null {
  const dx = stroke.endX - stroke.startX;
  const dy = stroke.endY - stroke.startY;
  if (dy > 40 && Math.abs(dy) >= Math.abs(dx)) {
    return { type: "hardDrop" };
  }

  const relX = stroke.startX - field.left;
  const leftZone = field.width * 0.4;
  const rightStart = field.width * 0.6;
  const isTap = Math.hypot(dx, dy) < 22;

  if (!isTap && Math.abs(dx) > 24 && relX < leftZone) {
    return { type: "move", dx: dx > 0 ? 1 : -1 };
  }

  if (isTap) {
    if (relX < leftZone) {
      const mid = leftZone / 2;
      return { type: "move", dx: relX < mid ? -1 : 1 };
    }
    if (relX >= rightStart) {
      return { type: "rotate", dir: 1 };
    }
  }

  return null;
}
