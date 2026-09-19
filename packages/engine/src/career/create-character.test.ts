import { describe, expect, it } from 'vitest';
import fc from 'fast-check';

import type { GoalkeeperAttributes, TechnicalAttributes } from '@leyenda/shared';
import { RNG } from '../rng';

import { createCharacter } from './create-character';
import { GROUP_MAX, GROUP_MIN, POINT_POOL, type CreateCharacterInput, type OriginModifier } from './types';

/** Object.values sobre una interfaz sin índice devuelve any[]; forzamos el tipo aquí. */
function numberValues(obj: object): number[] {
  return Object.values(obj as Record<string, number>);
}

const NEUTRAL_ORIGIN: OriginModifier = {
  attributeGroupBonus: { physical: 0, technical: 0, mental: 0 },
  startingAgeOverride: null,
  startingMoney: 400,
  agentRelationBonus: 0,
};

function baseInput(overrides: Partial<CreateCharacterInput> = {}): CreateCharacterInput {
  return {
    id: 'protagonist-1',
    firstName: 'Test',
    lastName: 'Player',
    nationality: 'XA',
    position: 'CF',
    foot: 'right',
    origin: NEUTRAL_ORIGIN,
    groupAllocation: { physical: 50, technical: 50, mental: 50 },
    clubId: 'club-1',
    startDate: '2026-08-01',
    ...overrides,
  };
}

describe('createCharacter', () => {
  it('es determinista', () => {
    const a = createCharacter(baseInput(), new RNG(1));
    const b = createCharacter(baseInput(), new RNG(1));
    expect(a).toEqual(b);
  });

  it('rechaza un reparto que no suma POINT_POOL', () => {
    const input = baseInput({ groupAllocation: { physical: 50, technical: 50, mental: 40 } });
    expect(() => createCharacter(input, new RNG(1))).toThrow();
  });

  it('rechaza un grupo fuera de [GROUP_MIN, GROUP_MAX]', () => {
    const input = baseInput({
      groupAllocation: { physical: GROUP_MAX + 10, technical: 50, mental: POINT_POOL - (GROUP_MAX + 10) - 50 },
    });
    expect(() => createCharacter(input, new RNG(1))).toThrow();
  });

  it('un grupo con más puntos produce atributos de ese grupo más altos de media', () => {
    const highPhysical = baseInput({ groupAllocation: { physical: 70, technical: 40, mental: 40 } });
    const lowPhysical = baseInput({ groupAllocation: { physical: 40, technical: 40, mental: 70 } });

    const avg = (values: number[]): number => values.reduce((a, b) => a + b, 0) / values.length;

    let highTotal = 0;
    let lowTotal = 0;
    const trials = 30;
    for (let seed = 0; seed < trials; seed++) {
      const high = createCharacter(highPhysical, new RNG(seed));
      const low = createCharacter(lowPhysical, new RNG(seed));
      highTotal += avg(numberValues(high.physical));
      lowTotal += avg(numberValues(low.physical));
    }
    expect(highTotal / trials).toBeGreaterThan(lowTotal / trials);
  });

  it('aplica el bono de atributos del origen', () => {
    const boostedOrigin: OriginModifier = {
      ...NEUTRAL_ORIGIN,
      attributeGroupBonus: { physical: 0, technical: 20, mental: 0 },
    };
    const withBonus = createCharacter(baseInput({ origin: boostedOrigin }), new RNG(5));
    const withoutBonus = createCharacter(baseInput(), new RNG(5));

    const avg = (values: number[]): number => values.reduce((a, b) => a + b, 0) / values.length;
    expect(avg(numberValues(withBonus.technical))).toBeGreaterThan(
      avg(numberValues(withoutBonus.technical))
    );
  });

  it('aplica el dinero y el bono de relación con el agente del origen', () => {
    const origin: OriginModifier = {
      attributeGroupBonus: { physical: 0, technical: 0, mental: 0 },
      startingAgeOverride: null,
      startingMoney: 800,
      agentRelationBonus: 15,
    };
    const result = createCharacter(baseInput({ origin }), new RNG(1));
    expect(result.money).toBe(800);
    expect(result.relations.agent).toBe(15);
  });

  it('el origen "tardío" da exactamente 19 años en la fecha de partida', () => {
    const origin: OriginModifier = { ...NEUTRAL_ORIGIN, startingAgeOverride: 19 };
    const result = createCharacter(baseInput({ origin, startDate: '2026-08-01' }), new RNG(1));

    const birth = new Date(result.dateOfBirth);
    const reference = new Date('2026-08-01');
    const ageAtReference =
      reference.getUTCFullYear() -
      birth.getUTCFullYear() -
      (reference.getUTCMonth() < birth.getUTCMonth() ||
      (reference.getUTCMonth() === birth.getUTCMonth() && reference.getUTCDate() < birth.getUTCDate())
        ? 1
        : 0);
    expect(ageAtReference).toBe(19);
  });

  it('un portero recibe GoalkeeperAttributes, no TechnicalAttributes', () => {
    const result = createCharacter(baseInput({ position: 'GK' }), new RNG(1));
    const technical = result.technical as GoalkeeperAttributes & Partial<TechnicalAttributes>;
    expect(technical.reflexes).toBeDefined();
    expect(technical.passing).toBeUndefined();
  });

  it('un jugador de campo recibe TechnicalAttributes, no GoalkeeperAttributes', () => {
    const result = createCharacter(baseInput({ position: 'CF' }), new RNG(1));
    const technical = result.technical as TechnicalAttributes & Partial<GoalkeeperAttributes>;
    expect(technical.shooting).toBeDefined();
    expect(technical.reflexes).toBeUndefined();
  });

  it('todos los atributos numéricos y potencial/currentAbility están en [1, 99]', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: GROUP_MIN, max: GROUP_MAX }),
        fc.integer({ min: GROUP_MIN, max: GROUP_MAX }),
        fc.constantFrom('GK', 'CB', 'CMF', 'CF'),
        fc.integer({ min: 0, max: 100000 }),
        (physical, mental, position, seed) => {
          const technical = POINT_POOL - physical - mental;
          fc.pre(technical >= GROUP_MIN && technical <= GROUP_MAX);

          const input = baseInput({
            groupAllocation: { physical, technical, mental },
            position: position as 'GK',
          });
          const result = createCharacter(input, new RNG(seed));

          for (const value of [
            ...numberValues(result.physical),
            ...numberValues(result.technical),
            ...numberValues(result.mental),
            result.potential,
            result.currentAbility,
          ]) {
            expect(value).toBeGreaterThanOrEqual(1);
            expect(value).toBeLessThanOrEqual(99);
          }
        }
      )
    );
  });
});
