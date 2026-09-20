import { RNG } from '@leyenda/engine';
import type { BasePlayer, Club, Country, CountryCode } from '@leyenda/shared';
import { generateSquad } from '@leyenda/worldgen/src/players/generate-squad';

import { namePools } from '@/content';

/** Mismo patrón de hash que `seedForClub` en `generate-squad-for-club.ts`, pero por país. */
function seedForCountry(baseSeed: number, countryCode: CountryCode): number {
  let hash = baseSeed >>> 0;
  for (let i = 0; i < countryCode.length; i++) {
    hash = (Math.imul(hash, 31) + countryCode.charCodeAt(i)) >>> 0;
  }
  return hash >>> 0;
}

/**
 * Genera la plantilla de la selección de un país al vuelo, con un `Club`
 * sintético de reputación máxima (no hay ningún dominio de selecciones en
 * `worldgen` — esto evita tener que escanear las plantillas reales de
 * todos los clubes del país para "elegir a los mejores").
 */
export function generateNationalSquad(
  seed: number,
  countryCode: CountryCode,
  allCountries: Country[]
): BasePlayer[] {
  const countryName = allCountries.find((c) => c.code === countryCode)?.name ?? countryCode;
  const nationalTeamClub: Club = {
    id: `seleccion-${countryCode}`,
    name: `Selección de ${countryName}`,
    shortName: countryCode,
    countryCode,
    reputation: 20,
    divisionLevel: 0,
    money: 0,
  };
  const rng = new RNG(seedForCountry(seed, countryCode));
  return generateSquad({ rng, club: nationalTeamClub, countries: allCountries, namePools });
}
