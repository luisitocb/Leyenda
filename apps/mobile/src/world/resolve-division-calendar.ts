import {
  addDays,
  DAYS_PER_WEEK,
  RNG,
  SEASON_LENGTH_WEEKS,
  generateSeasonCalendar,
  getDivisionsForSeason,
  getSeasonIndexForDate,
  getSeasonStartDate,
  getSeasonYear,
  type SeasonCalendar,
} from '@leyenda/engine';
import type { Club, Country, CountryCode, EntityId, ISODate, WorldState } from '@leyenda/shared';
// Import por subruta, no por el barrel `@leyenda/worldgen`: ver generate-clubs-for-country.ts.
import { DIVISIONS_PER_COUNTRY, SEASON_ONE_START_DATE } from '@leyenda/worldgen/src/constants';
import { generateCompetitions } from '@leyenda/worldgen/src/competitions/generate-competitions';

import { countries } from '@/content';
import { generateClubsForCountry } from './generate-clubs-for-country';

/**
 * Registro de offsets de seed reservados sobre la seed del save (mismo
 * patrón que create-character.tsx: `seed` = clubes candidatos, `seed+1` =
 * personaje, `seed+2` = elección de club, `seed+4` = ofertas de trabajo de
 * entrenador en coach-job-offers.tsx, `seed+5` = plantilla inicial del
 * entrenador). El siguiente offset libre es 6. Los calendarios de
 * temporadas posteriores a la primera se separan con `SEASON_SEED_STRIDE`
 * y `DIVISION_SEED_STRIDE` (primos grandes, lejos de los offsets pequeños).
 */
export const CALENDAR_SEED_OFFSET = 3;
const SEASON_SEED_STRIDE = 7_919;
const DIVISION_SEED_STRIDE = 104_729;

/** Consulta de "la temporada de un club": quién, en qué país y con qué estado del mundo. */
export interface ClubSeasonQuery {
  seed: number;
  countryCode: CountryCode;
  clubId: EntityId;
  worldState: WorldState | null;
}

export interface DivisionCalendar {
  myClub: Club;
  divisionClubs: Club[];
  calendar: SeasonCalendar;
  seasonIndex: number;
}

/** Temporada en curso en una fecha de la partida. */
export function seasonIndexForDate(date: ISODate): number {
  return getSeasonIndexForDate(SEASON_ONE_START_DATE, date);
}

/**
 * Clubes del país con la división que les toca en `seasonIndex` (ascensos
 * y descensos ya aplicados según el `WorldState`). Nombre y reputación
 * siempre salen de worldgen.
 */
export function resolveCountryClubs(
  seed: number,
  countryCode: CountryCode,
  worldState: WorldState | null,
  seasonIndex: number
): Club[] {
  const clubs = generateClubsForCountry(seed, countryCode);
  const divisions = worldState ? getDivisionsForSeason(worldState, seasonIndex) : null;
  if (!divisions) return clubs;
  return clubs.map((club) => {
    const level = divisions[club.id];
    return level === undefined ? club : { ...club, divisionLevel: level };
  });
}

/** Calendario de una división concreta en una temporada concreta. */
export function resolveLeagueCalendar(
  seed: number,
  country: Country,
  divisionClubs: Club[],
  divisionLevel: number,
  seasonIndex: number
): SeasonCalendar | null {
  const competition = generateCompetitions(country, DIVISIONS_PER_COUNTRY).find(
    (c) => c.level === divisionLevel
  );
  if (!competition || divisionClubs.length < 2) return null;
  return generateSeasonCalendar({
    competition,
    clubs: divisionClubs,
    year: getSeasonYear(SEASON_ONE_START_DATE, seasonIndex),
    seasonStartDate: getSeasonStartDate(SEASON_ONE_START_DATE, seasonIndex),
    seasonLengthWeeks: SEASON_LENGTH_WEEKS,
    rng: new RNG(
      seed +
        CALENDAR_SEED_OFFSET +
        seasonIndex * SEASON_SEED_STRIDE +
        (divisionLevel - 1) * DIVISION_SEED_STRIDE
    ),
  });
}

/**
 * Resuelve el club, los clubes de su división y el calendario de la
 * temporada en curso en `date` — la parte que comparten `resolveWeekMatch`
 * y `resolveStandings`. Nada de esto se persiste salvo la composición de
 * divisiones (`WorldState`): se regenera a partir de la seed del save.
 */
export function resolveDivisionCalendar(
  query: ClubSeasonQuery,
  date: ISODate,
  allCountries: Country[] = countries
): DivisionCalendar | null {
  const seasonIndex = seasonIndexForDate(date);
  const clubsInCountry = resolveCountryClubs(
    query.seed,
    query.countryCode,
    query.worldState,
    seasonIndex
  );
  const myClub = clubsInCountry.find((c) => c.id === query.clubId);
  if (!myClub) return null;

  const divisionClubs = clubsInCountry.filter((c) => c.divisionLevel === myClub.divisionLevel);
  const country = allCountries.find((c) => c.code === query.countryCode);
  if (!country) return null;

  const calendar = resolveLeagueCalendar(
    query.seed,
    country,
    divisionClubs,
    myClub.divisionLevel,
    seasonIndex
  );
  if (!calendar) return null;
  return { myClub, divisionClubs, calendar, seasonIndex };
}

/**
 * La última jornada de la temporada cae en `season.endDate`; la semana
 * siguiente es el único momento en que hay que reconocer explícitamente
 * el fin de temporada (después viene la pretemporada y la siguiente).
 */
export function isSeasonJustEnded(calendar: SeasonCalendar, thisWeekDate: ISODate): boolean {
  return thisWeekDate === addDays(calendar.season.endDate, DAYS_PER_WEEK);
}
