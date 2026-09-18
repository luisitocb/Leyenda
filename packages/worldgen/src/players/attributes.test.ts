import { describe, expect, it } from 'vitest';
import fc from 'fast-check';

import { RNG } from '@leyenda/engine';
import {
  clubQualityScore,
  currentAbilityFromPotential,
  generateFieldAttributes,
  generateGoalkeeperAttributes,
  generatePersonality,
} from './attributes';

/** Object.values sobre una interfaz sin índice devuelve any[]; forzamos el tipo aquí. */
function numberValues(obj: object): number[] {
  return Object.values(obj as Record<string, number>);
}

describe('clubQualityScore', () => {
  it('división 1 da más calidad que división 2 con la misma reputación', () => {
    expect(clubQualityScore(15, 1)).toBeGreaterThan(clubQualityScore(15, 2));
  });

  it('siempre está en el rango [10, 85]', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 20 }), fc.integer({ min: 1, max: 3 }), (rep, div) => {
        const score = clubQualityScore(rep, div);
        expect(score).toBeGreaterThanOrEqual(10);
        expect(score).toBeLessThanOrEqual(85);
      })
    );
  });
});

describe('currentAbilityFromPotential', () => {
  it('un jugador en su pico (24-30) tiene currentAbility más cercano al potencial que uno de 18 años', () => {
    const rng = new RNG(1);
    const peakAbility = currentAbilityFromPotential(80, 26, rng);
    const youngAbility = currentAbilityFromPotential(80, 18, rng);
    expect(peakAbility).toBeGreaterThan(youngAbility);
  });

  it('siempre está en el rango [1, 99]', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 99 }),
        fc.integer({ min: 15, max: 40 }),
        (potential, age) => {
          const ability = currentAbilityFromPotential(potential, age, new RNG(1));
          expect(ability).toBeGreaterThanOrEqual(1);
          expect(ability).toBeLessThanOrEqual(99);
        }
      )
    );
  });
});

describe('generateFieldAttributes', () => {
  it('los CB tienen más defending+heading de media que los CF', () => {
    const cbTotals: number[] = [];
    const cfTotals: number[] = [];
    for (let seed = 0; seed < 30; seed++) {
      const cb = generateFieldAttributes('CB', 70, new RNG(seed));
      const cf = generateFieldAttributes('CF', 70, new RNG(seed));
      cbTotals.push(cb.technical.defending + cb.technical.heading);
      cfTotals.push(cf.technical.defending + cf.technical.heading);
    }
    const avg = (arr: number[]): number => arr.reduce((a, b) => a + b, 0) / arr.length;
    expect(avg(cbTotals)).toBeGreaterThan(avg(cfTotals));
  });

  it('los CF tienen más shooting de media que los CB', () => {
    const cbShooting: number[] = [];
    const cfShooting: number[] = [];
    for (let seed = 0; seed < 30; seed++) {
      cbShooting.push(generateFieldAttributes('CB', 70, new RNG(seed)).technical.shooting);
      cfShooting.push(generateFieldAttributes('CF', 70, new RNG(seed)).technical.shooting);
    }
    const avg = (arr: number[]): number => arr.reduce((a, b) => a + b, 0) / arr.length;
    expect(avg(cfShooting)).toBeGreaterThan(avg(cbShooting));
  });

  it('todos los atributos generados están en [1, 99]', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('CB', 'LB', 'RB', 'DMF', 'CMF', 'AMF', 'LW', 'RW', 'CF'),
        fc.integer({ min: 1, max: 99 }),
        fc.integer({ min: 0, max: 100000 }),
        (position: string, ability: number, seed: number) => {
          const attrs = generateFieldAttributes(position as 'CB', ability, new RNG(seed));
          for (const value of [
            ...numberValues(attrs.physical),
            ...numberValues(attrs.technical),
            ...numberValues(attrs.mental),
          ]) {
            expect(value).toBeGreaterThanOrEqual(1);
            expect(value).toBeLessThanOrEqual(99);
          }
        }
      )
    );
  });
});

describe('generateGoalkeeperAttributes', () => {
  it('todos los atributos generados están en [1, 99]', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 99 }),
        fc.integer({ min: 0, max: 100000 }),
        (ability: number, seed: number) => {
          const attrs = generateGoalkeeperAttributes(ability, new RNG(seed));
          for (const value of [
            ...numberValues(attrs.physical),
            ...numberValues(attrs.technical),
            ...numberValues(attrs.mental),
          ]) {
            expect(value).toBeGreaterThanOrEqual(1);
            expect(value).toBeLessThanOrEqual(99);
          }
        }
      )
    );
  });
});

describe('generatePersonality', () => {
  it('siempre está en el rango [20, 90]', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100000 }), (seed) => {
        const personality = generatePersonality(new RNG(seed));
        for (const value of Object.values(personality)) {
          expect(value).toBeGreaterThanOrEqual(20);
          expect(value).toBeLessThanOrEqual(90);
        }
      })
    );
  });
});
