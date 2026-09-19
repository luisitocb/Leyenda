import { RNG, generateSeasonCalendar, type SeasonCalendar } from '@leyenda/engine';
import type { Club, Country, ProtagonistPlayer } from '@leyenda/shared';
// Import por subruta, no por el barrel `@leyenda/worldgen`: ver generate-clubs-for-country.ts.
import { DIVISIONS_PER_COUNTRY, SEASON_ONE_START_DATE } from '@leyenda/worldgen/src/constants';
import { generateCompetitions } from '@leyenda/worldgen/src/competitions/generate-competitions';

import { generateClubsForCountry } from './generate-clubs-for-country';

/**
 * Registro de offsets de seed reservados sobre la seed del save (mismo
 * patrón que create-character.tsx: `seed` = clubes candidatos, `seed+1` =
 * personaje, `seed+2` = elección de club). El siguiente offset libre es 4.
 */
export const CALENDAR_SEED_OFFSET = 3;

export const SEASON_YEAR = 2026;

export interface DivisionCalendar {
  myClub: Club;
  divisionClubs: Club[];
  calendar: SeasonCalendar;
}

/**
 * Resuelve el club del protagonista, los clubes de su división y el
 * calendario de la temporada — la parte que comparten `resolveWeekMatch`
 * y `resolveStandings`. Nada de esto se persiste: se regenera siempre a
 * partir de la seed del save, igual que el resto del `World`.
 */
export function resolveDivisionCalendar(
  seed: number,
  protagonist: ProtagonistPlayer,
  allCountries: Country[]
): DivisionCalendar | null {
  const clubsInCountry = generateClubsForCountry(seed, protagonist.nationality);
  const myClub = clubsInCountry.find((c) => c.id === protagonist.clubId);
  if (!myClub) return null;

  const divisionClubs = clubsInCountry.filter((c) => c.divisionLevel === myClub.divisionLevel);
  const country = allCountries.find((c) => c.code === protagonist.nationality);
  if (!country) return null;

  const competition = generateCompetitions(country, DIVISIONS_PER_COUNTRY).find(
    (c) => c.level === myClub.divisionLevel
  );
  if (!competition) return null;

  const calendar = generateSeasonCalendar({
    competition,
    clubs: divisionClubs,
    year: SEASON_YEAR,
    seasonStartDate: SEASON_ONE_START_DATE,
    rng: new RNG(seed + CALENDAR_SEED_OFFSET),
  });

  return { myClub, divisionClubs, calendar };
}
