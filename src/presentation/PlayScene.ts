import Phaser from "phaser";
import type { BoardViewState } from "../application/BoardViewState";
import { PlayGame } from "../application/PlayGame";
import { cellsFor } from "../domain/pieces";
import { POWERUP_IDS } from "../domain/powerups";
import { mathRng } from "../domain/rng";
import type { GameMode, PieceId, PowerupId } from "../domain/types";
import { BOARD_WIDTH, VISIBLE_HEIGHT } from "../domain/types";
import { LocalStorageScoreRepository } from "../infrastructure/LocalStorageScoreRepository";
import { MutePreference } from "../infrastructure/MutePreference";
import { SfxPlayer } from "../infrastructure/SfxPlayer";
import { drawBevelCell } from "./blocks";
import { ptBR } from "./i18n/ptBR";
import { commandFromKey, type InputCommand } from "./input/commands";
import { HeldKeyRepeater } from "./input/HeldKeyRepeater";
import { isHudClusterHit } from "./input/hudHit";
import { PauseGate } from "./input/PauseGate";
import { commandFromPointer } from "./input/touch";
import {
  BODY_FONT,
  DANGER,
  DISPLAY_FONT,
  GOLD,
  GOLD_DARK,
  GOLD_LIGHT,
  INK,
  LAYOUT,
  MIST,
  NAVY,
  NAVY_LIGHT,
  NAVY_MID,
  PIECE_COLORS,
  WELL,
  WELL_GRID,
} from "./theme";
import { addRoyalBackdrop, addWingSigil, createRoyalButton, drawOrnament, drawPanel } from "./visuals";

type PlayData = { mode: GameMode };

const POWER_SYMBOLS: Record<PowerupId, string> = {
  timeWing: "◷",
  skyShield: "◆",
  halo: "○",
  gust: "✦",
  plumeSwap: "⇄",
  royalStrike: "╋",
};

type HudTexts = {
  brand: Phaser.GameObjects.Text;
  score: Phaser.GameObjects.Text;
  best: Phaser.GameObjects.Text;
  level: Phaser.GameObjects.Text;
  lines: Phaser.GameObjects.Text;
  mode: Phaser.GameObjects.Text;
  power: Phaser.GameObjects.Text;
};

export class PlayScene extends Phaser.Scene {
  private play!: PlayGame;
  private gate = new PauseGate();
  private chromeGraphics!: Phaser.GameObjects.Graphics;
  private graphics!: Phaser.GameObjects.Graphics;
  private hud!: HudTexts;
  private overlay?: Phaser.GameObjects.Container;
  private overlayKind: "none" | "pause" | "over" | "help" = "none";
  private mode: GameMode = "calm";
  private repeaters = new Map<string, HeldKeyRepeater>();
  private pointerStart: { x: number; y: number } | null = null;
  private ready = false;
  private sfx = new SfxPlayer(() => {
    try {
      return new AudioContext();
    } catch {
      return null;
    }
  });
  private mutePref = new MutePreference(globalThis.localStorage);
  private muteLabel?: Phaser.GameObjects.Text;
  private scores = new LocalStorageScoreRepository(globalThis.localStorage);
  private bestFlushed = false;
  private bestFlushPending = false;
  private hint?: Phaser.GameObjects.Text;
  private hintMs = 8000;
  private previousLines = 0;
  private previousPowerActivationCount = 0;
  private previousRelicSpawnCount = 0;
  private helpOpen = false;
  private helpPausedGame = false;
  private hasShownHelp = false;
  private helpDomButton?: HTMLButtonElement;
  private helpDomPositioner?: () => void;

  constructor() {
    super("play");
  }

  init(data: PlayData): void {
    this.mode = data.mode ?? "calm";
  }

  create(): void {
    this.overlay?.destroy();
    this.overlay = undefined;
    this.overlayKind = "none";
    this.repeaters.clear();
    this.ready = false;
    this.bestFlushed = false;
    this.bestFlushPending = false;
    this.hintMs = 8000;
    this.previousLines = 0;
    this.previousPowerActivationCount = 0;
    this.previousRelicSpawnCount = 0;
    this.helpOpen = false;
    this.helpPausedGame = false;
    this.cameras.main.setBackgroundColor(NAVY);
    addRoyalBackdrop(this);

    this.sfx.muted = this.mutePref.get();
    this.play = new PlayGame(mathRng, this.scores);
    this.gate = new PauseGate();
    this.chromeGraphics = this.add.graphics();
    this.drawChrome();
    this.graphics = this.add.graphics();
    this.hud = this.createHudTexts();

    this.makeHudButton(LAYOUT.btnXs[0], LAYOUT.btnYs[0], ptBR.pause, () =>
      this.applyCommand({ type: "togglePause" }),
    );
    this.makeHudButton(LAYOUT.btnXs[1], LAYOUT.btnYs[0], ptBR.hold, () => this.applyCommand({ type: "hold" }));
    this.muteLabel = this.makeHudButton(LAYOUT.btnXs[0], LAYOUT.btnYs[1], this.muteCaption(), () => this.toggleMute());
    this.makeHudButton(LAYOUT.btnXs[1], LAYOUT.btnYs[1], ptBR.help, () => this.openHelp());

    this.hint = this.add
      .text(this.scale.width / 2, 797, ptBR.hints, {
        fontFamily: BODY_FONT,
        fontSize: "9px",
        color: "#f0c75e",
        align: "center",
        lineSpacing: 5,
        wordWrap: { width: this.scale.width - 32 },
      })
      .setOrigin(0.5);

    this.bindInput();
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.removeAllListeners();
      this.input.off("pointerdown");
      this.input.off("pointerup");
      this.removeHelpDomButton();
    });

    void this.play.startGame({ mode: this.mode }).then((view) => {
      this.previousLines = view.lines;
      this.ready = true;
      this.sfx.observe(view);
      this.redraw();
      if (!this.hasShownHelp) this.openHelp();
      this.cameras.main.fadeIn(260, 4, 9, 20);
    });
  }

  update(_time: number, dt: number): void {
    if (!this.ready) return;
    for (const rep of this.repeaters.values()) rep.tick(dt);
    if (this.gate.shouldTick()) {
      const view = this.play.tick(dt);
      this.gate.setGameOver(view.gameOver);
      this.sfx.observe(view);
      this.drawWell(view);
      this.drawHud(view);
      this.observeVisualEvents(view);
      this.syncOverlay(view);
      this.refreshBest();
      this.tickHint(dt);
    } else if (this.play.view().gameOver) {
      this.refreshBest();
    }
  }

  private bindInput(): void {
    this.input.keyboard?.addCapture([
      Phaser.Input.Keyboard.KeyCodes.LEFT,
      Phaser.Input.Keyboard.KeyCodes.RIGHT,
      Phaser.Input.Keyboard.KeyCodes.UP,
      Phaser.Input.Keyboard.KeyCodes.DOWN,
      Phaser.Input.Keyboard.KeyCodes.SPACE,
    ]);

    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      const cmd = commandFromKey(event.code, event.key);
      if (!cmd) return;
      event.preventDefault();
      if (cmd.type === "move" || cmd.type === "softDrop") {
        if (this.repeaters.has(event.code)) return;
        const arr = this.mode === "calm" && cmd.type === "move" ? 80 : 50;
        const repeater = new HeldKeyRepeater(170, arr, () => this.applyCommand(cmd));
        this.repeaters.set(event.code, repeater);
        repeater.press();
        return;
      }
      this.applyCommand(cmd);
    });
    this.input.keyboard?.on("keyup", (event: KeyboardEvent) => {
      this.repeaters.get(event.code)?.release();
      this.repeaters.delete(event.code);
    });

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.helpOpen) {
        if (this.isHelpDismissHit(pointer.x, pointer.y)) this.closeHelp();
        return;
      }
      if (this.isOnHudButton(pointer.x, pointer.y)) return;
      this.pointerStart = { x: pointer.x, y: pointer.y };
    });
    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (!this.pointerStart || this.isOnHudButton(this.pointerStart.x, this.pointerStart.y)) {
        this.pointerStart = null;
        return;
      }
      const field = {
        left: 0,
        top: LAYOUT.boardY,
        width: this.scale.width,
        height: LAYOUT.cell * VISIBLE_HEIGHT,
      };
      const cmd = commandFromPointer(field, {
        startX: this.pointerStart.x,
        startY: this.pointerStart.y,
        endX: pointer.x,
        endY: pointer.y,
      });
      this.pointerStart = null;
      if (cmd) this.applyCommand(cmd);
    });
  }

  private createHudTexts(): HudTexts {
    const labelStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: BODY_FONT,
      fontSize: "9px",
      color: "#7999bc",
      letterSpacing: 1,
    };
    const valueStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: BODY_FONT,
      fontSize: "18px",
      fontStyle: "bold",
      color: "#fff8df",
    };

    const brand = this.add.text(12, 12, ptBR.title, {
      fontFamily: DISPLAY_FONT,
      fontSize: "15px",
      fontStyle: "bold",
      color: "#ffedac",
      stroke: "#040914",
      strokeThickness: 3,
      letterSpacing: 1,
    });

    this.add.text(22, 50, ptBR.score.toUpperCase(), labelStyle);
    this.add.text(166, 50, ptBR.best.toUpperCase(), labelStyle);
    this.add.text(20, 113, ptBR.level.toUpperCase(), labelStyle);
    this.add.text(112, 113, ptBR.lines.toUpperCase(), labelStyle);
    this.add.text(204, 113, "RITMO", labelStyle);

    const score = this.add.text(22, 65, "0", valueStyle);
    const best = this.add.text(166, 65, "0", valueStyle);
    const level = this.add.text(20, 130, "1", { ...valueStyle, fontSize: "16px" });
    const lines = this.add.text(112, 130, "0", { ...valueStyle, fontSize: "16px" });
    const mode = this.add.text(204, 132, "", {
      ...valueStyle,
      fontSize: "11px",
      color: "#f0c75e",
    });

    this.add.text(274, 181, ptBR.holdSlot, labelStyle);
    this.add.text(274, 277, ptBR.nextQueue, labelStyle);
    this.add.text(274, 522, ptBR.powerSlot, labelStyle);
    const power = this.add
      .text(323, 575, ptBR.noPower, {
        fontFamily: BODY_FONT,
        fontSize: "10px",
        color: "#8faac8",
        align: "center",
        wordWrap: { width: 102 },
      })
      .setOrigin(0.5);

    const gestureStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: BODY_FONT,
      fontSize: "8px",
      fontStyle: "bold",
      color: "#dbe9f8",
      align: "center",
      lineSpacing: 3,
    };
    this.add.text(85, 718, "TOQUE\nMOVER", gestureStyle).setOrigin(0.5);
    this.add.text(195, 718, "TOQUE\nGIRAR", gestureStyle).setOrigin(0.5);
    this.add.text(307, 718, "DESLIZE\nCAIR", gestureStyle).setOrigin(0.5);

    return { brand, score, best, level, lines, mode, power };
  }

  private applyCommand(cmd: InputCommand): void {
    if (cmd.type === "togglePause") {
      if (this.helpOpen) {
        this.closeHelp();
        return;
      }
      this.gate.toggle();
      this.sfx.muted = this.mutePref.get() || this.gate.isPaused;
      this.redraw();
      return;
    }
    if (!this.gate.shouldAcceptPlayInput()) return;
    if (cmd.type === "move") this.play.move(cmd.dx);
    if (cmd.type === "rotate") this.play.rotate(cmd.dir);
    if (cmd.type === "softDrop") this.play.softDrop();
    if (cmd.type === "hardDrop") this.play.hardDrop();
    if (cmd.type === "hold") this.play.hold();
    this.sfx.observe(this.play.view());
    this.redraw();
    this.refreshBest();
  }

  private redraw(): void {
    const view = this.play.view();
    this.gate.setGameOver(view.gameOver);
    this.drawWell(view);
    this.drawHud(view);
    this.observeVisualEvents(view);
    this.syncOverlay(view);
  }

  private syncOverlay(view: BoardViewState): void {
    const kind = view.gameOver ? "over" : this.helpOpen ? "help" : this.gate.isPaused ? "pause" : "none";
    if (kind === this.overlayKind) return;
    this.overlayKind = kind;
    this.overlay?.destroy();
    this.overlay = undefined;
    if (kind === "none") return;
    if (kind === "help") {
      this.buildHelpOverlay();
      return;
    }
    this.buildOverlay(view);
  }

  private buildOverlay(view: BoardViewState): void {
    const { width, height } = this.scale;
    const gameOver = view.gameOver;
    this.overlay = this.add.container(0, 0).setDepth(50);
    const dim = this.add.rectangle(width / 2, height / 2, width, height, 0x02050c, 0.82).setInteractive();
    const panel = this.add.graphics();
    drawPanel(panel, 38, gameOver ? 198 : 238, width - 76, gameOver ? 472 : 362, { accent: GOLD, radius: 16 });
    drawOrnament(panel, width / 2, gameOver ? 290 : 330, 214);
    const sigil = addWingSigil(this, width / 2, gameOver ? 250 : 290, 0.76);
    const title = this.add
      .text(width / 2, gameOver ? 332 : 372, (gameOver ? ptBR.gameOver : ptBR.pause).toUpperCase(), {
        fontFamily: DISPLAY_FONT,
        fontSize: "29px",
        fontStyle: "bold",
        color: "#fff8df",
        stroke: "#040914",
        strokeThickness: 4,
        letterSpacing: 2,
      })
      .setOrigin(0.5);
    this.overlay.add([dim, panel, sigil, title]);

    if (gameOver) {
      const score = this.add
        .text(width / 2, 388, `${ptBR.score.toUpperCase()}  ${view.score.toLocaleString("pt-BR")}`, {
          fontFamily: BODY_FONT,
          fontSize: "16px",
          fontStyle: "bold",
          color: "#ffedac",
        })
        .setOrigin(0.5);
      const best = this.add
        .text(width / 2, 423, `${ptBR.best.toUpperCase()}  ${view.bestScore.toLocaleString("pt-BR")}`, {
          fontFamily: BODY_FONT,
          fontSize: "12px",
          color: "#aec8e8",
        })
        .setOrigin(0.5);
      this.overlay.add([score, best]);
      this.overlay.add(
        this.textButton(width / 2, 510, ptBR.playAgain, () => this.scene.restart({ mode: this.mode })),
      );
      this.overlay.add(this.textButton(width / 2, 602, ptBR.backMenu, () => this.scene.start("menu")));
    } else {
      this.overlay.add(
        this.textButton(width / 2, 460, ptBR.resume, () => {
          this.gate.toggle();
          this.sfx.muted = this.mutePref.get() || this.gate.isPaused;
          this.redraw();
        }),
      );
      this.overlay.add(this.textButton(width / 2, 552, ptBR.backMenu, () => this.scene.start("menu")));
    }
  }

  private buildHelpOverlay(): void {
    const { width, height } = this.scale;
    this.overlay = this.add.container(0, 0).setDepth(60);
    const dim = this.add.rectangle(width / 2, height / 2, width, height, 0x02050c, 0.9).setInteractive();
    const panel = this.add.graphics();
    drawPanel(panel, 14, 24, width - 28, height - 48, { accent: GOLD, radius: 16 });
    drawOrnament(panel, width / 2, 92, 230);
    const sigil = addWingSigil(this, width / 2, 55, 0.58);
    const title = this.add
      .text(width / 2, 118, ptBR.helpTitle, {
        fontFamily: DISPLAY_FONT,
        fontSize: "22px",
        fontStyle: "bold",
        color: "#fff8df",
        stroke: "#040914",
        strokeThickness: 4,
        letterSpacing: 1,
      })
      .setOrigin(0.5);
    const intro = this.add
      .text(width / 2, 151, ptBR.relicHelp, {
        fontFamily: BODY_FONT,
        fontSize: "9px",
        color: "#ffedac",
        align: "center",
        lineSpacing: 3,
        wordWrap: { width: width - 64 },
      })
      .setOrigin(0.5);
    this.overlay.add([dim, panel, sigil, title, intro]);

    POWERUP_IDS.forEach((id, index) => {
      const y = 209 + index * 75;
      const icon = this.add.circle(46, y, 19, index % 2 === 0 ? 0x173b67 : 0x493719, 1);
      icon.setStrokeStyle(1, GOLD, 0.72);
      const symbol = this.add
        .text(46, y, POWER_SYMBOLS[id], {
          fontFamily: BODY_FONT,
          fontSize: "17px",
          fontStyle: "bold",
          color: "#ffedac",
        })
        .setOrigin(0.5);
      const name = this.add.text(76, y - 15, ptBR.powerups[id].toUpperCase(), {
        fontFamily: BODY_FONT,
        fontSize: "10px",
        fontStyle: "bold",
        color: "#fff8df",
      });
      const description = this.add.text(76, y + 2, ptBR.powerupDescriptions[id], {
        fontFamily: BODY_FONT,
        fontSize: "8px",
        color: "#aec8e8",
        lineSpacing: 2,
        wordWrap: { width: 275 },
      });
      this.overlay?.add([icon, symbol, name, description]);
    });

    this.overlay.add(
      createRoyalButton(this, width / 2, 759, 238, 52, {
        label: ptBR.understood.toUpperCase(),
        accent: GOLD,
        onClick: () => this.closeHelp(),
      }),
    );
    this.installHelpDomButton();
  }

  private openHelp(): void {
    if (!this.ready || this.helpOpen || this.play.view().gameOver) return;
    this.helpOpen = true;
    this.hasShownHelp = true;
    this.helpPausedGame = !this.gate.isPaused;
    if (this.helpPausedGame) this.gate.toggle();
    this.sfx.muted = true;
    this.overlayKind = "none";
    this.syncOverlay(this.play.view());
  }

  private closeHelp(): void {
    if (!this.helpOpen) return;
    this.removeHelpDomButton();
    this.helpOpen = false;
    if (this.helpPausedGame && this.gate.isPaused) this.gate.toggle();
    this.helpPausedGame = false;
    this.sfx.muted = this.mutePref.get() || this.gate.isPaused;
    this.overlay?.destroy();
    this.overlay = undefined;
    this.overlayKind = "none";
    this.redraw();
  }

  private drawWell(view: BoardViewState): void {
    const { cell, boardX, boardY } = LAYOUT;
    const pulse = (Math.sin(this.time.now / 180) + 1) / 2;
    this.graphics.clear();

    if (view.powerup) {
      this.graphics.lineStyle(2, GOLD, 0.48 + pulse * 0.32);
      this.graphics.strokeRoundedRect(267, 515, 114, 110, 8);
    }

    const paint = (x: number, y: number, color: number, ghost?: boolean, relic?: boolean): void => {
      if (y < 0 || y >= VISIBLE_HEIGHT) return;
      drawBevelCell(this.graphics, boardX + x * cell, boardY + y * cell, cell, color, {
        ghost,
        relic,
        pulse,
      });
    };

    for (const cellView of view.ghost) paint(cellView.x, cellView.y, PIECE_COLORS[cellView.pieceId], true);
    for (const cellView of view.locked) {
      paint(cellView.x, cellView.y, PIECE_COLORS[cellView.pieceId], false, cellView.relic);
    }
    for (const cellView of view.active) {
      paint(cellView.x, cellView.y, PIECE_COLORS[cellView.pieceId], false, cellView.relic);
    }

    this.drawMini(view.hold, 324, 232, 12);
    view.next.forEach((id, index) => this.drawMini(id, 324, 328 + index * 68, 11));

    if (!view.hold) {
      this.graphics.lineStyle(1, MIST, 0.25);
      this.graphics.lineBetween(307, 233, 341, 233);
    }
  }

  private drawChrome(): void {
    const { cell, boardX, boardY } = LAYOUT;
    const wellW = BOARD_WIDTH * cell;
    const wellH = VISIBLE_HEIGHT * cell;
    const graphics = this.chromeGraphics;

    drawPanel(graphics, 12, 43, 138, 52, { accent: 0x4e8bc4 });
    drawPanel(graphics, 156, 43, 138, 52, { accent: GOLD });
    drawPanel(graphics, 12, 106, 86, 52, { accent: 0x4e8bc4 });
    drawPanel(graphics, 104, 106, 86, 52, { accent: 0x4e8bc4 });
    drawPanel(graphics, 196, 106, 98, 52, { accent: this.mode === "calm" ? 0x58b9d4 : GOLD });

    graphics.fillStyle(INK, 0.72);
    graphics.fillRoundedRect(boardX - 6, boardY - 7, wellW + 12, wellH + 14, 7);
    graphics.lineStyle(2, GOLD_DARK, 0.74);
    graphics.strokeRoundedRect(boardX - 5, boardY - 6, wellW + 10, wellH + 12, 7);
    graphics.lineStyle(1, GOLD_LIGHT, 0.22);
    graphics.strokeRoundedRect(boardX - 2, boardY - 3, wellW + 4, wellH + 6, 4);
    graphics.fillGradientStyle(0x0d2949, 0x0d2949, WELL, WELL, 0.98);
    graphics.fillRect(boardX, boardY, wellW, wellH);
    for (let row = 0; row < VISIBLE_HEIGHT; row += 2) {
      graphics.fillStyle(0xffffff, 0.012);
      graphics.fillRect(boardX, boardY + row * cell, wellW, cell);
    }
    graphics.fillStyle(DANGER, 0.035);
    graphics.fillRect(boardX, boardY, wellW, cell * 4);
    graphics.lineStyle(1, DANGER, 0.2);
    graphics.lineBetween(boardX, boardY + cell * 4, boardX + wellW, boardY + cell * 4);
    graphics.lineStyle(1, WELL_GRID, 0.3);
    for (let gx = 1; gx < BOARD_WIDTH; gx += 1) {
      graphics.lineBetween(boardX + gx * cell, boardY, boardX + gx * cell, boardY + wellH);
    }
    for (let gy = 1; gy < VISIBLE_HEIGHT; gy += 1) {
      graphics.lineBetween(boardX, boardY + gy * cell, boardX + wellW, boardY + gy * cell);
    }
    this.drawFrameCorners(graphics, boardX - 6, boardY - 7, wellW + 12, wellH + 14);

    drawPanel(graphics, 266, 198, 116, 70, { accent: 0x568ab9 });
    drawPanel(graphics, 266, 298, 116, 60, { accent: 0x568ab9 });
    drawPanel(graphics, 266, 366, 116, 60, { accent: 0x568ab9 });
    drawPanel(graphics, 266, 434, 116, 60, { accent: 0x568ab9 });
    drawPanel(graphics, 266, 514, 116, 112, { accent: 0x568ab9 });
    drawPanel(graphics, 12, 680, 366, 78, { accent: 0x568ab9, alpha: 0.88, radius: 12 });
    graphics.lineStyle(1, 0x76a8d2, 0.22);
    graphics.lineBetween(134, 690, 134, 748);
    graphics.lineBetween(256, 690, 256, 748);
    graphics.fillStyle(GOLD, 0.65);
    graphics.fillTriangle(49, 716, 58, 707, 58, 725);
    graphics.fillTriangle(341, 716, 332, 707, 332, 725);
    graphics.lineStyle(2, 0x8ebce2, 0.5);
    graphics.strokeCircle(195, 716, 9);
    graphics.lineBetween(195, 702, 195, 708);
  }

  private drawFrameCorners(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    const size = 10;
    graphics.fillStyle(GOLD, 0.92);
    graphics.fillTriangle(x, y, x + size, y, x, y + size);
    graphics.fillTriangle(x + width, y, x + width - size, y, x + width, y + size);
    graphics.fillTriangle(x, y + height, x + size, y + height, x, y + height - size);
    graphics.fillTriangle(x + width, y + height, x + width - size, y + height, x + width, y + height - size);
  }

  private drawMini(id: PieceId | null, centerX: number, centerY: number, size: number): void {
    if (!id) return;
    const cells = cellsFor(id);
    const minX = Math.min(...cells.map((cell) => cell.x));
    const maxX = Math.max(...cells.map((cell) => cell.x));
    const minY = Math.min(...cells.map((cell) => cell.y));
    const maxY = Math.max(...cells.map((cell) => cell.y));
    const width = (maxX - minX + 1) * size;
    const height = (maxY - minY + 1) * size;
    const originX = centerX - width / 2 - minX * size;
    const originY = centerY - height / 2 - minY * size;
    for (const cell of cells) {
      drawBevelCell(this.graphics, originX + cell.x * size, originY + cell.y * size, size, PIECE_COLORS[id]);
    }
  }

  private drawHud(view: BoardViewState): void {
    this.hud.score.setText(view.score.toLocaleString("pt-BR"));
    this.hud.best.setText(view.bestScore.toLocaleString("pt-BR"));
    this.hud.level.setText(String(view.level));
    this.hud.lines.setText(String(view.lines));
    this.hud.mode.setText((view.mode === "calm" ? ptBR.calm : ptBR.classic).toUpperCase());

    if (view.powerup === null) {
      this.hud.power.setText(ptBR.noPower).setColor("#8faac8");
    } else {
      const timer = view.powerupMs > 0 ? `\n${Math.ceil(view.powerupMs / 1000)}s` : "";
      this.hud.power.setText(`${ptBR.powerups[view.powerup]}${timer}`).setColor("#ffedac");
    }
  }

  private observeVisualEvents(view: BoardViewState): void {
    if (view.lines > this.previousLines) this.showLineClear(view.lastCleared);
    if (view.relicSpawnCount > this.previousRelicSpawnCount) this.showRelicArrival();
    if (view.powerActivationCount > this.previousPowerActivationCount && view.lastActivatedPowerup) {
      this.showPowerArrival(view.lastActivatedPowerup);
    }
    this.previousLines = view.lines;
    this.previousRelicSpawnCount = view.relicSpawnCount;
    this.previousPowerActivationCount = view.powerActivationCount;
  }

  private showRelicArrival(): void {
    const centerX = LAYOUT.boardX + (BOARD_WIDTH * LAYOUT.cell) / 2;
    const glow = this.add.circle(centerX, LAYOUT.boardY + 58, 52, GOLD, 0.2).setDepth(11);
    const text = this.add
      .text(centerX, LAYOUT.boardY + 58, "RELÍQUIA DOURADA", {
        fontFamily: DISPLAY_FONT,
        fontSize: "14px",
        fontStyle: "bold",
        color: "#ffffcf",
        stroke: "#6b3f05",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(12);
    this.tweens.add({ targets: glow, alpha: 0, scale: 1.65, duration: 1000, ease: "Cubic.Out" });
    this.tweens.add({ targets: text, alpha: 0, y: "-=22", duration: 1200, ease: "Cubic.Out" });
    this.time.delayedCall(1250, () => {
      glow.destroy();
      text.destroy();
    });
  }

  private showLineClear(cleared: number): void {
    const wellWidth = BOARD_WIDTH * LAYOUT.cell;
    const centerX = LAYOUT.boardX + wellWidth / 2;
    const centerY = LAYOUT.boardY + (VISIBLE_HEIGHT * LAYOUT.cell) / 2;
    const flash = this.add.rectangle(centerX, centerY, wellWidth, 56, GOLD, 0.3).setDepth(12);
    const label = cleared === 4 ? ptBR.asaQuadrupla.toUpperCase() : `+ ${cleared} ${cleared === 1 ? "LINHA" : "LINHAS"}`;
    const text = this.add
      .text(centerX, centerY, label, {
        fontFamily: DISPLAY_FONT,
        fontSize: cleared === 4 ? "19px" : "17px",
        fontStyle: "bold",
        color: "#fff8df",
        stroke: "#040914",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(13);

    this.tweens.add({ targets: [flash, text], alpha: 0, y: "-=26", duration: 850, ease: "Cubic.Out" });
    this.tweens.add({ targets: text, scale: { from: 0.82, to: 1.08 }, duration: 280, yoyo: true });
    this.time.delayedCall(900, () => {
      flash.destroy();
      text.destroy();
    });
  }

  private showPowerArrival(power: PowerupId): void {
    const centerX = LAYOUT.boardX + (BOARD_WIDTH * LAYOUT.cell) / 2;
    const centerY = LAYOUT.boardY + (VISIBLE_HEIGHT * LAYOUT.cell) / 2;
    const glow = this.add.circle(centerX, centerY, 68, GOLD, 0.28).setDepth(14);
    const eyebrow = this.add
      .text(centerX, centerY - 18, "PODER ATIVADO", {
        fontFamily: BODY_FONT,
        fontSize: "9px",
        fontStyle: "bold",
        color: "#ffedac",
        letterSpacing: 2,
      })
      .setOrigin(0.5)
      .setDepth(15);
    const title = this.add
      .text(centerX, centerY + 4, ptBR.powerups[power].toUpperCase(), {
        fontFamily: BODY_FONT,
        fontSize: "14px",
        fontStyle: "bold",
        color: "#fff8df",
        stroke: "#040914",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(15);
    this.tweens.add({ targets: glow, alpha: 0, scale: 1.75, duration: 1200, ease: "Cubic.Out" });
    this.tweens.add({ targets: [eyebrow, title], alpha: 0, y: "-=24", delay: 450, duration: 900, ease: "Cubic.Out" });
    this.time.delayedCall(1400, () => {
      glow.destroy();
      eyebrow.destroy();
      title.destroy();
    });
  }

  private refreshBest(): void {
    const current = this.play.view();
    if (!current.gameOver || this.bestFlushed || this.bestFlushPending) return;
    this.bestFlushPending = true;
    void this.play.persistIfOver().then(() => {
      const view = this.play.view();
      this.drawHud(view);
      if (view.gameOver && !this.bestFlushed) {
        this.bestFlushed = true;
        this.overlayKind = "none";
        this.syncOverlay(view);
      }
    }).finally(() => {
      this.bestFlushPending = false;
    });
  }

  private toggleMute(): void {
    this.mutePref.set(!this.mutePref.get());
    this.sfx.muted = this.mutePref.get() || this.gate.isPaused;
    this.muteLabel?.setText(this.muteCaption().toUpperCase());
  }

  private muteCaption(): string {
    return this.mutePref.get() ? ptBR.mute : ptBR.sound;
  }

  private textButton(x: number, y: number, label: string, onClick: () => void): Phaser.GameObjects.Container {
    return createRoyalButton(this, x, y, 252, 62, {
      label: label.toUpperCase(),
      accent: GOLD,
      onClick,
    });
  }

  private makeHudButton(x: number, y: number, label: string, onClick: () => void): Phaser.GameObjects.Text {
    const width = 48;
    const height = LAYOUT.hudButton;
    const graphics = this.add.graphics();
    const hit = this.add.rectangle(0, 0, width, height, 0x000000, 0).setInteractive({ useHandCursor: true });
    const text = this.add
      .text(0, 0, label.toUpperCase(), {
        fontFamily: BODY_FONT,
        fontSize: "8px",
        fontStyle: "bold",
        color: "#fff8df",
      })
      .setOrigin(0.5);

    const paint = (hovered: boolean, pressed = false): void => {
      graphics.clear();
      graphics.fillStyle(INK, 0.65);
      graphics.fillRoundedRect(-width / 2 + 2, -height / 2 + 4, width, height, 8);
      graphics.fillGradientStyle(
        hovered ? GOLD_DARK : NAVY_LIGHT,
        hovered ? GOLD_DARK : NAVY_LIGHT,
        NAVY_MID,
        NAVY_MID,
        1,
      );
      graphics.fillRoundedRect(-width / 2, -height / 2 + (pressed ? 2 : 0), width, height - (pressed ? 2 : 0), 8);
      graphics.lineStyle(1, hovered ? GOLD_LIGHT : GOLD, hovered ? 0.9 : 0.48);
      graphics.strokeRoundedRect(-width / 2 + 0.5, -height / 2 + 0.5 + (pressed ? 2 : 0), width - 1, height - 1, 8);
    };
    paint(false);

    this.add.container(x, y, [graphics, hit, text]);
    hit.on("pointerover", () => paint(true));
    hit.on("pointerout", () => paint(false));
    hit.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      paint(true, true);
    });
    hit.on("pointerup", () => {
      paint(true);
      onClick();
    });
    return text;
  }

  private tickHint(dt: number): void {
    if (!this.hint || this.hintMs <= 0) return;
    this.hintMs -= dt;
    if (this.hintMs <= 0) this.tweens.add({ targets: this.hint, alpha: 0, duration: 400 });
  }

  private isOnHudButton(x: number, y: number): boolean {
    return isHudClusterHit(x, y, this.scale.width);
  }

  private isHelpDismissHit(x: number, y: number): boolean {
    return Math.abs(x - this.scale.width / 2) <= 119 && Math.abs(y - 759) <= 34;
  }

  /** Native hit target over the canvas button, reliable under FIT scaling and in PWA mode. */
  private installHelpDomButton(): void {
    this.removeHelpDomButton();
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = ptBR.understood;
    button.setAttribute("aria-label", ptBR.understood);
    Object.assign(button.style, {
      position: "fixed",
      zIndex: "1000",
      margin: "0",
      padding: "0",
      border: "0",
      borderRadius: "11px",
      background: "transparent",
      color: "transparent",
      cursor: "pointer",
      touchAction: "manipulation",
    });

    const position = (): void => {
      const rect = this.game.canvas.getBoundingClientRect();
      button.style.left = `${rect.left + rect.width * ((this.scale.width / 2 - 119) / this.scale.width)}px`;
      button.style.top = `${rect.top + rect.height * ((759 - 26) / this.scale.height)}px`;
      button.style.width = `${rect.width * (238 / this.scale.width)}px`;
      button.style.height = `${rect.height * (52 / this.scale.height)}px`;
    };
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.closeHelp();
    });
    document.body.append(button);
    globalThis.addEventListener("resize", position);
    globalThis.visualViewport?.addEventListener("resize", position);
    this.helpDomButton = button;
    this.helpDomPositioner = position;
    position();
  }

  private removeHelpDomButton(): void {
    this.helpDomButton?.remove();
    if (this.helpDomPositioner) {
      globalThis.removeEventListener("resize", this.helpDomPositioner);
      globalThis.visualViewport?.removeEventListener("resize", this.helpDomPositioner);
    }
    this.helpDomButton = undefined;
    this.helpDomPositioner = undefined;
  }
}
