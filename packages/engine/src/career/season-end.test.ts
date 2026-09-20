import { describe, expect, it } from 'vitest';

import type { ProtagonistPlayer } from '@leyenda/shared';

import { applySeasonEndResult } from './season-end';

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
    ...overrides,
  };
}

describe('applySeasonEndResult', () => {
  it('sin título no cambia nada', () => {
    const protagonist = baseProtagonist();
    const result = applySeasonEndResult(protagonist, null);
    expect(result).toBe(protagonist);
  });

  it('añade el título si no lo tenía', () => {
    const protagonist = baseProtagonist();
    const result = applySeasonEndResult(protagonist, 'season-liga-a-2026');
    expect(result.titlesWon).toEqual(['season-liga-a-2026']);
  });

  it('no duplica un título ya ganado', () => {
    const protagonist = baseProtagonist({ titlesWon: ['season-liga-a-2026'] });
    const result = applySeasonEndResult(protagonist, 'season-liga-a-2026');
    expect(result).toBe(protagonist);
    expect(result.titlesWon).toEqual(['season-liga-a-2026']);
  });
});
