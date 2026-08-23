import { describe, expect, it } from "vitest";
import { persistBestIfOver } from "../../src/application/persistBestIfOver";
import { LocalStorageScoreRepository } from "../../src/infrastructure/LocalStorageScoreRepository";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: () => null,
    removeItem: (k) => {
      map.delete(k);
    },
    setItem: (k, v) => {
      map.set(k, v);
    },
  } as Storage;
}

describe("SPEC-006 persist on game over", () => {
  it("saves only when the game is over", async () => {
    const repo = new LocalStorageScoreRepository(memoryStorage());
    await repo.saveIfBest("classic", 1000);
    await expect(persistBestIfOver(repo, "classic", 1500, false)).resolves.toBe(1000);
    await expect(persistBestIfOver(repo, "classic", 1500, true)).resolves.toBe(1500);
  });
});
