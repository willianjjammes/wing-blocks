export type ScoreRepository = {
  getBest(mode: "calm" | "classic"): Promise<number>;
  saveIfBest(mode: "calm" | "classic", score: number): Promise<number>;
};
