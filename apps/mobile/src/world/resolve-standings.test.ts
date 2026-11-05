import { addDays } from '@leyenda/engine';
import { SEASON_ONE_START_DATE } from '@leyenda/worldgen/src/constants';

import { countries } from '@/content';
import type { ClubSeasonQuery } from './resolve-division-calendar';
import { resolveFinalStandingsByLevel, resolveStandings } from './resolve-standings';
import { findWeekMatch } from './resolve-week-match';

const QUERY: ClubSeasonQuery = {
  seed: 42,
  countryCode: 'XA',
  clubId: 'club-XA-2-1',
  worldState: null,
};

describe('resolveStandings', () => {
  it('en la primera fecha de temporada nadie ha jugado todavía', () => {
    const result = resolveStandings(QUERY, SEASON_ONE_START_DATE, {}, countries);
    expect(result).not.toBeNull();
    expect(result?.standings).toHaveLength(12);
    expect(result?.standings.every((s) => s.played === 0)).toBe(true);
  });

  it('tras varias semanas hay partidos jugados', () => {
    const laterDate = addDays(SEASON_ONE_START_DATE, 5 * 7);
    const result = resolveStandings(QUERY, laterDate, {}, countries);
    const totalPlayed = result!.standings.reduce((sum, s) => sum + s.played, 0);
    expect(totalPlayed).toBeGreaterThan(0);
    // Cada partido suma 1 "jugado" a dos clubes.
    expect(totalPlayed % 2).toBe(0);
  });

  it('la clasificación está ordenada por puntos (y desempates) de forma coherente', () => {
    const laterDate = addDays(SEASON_ONE_START_DATE, 8 * 7);
    const standings = resolveStandings(QUERY, laterDate, {}, countries)!.standings;
    for (let i = 1; i < standings.length; i++) {
      expect(standings[i]!.points).toBeLessThanOrEqual(standings[i - 1]!.points);
      expect(standings[i]!.position).toBe(i + 1);
    }
  });

  it('es determinista', () => {
    const laterDate = addDays(SEASON_ONE_START_DATE, 3 * 7);
    expect(resolveStandings(QUERY, laterDate, {}, countries)).toEqual(
      resolveStandings(QUERY, laterDate, {}, countries)
    );
  });

  it('devuelve null si el club no existe', () => {
    const result = resolveStandings(
      { ...QUERY, clubId: 'club-inexistente' },
      SEASON_ONE_START_DATE,
      {},
      countries
    );
    expect(result).toBeNull();
  });

  it('usa los resultados fijados en vez de re-simular esos partidos', () => {
    const scheduled = findWeekMatch(QUERY, SEASON_ONE_START_DATE, countries)!;
    const fixedResults = { [scheduled.match.id]: { homeGoals: 9, awayGoals: 0 } };
    const after = addDays(SEASON_ONE_START_DATE, 7);
    const result = resolveStandings(QUERY, after, { fixedResults }, countries)!;
    const home = result.standings.find((s) => s.clubId === scheduled.match.homeTeamId)!;
    expect(home.goalsFor).toBe(9);
    expect(home.points).toBe(3);
  });
});

describe('resolveFinalStandingsByLevel', () => {
  it('devuelve la clasificación completa de cada división', () => {
    const byLevel = resolveFinalStandingsByLevel(42, 'XA', null, 0, {}, countries);
    expect(Object.keys(byLevel).sort()).toEqual(['1', '2']);
    expect(byLevel[1]).toHaveLength(14);
    expect(byLevel[2]).toHaveLength(12);
    expect(byLevel[1]!.every((s) => s.played === 26)).toBe(true);
  });
});
