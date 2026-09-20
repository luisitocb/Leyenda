import type { ProtagonistPlayer } from '@leyenda/shared';
import { addDays } from '@leyenda/engine';
import { SEASON_ONE_START_DATE } from '@leyenda/worldgen/src/constants';

import { countries } from '@/content';
import { resolveStandings } from './resolve-standings';

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
    activeInjury: null,
    relationshipStatus: 'single',
    ...overrides,
  };
}

describe('resolveStandings', () => {
  it('en la primera fecha de temporada nadie ha jugado todavía', () => {
    const result = resolveStandings(SEED, makeProtagonist(), SEASON_ONE_START_DATE, countries);
    expect(result).not.toBeNull();
    expect(result?.standings).toHaveLength(12);
    expect(result?.standings.every((s) => s.played === 0)).toBe(true);
  });

  it('tras varias semanas hay partidos jugados', () => {
    const laterDate = addDays(SEASON_ONE_START_DATE, 5 * 7);
    const result = resolveStandings(SEED, makeProtagonist(), laterDate, countries);
    expect(result).not.toBeNull();
    const totalPlayed = result!.standings.reduce((sum, s) => sum + s.played, 0);
    expect(totalPlayed).toBeGreaterThan(0);
    // Cada partido suma 1 "jugado" a dos clubes.
    expect(totalPlayed % 2).toBe(0);
  });

  it('la clasificación está ordenada por puntos (y desempates) de forma coherente', () => {
    const laterDate = addDays(SEASON_ONE_START_DATE, 8 * 7);
    const result = resolveStandings(SEED, makeProtagonist(), laterDate, countries);
    const standings = result!.standings;
    for (let i = 1; i < standings.length; i++) {
      expect(standings[i]!.points).toBeLessThanOrEqual(standings[i - 1]!.points);
      expect(standings[i]!.position).toBe(i + 1);
    }
  });

  it('es determinista', () => {
    const laterDate = addDays(SEASON_ONE_START_DATE, 3 * 7);
    const a = resolveStandings(SEED, makeProtagonist(), laterDate, countries);
    const b = resolveStandings(SEED, makeProtagonist(), laterDate, countries);
    expect(a).toEqual(b);
  });

  it('devuelve null si el club del protagonista no existe', () => {
    const result = resolveStandings(
      SEED,
      makeProtagonist({ clubId: 'club-inexistente' }),
      SEASON_ONE_START_DATE,
      countries
    );
    expect(result).toBeNull();
  });
});
