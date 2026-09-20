import { describe, expect, it } from 'vitest';

import type { InjuryType, ProtagonistPlayer } from '@leyenda/shared';
import { RNG } from '../rng';

import {
  advanceInjuryRest,
  applyInjuryOnset,
  attemptEarlyReturn,
  rollInjuryChance,
} from './injury';

function baseProtagonist(overrides: Partial<ProtagonistPlayer> = {}): ProtagonistPlayer {
  return {
    id: 'protagonist-1',
    firstName: 'Test',
    lastName: 'Player',
    nationality: 'XA',
    dateOfBirth: '2008-08-01',
    position: 'CF',
    foot: 'right',
    physical: { speed: 50, stamina: 50, strength: 50, jumping: 50 },
    technical: {
      passing: 50,
      dribbling: 50,
      shooting: 50,
      ballControl: 50,
      defending: 50,
      heading: 50,
    },
    mental: { vision: 50, composure: 50, leadership: 50, teamwork: 50 },
    personality: { professionalism: 50, charisma: 50, ego: 50, temperament: 50 },
    potential: 60,
    currentAbility: 50,
    form: 70,
    morale: 70,
    fitness: 70,
    clubId: 'club-1',
    contractExpiry: '2028-08-01',
    value: 50_000,
    health: 70,
    mentalHealth: 70,
    energy: 100,
    money: 400,
    assets: 0,
    salary: 500,
    relations: {
      coach: 0,
      squad: 0,
      fans: 0,
      board: 0,
      press: 0,
      partner: 0,
      family: 0,
      agent: 0,
      sponsors: 0,
    },
    traits: [],
    gamesPlayed: 0,
    goalsScored: 0,
    assists: 0,
    titlesWon: [],
    activeInjury: null,
    relationshipStatus: 'single',
    activeBrandDeal: null,
    nationalTeamCaps: 0,
    nationalTeamGoals: 0,
    nationalTeamAssists: 0,
    ...overrides,
  };
}

const INJURY_TYPES: InjuryType[] = [
  {
    id: 'leve',
    name: 'Leve',
    description: 'Leve',
    minWeeks: 1,
    maxWeeks: 2,
    weight: 4,
    healthPenalty: -5,
  },
  {
    id: 'grave',
    name: 'Grave',
    description: 'Grave',
    minWeeks: 10,
    maxWeeks: 12,
    weight: 1,
    healthPenalty: -30,
  },
];

describe('rollInjuryChance', () => {
  it('sube el riesgo cuanto peor está la forma física', () => {
    const fit = baseProtagonist({ fitness: 90 });
    const unfit = baseProtagonist({ fitness: 10 });
    let fitInjuries = 0;
    let unfitInjuries = 0;
    const trials = 500;
    for (let seed = 0; seed < trials; seed++) {
      if (rollInjuryChance(fit, new RNG(seed))) fitInjuries++;
      if (rollInjuryChance(unfit, new RNG(seed))) unfitInjuries++;
    }
    expect(unfitInjuries).toBeGreaterThan(fitInjuries);
  });
});

describe('applyInjuryOnset', () => {
  it('fija una lesión con duración dentro del rango del tipo elegido', () => {
    for (let seed = 0; seed < 50; seed++) {
      const protagonist = baseProtagonist();
      const result = applyInjuryOnset(protagonist, INJURY_TYPES, new RNG(seed));
      expect(result.activeInjury).not.toBeNull();
      const type = INJURY_TYPES.find((t) => t.id === result.activeInjury!.typeId)!;
      expect(result.activeInjury!.weeksRemaining).toBeGreaterThanOrEqual(type.minWeeks);
      expect(result.activeInjury!.weeksRemaining).toBeLessThanOrEqual(type.maxWeeks);
    }
  });

  it('resta la penalización de salud del tipo elegido', () => {
    const protagonist = baseProtagonist({ health: 70 });
    const result = applyInjuryOnset(protagonist, [INJURY_TYPES[0]!], new RNG(1));
    expect(result.health).toBe(65);
  });
});

describe('advanceInjuryRest', () => {
  it('resta una semana', () => {
    const protagonist = baseProtagonist({ activeInjury: { typeId: 'leve', weeksRemaining: 3 } });
    const result = advanceInjuryRest(protagonist);
    expect(result.activeInjury).toEqual({ typeId: 'leve', weeksRemaining: 2 });
  });

  it('limpia la lesión al llegar a 0', () => {
    const protagonist = baseProtagonist({ activeInjury: { typeId: 'leve', weeksRemaining: 1 } });
    const result = advanceInjuryRest(protagonist);
    expect(result.activeInjury).toBeNull();
  });
});

describe('attemptEarlyReturn', () => {
  it('lanza si no hay lesión activa', () => {
    expect(() => attemptEarlyReturn(baseProtagonist(), INJURY_TYPES, new RNG(1))).toThrow();
  });

  it('con éxito limpia la lesión y penaliza la forma', () => {
    const protagonist = baseProtagonist({
      health: 99,
      form: 70,
      activeInjury: { typeId: 'leve', weeksRemaining: 2 },
    });
    let sawSuccess = false;
    for (let seed = 0; seed < 50; seed++) {
      const result = attemptEarlyReturn(protagonist, INJURY_TYPES, new RNG(seed));
      if (result.success) {
        sawSuccess = true;
        expect(result.protagonist.activeInjury).toBeNull();
        expect(result.protagonist.form).toBeLessThan(70);
      } else {
        expect(result.protagonist.activeInjury).not.toBeNull();
        expect(result.protagonist.health).toBeLessThan(99);
      }
    }
    expect(sawSuccess).toBe(true);
  });

  it('con fallo alarga la lesión en vez de limpiarla', () => {
    const protagonist = baseProtagonist({
      health: 1,
      activeInjury: { typeId: 'leve', weeksRemaining: 2 },
    });
    let sawFailure = false;
    for (let seed = 0; seed < 50; seed++) {
      const result = attemptEarlyReturn(protagonist, INJURY_TYPES, new RNG(seed));
      if (!result.success) {
        sawFailure = true;
        expect(result.protagonist.activeInjury).not.toBeNull();
        expect(result.protagonist.activeInjury!.typeId).toBe('leve');
      }
    }
    expect(sawFailure).toBe(true);
  });
});
