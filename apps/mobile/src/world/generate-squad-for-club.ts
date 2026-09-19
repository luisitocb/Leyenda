import { RNG } from '@leyenda/engine';
import type { BasePlayer, Club, Country } from '@leyenda/shared';
import { generateSquad } from '@leyenda/worldgen/src/players/generate-squad';

import { namePools } from '@/content';

/** Deriva una seed propia por club (mismo patrón que `seedFor` en packages/balance-sim/src/run-seasons.ts). */
function seedForClub(baseSeed: number, clubId: string): number {
  let hash = baseSeed >>> 0;
  for (let i = 0; i < clubId.length; i++) {
    hash = (Math.imul(hash, 31) + clubId.charCodeAt(i)) >>> 0;
  }
  return hash >>> 0;
}

/**
 * Genera la plantilla de un club de forma determinista a partir de
 * (seed, club.id) — no depende de generar el resto de la división, porque
 * aquí no existe un `World` canónico que replayear (nunca se persiste).
 */
export function generateSquadForClub(
  seed: number,
  club: Club,
  allCountries: Country[]
): BasePlayer[] {
  const rng = new RNG(seedForClub(seed, club.id));
  return generateSquad({ rng, club, countries: allCountries, namePools });
}
