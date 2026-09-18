import type { RNG } from '../rng';

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Selección ponderada: `weightFn` da el peso relativo de cada elemento. */
export function pickWeighted<T>(items: readonly T[], weightFn: (item: T) => number, rng: RNG): T {
  const weights = items.map(weightFn);
  const total = weights.reduce((sum, w) => sum + w, 0);
  let roll = rng.nextFloat(0, total);

  for (let i = 0; i < items.length; i++) {
    const weight = weights[i]!;
    if (roll < weight) {
      return items[i]!;
    }
    roll -= weight;
  }

  return items[items.length - 1]!;
}
