import { describe, expect, it } from 'vitest';

import { RNG } from '@leyenda/engine';
import type { Country } from '@leyenda/shared';
import { loadClubNamePool, type RealClubRoster } from '@leyenda/content';

import { generateClubs } from './generate-clubs';

const COUNTRY: Country = { code: 'XA', name: 'Aurelia', reputationBase: 18 };
const CLUB_NAME_POOL = loadClubNamePool();

describe('generateClubs', () => {
  it('genera el número exacto de clubes por división', () => {
    const clubs = generateClubs({
      rng: new RNG(1),
      country: COUNTRY,
      clubNamePool: CLUB_NAME_POOL,
      divisionsPerCountry: 2,
      clubsPerDivision: { 1: 14, 2: 12 },
    });
    expect(clubs).toHaveLength(26);
    expect(clubs.filter((c) => c.divisionLevel === 1)).toHaveLength(14);
    expect(clubs.filter((c) => c.divisionLevel === 2)).toHaveLength(12);
  });

  it('división 1 tiene reputación media mayor que división 2', () => {
    const clubs = generateClubs({
      rng: new RNG(1),
      country: COUNTRY,
      clubNamePool: CLUB_NAME_POOL,
      divisionsPerCountry: 2,
      clubsPerDivision: { 1: 14, 2: 12 },
    });
    const avgDiv1 =
      clubs.filter((c) => c.divisionLevel === 1).reduce((sum, c) => sum + c.reputation, 0) / 14;
    const avgDiv2 =
      clubs.filter((c) => c.divisionLevel === 2).reduce((sum, c) => sum + c.reputation, 0) / 12;
    expect(avgDiv1).toBeGreaterThan(avgDiv2);
  });

  it('todos los clubes tienen countryCode del país y reputación 1-20', () => {
    const clubs = generateClubs({
      rng: new RNG(1),
      country: COUNTRY,
      clubNamePool: CLUB_NAME_POOL,
      divisionsPerCountry: 2,
      clubsPerDivision: { 1: 14, 2: 12 },
    });
    for (const club of clubs) {
      expect(club.countryCode).toBe('XA');
      expect(club.reputation).toBeGreaterThanOrEqual(1);
      expect(club.reputation).toBeLessThanOrEqual(20);
      expect(club.money).toBeGreaterThan(0);
    }
  });

  it('es determinista', () => {
    const input = {
      rng: new RNG(7),
      country: COUNTRY,
      clubNamePool: CLUB_NAME_POOL,
      divisionsPerCountry: 2,
      clubsPerDivision: { 1: 14, 2: 12 },
    };
    const a = generateClubs({ ...input, rng: new RNG(7) });
    const b = generateClubs({ ...input, rng: new RNG(7) });
    expect(a).toEqual(b);
  });

  describe('con realRoster (ADR-004)', () => {
    const REAL_COUNTRY: Country = { code: 'ES', name: 'España', reputationBase: 19 };
    const REAL_ROSTER: RealClubRoster = {
      '1': [
        { name: 'Real Madrid CF', shortName: 'Real Madrid', reputation: 20 },
        { name: 'FC Barcelona', shortName: 'Barcelona', reputation: 19 },
      ],
      '2': [{ name: 'Real Zaragoza', shortName: 'Zaragoza', reputation: 9 }],
    };

    it('usa los nombres y la reputación exactos de la lista, no los procedurales', () => {
      const clubs = generateClubs({
        rng: new RNG(1),
        country: REAL_COUNTRY,
        clubNamePool: CLUB_NAME_POOL,
        divisionsPerCountry: 2,
        clubsPerDivision: { 1: 14, 2: 12 },
        realRoster: REAL_ROSTER,
      });
      expect(clubs.map((c) => c.name)).toEqual(['Real Madrid CF', 'FC Barcelona', 'Real Zaragoza']);
      expect(clubs.find((c) => c.name === 'Real Madrid CF')?.reputation).toBe(20);
    });

    it('el número de clubes por división lo decide la lista, no clubsPerDivision', () => {
      const clubs = generateClubs({
        rng: new RNG(1),
        country: REAL_COUNTRY,
        clubNamePool: CLUB_NAME_POOL,
        divisionsPerCountry: 2,
        clubsPerDivision: { 1: 14, 2: 12 },
        realRoster: REAL_ROSTER,
      });
      expect(clubs.filter((c) => c.divisionLevel === 1)).toHaveLength(2);
      expect(clubs.filter((c) => c.divisionLevel === 2)).toHaveLength(1);
    });
  });
});
