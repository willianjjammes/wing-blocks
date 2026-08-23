import type Phaser from "phaser";
import { shade } from "./theme";

function mixColor(from: number, to: number, amount: number): number {
  const channel = (shift: number): number => {
    const a = (from >> shift) & 255;
    const b = (to >> shift) & 255;
    return Math.round(a + (b - a) * amount);
  };
  return (channel(16) << 16) | (channel(8) << 8) | channel(0);
}

export function drawBevelCell(
  g: Phaser.GameObjects.Graphics,
  px: number,
  py: number,
  size: number,
  color: number,
  opts: { ghost?: boolean; relic?: boolean; pulse?: number } = {},
): void {
  const inset = 1.25;
  const x = px + inset;
  const y = py + inset;
  const s = size - inset * 2;
  if (s <= 2) return;

  if (opts.ghost) {
    g.lineStyle(1.25, color, 0.62);
    g.strokeRoundedRect(x + 0.5, y + 0.5, s - 1, s - 1, 3);
    g.fillStyle(color, 0.1);
    g.fillRoundedRect(x + 2.5, y + 2.5, s - 5, s - 5, 2);
    g.fillStyle(color, 0.38);
    g.fillCircle(x + s / 2, y + s / 2, Math.max(1, s * 0.08));
    return;
  }

  const pulse = opts.pulse ?? 0;
  const fill = opts.relic ? mixColor(0xd99018, 0xffffc7, pulse) : color;
  if (opts.relic) {
    g.fillStyle(0xffd84d, 0.2 + pulse * 0.46);
    g.fillRoundedRect(x - 3, y - 3, s + 6, s + 6, 5);
    g.lineStyle(1 + pulse, 0xffffff, 0.38 + pulse * 0.5);
    g.strokeRoundedRect(x - 1, y - 1, s + 2, s + 2, 4);
  }
  g.fillStyle(0x020610, 0.95);
  g.fillRoundedRect(x, y + 1, s, s, 4);
  g.fillStyle(fill, 1);
  g.fillRoundedRect(x + 1, y + 1, s - 2, s - 2, 3);

  const hi = shade(fill, 1.28);
  const lo = shade(fill, 0.48);
  const edge = Math.max(2, Math.floor(s * 0.17));
  g.fillStyle(hi, 0.92);
  g.fillTriangle(x + 2, y + 2, x + s - 2, y + 2, x + 2, y + s - 2);
  g.fillStyle(lo, 0.72);
  g.fillTriangle(x + s - 2, y + 2, x + s - 2, y + s - 2, x + 2, y + s - 2);
  g.fillStyle(fill, 1);
  g.fillRoundedRect(x + edge, y + edge, s - edge * 2, s - edge * 2, 2);

  g.fillStyle(0xffffff, 0.34);
  g.fillRoundedRect(x + 3, y + 3, Math.max(2, s * 0.24), Math.max(1.5, s * 0.1), 1);
  g.lineStyle(1, shade(fill, 1.45), 0.35);
  g.strokeRoundedRect(x + 2.5, y + 2.5, s - 5, s - 5, 2);

  if (opts.relic) {
    const cx = x + s / 2;
    const cy = y + s / 2;
    const r = Math.max(2.5, s * 0.19);
    const relicRadius = r * (1 + pulse * 0.22);
    g.fillStyle(0xfff4bb, 0.92);
    g.fillTriangle(cx, cy - relicRadius, cx + relicRadius, cy, cx, cy + relicRadius);
    g.fillTriangle(cx, cy - relicRadius, cx - relicRadius, cy, cx, cy + relicRadius);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(cx, cy, Math.max(1, r * 0.28));
    g.lineStyle(1, 0xffffff, 0.25 + pulse * 0.65);
    g.lineBetween(cx - r * 1.7, cy, cx + r * 1.7, cy);
    g.lineBetween(cx, cy - r * 1.7, cx, cy + r * 1.7);
    g.lineStyle(1, 0xfff3c4, 0.82);
    g.strokeRoundedRect(x + 1.5, y + 1.5, s - 3, s - 3, 3);
  }
}
