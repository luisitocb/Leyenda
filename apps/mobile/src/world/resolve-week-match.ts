import { RNG, generateSeasonCalendar, simulateMatch } from '@leyenda/engine';
import type { Club, Country, ISODate, MatchResult, ProtagonistPlayer } from '@leyenda/shared';
// Import por subruta, no por el barrel `@leyenda/worldgen`: ver generate-clubs-for-country.ts.
import { DIVISIONS_PER_COUNTRY, SEASON_ONE_START_DATE } from '@leyenda/worldgen/src/constants';
import { generateCompetitions } from '@leyenda/worldgen/src/competitions/generate-competitions';

import { countries } from '@/content';
import { generateClubsForCountry } from './generate-clubs-for-country';
import { generateSquadForClub } from './generate-squad-for-club';

/**
 * Registro de offsets de seed reservados sobre la seed del save (mismo
 * patrón que create-character.tsx: `seed` = clubes candidatos, `seed+1` =
 * personaje, `seed+2` = elección de club). El siguiente offset libre es 4.
 */
const CALENDAR_SEED_OFFSET = 3;

const SEASON_YEAR = 2026;

export interface WeekMatchResolution {
  homeClub: Club;
  awayClub: Club;
  result: MatchResult;
  isHome: boolean;
}

/**
 * Resuelve (y simula) el partido del club del protagonista en una fecha
 * dada, si lo hay. Nada de esto se persiste: calendario y plantillas
 * rivales se regeneran siempre a partir de la seed del save, igual que el
 * resto del `World` (nunca guardado).
 */
export function resolveWeekMatch(
  seed: number,
  protagonist: ProtagonistPlayer,
  date: ISODate,
  allCountries: Country[] = countries
): WeekMatchResolution | null {
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

  const match = calendar.matches.find(
    (m) => m.date === date && (m.homeTeamId === myClub.id || m.awayTeamId === myClub.id)
  );
  if (!match) return null;

  const homeClub = divisionClubs.find((c) => c.id === match.homeTeamId);
  const awayClub = divisionClubs.find((c) => c.id === match.awayTeamId);
  if (!homeClub || !awayClub) return null;

  const homeSquad = generateSquadForClub(seed, homeClub, allCountries);
  const awaySquad = generateSquadForClub(seed, awayClub, allCountries);
  const simulated = simulateMatch(match, homeSquad, awaySquad, new RNG(match.seed));

  return {
    homeClub,
    awayClub,
    result: simulated.result,
    isHome: match.homeTeamId === myClub.id,
  };
}
