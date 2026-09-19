import { RNG, simulateMatch } from '@leyenda/engine';
import type { Club, Country, ISODate, MatchResult, ProtagonistPlayer } from '@leyenda/shared';

import { countries } from '@/content';
import { resolveDivisionCalendar } from './resolve-division-calendar';
import { generateSquadForClub } from './generate-squad-for-club';

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
  const resolved = resolveDivisionCalendar(seed, protagonist, allCountries);
  if (!resolved) return null;
  const { myClub, divisionClubs, calendar } = resolved;

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
