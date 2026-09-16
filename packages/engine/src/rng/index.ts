import type { Seed } from '@leyenda/shared';

/**
 * Generador de números aleatorios con semilla (RNG)
 *
 * Implementa el algoritmo Mulberry32, un PRNG (Pseudo-Random Number Generator)
 * simple, rápido y determinista.
 *
 * CRÍTICO: TODA la aleatoriedad del motor debe pasar por este RNG.
 * NUNCA usar Math.random() directamente.
 *
 * @see https://github.com/bryc/code/blob/master/jshash/PRNGs.md
 */
export class RNG {
  private state: number;

  constructor(seed: Seed) {
    // Asegurar que la semilla es un entero de 32 bits
    this.state = seed >>> 0;
  }

  /**
   * Genera el siguiente número aleatorio entre 0 (inclusivo) y 1 (exclusivo)
   */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Genera un entero aleatorio entre min (inclusivo) y max (inclusivo)
   */
  nextInt(min: number, max: number): number {
    if (min > max) {
      throw new Error(`min (${min}) must be <= max (${max})`);
    }
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Genera un número aleatorio entre min y max (ambos inclusivos)
   */
  nextFloat(min: number, max: number): number {
    if (min > max) {
      throw new Error(`min (${min}) must be <= max (${max})`);
    }
    return this.next() * (max - min) + min;
  }

  /**
   * Retorna true con la probabilidad especificada (0-1)
   */
  chance(probability: number): boolean {
    if (probability < 0 || probability > 1) {
      throw new Error(`Probability must be between 0 and 1, got ${probability}`);
    }
    return this.next() < probability;
  }

  /**
   * Selecciona un elemento aleatorio de un array
   */
  pick<T>(array: readonly T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot pick from empty array');
    }
    const index = this.nextInt(0, array.length - 1);
    return array[index]!;
  }

  /**
   * Mezcla un array in-place (algoritmo Fisher-Yates)
   */
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [array[i], array[j]] = [array[j]!, array[i]!];
    }
    return array;
  }

  /**
   * Retorna la semilla actual (para serialización)
   */
  getState(): Seed {
    return this.state;
  }
}

/**
 * Crea un nuevo RNG con una semilla aleatoria basada en timestamp
 * SOLO para partidas nuevas, nunca para cargar
 */
export function createRandomSeed(): Seed {
  return Math.floor(Math.random() * 0xffffffff);
}
