import { describe, expect, it } from 'vitest';

import type { ProtagonistPlayer } from '@leyenda/shared';
import { RNG } from '../rng';

import { applyWeeklyAction } from './apply-weekly-action';
import type { WeeklyActionEffect } from './types';

/** Object.values sobre una interfaz sin índice devuelve any[]; forzamos el tipo aquí. */
function numberValues(obj: object): number[] {
  return Object.values(obj as Record<string, number>);
}

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

const NEUTRAL_EFFECTS: WeeklyActionEffect['effects'] = {
  attributeGroup: null,
  vitalStateDelta: { health: 0, mentalHealth: 0, form: 0, fitness: 0 },
  relationsDelta: {},
  moneyDelta: 0,
};

describe('applyWeeklyAction', () => {
  it('es determinista', () => {
    const action: WeeklyActionEffect = {
      energyCost: 30,
      effects: { ...NEUTRAL_EFFECTS, attributeGroup: 'physical' },
    };
    const a = applyWeeklyAction(baseProtagonist(), action, new RNG(1));
    const b = applyWeeklyAction(baseProtagonist(), action, new RNG(1));
    expect(a).toEqual(b);
  });

  it('descuenta energyCost de la energía', () => {
    const action: WeeklyActionEffect = { energyCost: 30, effects: NEUTRAL_EFFECTS };
    const result = applyWeeklyAction(baseProtagonist({ energy: 80 }), action, new RNG(1));
    expect(result.energy).toBe(50);
  });

  it('un energyCost negativo devuelve energía, sin pasar de 100', () => {
    const action: WeeklyActionEffect = { energyCost: -30, effects: NEUTRAL_EFFECTS };
    const result = applyWeeklyAction(baseProtagonist({ energy: 90 }), action, new RNG(1));
    expect(result.energy).toBe(100);
  });

  it('rechaza si no hay energía suficiente', () => {
    const action: WeeklyActionEffect = { energyCost: 30, effects: NEUTRAL_EFFECTS };
    expect(() => applyWeeklyAction(baseProtagonist({ energy: 10 }), action, new RNG(1))).toThrow();
  });

  it('rechaza si no hay dinero suficiente', () => {
    const action: WeeklyActionEffect = {
      energyCost: 0,
      effects: { ...NEUTRAL_EFFECTS, moneyDelta: -500 },
    };
    expect(() => applyWeeklyAction(baseProtagonist({ money: 100 }), action, new RNG(1))).toThrow();
  });

  it('aplica moneyDelta al dinero', () => {
    const action: WeeklyActionEffect = {
      energyCost: 0,
      effects: { ...NEUTRAL_EFFECTS, moneyDelta: -100 },
    };
    const result = applyWeeklyAction(baseProtagonist({ money: 400 }), action, new RNG(1));
    expect(result.money).toBe(300);
  });

  it('aplica vitalStateDelta con clamp en los límites', () => {
    const action: WeeklyActionEffect = {
      energyCost: 0,
      effects: {
        ...NEUTRAL_EFFECTS,
        vitalStateDelta: { health: 20, mentalHealth: 0, form: 0, fitness: 20 },
      },
    };
    const result = applyWeeklyAction(
      baseProtagonist({ health: 90, fitness: 95 }),
      action,
      new RNG(1)
    );
    expect(result.health).toBe(99);
    expect(result.fitness).toBe(100);
  });

  it('aplica relationsDelta con clamp en [-100, 100]', () => {
    const action: WeeklyActionEffect = {
      energyCost: 0,
      effects: { ...NEUTRAL_EFFECTS, relationsDelta: { squad: 20, family: 5 } },
    };
    const result = applyWeeklyAction(
      baseProtagonist({ relations: { ...baseProtagonist().relations, squad: 95 } }),
      action,
      new RNG(1)
    );
    expect(result.relations.squad).toBe(100);
    expect(result.relations.family).toBe(5);
  });

  it('entrenar un grupo sube ese grupo de media más que sin entrenar', () => {
    const action: WeeklyActionEffect = {
      energyCost: 30,
      effects: { ...NEUTRAL_EFFECTS, attributeGroup: 'physical' },
    };
    const avg = (values: number[]): number => values.reduce((a, b) => a + b, 0) / values.length;

    let trainedTotal = 0;
    let untouchedTotal = 0;
    const trials = 30;
    for (let seed = 0; seed < trials; seed++) {
      const trained = applyWeeklyAction(baseProtagonist(), action, new RNG(seed));
      trainedTotal += avg(numberValues(trained.physical));
      untouchedTotal += avg(numberValues(baseProtagonist().physical));
    }
    expect(trainedTotal / trials).toBeGreaterThan(untouchedTotal / trials);
  });

  it('entrenar no toca los otros dos grupos', () => {
    const action: WeeklyActionEffect = {
      energyCost: 30,
      effects: { ...NEUTRAL_EFFECTS, attributeGroup: 'technical' },
    };
    const base = baseProtagonist();
    const result = applyWeeklyAction(base, action, new RNG(1));
    expect(result.physical).toEqual(base.physical);
    expect(result.mental).toEqual(base.mental);
  });

  it('entrena GoalkeeperAttributes si la posición es GK', () => {
    const gk = baseProtagonist({
      position: 'GK',
      technical: { reflexes: 50, positioning: 50, aerialAbility: 50 },
    });
    const action: WeeklyActionEffect = {
      energyCost: 30,
      effects: { ...NEUTRAL_EFFECTS, attributeGroup: 'technical' },
    };
    const result = applyWeeklyAction(gk, action, new RNG(1));
    expect('reflexes' in result.technical).toBe(true);
  });
});
