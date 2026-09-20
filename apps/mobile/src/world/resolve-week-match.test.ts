import type { ProtagonistPlayer } from '@leyenda/shared';
import { addDays } from '@leyenda/engine';
import { SEASON_ONE_START_DATE } from '@leyenda/worldgen/src/constants';

import { countries } from '@/content';
import { resolveWeekMatch } from './resolve-week-match';

const SEED = 42;

function makeProtagonist(overrides: Partial<ProtagonistPlayer> = {}): ProtagonistPlayer {
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
    // Los ids de club no dependen de la seed (solo nombre/reputación/dinero),
    // así que club-XA-2-1 siempre es un club real de división 2 de XA.
    clubId: 'club-XA-2-1',
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
    ...overrides,
  };
}

describe('resolveWeekMatch', () => {
  it('encuentra un partido en la primera fecha de temporada con marcador válido', () => {
    const result = resolveWeekMatch(SEED, makeProtagonist(), SEASON_ONE_START_DATE, countries);
    expect(result).not.toBeNull();
    expect(result?.result.homeGoals).toBeGreaterThanOrEqual(0);
    expect(result?.result.awayGoals).toBeGreaterThanOrEqual(0);
    expect([result?.homeClub.id, result?.awayClub.id]).toContain('club-XA-2-1');
  });

  it('devuelve null fuera de temporada', () => {
    const result = resolveWeekMatch(SEED, makeProtagonist(), '2030-01-01', countries);
    expect(result).toBeNull();
  });

  it('es determinista', () => {
    const a = resolveWeekMatch(SEED, makeProtagonist(), SEASON_ONE_START_DATE, countries);
    const b = resolveWeekMatch(SEED, makeProtagonist(), SEASON_ONE_START_DATE, countries);
    expect(a).toEqual(b);
  });

  it('isHome es true en algunas semanas y false en otras a lo largo de la temporada', () => {
    const seenHome = new Set<boolean>();
    for (let week = 0; week < 21; week++) {
      const date = addDays(SEASON_ONE_START_DATE, week * 7);
      const result = resolveWeekMatch(SEED, makeProtagonist(), date, countries);
      if (result) seenHome.add(result.isHome);
    }
    expect(seenHome.has(true)).toBe(true);
    expect(seenHome.has(false)).toBe(true);
  });
});
