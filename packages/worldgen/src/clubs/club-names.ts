import type { ClubNamePool } from '@leyenda/content';
import { RNG } from '@leyenda/engine';

export interface GeneratedClubName {
  name: string;
  shortName: string;
}

/**
 * Genera `count` nombres de club únicos dentro de un país, a partir del
 * pool generativo {cityPrefixes, citySuffixes, clubSuffixes}. El nombre
 * de ciudad (prefijo+sufijo) nunca se repite dentro del mismo país; el
 * sufijo de club sí puede repetirse (p. ej. varios "United").
 */
export function generateClubNames(
  rng: RNG,
  pool: ClubNamePool,
  count: number
): GeneratedClubName[] {
  const combos: Array<{ prefix: string; suffix: string }> = [];
  for (const prefix of pool.cityPrefixes) {
    for (const suffix of pool.citySuffixes) {
      combos.push({ prefix, suffix });
    }
  }

  if (combos.length < count) {
    throw new Error(
      `No hay suficientes combinaciones de nombre de ciudad (${combos.length}) para generar ${count} clubes`
    );
  }

  rng.shuffle(combos);
  const selected = combos.slice(0, count);

  const usedShortNames = new Set<string>();
  return selected.map(({ prefix, suffix }) => {
    const cityName = `${prefix}${suffix}`;
    const clubSuffix = rng.pick(pool.clubSuffixes);
    const name = `${cityName} ${clubSuffix}`;

    let shortName = cityName.slice(0, 3).toUpperCase();
    let disambiguator = 1;
    while (usedShortNames.has(shortName)) {
      disambiguator++;
      shortName = `${cityName.slice(0, 2).toUpperCase()}${disambiguator}`;
    }
    usedShortNames.add(shortName);

    return { name, shortName };
  });
}
