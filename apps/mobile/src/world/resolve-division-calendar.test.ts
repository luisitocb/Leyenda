import { addDays, closeSeason, createWorldState } from '@leyenda/engine';
import { SEASON_ONE_START_DATE } from '@leyenda/worldgen/src/constants';

import { countries } from '@/content';
import {
  isSeasonJustEnded,
  resolveCountryClubs,
  resolveDivisionCalendar,
  seasonIndexForDate,
  type ClubSeasonQuery,
} from './resolve-division-calendar';
import { resolveFinalStandingsByLevel } from './resolve-standings';

const QUERY: ClubSeasonQuery = {
  seed: 42,
  countryCode: 'XA',
  clubId: 'club-XA-2-1',
  worldState: null,
};

describe('isSeasonJustEnded', () => {
  it('es false durante la temporada, incluida la fecha del último partido', () => {
    const resolved = resolveDivisionCalendar(QUERY, SEASON_ONE_START_DATE, countries);
    expect(resolved).not.toBeNull();
    expect(isSeasonJustEnded(resolved!.calendar, SEASON_ONE_START_DATE)).toBe(false);
    expect(isSeasonJustEnded(resolved!.calendar, resolved!.calendar.season.endDate)).toBe(false);
  });

  it('es true exactamente la semana siguiente al último partido', () => {
    const resolved = resolveDivisionCalendar(QUERY, SEASON_ONE_START_DATE, countries);
    const weekAfterEnd = addDays(resolved!.calendar.season.endDate, 7);
    expect(isSeasonJustEnded(resolved!.calendar, weekAfterEnd)).toBe(true);
  });

  it('es false varias semanas después de terminada la temporada', () => {
    const resolved = resolveDivisionCalendar(QUERY, SEASON_ONE_START_DATE, countries);
    const monthsAfterEnd = addDays(resolved!.calendar.season.endDate, 28);
    expect(isSeasonJustEnded(resolved!.calendar, monthsAfterEnd)).toBe(false);
  });
});

describe('temporadas sucesivas', () => {
  it('la temporada termina antes de que empiece la siguiente (hay pretemporada)', () => {
    const first = resolveDivisionCalendar(QUERY, SEASON_ONE_START_DATE, countries)!;
    const nextStart = addDays(first.calendar.season.endDate, 8 * 7);
    expect(seasonIndexForDate(first.calendar.season.endDate)).toBe(0);
    expect(seasonIndexForDate(addDays(first.calendar.season.endDate, 7))).toBe(0);
    const later = resolveDivisionCalendar(QUERY, addDays(nextStart, 6 * 7), countries)!;
    expect(later.seasonIndex).toBe(1);
    expect(later.calendar.season.year).toBe(2027);
  });

  it('cada temporada tiene su propio calendario (no se repite el de la primera)', () => {
    const first = resolveDivisionCalendar(QUERY, SEASON_ONE_START_DATE, countries)!;
    const second = resolveDivisionCalendar(QUERY, '2027-12-01', countries)!;
    expect(second.seasonIndex).toBe(1);
    expect(second.calendar.matches[0]!.id).not.toBe(first.calendar.matches[0]!.id);
    expect(second.calendar.matches.every((m) => m.date >= '2027-08-01')).toBe(true);
  });

  it('los ascensos del WorldState cambian la división del club la temporada siguiente', () => {
    const standingsByLevel = resolveFinalStandingsByLevel(42, 'XA', null, 0, {}, countries);
    const champion2 = standingsByLevel[2]![0]!.clubId;
    const worldState = closeSeason(createWorldState('XA'), {
      seasonIndex: 0,
      year: 2026,
      standingsByLevel,
    });

    const season0 = resolveCountryClubs(42, 'XA', worldState, 0);
    const season1 = resolveCountryClubs(42, 'XA', worldState, 1);
    expect(season0.find((c) => c.id === champion2)?.divisionLevel).toBe(2);
    expect(season1.find((c) => c.id === champion2)?.divisionLevel).toBe(1);

    const promotedQuery = { ...QUERY, clubId: champion2, worldState };
    const calendar = resolveDivisionCalendar(promotedQuery, '2027-12-01', countries)!;
    expect(calendar.myClub.divisionLevel).toBe(1);
    expect(calendar.divisionClubs).toHaveLength(14);
  });
});
