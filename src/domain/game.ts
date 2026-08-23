import { Board, SPAWN_ORIGIN } from "./board";
import { PIECE_IDS } from "./pieces";
import { pickPowerup, shouldSpawnRelic, TIME_WING_MS } from "./powerups";
import type { Rng } from "./rng";
import { shuffleInPlace } from "./rng";
import { cellsAtRotation, type Rotation, WALL_KICKS } from "./rotation";
import { gravityMs, lockDelayMs, levelForLines, scoreForLines } from "./timing";
import type { GameMode, PieceId, PowerupId } from "./types";

export type ActivePiece = {
  id: PieceId;
  rotation: Rotation;
  x: number;
  y: number;
  relic: boolean;
};

export type GameSnapshot = {
  mode: GameMode;
  score: number;
  lines: number;
  level: number;
  gameOver: boolean;
  gravityMs: number;
  hold: PieceId | null;
  holdUsedThisPiece: boolean;
  next: PieceId[];
  lastCleared: number;
  relicLineCleared: boolean;
  locked: ReturnType<Board["lockedSnapshot"]>;
  active: ActivePiece | null;
  powerup: PowerupId | null;
  powerupMs: number;
  lastActivatedPowerup: PowerupId | null;
  powerActivationCount: number;
  relicSpawnCount: number;
};

export type CreateGameOptions = {
  mode: GameMode;
  rng: Rng;
  locked?: Array<{ x: number; y: number; pieceId: PieceId; relic?: boolean }>;
  dealPiece?: () => PieceId;
  forceRelic?: boolean;
  pickPower?: () => PowerupId;
  skipInitialSpawn?: boolean;
};

export class Game {
  readonly mode: GameMode;
  private readonly rng: Rng;
  private readonly board = new Board();
  private readonly dealPiece?: () => PieceId;
  private readonly forceRelic: boolean;
  private readonly pickPowerFn?: () => PowerupId;
  private bag: PieceId[] = [];
  private nextQueue: PieceId[] = [];
  private active: ActivePiece | null = null;
  private hold: PieceId | null = null;
  private holdUsedThisPiece = false;
  private score = 0;
  private lines = 0;
  private lastCleared = 0;
  private relicLineCleared = false;
  private gameOver = false;
  private gravityAcc = 0;
  private lockAcc: number | null = null;
  private timeWingMs = 0;
  private skyShield = false;
  private powerup: PowerupId | null = null;
  private lastActivatedPowerup: PowerupId | null = null;
  private powerActivationCount = 0;
  private relicSpawnCount = 0;
  private lastLockMin = { x: 0, y: 0 };

  constructor(opts: CreateGameOptions) {
    this.mode = opts.mode;
    this.rng = opts.rng;
    this.dealPiece = opts.dealPiece;
    this.forceRelic = opts.forceRelic ?? false;
    this.pickPowerFn = opts.pickPower;
    for (const c of opts.locked ?? []) {
      this.board.set(c.x, c.y, { pieceId: c.pieceId, relic: c.relic ?? false });
    }
    this.fillNext();
    if (!opts.skipInitialSpawn) this.spawn();
  }

  get level(): number {
    return levelForLines(this.lines);
  }

  worldCells(piece: ActivePiece = this.requireActive()): Array<{ x: number; y: number }> {
    return cellsAtRotation(piece.id, piece.rotation).map((c) => ({
      x: piece.x + c.x,
      y: piece.y + c.y,
    }));
  }

  ghostCells(): Array<{ x: number; y: number }> {
    if (!this.active || this.gameOver) return [];
    const ghost = { ...this.active };
    while (!this.board.collides(this.worldCells({ ...ghost, y: ghost.y + 1 }))) {
      ghost.y += 1;
    }
    return this.worldCells(ghost);
  }

  applyPower(id: PowerupId): void {
    this.lastActivatedPowerup = id;
    this.powerActivationCount += 1;
    this.timeWingMs = 0;
    this.skyShield = false;
    this.powerup = null;
    if (id === "timeWing") {
      this.timeWingMs = TIME_WING_MS;
      this.powerup = "timeWing";
      return;
    }
    if (id === "skyShield") {
      this.skyShield = true;
      this.powerup = "skyShield";
      return;
    }
    if (id === "halo") {
      this.board.clearLowestPartial();
      return;
    }
    if (id === "gust") {
      this.board.blast2x2(this.lastLockMin.x, this.lastLockMin.y);
      return;
    }
    if (id === "plumeSwap") {
      this.plumeSwap();
      return;
    }
    if (id === "royalStrike") {
      this.board.clearStrongestLineOrColumn();
    }
  }

  move(dx: number): boolean {
    if (!this.canPlay()) return false;
    const next = { ...this.active!, x: this.active!.x + dx };
    if (this.board.collides(this.worldCells(next))) return false;
    this.active = next;
    this.resetLock();
    return true;
  }

  rotate(dir: -1 | 1): boolean {
    if (!this.canPlay()) return false;
    const piece = this.active!;
    const rotation = ((((piece.rotation + dir) % 4) + 4) % 4) as Rotation;
    for (const [kx, ky] of WALL_KICKS) {
      const next: ActivePiece = {
        ...piece,
        rotation,
        x: piece.x + kx,
        y: piece.y + ky,
      };
      if (!this.board.collides(this.worldCells(next))) {
        this.active = next;
        this.resetLock();
        return true;
      }
    }
    return false;
  }

  softDrop(): boolean {
    if (!this.canPlay()) return false;
    if (this.tryDown()) {
      this.score += 1;
      return true;
    }
    this.startLock();
    return false;
  }

  hardDrop(): void {
    if (!this.canPlay()) return;
    let cells = 0;
    while (this.tryDown()) {
      cells += 1;
    }
    this.score += cells * 2;
    this.lockActive();
  }

  holdPiece(): boolean {
    if (!this.canPlay() || this.holdUsedThisPiece) return false;
    const current = this.active!;
    this.holdUsedThisPiece = true;
    if (this.hold === null) {
      this.hold = current.id;
      this.active = null;
      this.spawn();
      this.holdUsedThisPiece = true;
      return true;
    }
    const swapped = this.hold;
    this.hold = current.id;
    this.active = {
      id: swapped,
      rotation: 0,
      x: SPAWN_ORIGIN.x,
      y: SPAWN_ORIGIN.y,
      relic: false,
    };
    if (this.board.collides(this.worldCells(this.active))) {
      if (this.consumeShield()) {
        this.active = null;
        this.spawn();
        this.holdUsedThisPiece = true;
        return true;
      }
      this.active = null;
      this.gameOver = true;
    }
    return true;
  }

  tick(dtMs: number): void {
    if (!this.canPlay()) return;
    if (this.timeWingMs > 0) {
      this.timeWingMs = Math.max(0, this.timeWingMs - dtMs);
      if (this.timeWingMs === 0 && this.powerup === "timeWing") this.powerup = null;
    }
    if (this.lockAcc !== null) {
      this.lockAcc -= dtMs;
      if (this.lockAcc <= 0) this.lockActive();
      return;
    }
    this.gravityAcc += dtMs;
    const interval = this.currentGravityMs();
    while (this.canPlay() && this.lockAcc === null && this.gravityAcc >= interval) {
      this.gravityAcc -= interval;
      if (!this.tryDown()) {
        this.startLock();
        break;
      }
    }
  }

  snapshot(): GameSnapshot {
    return {
      mode: this.mode,
      score: this.score,
      lines: this.lines,
      level: this.level,
      gameOver: this.gameOver,
      gravityMs: this.currentGravityMs(),
      hold: this.hold,
      holdUsedThisPiece: this.holdUsedThisPiece,
      next: [...this.nextQueue],
      lastCleared: this.lastCleared,
      relicLineCleared: this.relicLineCleared,
      locked: this.board.lockedSnapshot(),
      active: this.active ? { ...this.active } : null,
      powerup: this.powerup,
      powerupMs: this.timeWingMs,
      lastActivatedPowerup: this.lastActivatedPowerup,
      powerActivationCount: this.powerActivationCount,
      relicSpawnCount: this.relicSpawnCount,
    };
  }

  spawn(): void {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      this.fillNext();
      const id = this.nextQueue.shift();
      if (!id) {
        this.gameOver = true;
        return;
      }
      this.fillNext();
      const relic = this.rollRelic();
      const piece: ActivePiece = {
        id,
        rotation: 0,
        x: SPAWN_ORIGIN.x,
        y: SPAWN_ORIGIN.y,
        relic,
      };
      if (!this.board.collides(this.worldCells(piece))) {
        this.active = piece;
        this.holdUsedThisPiece = false;
        if (relic) this.relicSpawnCount += 1;
        return;
      }
      if (this.consumeShield()) continue;
      this.active = null;
      this.gameOver = true;
      return;
    }
    this.active = null;
    this.gameOver = true;
  }

  private currentGravityMs(): number {
    if (this.timeWingMs > 0) return gravityMs("calm", 1);
    return gravityMs(this.mode, this.level);
  }

  private canPlay(): boolean {
    return !this.gameOver && this.active !== null;
  }

  private requireActive(): ActivePiece {
    if (!this.active) throw new Error("no active piece");
    return this.active;
  }

  private tryDown(): boolean {
    const next = { ...this.active!, y: this.active!.y + 1 };
    if (this.board.collides(this.worldCells(next))) return false;
    this.active = next;
    this.lockAcc = null;
    return true;
  }

  private startLock(): void {
    if (this.lockAcc === null) this.lockAcc = lockDelayMs(this.mode);
  }

  private resetLock(): void {
    if (this.lockAcc !== null) this.lockAcc = lockDelayMs(this.mode);
  }

  private lockActive(): void {
    const piece = this.active;
    if (!piece) return;
    const world = this.worldCells(piece);
    this.lastLockMin = {
      x: Math.min(...world.map((c) => c.x)),
      y: Math.min(...world.map((c) => c.y)),
    };
    this.board.lock(world, piece.id, piece.relic);
    this.active = null;
    this.lockAcc = null;
    this.gravityAcc = 0;
    const { cleared, relicCleared } = this.board.clearFullLines();
    this.lastCleared = cleared;
    this.relicLineCleared = relicCleared;
    if (cleared > 0) {
      this.score += scoreForLines(cleared, this.level);
      this.lines += cleared;
    }
    this.holdUsedThisPiece = false;
    this.spawn();
    if (relicCleared) {
      this.applyPower(this.pickPowerFn ? this.pickPowerFn() : pickPowerup(this.rng, this.mode));
    }
  }

  private rollRelic(): boolean {
    if (this.forceRelic) {
      return shouldSpawnRelic(this.mode, 0, this.board.relicPieceCount());
    }
    return shouldSpawnRelic(this.mode, this.rng.next(), this.board.relicPieceCount());
  }

  private consumeShield(): boolean {
    if (!this.skyShield) return false;
    this.skyShield = false;
    if (this.powerup === "skyShield") this.powerup = null;
    return true;
  }

  private plumeSwap(): void {
    if (!this.active || this.gameOver) return;
    if (this.hold !== null) {
      const currentId = this.active.id;
      const incoming = this.hold;
      this.hold = currentId;
      this.active = {
        id: incoming,
        rotation: 0,
        x: SPAWN_ORIGIN.x,
        y: SPAWN_ORIGIN.y,
        relic: false,
      };
      this.holdUsedThisPiece = false;
      return;
    }
    const nextId = this.nextQueue[0];
    if (!nextId) return;
    this.nextQueue.shift();
    this.fillNext();
    this.active = {
      id: nextId,
      rotation: 0,
      x: SPAWN_ORIGIN.x,
      y: SPAWN_ORIGIN.y,
      relic: false,
    };
    this.holdUsedThisPiece = false;
  }

  private fillNext(): void {
    while (this.nextQueue.length < 3) {
      this.nextQueue.push(this.nextPieceId());
    }
  }

  private nextPieceId(): PieceId {
    if (this.dealPiece) return this.dealPiece();
    if (this.bag.length === 0) {
      this.bag = shuffleInPlace([...PIECE_IDS], this.rng);
    }
    const id = this.bag.shift();
    if (!id) throw new Error("empty bag");
    return id;
  }
}
