import { describe, expect, it } from 'vitest';

import { RNG } from '@leyenda/engine';
import type { Club, Country, CountryCode } from '@leyenda/shared';
import { loadCountries, loadPersonNamePool, type PersonNamePool } from '@leyenda/content';

import { generateSquad } from './generate-squad';
import { SQUAD_POSITION_COUNTS } from '../constants';

const COUNTRIES: Country[] = loadCountries().map((c) => ({
  code: c.code,
  name: c.name,
  reputationBase: c.reputationBase,
}));

const NAME_POOLS: Record<CountryCode, PersonNamePool> = {};
for (const country of COUNTRIES) {
  NAME_POOLS[country.code] = loadPersonNamePool(country.code);
}

const CLUB: Club = {
  id: 'club-XA-1-1',
  name: 'Rivermouth United',
  shortName: 'RIV',
  countryCode: 'XA',
  reputation: 18,
  divisionLevel: 1,
  money: 1_000_000,
};

describe('generateSquad', () => {
  it('genera exactamente 28 jugadores', () => {
    const squad = generateSquad({
      rng: new RNG(1),
      club: CLUB,
      countries: COUNTRIES,
      namePools: NAME_POOLS,
    });
    expect(squad).toHaveLength(28);
  });

  it('respeta la distribución de posiciones exacta', () => {
    const squad = generateSquad({
      rng: new RNG(1),
      club: CLUB,
      countries: COUNTRIES,
      namePools: NAME_POOLS,
    });
    for (const [position, count] of Object.entries(SQUAD_POSITION_COUNTS)) {
      expect(squad.filter((p) => p.position === position)).toHaveLength(count);
    }
  });

  it('todos los jugadores pertenecen al club', () => {
    const squad = generateSquad({
      rng: new RNG(1),
      club: CLUB,
      countries: COUNTRIES,
      namePools: NAME_POOLS,
    });
    expect(squad.every((p) => p.clubId === CLUB.id)).toBe(true);
  });

  it('la mayoría de jugadores son del país del club (~75%)', () => {
    let domestic = 0;
    for (let seed = 0; seed < 20; seed++) {
      const squad = generateSquad({
        rng: new RNG(seed),
        club: CLUB,
        countries: COUNTRIES,
        namePools: NAME_POOLS,
      });
      domestic += squad.filter((p) => p.nationality === CLUB.countryCode).length;
    }
    const total = 20 * 28;
    expect(domestic / total).toBeGreaterThan(0.6);
    expect(domestic / total).toBeLessThan(0.85);
  });

  it('es determinista', () => {
    const a = generateSquad({
      rng: new RNG(5),
      club: CLUB,
      countries: COUNTRIES,
      namePools: NAME_POOLS,
    });
    const b = generateSquad({
      rng: new RNG(5),
      club: CLUB,
      countries: COUNTRIES,
      namePools: NAME_POOLS,
    });
    expect(a).toEqual(b);
  });
});
