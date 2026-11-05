import { RNG, computeStandings, simulateMatch } from '@leyenda/engine';
import type {
  BasePlayer,
  Club,
  Country,
  CountryCode,
  EntityId,
  ISODate,
  Match,
  MatchResult,
  Standing,
  WorldState,
} from '@leyenda/shared';

import { countries } from '@/content';
import {
  resolveCountryClubs,
  resolveDivisionCalendar,
  resolveLeagueCalendar,
  type ClubSeasonQuery,
} from './resolve-division-calendar';
import { generateSquadForClub } from './generate-squad-for-club';

export interface StandingsResolution {
  divisionClubs: Club[];
  standings: Standing[];
  seasonIndex: number;
}

/**
 * Resultados ya decididos que no se deben re-simular: los partidos del
 * club del entrenador (su plantilla cambia con el tiempo, así que el
 * marcador "real" es el que se jugó, ver `CoachCareer.results`).
 */
export interface StandingsOptions {
  fixedResults?: Record<EntityId, MatchResult>;
}

function playMatches(
  matches: Match[],
  divisionClubs: Club[],
  seed: number,
  allCountries: Country[],
  options: StandingsOptions
): Match[] {
  const squadsByClub = new Map<EntityId, BasePlayer[]>();
  const squadFor = (club: Club | undefined): BasePlayer[] => {
    if (!club) return [];
    const cached = squadsByClub.get(club.id);
    if (cached) return cached;
    const squad = generateSquadForClub(seed, club, allCountries);
    squadsByClub.set(club.id, squad);
    return squad;
  };
  const clubById = new Map(divisionClubs.map((c) => [c.id, c]));

  return matches.map((match) => {
    const fixed = options.fixedResults?.[match.id];
    if (fixed) return { ...match, result: fixed, simulated: true };
    return simulateMatch(
      match,
      squadFor(clubById.get(match.homeTeamId)),
      squadFor(clubById.get(match.awayTeamId)),
      new RNG(match.seed)
    );
  });
}

/**
 * Simula todos los partidos ya jugados (fecha anterior a `currentDate`) de
 * la división del club en la temporada en curso y calcula la clasificación
 * con `computeStandings`. Las plantillas se generan una sola vez por club.
 */
export function resolveStandings(
  query: ClubSeasonQuery,
  currentDate: ISODate,
  options: StandingsOptions = {},
  allCountries: Country[] = countries
): StandingsResolution | null {
  const resolved = resolveDivisionCalendar(query, currentDate, allCountries);
  if (!resolved) return null;
  const { divisionClubs, calendar, seasonIndex } = resolved;

  const played = playMatches(
    calendar.matches.filter((match) => match.date < currentDate),
    divisionClubs,
    query.seed,
    allCountries,
    options
  );
  const standings = computeStandings(
    played,
    divisionClubs.map((c) => c.id)
  );
  return { divisionClubs, standings, seasonIndex };
}

/**
 * Clasificación final de todas las divisiones del país en una temporada
 * (todos sus partidos), para cerrarla con ascensos y descensos.
 */
export function resolveFinalStandingsByLevel(
  seed: number,
  countryCode: CountryCode,
  worldState: WorldState | null,
  seasonIndex: number,
  options: StandingsOptions = {},
  allCountries: Country[] = countries
): Record<number, Standing[]> {
  const country = allCountries.find((c) => c.code === countryCode);
  if (!country) return {};
  const clubs = resolveCountryClubs(seed, countryCode, worldState, seasonIndex);
  const levels = [...new Set(clubs.map((c) => c.divisionLevel))].sort((a, b) => a - b);

  const result: Record<number, Standing[]> = {};
  for (const level of levels) {
    const divisionClubs = clubs.filter((c) => c.divisionLevel === level);
    const calendar = resolveLeagueCalendar(seed, country, divisionClubs, level, seasonIndex);
    if (!calendar) continue;
    const played = playMatches(calendar.matches, divisionClubs, seed, allCountries, options);
    result[level] = computeStandings(
      played,
      divisionClubs.map((c) => c.id)
    );
  }
  return result;
}
