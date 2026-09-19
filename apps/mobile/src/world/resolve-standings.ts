import { RNG, computeStandings, simulateMatch } from '@leyenda/engine';
import type { Club, Country, ISODate, ProtagonistPlayer, Standing } from '@leyenda/shared';

import { countries } from '@/content';
import { resolveDivisionCalendar } from './resolve-division-calendar';
import { generateSquadForClub } from './generate-squad-for-club';

export interface StandingsResolution {
  divisionClubs: Club[];
  standings: Standing[];
}

/**
 * Simula todos los partidos ya jugados (fecha anterior a `currentDate`)
 * del club del protagonista y calcula la clasificación con
 * `computeStandings` (ya existe, Fase 1). Las plantillas rivales se
 * generan una sola vez por club (no una vez por partido) — una división
 * de 12 clubes puede tener hasta ~130 partidos en una temporada completa.
 */
export function resolveStandings(
  seed: number,
  protagonist: ProtagonistPlayer,
  currentDate: ISODate,
  allCountries: Country[] = countries
): StandingsResolution | null {
  const resolved = resolveDivisionCalendar(seed, protagonist, allCountries);
  if (!resolved) return null;
  const { divisionClubs, calendar } = resolved;

  const squadsByClub = new Map(
    divisionClubs.map((club) => [club.id, generateSquadForClub(seed, club, allCountries)])
  );

  const playedMatches = calendar.matches
    .filter((match) => match.date < currentDate)
    .map((match) => {
      const homeSquad = squadsByClub.get(match.homeTeamId) ?? [];
      const awaySquad = squadsByClub.get(match.awayTeamId) ?? [];
      return simulateMatch(match, homeSquad, awaySquad, new RNG(match.seed));
    });

  const standings = computeStandings(
    playedMatches,
    divisionClubs.map((c) => c.id)
  );

  return { divisionClubs, standings };
}
