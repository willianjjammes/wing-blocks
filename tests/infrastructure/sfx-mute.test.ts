import { describe, expect, it } from "vitest";
import { MutePreference } from "../../src/infrastructure/MutePreference";
import { SfxPlayer } from "../../src/infrastructure/SfxPlayer";
import type { BoardViewState } from "../../src/application/BoardViewState";

function emptyView(over: Partial<BoardViewState> = {}): BoardViewState {
  return {
    mode: "classic",
    score: 0,
    lines: 0,
    level: 1,
    gameOver: false,
    gravityMs: 800,
    hold: null,
    next: [],
    lastCleared: 0,
    locked: [],
    active: [],
    ghost: [],
    powerup: null,
    powerupMs: 0,
    lastActivatedPowerup: null,
    powerActivationCount: 0,
    relicSpawnCount: 0,
    bestScore: 0,
    ...over,
  };
}

describe("mute preference", () => {
  it("persists muted flag", () => {
    const map = new Map<string, string>();
    const storage = {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => {
        map.set(k, v);
      },
    };
    const pref = new MutePreference(storage);
    expect(pref.get()).toBe(false);
    pref.set(true);
    expect(pref.get()).toBe(true);
  });
});

describe("sfx observe", () => {
  it("does not throw when muted", () => {
    const sfx = new SfxPlayer(() => null);
    sfx.muted = true;
    sfx.observe(emptyView());
    sfx.observe(emptyView({ lastCleared: 1, lines: 1 }));
  });

  it("uses distinct note sequences for relics and activated powers", () => {
    const notes: number[] = [];
    const context = {
      state: "running",
      currentTime: 0,
      destination: {},
      createOscillator: () => {
        const oscillator = {
          frequency: { value: 0 },
          type: "square",
          connect: () => undefined,
          start: () => notes.push(oscillator.frequency.value),
          stop: () => undefined,
        };
        return oscillator;
      },
      createGain: () => ({
        gain: { value: 0 },
        connect: () => undefined,
      }),
      resume: () => Promise.resolve(),
    } as unknown as AudioContext;

    const relicSfx = new SfxPlayer(() => context);
    relicSfx.observe(emptyView({ relicSpawnCount: 1 }));
    expect(notes).toEqual([740, 1110]);

    notes.length = 0;
    const powerSfx = new SfxPlayer(() => context);
    powerSfx.observe(emptyView());
    powerSfx.observe(emptyView({ lastActivatedPowerup: "royalStrike", powerActivationCount: 1 }));
    expect(notes).toEqual([660, 880, 1320]);
  });
});
