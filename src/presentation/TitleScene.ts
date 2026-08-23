import Phaser from "phaser";
import { ptBR } from "./i18n/ptBR";
import { BODY_FONT, DISPLAY_FONT, GOLD, GOLD_LIGHT, INK, NAVY } from "./theme";
import { addRoyalBackdrop, addWingSigil, drawOrnament } from "./visuals";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("title");
  }

  preload(): void {
    this.load.image("logo", "/assets/logo_wings_studios.png");
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(NAVY);
    addRoyalBackdrop(this);

    const ornament = this.add.graphics();
    drawOrnament(ornament, width / 2, 120, 210);

    this.add
      .text(width / 2, 91, ptBR.eyebrow, {
        fontFamily: BODY_FONT,
        fontSize: "10px",
        color: "#f0c75e",
        letterSpacing: 3,
      })
      .setOrigin(0.5);

    const crestGlow = this.add.circle(width / 2, 304, 133, 0x1d4f7a, 0.2);
    this.tweens.add({
      targets: crestGlow,
      alpha: { from: 0.12, to: 0.3 },
      scale: { from: 0.94, to: 1.05 },
      duration: 2400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
    });

    const logo = this.add.image(width / 2, 304, "logo").setDisplaySize(270, 270);
    this.tweens.add({
      targets: logo,
      y: 299,
      duration: 2500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
    });

    addWingSigil(this, width / 2, 491, 0.9);

    this.add
      .text(width / 2, 543, ptBR.title, {
        fontFamily: DISPLAY_FONT,
        fontSize: "38px",
        fontStyle: "bold",
        color: "#fff8df",
        stroke: "#040914",
        strokeThickness: 5,
        letterSpacing: 2,
        shadow: { offsetX: 0, offsetY: 4, color: "#02050c", blur: 0, fill: true },
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 592, ptBR.tagline, {
        fontFamily: BODY_FONT,
        fontSize: "9px",
        color: "#aec8e8",
        letterSpacing: 1,
      })
      .setOrigin(0.5);

    const ctaBg = this.add.graphics();
    ctaBg.fillStyle(INK, 0.52);
    ctaBg.fillRoundedRect(width / 2 - 120, 679, 240, 58, 29);
    ctaBg.lineStyle(1, GOLD, 0.78);
    ctaBg.strokeRoundedRect(width / 2 - 119.5, 679.5, 239, 57, 29);
    ctaBg.fillStyle(GOLD_LIGHT, 0.86);
    ctaBg.fillTriangle(width / 2 + 91, 699, width / 2 + 101, 708, width / 2 + 91, 717);
    const cta = this.add
      .text(width / 2 - 4, 708, ptBR.tapToStart.toUpperCase(), {
        fontFamily: BODY_FONT,
        fontSize: "13px",
        fontStyle: "bold",
        color: "#ffedac",
        letterSpacing: 1,
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: [cta, ctaBg],
      alpha: { from: 0.55, to: 1 },
      duration: 1050,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
    });

    this.add
      .text(width / 2, height - 44, ptBR.studio.toUpperCase(), {
        fontFamily: BODY_FONT,
        fontSize: "9px",
        color: "#6f8cac",
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    this.cameras.main.fadeIn(500, 4, 9, 20);

    const go = (): void => {
      this.cameras.main.fadeOut(220, 4, 9, 20);
      this.time.delayedCall(210, () => this.scene.start("menu"));
    };
    this.input.once("pointerdown", go);
    this.input.keyboard?.once("keydown", go);
  }
}
