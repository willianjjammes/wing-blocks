export type Rng = {
  /** Uniform in [0, 1). */
  next(): number;
};

export function shuffleInPlace<T>(items: T[], rng: Rng): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng.next() * (i + 1));
    const tmp = items[i];
    items[i] = items[j];
    items[j] = tmp;
  }
  return items;
}

export const alwaysZeroRng: Rng = { next: () => 0 };

export const mathRng: Rng = { next: () => Math.random() };
