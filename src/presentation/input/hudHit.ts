export function isHudClusterHit(x: number, y: number, canvasWidth: number): boolean {
  return x > canvasWidth - 96 && y > 4 && y < 108;
}
