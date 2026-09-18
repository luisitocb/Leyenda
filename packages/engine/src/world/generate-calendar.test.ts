import { describe, expect, it } from 'vitest';

import type { Club, Competition } from '@leyenda/shared';
import { RNG } from '../rng';

import { generateSeasonCalendar } from './generate-calendar';

const COMPETITION: Competition = {
  id: 'league-XA-1',
  name: 'Primera de Aurelia',
  type: 'league',
  countryCode: 'XA',
  level: 1,
};

function buildClubs(count: number): Club[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `club-XA-1-${i + 1}`,
    name: `Club ${i + 1}`,
    shortName: `C${i + 1}`,
    countryCode: 'XA',
    reputation: 15,
    divisionLevel: 1,
    money: 1_000_000,
  }));
}

describe('generateSeasonCalendar', () => {
  it('es determinista', () => {
    const clubs = buildClubs(14);
    const a = generateSeasonCalendar({
      competition: COMPETITION,
      clubs,
      year: 2026,
      seasonStartDate: '2026-08-01',
      rng: new RNG(1),
    });
    const b = generateSeasonCalendar({
      competition: COMPETITION,
      clubs,
      year: 2026,
      seasonStartDate: '2026-08-01',
      rng: new RNG(1),
    });
    expect(a).toEqual(b);
  });

  it('genera el número exacto de partidos y jornadas para N=14', () => {
    const clubs = buildClubs(14);
    const calendar = generateSeasonCalendar({
      competition: COMPETITION,
      clubs,
      year: 2026,
      seasonStartDate: '2026-08-01',
      rng: new RNG(1),
    });
    expect(calendar.matches).toHaveLength(14 * 13);
    expect(calendar.fixtures).toHaveLength(2 * 13);
  });

  it('genera el número exacto de partidos y jornadas para N=12', () => {
    const clubs = buildClubs(12);
    const calendar = generateSeasonCalendar({
      competition: COMPETITION,
      clubs,
      year: 2026,
      seasonStartDate: '2026-08-01',
      rng: new RNG(1),
    });
    expect(calendar.matches).toHaveLength(12 * 11);
    expect(calendar.fixtures).toHaveLength(2 * 11);
  });

  it('cada club juega exactamente 2 veces contra cada otro club, una vez local y una visitante', () => {
    const clubs = buildClubs(14);
    const calendar = generateSeasonCalendar({
      competition: COMPETITION,
      clubs,
      year: 2026,
      seasonStartDate: '2026-08-01',
      rng: new RNG(3),
    });

    const pairCounts = new Map<string, { asHome: number; asAway: number }>();
    for (const match of calendar.matches) {
      const key = [match.homeTeamId, match.awayTeamId].sort().join('|');
      const entry = pairCounts.get(key) ?? { asHome: 0, asAway: 0 };
      if (match.homeTeamId < match.awayTeamId) entry.asHome++;
      else entry.asAway++;
      pairCounts.set(key, entry);
    }

    expect(pairCounts.size).toBe((14 * 13) / 2);
    for (const { asHome, asAway } of pairCounts.values()) {
      expect(asHome).toBe(1);
      expect(asAway).toBe(1);
    }
  });

  it('cada club juega N-1 partidos como local y N-1 como visitante', () => {
    const clubs = buildClubs(14);
    const calendar = generateSeasonCalendar({
      competition: COMPETITION,
      clubs,
      year: 2026,
      seasonStartDate: '2026-08-01',
      rng: new RNG(4),
    });

    for (const club of clubs) {
      const asHome = calendar.matches.filter((m) => m.homeTeamId === club.id).length;
      const asAway = calendar.matches.filter((m) => m.awayTeamId === club.id).length;
      expect(asHome).toBe(13);
      expect(asAway).toBe(13);
    }
  });

  it('cada jornada tiene N/2 partidos y ningún club se repite', () => {
    const clubs = buildClubs(14);
    const calendar = generateSeasonCalendar({
      competition: COMPETITION,
      clubs,
      year: 2026,
      seasonStartDate: '2026-08-01',
      rng: new RNG(5),
    });

    for (const fixture of calendar.fixtures) {
      expect(fixture.matches).toHaveLength(7);
      const clubsInFixture = fixture.matches.flatMap((matchId) => {
        const match = calendar.matches.find((m) => m.id === matchId)!;
        return [match.homeTeamId, match.awayTeamId];
      });
      expect(new Set(clubsInFixture).size).toBe(14);
    }
  });

  it('las fechas siguen la cadencia semanal desde seasonStartDate', () => {
    const clubs = buildClubs(14);
    const calendar = generateSeasonCalendar({
      competition: COMPETITION,
      clubs,
      year: 2026,
      seasonStartDate: '2026-08-01',
      rng: new RNG(1),
    });
    expect(calendar.fixtures[0]?.date).toBe('2026-08-01');
    expect(calendar.fixtures[1]?.date).toBe('2026-08-08');
    expect(calendar.season.startDate).toBe('2026-08-01');
  });

  it('ningún club juega más de 4 partidos seguidos como local (sanity, no estricto)', () => {
    const clubs = buildClubs(14);
    const calendar = generateSeasonCalendar({
      competition: COMPETITION,
      clubs,
      year: 2026,
      seasonStartDate: '2026-08-01',
      rng: new RNG(6),
    });

    for (const club of clubs) {
      let maxStreak = 0;
      let streak = 0;
      for (const fixture of calendar.fixtures) {
        const match = calendar.matches.find(
          (m) =>
            fixture.matches.includes(m.id) && (m.homeTeamId === club.id || m.awayTeamId === club.id)
        );
        if (!match) continue;
        if (match.homeTeamId === club.id) {
          streak++;
          maxStreak = Math.max(maxStreak, streak);
        } else {
          streak = 0;
        }
      }
      expect(maxStreak).toBeLessThanOrEqual(4);
    }
  });
});
