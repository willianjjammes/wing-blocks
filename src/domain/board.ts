import { BOARD_WIDTH, BUFFER_HEIGHT, VISIBLE_HEIGHT, type PieceId } from "./types";

export type LockedCell = {
  pieceId: PieceId;
  relic: boolean;
};

export const MIN_Y = -BUFFER_HEIGHT;
export const MAX_Y = VISIBLE_HEIGHT - 1;
export const SPAWN_ORIGIN = { x: 3, y: MIN_Y } as const;

export class Board {
  private readonly cells = new Map<string, LockedCell>();

  static key(x: number, y: number): string {
    return `${x},${y}`;
  }

  get(x: number, y: number): LockedCell | undefined {
    return this.cells.get(Board.key(x, y));
  }

  set(x: number, y: number, cell: LockedCell): void {
    this.cells.set(Board.key(x, y), cell);
  }

  delete(x: number, y: number): void {
    this.cells.delete(Board.key(x, y));
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && x < BOARD_WIDTH && y >= MIN_Y && y <= MAX_Y;
  }

  occupied(x: number, y: number): boolean {
    return this.cells.has(Board.key(x, y));
  }

  collides(world: Array<{ x: number; y: number }>): boolean {
    return world.some((c) => !this.inBounds(c.x, c.y) || this.occupied(c.x, c.y));
  }

  lock(world: Array<{ x: number; y: number }>, pieceId: PieceId, relic: boolean): void {
    for (const c of world) {
      this.set(c.x, c.y, { pieceId, relic });
    }
  }

  /** Visible rows 0..19. Returns relic-in-cleared-line for SPEC-004 later. */
  clearFullLines(): { cleared: number; relicCleared: boolean } {
    const fullYs: number[] = [];
    let relicCleared = false;
    for (let y = 0; y < VISIBLE_HEIGHT; y += 1) {
      let full = true;
      let relic = false;
      for (let x = 0; x < BOARD_WIDTH; x += 1) {
        const cell = this.get(x, y);
        if (!cell) {
          full = false;
          break;
        }
        if (cell.relic) relic = true;
      }
      if (full) {
        fullYs.push(y);
        if (relic) relicCleared = true;
      }
    }
    if (fullYs.length === 0) return { cleared: 0, relicCleared: false };
    this.clearRows(fullYs);
    return { cleared: fullYs.length, relicCleared };
  }

  relicCellCount(): number {
    let n = 0;
    for (const cell of this.cells.values()) {
      if (cell.relic) n += 1;
    }
    return n;
  }

  relicPieceCount(): number {
    const cells = this.relicCellCount();
    return cells === 0 ? 0 : Math.ceil(cells / 4);
  }

  blast2x2(originX: number, originY: number): void {
    for (let y = originY; y < originY + 2; y += 1) {
      for (let x = originX; x < originX + 2; x += 1) {
        if (this.inBounds(x, y)) this.delete(x, y);
      }
    }
  }

  /** Lowest visible row with 1–9 blocks; compact like a line clear. */
  clearLowestPartial(): boolean {
    for (let y = VISIBLE_HEIGHT - 1; y >= 0; y -= 1) {
      let count = 0;
      for (let x = 0; x < BOARD_WIDTH; x += 1) {
        if (this.get(x, y)) count += 1;
      }
      if (count >= 1 && count < BOARD_WIDTH) {
        this.clearRows([y]);
        return true;
      }
    }
    return false;
  }

  /** Clears the most occupied visible row or column, preferring a row on ties. */
  clearStrongestLineOrColumn(): "row" | "column" | null {
    let bestRow = -1;
    let bestRowCount = 0;
    for (let y = 0; y < VISIBLE_HEIGHT; y += 1) {
      let count = 0;
      for (let x = 0; x < BOARD_WIDTH; x += 1) {
        if (this.get(x, y)) count += 1;
      }
      if (count > bestRowCount) {
        bestRow = y;
        bestRowCount = count;
      }
    }

    let bestColumn = -1;
    let bestColumnCount = 0;
    for (let x = 0; x < BOARD_WIDTH; x += 1) {
      let count = 0;
      for (let y = 0; y < VISIBLE_HEIGHT; y += 1) {
        if (this.get(x, y)) count += 1;
      }
      if (count > bestColumnCount) {
        bestColumn = x;
        bestColumnCount = count;
      }
    }

    if (bestRowCount === 0 && bestColumnCount === 0) return null;
    if (bestRowCount >= bestColumnCount) {
      this.clearRows([bestRow]);
      return "row";
    }
    for (let y = MIN_Y; y <= MAX_Y; y += 1) this.delete(bestColumn, y);
    return "column";
  }

  private clearRows(fullYs: number[]): void {
    const drop = new Map<number, number>();
    for (let y = MIN_Y; y <= MAX_Y; y += 1) {
      drop.set(
        y,
        fullYs.filter((fy) => fy > y).length,
      );
    }
    const next = new Map<string, LockedCell>();
    for (const [key, cell] of this.cells) {
      const [xs, ys] = key.split(",");
      const x = Number(xs);
      const y = Number(ys);
      if (fullYs.includes(y)) continue;
      const ny = y + (drop.get(y) ?? 0);
      next.set(Board.key(x, ny), cell);
    }
    this.cells.clear();
    for (const [k, v] of next) this.cells.set(k, v);
  }

  lockedSnapshot(): Array<{ x: number; y: number; pieceId: PieceId; relic: boolean }> {
    const out: Array<{ x: number; y: number; pieceId: PieceId; relic: boolean }> = [];
    for (const [key, cell] of this.cells) {
      const [xs, ys] = key.split(",");
      out.push({ x: Number(xs), y: Number(ys), pieceId: cell.pieceId, relic: cell.relic });
    }
    return out.sort((a, b) => a.y - b.y || a.x - b.x);
  }
}
