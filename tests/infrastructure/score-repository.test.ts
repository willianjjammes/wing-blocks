import { describe, expect, it } from "vitest";
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

describe("SPEC-006 local best score", () => {
  it("saves a new record", async () => {
    const repo = new LocalStorageScoreRepository(memoryStorage());
    await expect(repo.saveIfBest("classic", 1500)).resolves.toBe(1500);
    await expect(repo.getBest("classic")).resolves.toBe(1500);
  });

  it("keeps the higher score", async () => {
    const repo = new LocalStorageScoreRepository(memoryStorage());
    await repo.saveIfBest("classic", 2000);
    await expect(repo.saveIfBest("classic", 500)).resolves.toBe(2000);
  });
});
