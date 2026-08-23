import Phaser from "phaser";
import type { GameMode } from "../domain/types";
import { ptBR } from "./i18n/ptBR";
import { BODY_FONT, DISPLAY_FONT, GOLD, NAVY } from "./theme";
import { addRoyalBackdrop, addWingSigil, createRoyalButton, drawOrnament } from "./visuals";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("menu");
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(NAVY);
    addRoyalBackdrop(this);

    addWingSigil(this, width / 2, 66, 0.72);

    this.add
      .text(width / 2, 116, ptBR.title, {
        fontFamily: DISPLAY_FONT,
        fontSize: "34px",
        fontStyle: "bold",
        color: "#fff8df",
        stroke: "#040914",
        strokeThickness: 4,
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 164, ptBR.chooseMode, {
        fontFamily: BODY_FONT,
        fontSize: "12px",
        color: "#aec8e8",
      })
      .setOrigin(0.5);

    const rule = this.add.graphics();
    drawOrnament(rule, width / 2, 205, 250);

    this.modeButton(width / 2, 295, ptBR.calm, ptBR.calmDescription, "calm", 0x58b9d4);
    this.modeButton(width / 2, 425, ptBR.classic, ptBR.classicDescription, "classic", GOLD);

    this.add
      .text(width / 2, 527, "1  CALMA      ·      2  CLÁSSICO", {
        fontFamily: BODY_FONT,
        fontSize: "10px",
        color: "#7899bd",
        letterSpacing: 1,
      })
      .setOrigin(0.5);

    const hintPanel = this.add.graphics();
    hintPanel.fillStyle(0x07101f, 0.7);
    hintPanel.fillRoundedRect(20, 587, width - 40, 150, 12);
    hintPanel.lineStyle(1, GOLD, 0.24);
    hintPanel.strokeRoundedRect(20.5, 587.5, width - 41, 149, 12);
    hintPanel.fillStyle(GOLD, 0.82);
    hintPanel.fillRect(width / 2 - 28, 587, 56, 2);

    this.add
      .text(width / 2, 615, "CONTROLES", {
        fontFamily: BODY_FONT,
        fontSize: "11px",
        fontStyle: "bold",
        color: "#ffedac",
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 674, ptBR.hints, {
        fontFamily: BODY_FONT,
        fontSize: "10px",
        color: "#dce9f8",
        align: "center",
        lineSpacing: 7,
        wordWrap: { width: width - 68 },
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height - 43, ptBR.studio.toUpperCase(), {
        fontFamily: BODY_FONT,
        fontSize: "9px",
        color: "#6f8cac",
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    this.cameras.main.fadeIn(320, 4, 9, 20);

    this.input.keyboard?.once("keydown-ONE", () => this.scene.start("play", { mode: "calm" as GameMode }));
    this.input.keyboard?.once("keydown-TWO", () => this.scene.start("play", { mode: "classic" as GameMode }));
    this.input.keyboard?.once("keydown-ENTER", () => this.scene.start("play", { mode: "calm" as GameMode }));
  }

  private modeButton(x: number, y: number, label: string, detail: string, mode: GameMode, accent: number): void {
    createRoyalButton(this, x, y, 310, 92, {
      label: label.toUpperCase(),
      detail,
      accent,
      onClick: () => {
        this.cameras.main.fadeOut(180, 4, 9, 20);
        this.time.delayedCall(170, () => this.scene.start("play", { mode }));
      },
    });
  }
}
