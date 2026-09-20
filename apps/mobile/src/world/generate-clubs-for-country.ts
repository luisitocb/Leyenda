import { RNG } from '@leyenda/engine';
import type { Club, CountryCode } from '@leyenda/shared';
// Import por subruta, no por el barrel `@leyenda/worldgen`: el barrel reexporta
// generate-world.ts, que arrastra @leyenda/content (node:fs) aunque no se use
// generateWorld — Metro evalúa todo el grafo estático, no solo lo importado.
import { CLUBS_PER_DIVISION, DIVISIONS_PER_COUNTRY } from '@leyenda/worldgen/src/constants';
import { generateClubs } from '@leyenda/worldgen/src/clubs/generate-clubs';

import { clubNamePool, countries, realClubRosters } from '@/content';

/**
 * Regenera los clubes de un país a partir de la seed del save. El `World`
 * nunca se persiste (solo la seed), así que esto es lo único que hay para
 * volver a obtener nombre/reputación de un club a partir de su id.
 */
export function generateClubsForCountry(seed: number, countryCode: CountryCode): Club[] {
  const country = countries.find((c) => c.code === countryCode);
  if (!country) return [];
  return generateClubs({
    rng: new RNG(seed),
    country,
    clubNamePool,
    divisionsPerCountry: DIVISIONS_PER_COUNTRY,
    clubsPerDivision: CLUBS_PER_DIVISION,
    realRoster: realClubRosters[countryCode] ?? null,
  });
}
