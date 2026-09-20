import { describe, expect, it } from 'vitest';

import type { DecisionEvent, ProtagonistPlayer } from '@leyenda/shared';
import { RNG } from '../rng';

import { resolveEventChoice, selectEvent } from './events';

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
    ...overrides,
  };
}

const NEUTRAL_EFFECTS = {
  attributeGroup: null,
  personalityDelta: {},
  vitalStateDelta: { health: 0, mentalHealth: 0, form: 0, fitness: 0 },
  relationsDelta: {},
  moneyDelta: 0,
} as const;

const HEAVY_EVENT: DecisionEvent = {
  id: 'heavy',
  category: 'test',
  text: 'Evento con mucho peso',
  weight: 9,
  choices: [
    {
      id: 'no-check',
      label: 'Sin riesgo',
      check: null,
      effects: NEUTRAL_EFFECTS,
      onFailEffects: null,
      grantsTrait: null,
    },
    {
      id: 'other',
      label: 'Otra',
      check: null,
      effects: NEUTRAL_EFFECTS,
      onFailEffects: null,
      grantsTrait: null,
    },
  ],
};

const LIGHT_EVENT: DecisionEvent = {
  id: 'light',
  category: 'test',
  text: 'Evento con poco peso',
  weight: 1,
  choices: [
    {
      id: 'only',
      label: 'Única',
      check: null,
      effects: NEUTRAL_EFFECTS,
      onFailEffects: null,
      grantsTrait: null,
    },
  ],
};

describe('selectEvent', () => {
  it('es determinista', () => {
    const a = selectEvent([HEAVY_EVENT, LIGHT_EVENT], new RNG(1));
    const b = selectEvent([HEAVY_EVENT, LIGHT_EVENT], new RNG(1));
    expect(a).toEqual(b);
  });

  it('a veces no toca ningún evento', () => {
    const results = new Set<boolean>();
    for (let seed = 0; seed < 30; seed++) {
      results.add(selectEvent([HEAVY_EVENT, LIGHT_EVENT], new RNG(seed)) === null);
    }
    expect(results.has(true)).toBe(true);
    expect(results.has(false)).toBe(true);
  });

  it('el evento con más peso sale más veces en muchas tiradas', () => {
    let heavyCount = 0;
    let lightCount = 0;
    const trials = 500;
    for (let seed = 0; seed < trials; seed++) {
      const event = selectEvent([HEAVY_EVENT, LIGHT_EVENT], new RNG(seed));
      if (event?.id === 'heavy') heavyCount++;
      if (event?.id === 'light') lightCount++;
    }
    expect(heavyCount).toBeGreaterThan(lightCount);
  });

  it('devuelve null si no hay eventos', () => {
    expect(selectEvent([], new RNG(1))).toBeNull();
  });
});

describe('resolveEventChoice', () => {
  it('es determinista', () => {
    const protagonist = baseProtagonist();
    const a = resolveEventChoice(protagonist, HEAVY_EVENT, 'no-check', new RNG(1));
    const b = resolveEventChoice(protagonist, HEAVY_EVENT, 'no-check', new RNG(1));
    expect(a).toEqual(b);
  });

  it('sin check aplica los efectos siempre y success es null', () => {
    const event: DecisionEvent = {
      id: 'e1',
      category: 'test',
      text: '...',
      weight: 1,
      choices: [
        {
          id: 'go',
          label: 'Ir',
          check: null,
          effects: { ...NEUTRAL_EFFECTS, moneyDelta: 100 },
          onFailEffects: null,
          grantsTrait: null,
        },
      ],
    };
    const result = resolveEventChoice(baseProtagonist({ money: 400 }), event, 'go', new RNG(1));
    expect(result.success).toBeNull();
    expect(result.protagonist.money).toBe(500);
  });

  it('con check aplica onFailEffects cuando falla y effects cuando acierta', () => {
    const event: DecisionEvent = {
      id: 'e2',
      category: 'test',
      text: '...',
      weight: 1,
      choices: [
        {
          id: 'risky',
          label: 'Arriesgar',
          check: { determinedBy: 'composure', baseSuccessChance: 0.5 },
          effects: { ...NEUTRAL_EFFECTS, moneyDelta: 100 },
          onFailEffects: { ...NEUTRAL_EFFECTS, moneyDelta: -50 },
          grantsTrait: null,
        },
      ],
    };

    let sawSuccess = false;
    let sawFail = false;
    for (let seed = 0; seed < 40; seed++) {
      const result = resolveEventChoice(
        baseProtagonist({ money: 400 }),
        event,
        'risky',
        new RNG(seed)
      );
      if (result.success) {
        expect(result.protagonist.money).toBe(500);
        sawSuccess = true;
      } else {
        expect(result.protagonist.money).toBe(350);
        sawFail = true;
      }
    }
    expect(sawSuccess).toBe(true);
    expect(sawFail).toBe(true);
  });

  it('grantsTrait añade el rasgo con la probabilidad dada', () => {
    const event: DecisionEvent = {
      id: 'e3',
      category: 'test',
      text: '...',
      weight: 1,
      choices: [
        {
          id: 'accept',
          label: 'Aceptar',
          check: null,
          effects: NEUTRAL_EFFECTS,
          onFailEffects: null,
          grantsTrait: { trait: 'controversial', chance: 1 },
        },
      ],
    };
    const result = resolveEventChoice(baseProtagonist(), event, 'accept', new RNG(1));
    expect(result.grantedTrait).toBe('controversial');
    expect(result.protagonist.traits).toContain('controversial');
  });

  it('no duplica un rasgo que el protagonista ya tenía', () => {
    const event: DecisionEvent = {
      id: 'e4',
      category: 'test',
      text: '...',
      weight: 1,
      choices: [
        {
          id: 'accept',
          label: 'Aceptar',
          check: null,
          effects: NEUTRAL_EFFECTS,
          onFailEffects: null,
          grantsTrait: { trait: 'controversial', chance: 1 },
        },
      ],
    };
    const protagonist = baseProtagonist({ traits: ['controversial'] });
    const result = resolveEventChoice(protagonist, event, 'accept', new RNG(1));
    expect(result.protagonist.traits).toEqual(['controversial']);
  });

  it('aplica clamp de personalidad en [1, 99]', () => {
    const event: DecisionEvent = {
      id: 'e5',
      category: 'test',
      text: '...',
      weight: 1,
      choices: [
        {
          id: 'go',
          label: 'Ir',
          check: null,
          effects: { ...NEUTRAL_EFFECTS, personalityDelta: { ego: 50 } },
          onFailEffects: null,
          grantsTrait: null,
        },
      ],
    };
    const protagonist = baseProtagonist({
      personality: { professionalism: 50, charisma: 50, ego: 90, temperament: 50 },
    });
    const result = resolveEventChoice(protagonist, event, 'go', new RNG(1));
    expect(result.protagonist.personality.ego).toBe(99);
  });

  it('lanza si la elección no existe en el evento', () => {
    expect(() =>
      resolveEventChoice(baseProtagonist(), HEAVY_EVENT, 'inexistente', new RNG(1))
    ).toThrow();
  });
});
