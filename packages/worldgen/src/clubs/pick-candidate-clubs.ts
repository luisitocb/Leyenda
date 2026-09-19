import { RNG } from '@leyenda/engine';
import type { Club, CountryCode } from '@leyenda/shared';

export const STARTING_CLUB_CANDIDATES = 3;

/**
 * Elige 3 clubes candidatos para empezar la carrera (GDD §4.1): siempre de
 * la división más baja del país elegido, porque un debutante no ficha
 * directamente por primera división. Determinista dado el mismo rng. Recibe
 * `clubs` en vez de un `World` completo porque quien llama (el asistente de
 * creación de personaje) solo genera los clubes del país elegido, no el
 * mundo entero.
 */
export function pickCandidateClubs(
  clubs: Club[],
  countryCode: CountryCode,
  rng: RNG,
  count: number = STARTING_CLUB_CANDIDATES
): Club[] {
  const clubsInCountry = clubs.filter((club) => club.countryCode === countryCode);
  const lowestDivision = Math.max(...clubsInCountry.map((club) => club.divisionLevel));
  const candidates = clubsInCountry.filter((club) => club.divisionLevel === lowestDivision);

  return rng.shuffle([...candidates]).slice(0, count);
}
