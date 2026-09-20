import { describe, expect, it } from 'vitest';
import fc from 'fast-check';

import type { KeyMoment, ProtagonistPlayer } from '@leyenda/shared';
import { RNG } from '../rng';

import {
  applyMatchExperience,
  computeMatchRating,
  resolveKeyMomentChoice,
  selectKeyMoments,
} from './key-moments';
import type { KeyMomentOutcome } from './types';

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
    ...overrides,
  };
}

const MOMENT_ATTACKING: KeyMoment = {
  id: 'moment-attack',
  situation: 'Ocasión de prueba',
  positions: ['CF'],
  choices: [
    {
      id: 'choice-shoot',
      label: 'Chutar',
      determinedBy: 'shooting',
      baseSuccessChance: 0.5,
      ratingDelta: { onSuccess: 2, onFail: -1 },
      fanRelationDelta: { onSuccess: 5, onFail: -2 },
      implies: 'goal',
    },
  ],
};

const MOMENT_GK: KeyMoment = {
  id: 'moment-gk',
  situation: 'Parada de prueba',
  positions: ['GK'],
  choices: [
    {
      id: 'choice-save',
      label: 'Parar',
      determinedBy: 'reflexes',
      baseSuccessChance: 0.5,
      ratingDelta: { onSuccess: 2, onFail: -1 },
      fanRelationDelta: { onSuccess: 5, onFail: -2 },
      implies: null,
    },
  ],
};

const MOMENT_ANY: KeyMoment = {
  id: 'moment-any',
  situation: 'Situación general de prueba',
  positions: 'any',
  choices: [
    {
      id: 'choice-calm',
      label: 'Calma',
      determinedBy: 'composure',
      baseSuccessChance: 0.5,
      ratingDelta: { onSuccess: 1, onFail: -0.5 },
      fanRelationDelta: { onSuccess: 2, onFail: -1 },
      implies: null,
    },
  ],
};

const ALL_MOMENTS = [MOMENT_ATTACKING, MOMENT_GK, MOMENT_ANY];

describe('selectKeyMoments', () => {
  it('nunca selecciona un momento de otra posición', () => {
    const selected = selectKeyMoments('GK', ALL_MOMENTS, new RNG(1), 3);
    expect(selected.map((m) => m.id)).not.toContain('moment-attack');
  });

  it('incluye siempre los momentos "any" cuando caben', () => {
    const selected = selectKeyMoments('GK', ALL_MOMENTS, new RNG(1), 3);
    expect(selected.map((m) => m.id)).toContain('moment-any');
  });

  it('es determinista', () => {
    const a = selectKeyMoments('CF', ALL_MOMENTS, new RNG(7), 2);
    const b = selectKeyMoments('CF', ALL_MOMENTS, new RNG(7), 2);
    expect(a).toEqual(b);
  });
});

describe('resolveKeyMomentChoice', () => {
  it('es determinista', () => {
    const protagonist = baseProtagonist();
    const a = resolveKeyMomentChoice(protagonist, MOMENT_ATTACKING, 'choice-shoot', new RNG(1));
    const b = resolveKeyMomentChoice(protagonist, MOMENT_ATTACKING, 'choice-shoot', new RNG(1));
    expect(a).toEqual(b);
  });

  it('un atributo más alto da más éxitos en muchas tiradas', () => {
    const strong = baseProtagonist({
      technical: {
        passing: 50,
        dribbling: 50,
        shooting: 95,
        ballControl: 50,
        defending: 50,
        heading: 50,
      },
    });
    const weak = baseProtagonist({
      technical: {
        passing: 50,
        dribbling: 50,
        shooting: 10,
        ballControl: 50,
        defending: 50,
        heading: 50,
      },
    });

    let strongSuccesses = 0;
    let weakSuccesses = 0;
    const trials = 200;
    for (let seed = 0; seed < trials; seed++) {
      if (resolveKeyMomentChoice(strong, MOMENT_ATTACKING, 'choice-shoot', new RNG(seed)).success) {
        strongSuccesses++;
      }
      if (resolveKeyMomentChoice(weak, MOMENT_ATTACKING, 'choice-shoot', new RNG(seed)).success) {
        weakSuccesses++;
      }
    }
    expect(strongSuccesses).toBeGreaterThan(weakSuccesses);
  });

  it('lanza si la elección no existe en el momento', () => {
    expect(() =>
      resolveKeyMomentChoice(baseProtagonist(), MOMENT_ATTACKING, 'choice-inexistente', new RNG(1))
    ).toThrow();
  });

  it('implies solo se propaga si hay éxito', () => {
    for (let seed = 0; seed < 50; seed++) {
      const result = resolveKeyMomentChoice(
        baseProtagonist(),
        MOMENT_ATTACKING,
        'choice-shoot',
        new RNG(seed)
      );
      if (result.success) {
        expect(result.implies).toBe('goal');
      } else {
        expect(result.implies).toBeNull();
      }
    }
  });
});

describe('computeMatchRating', () => {
  it('siempre está en el rango [1, 10]', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ ratingDelta: fc.float({ min: -20, max: 20, noNaN: true }) }), {
          minLength: 0,
          maxLength: 6,
        }),
        (partials) => {
          const outcomes = partials.map((p, i): KeyMomentOutcome => ({
            momentId: `m${i}`,
            choiceId: `c${i}`,
            success: true,
            ratingDelta: p.ratingDelta,
            fanRelationDelta: 0,
            implies: null,
          }));
          const rating = computeMatchRating(outcomes);
          expect(rating).toBeGreaterThanOrEqual(1);
          expect(rating).toBeLessThanOrEqual(10);
        }
      )
    );
  });

  it('sin momentos clave da la nota base', () => {
    expect(computeMatchRating([])).toBe(6);
  });
});

describe('applyMatchExperience', () => {
  it('aplica clamp en relations.fans', () => {
    const protagonist = baseProtagonist({
      relations: { ...baseProtagonist().relations, fans: 98 },
    });
    const outcomes: KeyMomentOutcome[] = [
      {
        momentId: 'm1',
        choiceId: 'c1',
        success: true,
        ratingDelta: 1,
        fanRelationDelta: 10,
        implies: null,
      },
    ];
    const result = applyMatchExperience(protagonist, outcomes, 8);
    expect(result.relations.fans).toBe(100);
  });

  it('sube la forma con una nota alta y la baja con una nota baja', () => {
    const protagonist = baseProtagonist({ form: 70 });
    const goodMatch = applyMatchExperience(protagonist, [], 9);
    const badMatch = applyMatchExperience(protagonist, [], 2);
    expect(goodMatch.form).toBeGreaterThan(protagonist.form);
    expect(badMatch.form).toBeLessThan(protagonist.form);
  });

  it('gamesPlayed sube siempre, haya o no momentos con éxito', () => {
    const protagonist = baseProtagonist({ gamesPlayed: 5 });
    const result = applyMatchExperience(protagonist, [], 6);
    expect(result.gamesPlayed).toBe(6);
  });

  it('goalsScored/assists suman solo los outcomes con implies y éxito', () => {
    const protagonist = baseProtagonist({ goalsScored: 2, assists: 1 });
    const outcomes: KeyMomentOutcome[] = [
      {
        momentId: 'm1',
        choiceId: 'c1',
        success: true,
        ratingDelta: 1,
        fanRelationDelta: 0,
        implies: 'goal',
      },
      {
        momentId: 'm2',
        choiceId: 'c2',
        success: true,
        ratingDelta: 1,
        fanRelationDelta: 0,
        implies: 'assist',
      },
      {
        momentId: 'm3',
        choiceId: 'c3',
        success: false,
        ratingDelta: -1,
        fanRelationDelta: 0,
        implies: null,
      },
    ];
    const result = applyMatchExperience(protagonist, outcomes, 6);
    expect(result.goalsScored).toBe(3);
    expect(result.assists).toBe(2);
  });
});
