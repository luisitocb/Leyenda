import { addDays } from '@leyenda/engine';
import { SEASON_ONE_START_DATE } from '@leyenda/worldgen/src/constants';

import { countries } from '@/content';
import type { ClubSeasonQuery } from './resolve-division-calendar';
import { resolveWeekMatch } from './resolve-week-match';

const QUERY: ClubSeasonQuery = {
  seed: 42,
  countryCode: 'XA',
  clubId: 'club-XA-2-1',
  worldState: null,
};

describe('resolveWeekMatch', () => {
  it('encuentra un partido en la primera fecha de temporada con marcador válido', () => {
    const result = resolveWeekMatch(QUERY, SEASON_ONE_START_DATE, countries);
    expect(result).not.toBeNull();
    expect(result?.result.homeGoals).toBeGreaterThanOrEqual(0);
    expect(result?.result.awayGoals).toBeGreaterThanOrEqual(0);
    expect([result?.homeClub.id, result?.awayClub.id]).toContain('club-XA-2-1');
  });

  it('devuelve null en pretemporada', () => {
    expect(resolveWeekMatch(QUERY, '2027-07-10', countries)).toBeNull();
  });

  it('hay partidos también en temporadas posteriores a la primera', () => {
    let found = 0;
    for (let week = 0; week < 52; week++) {
      const date = addDays('2030-08-03', week * 7);
      if (resolveWeekMatch(QUERY, date, countries)) found++;
    }
    expect(found).toBe(22);
  });

  it('es determinista', () => {
    const a = resolveWeekMatch(QUERY, SEASON_ONE_START_DATE, countries);
    const b = resolveWeekMatch(QUERY, SEASON_ONE_START_DATE, countries);
    expect(a).toEqual(b);
  });

  it('isHome es true en algunas semanas y false en otras a lo largo de la temporada', () => {
    const seenHome = new Set<boolean>();
    for (let week = 0; week < 42; week++) {
      const date = addDays(SEASON_ONE_START_DATE, week * 7);
      const result = resolveWeekMatch(QUERY, date, countries);
      if (result) seenHome.add(result.isHome);
    }
    expect(seenHome.has(true)).toBe(true);
    expect(seenHome.has(false)).toBe(true);
  });
});
