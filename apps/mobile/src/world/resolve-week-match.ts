import { RNG, simulateMatch } from '@leyenda/engine';
import type { Club, Country, ISODate, Match, MatchResult } from '@leyenda/shared';

import { countries } from '@/content';
import { resolveDivisionCalendar, type ClubSeasonQuery } from './resolve-division-calendar';
import { generateSquadForClub } from './generate-squad-for-club';

/** Partido programado del club en una fecha (todavía sin simular). */
export interface ScheduledWeekMatch {
  match: Match;
  homeClub: Club;
  awayClub: Club;
  isHome: boolean;
  divisionClubs: Club[];
  seasonIndex: number;
}

export interface WeekMatchResolution {
  homeClub: Club;
  awayClub: Club;
  result: MatchResult;
  isHome: boolean;
}

/** Busca el partido del club en una fecha, si lo hay. */
export function findWeekMatch(
  query: ClubSeasonQuery,
  date: ISODate,
  allCountries: Country[] = countries
): ScheduledWeekMatch | null {
  const resolved = resolveDivisionCalendar(query, date, allCountries);
  if (!resolved) return null;
  const { myClub, divisionClubs, calendar, seasonIndex } = resolved;

  const match = calendar.matches.find(
    (m) => m.date === date && (m.homeTeamId === myClub.id || m.awayTeamId === myClub.id)
  );
  if (!match) return null;

  const homeClub = divisionClubs.find((c) => c.id === match.homeTeamId);
  const awayClub = divisionClubs.find((c) => c.id === match.awayTeamId);
  if (!homeClub || !awayClub) return null;

  return {
    match,
    homeClub,
    awayClub,
    isHome: match.homeTeamId === myClub.id,
    divisionClubs,
    seasonIndex,
  };
}

/**
 * Resuelve (y simula con las plantillas generadas) el partido del club en
 * una fecha, si lo hay — Modo Jugador. Nada de esto se persiste.
 */
export function resolveWeekMatch(
  query: ClubSeasonQuery,
  date: ISODate,
  allCountries: Country[] = countries
): WeekMatchResolution | null {
  const scheduled = findWeekMatch(query, date, allCountries);
  if (!scheduled) return null;
  const { match, homeClub, awayClub, isHome } = scheduled;

  const homeSquad = generateSquadForClub(query.seed, homeClub, allCountries);
  const awaySquad = generateSquadForClub(query.seed, awayClub, allCountries);
  const simulated = simulateMatch(match, homeSquad, awaySquad, new RNG(match.seed));

  return { homeClub, awayClub, result: simulated.result, isHome };
}
