import {
  loadClubNamePool,
  loadPersonNamePool,
  loadRealClubRoster,
  type PersonNamePool,
} from '@leyenda/content';
import { RNG } from '@leyenda/engine';
import type { BasePlayer, Club, Competition, CountryCode } from '@leyenda/shared';

import { generateClubs } from './clubs/generate-clubs';
import { generateCompetitions } from './competitions/generate-competitions';
import { generateCountries } from './countries/generate-countries';
import { CLUBS_PER_DIVISION, DIVISIONS_PER_COUNTRY, SQUAD_SIZE } from './constants';
import { generateSquad } from './players/generate-squad';
import type { World, WorldgenConfig } from './types';

const DEFAULT_CONFIG: WorldgenConfig = {
  divisionsPerCountry: DIVISIONS_PER_COUNTRY,
  clubsPerDivision: CLUBS_PER_DIVISION,
  squadSize: SQUAD_SIZE,
};

/**
 * Genera la foto fija del mundo en la temporada 1: países, clubes,
 * competiciones y plantillas completas, de forma pura y determinista.
 */
export function generateWorld(seed: number, config: Partial<WorldgenConfig> = {}): World {
  const finalConfig: WorldgenConfig = { ...DEFAULT_CONFIG, ...config };
  const rng = new RNG(seed);

  const countries = generateCountries();
  const clubNamePool = loadClubNamePool();
  const namePools: Record<CountryCode, PersonNamePool> = {};
  for (const country of countries) {
    namePools[country.code] = loadPersonNamePool(country.code);
  }

  const clubs: Club[] = [];
  const competitions: Competition[] = [];

  for (const country of countries) {
    const realRoster = loadRealClubRoster(country.code);
    clubs.push(
      ...generateClubs({
        rng,
        country,
        clubNamePool,
        divisionsPerCountry: finalConfig.divisionsPerCountry,
        clubsPerDivision: finalConfig.clubsPerDivision,
        realRoster,
      })
    );
    competitions.push(...generateCompetitions(country, finalConfig.divisionsPerCountry));
  }

  const players: BasePlayer[] = [];
  for (const club of clubs) {
    players.push(...generateSquad({ rng, club, countries, namePools }));
  }

  return { countries, clubs, competitions, players };
}
