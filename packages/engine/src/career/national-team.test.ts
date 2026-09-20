import { describe, expect, it } from 'vitest';

import type { Country, ProtagonistPlayer } from '@leyenda/shared';
import { RNG } from '../rng';

import {
  applyNationalTeamExperience,
  pickRivalCountry,
  shouldReceiveCallUp,
} from './national-team';
import type { KeyMomentOutcome } from './types';

function baseProtagonist(overrides: Partial<ProtagonistPlayer> = {}): ProtagonistPlayer {
  return {
    id: 'protagonist-1',
    firstName: 'Test',
    lastName: 'Player',
    nationality: 'XA',
    dateOfBirth: '2000-01-01',
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
    potential: 90,
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

const COUNTRIES: Country[] = [
  { code: 'XA', name: 'Xandia', reputationBase: 10 },
  { code: 'XB', name: 'Xarelia', reputationBase: 8 },
  { code: 'XC', name: 'Xoria', reputationBase: 12 },
];

describe('shouldReceiveCallUp', () => {
  it('nunca convoca por debajo del umbral de habilidad', () => {
    const protagonist = baseProtagonist({ currentAbility: 64 });
    for (let seed = 0; seed < 200; seed++) {
      expect(shouldReceiveCallUp(protagonist, new RNG(seed))).toBe(false);
    }
  });

  it('varía por encima del umbral', () => {
    const protagonist = baseProtagonist({ currentAbility: 80 });
    const results = new Set<boolean>();
    for (let seed = 0; seed < 200; seed++) {
      results.add(shouldReceiveCallUp(protagonist, new RNG(seed)));
    }
    expect(results.has(true)).toBe(true);
    expect(results.has(false)).toBe(true);
  });
});

describe('pickRivalCountry', () => {
  it('nunca elige el país propio del protagonista', () => {
    for (let seed = 0; seed < 30; seed++) {
      const rival = pickRivalCountry('XA', COUNTRIES, new RNG(seed));
      expect(rival.code).not.toBe('XA');
    }
  });
});

describe('applyNationalTeamExperience', () => {
  it('sube nationalTeamCaps siempre, sin tocar gamesPlayed de club', () => {
    const protagonist = baseProtagonist({ gamesPlayed: 10, nationalTeamCaps: 2 });
    const result = applyNationalTeamExperience(protagonist, [], 6);
    expect(result.nationalTeamCaps).toBe(3);
    expect(result.gamesPlayed).toBe(10);
  });

  it('suma goles/asistencias de selección solo con éxito e implies', () => {
    const protagonist = baseProtagonist({ goalsScored: 5, nationalTeamGoals: 1 });
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
        success: false,
        ratingDelta: -1,
        fanRelationDelta: 0,
        implies: null,
      },
    ];
    const result = applyNationalTeamExperience(protagonist, outcomes, 7);
    expect(result.nationalTeamGoals).toBe(2);
    expect(result.goalsScored).toBe(5);
  });
});
