export type InputCommand =
  | { type: "move"; dx: -1 | 1 }
  | { type: "rotate"; dir: -1 | 1 }
  | { type: "softDrop" }
  | { type: "hardDrop" }
  | { type: "hold" }
  | { type: "togglePause" };

export function commandFromKey(code: string, key: string): InputCommand | null {
  if (code === "ArrowLeft") return { type: "move", dx: -1 };
  if (code === "ArrowRight") return { type: "move", dx: 1 };
  if (code === "ArrowDown") return { type: "softDrop" };
  if (code === "ArrowUp" || key === "x" || key === "X") return { type: "rotate", dir: 1 };
  if (key === "z" || key === "Z") return { type: "rotate", dir: -1 };
  if (code === "Space") return { type: "hardDrop" };
  if (key === "c" || key === "C") return { type: "hold" };
  if (code === "Escape" || key === "p" || key === "P") return { type: "togglePause" };
  return null;
}
