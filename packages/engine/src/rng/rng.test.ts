import { describe, it, expect } from 'vitest';
import { RNG, createRandomSeed } from './index';

describe('RNG', () => {
  describe('determinismo', () => {
    it('debe generar la misma secuencia con la misma semilla', () => {
      const rng1 = new RNG(12345);
      const rng2 = new RNG(12345);

      const sequence1 = Array.from({ length: 100 }, () => rng1.next());
      const sequence2 = Array.from({ length: 100 }, () => rng2.next());

      expect(sequence1).toEqual(sequence2);
    });

    it('debe generar secuencias diferentes con semillas diferentes', () => {
      const rng1 = new RNG(12345);
      const rng2 = new RNG(54321);

      const sequence1 = Array.from({ length: 100 }, () => rng1.next());
      const sequence2 = Array.from({ length: 100 }, () => rng2.next());

      expect(sequence1).not.toEqual(sequence2);
    });
  });

  describe('next()', () => {
    it('debe generar números entre 0 y 1', () => {
      const rng = new RNG(12345);

      for (let i = 0; i < 1000; i++) {
        const value = rng.next();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });
  });

  describe('nextInt()', () => {
    it('debe generar enteros dentro del rango especificado', () => {
      const rng = new RNG(12345);
      const min = 10;
      const max = 20;

      for (let i = 0; i < 1000; i++) {
        const value = rng.nextInt(min, max);
        expect(value).toBeGreaterThanOrEqual(min);
        expect(value).toBeLessThanOrEqual(max);
        expect(Number.isInteger(value)).toBe(true);
      }
    });

    it('debe lanzar error si min > max', () => {
      const rng = new RNG(12345);
      expect(() => rng.nextInt(20, 10)).toThrow();
    });

    it('debe funcionar cuando min === max', () => {
      const rng = new RNG(12345);
      expect(rng.nextInt(42, 42)).toBe(42);
    });
  });

  describe('nextFloat()', () => {
    it('debe generar flotantes dentro del rango especificado', () => {
      const rng = new RNG(12345);
      const min = 10.5;
      const max = 20.5;

      for (let i = 0; i < 1000; i++) {
        const value = rng.nextFloat(min, max);
        expect(value).toBeGreaterThanOrEqual(min);
        expect(value).toBeLessThanOrEqual(max);
      }
    });

    it('debe lanzar error si min > max', () => {
      const rng = new RNG(12345);
      expect(() => rng.nextFloat(20, 10)).toThrow();
    });
  });

  describe('chance()', () => {
    it('debe retornar true con la probabilidad correcta', () => {
      const rng = new RNG(12345);
      const probability = 0.7;
      const iterations = 10000;

      let trueCount = 0;
      for (let i = 0; i < iterations; i++) {
        if (rng.chance(probability)) {
          trueCount++;
        }
      }

      const actualProbability = trueCount / iterations;
      // Debe estar dentro del 5% del valor esperado
      expect(actualProbability).toBeGreaterThan(probability - 0.05);
      expect(actualProbability).toBeLessThan(probability + 0.05);
    });

    it('debe lanzar error si la probabilidad está fuera de rango', () => {
      const rng = new RNG(12345);
      expect(() => rng.chance(-0.1)).toThrow();
      expect(() => rng.chance(1.1)).toThrow();
    });

    it('debe retornar siempre false con probabilidad 0', () => {
      const rng = new RNG(12345);
      for (let i = 0; i < 100; i++) {
        expect(rng.chance(0)).toBe(false);
      }
    });

    it('debe retornar siempre true con probabilidad 1', () => {
      const rng = new RNG(12345);
      for (let i = 0; i < 100; i++) {
        expect(rng.chance(1)).toBe(true);
      }
    });
  });

  describe('pick()', () => {
    it('debe seleccionar elementos del array', () => {
      const rng = new RNG(12345);
      const array = ['a', 'b', 'c', 'd', 'e'];

      for (let i = 0; i < 100; i++) {
        const picked = rng.pick(array);
        expect(array).toContain(picked);
      }
    });

    it('debe lanzar error si el array está vacío', () => {
      const rng = new RNG(12345);
      expect(() => rng.pick([])).toThrow();
    });

    it('debe retornar el único elemento si el array tiene 1 elemento', () => {
      const rng = new RNG(12345);
      expect(rng.pick(['único'])).toBe('único');
    });
  });

  describe('shuffle()', () => {
    it('debe mezclar el array in-place', () => {
      const rng = new RNG(12345);
      const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const array = [...original];

      rng.shuffle(array);

      // Debe contener los mismos elementos
      expect(array.sort((a, b) => a - b)).toEqual(original);
      // Pero probablemente en diferente orden
      // (puede fallar 1 en 10! veces, pero es improbable)
    });

    it('debe ser determinista con la misma semilla', () => {
      const rng1 = new RNG(12345);
      const rng2 = new RNG(12345);

      const array1 = [1, 2, 3, 4, 5];
      const array2 = [1, 2, 3, 4, 5];

      rng1.shuffle(array1);
      rng2.shuffle(array2);

      expect(array1).toEqual(array2);
    });
  });

  describe('getState()', () => {
    it('debe retornar la semilla actualizada', () => {
      const seed = 12345;
      const rng = new RNG(seed);

      const initialState = rng.getState();
      expect(initialState).toBe(seed);

      // Después de generar números, el estado cambia
      rng.next();
      const newState = rng.getState();
      expect(newState).not.toBe(seed);
    });
  });

  describe('createRandomSeed()', () => {
    it('debe generar semillas diferentes', () => {
      const seed1 = createRandomSeed();
      const seed2 = createRandomSeed();

      // Puede fallar muy raramente, pero es improbable
      expect(seed1).not.toBe(seed2);
    });

    it('debe generar semillas válidas', () => {
      const seed = createRandomSeed();
      expect(seed).toBeGreaterThanOrEqual(0);
      expect(seed).toBeLessThanOrEqual(0xffffffff);
      expect(Number.isInteger(seed)).toBe(true);
    });
  });
});
