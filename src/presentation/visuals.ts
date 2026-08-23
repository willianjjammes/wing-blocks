import Phaser from "phaser";
import {
  BODY_FONT,
  GOLD,
  GOLD_DARK,
  GOLD_LIGHT,
  INK,
  NAVY,
  NAVY_LIGHT,
  NAVY_MID,
} from "./theme";

export type RoyalButtonOptions = {
  label: string;
  detail?: string;
  accent?: number;
  onClick: () => void;
};

export function addRoyalBackdrop(scene: Phaser.Scene): Phaser.GameObjects.Container {
  const { width, height } = scene.scale;
  const container = scene.add.container(0, 0).setDepth(-20);
  const background = scene.add.graphics();

  background.fillGradientStyle(0x061020, 0x061020, 0x102c4d, 0x102c4d, 1);
  background.fillRect(0, 0, width, height);

  background.fillStyle(0x1b4c78, 0.16);
  background.fillCircle(width * 0.12, height * 0.12, width * 0.72);
  background.fillStyle(0x2a1652, 0.12);
  background.fillCircle(width * 0.92, height * 0.43, width * 0.64);

  background.lineStyle(1, GOLD, 0.055);
  for (let y = 34; y < height; y += 52) background.lineBetween(0, y, width, y - 18);

  for (let i = 0; i < 44; i += 1) {
    const x = (i * 83 + 29) % width;
    const y = (i * 137 + 41) % Math.round(height * 0.78);
    const size = i % 7 === 0 ? 1.7 : i % 3 === 0 ? 1.1 : 0.7;
    const alpha = i % 5 === 0 ? 0.7 : 0.35;
    background.fillStyle(i % 6 === 0 ? GOLD_LIGHT : 0xd8eaff, alpha);
    background.fillCircle(x, y, size);
    if (i % 11 === 0) {
      background.lineStyle(1, GOLD_LIGHT, 0.22);
      background.lineBetween(x - 4, y, x + 4, y);
      background.lineBetween(x, y - 4, x, y + 4);
    }
  }

  background.fillGradientStyle(INK, INK, NAVY, NAVY, 0.08, 0.08, 0.88, 0.88);
  background.fillRect(0, height * 0.72, width, height * 0.28);
  container.add(background);

  const motes = [
    { x: width * 0.18, y: height * 0.18, delay: 0 },
    { x: width * 0.76, y: height * 0.27, delay: 420 },
    { x: width * 0.34, y: height * 0.63, delay: 760 },
  ];
  for (const mote of motes) {
    const star = scene.add.circle(mote.x, mote.y, 2, GOLD_LIGHT, 0.72);
    container.add(star);
    scene.tweens.add({
      targets: star,
      alpha: { from: 0.18, to: 0.88 },
      scale: { from: 0.7, to: 1.45 },
      duration: 1450,
      delay: mote.delay,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
    });
  }

  return container;
}

export function drawPanel(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  options: { accent?: number; alpha?: number; radius?: number } = {},
): void {
  const accent = options.accent ?? GOLD;
  const alpha = options.alpha ?? 0.96;
  const radius = options.radius ?? 8;

  graphics.fillStyle(INK, 0.48);
  graphics.fillRoundedRect(x + 2, y + 4, width, height, radius);
  graphics.fillStyle(NAVY_MID, alpha);
  graphics.fillRoundedRect(x, y, width, height, radius);
  graphics.lineStyle(1, accent, 0.4);
  graphics.strokeRoundedRect(x + 0.5, y + 0.5, width - 1, height - 1, radius);
  graphics.lineStyle(1, 0xffffff, 0.07);
  graphics.lineBetween(x + radius, y + 3, x + width - radius, y + 3);
  graphics.fillStyle(accent, 0.85);
  graphics.fillTriangle(x + 8, y + 1, x + 15, y + 1, x + 8, y + 8);
  graphics.fillTriangle(x + width - 8, y + height - 1, x + width - 15, y + height - 1, x + width - 8, y + height - 8);
}

export function drawOrnament(graphics: Phaser.GameObjects.Graphics, centerX: number, y: number, width = 180): void {
  graphics.lineStyle(1, GOLD, 0.5);
  graphics.lineBetween(centerX - width / 2, y, centerX - 12, y);
  graphics.lineBetween(centerX + 12, y, centerX + width / 2, y);
  graphics.fillStyle(GOLD, 0.9);
  graphics.fillTriangle(centerX, y - 7, centerX + 7, y, centerX, y + 7);
  graphics.fillTriangle(centerX, y - 7, centerX - 7, y, centerX, y + 7);
  graphics.fillStyle(GOLD_LIGHT, 0.8);
  graphics.fillCircle(centerX, y, 2);
}

export function addWingSigil(scene: Phaser.Scene, x: number, y: number, scale = 1): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.fillStyle(GOLD, 0.92);
  g.fillTriangle(x, y - 8 * scale, x + 7 * scale, y, x, y + 10 * scale);
  g.fillTriangle(x, y - 8 * scale, x - 7 * scale, y, x, y + 10 * scale);
  g.lineStyle(Math.max(1, 2 * scale), GOLD_LIGHT, 0.72);
  for (let i = 0; i < 3; i += 1) {
    const offset = i * 5 * scale;
    g.lineBetween(x - 8 * scale, y - 2 * scale + offset, x - (18 + offset) * scale, y - (9 - i * 2) * scale);
    g.lineBetween(x + 8 * scale, y - 2 * scale + offset, x + (18 + offset) * scale, y - (9 - i * 2) * scale);
  }
  return g;
}

export function createRoyalButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  options: RoyalButtonOptions,
): Phaser.GameObjects.Container {
  const accent = options.accent ?? GOLD;
  const graphics = scene.add.graphics();
  const hit = scene.add.rectangle(0, 0, width, height, 0x000000, 0).setInteractive({ useHandCursor: true });

  const paint = (hovered: boolean, pressed = false): void => {
    graphics.clear();
    graphics.fillStyle(INK, 0.65);
    graphics.fillRoundedRect(-width / 2 + 3, -height / 2 + 5, width, height, 11);
    graphics.fillGradientStyle(
      hovered ? accent : NAVY_LIGHT,
      hovered ? accent : NAVY_LIGHT,
      hovered ? GOLD_DARK : NAVY_MID,
      hovered ? GOLD_DARK : NAVY_MID,
      1,
    );
    graphics.fillRoundedRect(-width / 2, -height / 2 + (pressed ? 2 : 0), width, height - (pressed ? 2 : 0), 11);
    graphics.lineStyle(hovered ? 2 : 1, hovered ? GOLD_LIGHT : accent, hovered ? 0.95 : 0.65);
    graphics.strokeRoundedRect(-width / 2 + 0.5, -height / 2 + 0.5 + (pressed ? 2 : 0), width - 1, height - 1 - (pressed ? 2 : 0), 11);
    graphics.lineStyle(1, 0xffffff, hovered ? 0.32 : 0.14);
    graphics.lineBetween(-width / 2 + 14, -height / 2 + 4 + (pressed ? 2 : 0), width / 2 - 14, -height / 2 + 4 + (pressed ? 2 : 0));
  };
  paint(false);

  const label = scene.add
    .text(0, options.detail ? -9 : 0, options.label, {
      fontFamily: BODY_FONT,
      fontSize: options.detail ? "21px" : "17px",
      fontStyle: "bold",
      color: "#fff8df",
      stroke: "#040914",
      strokeThickness: 2,
    })
    .setOrigin(0.5);
  const detail = options.detail
    ? scene.add
        .text(0, 19, options.detail, {
          fontFamily: BODY_FONT,
          fontSize: "10px",
          color: "#d8e7fa",
        })
        .setOrigin(0.5)
    : null;

  const children: Phaser.GameObjects.GameObject[] = [graphics, hit, label];
  if (detail) children.push(detail);
  const container = scene.add.container(x, y, children);
  hit.on("pointerover", () => paint(true));
  hit.on("pointerout", () => paint(false));
  hit.on("pointerdown", () => paint(true, true));
  hit.on("pointerup", () => {
    paint(true);
    options.onClick();
  });
  hit.on("pointerupoutside", () => paint(false));
  return container;
}
