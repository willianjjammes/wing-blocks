import type { ScoreRepository } from "../application/ports/ScoreRepository";

const key = (mode: "calm" | "classic") => `wing-blocks:best:${mode}`;

export class LocalStorageScoreRepository implements ScoreRepository {
  constructor(private readonly storage: Pick<Storage, "getItem" | "setItem">) {}

  async getBest(mode: "calm" | "classic"): Promise<number> {
    try {
      const raw = this.storage.getItem(key(mode));
      const n = raw ? Number(raw) : 0;
      return Number.isFinite(n) ? n : 0;
    } catch {
      return 0;
    }
  }

  async saveIfBest(mode: "calm" | "classic", score: number): Promise<number> {
    const current = await this.getBest(mode);
    const next = Math.max(current, score);
    try {
      this.storage.setItem(key(mode), String(next));
    } catch {
      /* in-memory only */
    }
    return next;
  }
}
