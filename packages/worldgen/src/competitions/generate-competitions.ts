import type { Competition, Country } from '@leyenda/shared';

const DIVISION_ORDINAL: Record<number, string> = {
  1: 'Primera',
  2: 'Segunda',
  3: 'Tercera',
};

/**
 * Genera una Competition de tipo 'league' por división de un país.
 * Sin aleatoriedad: el nombre y el nivel se derivan directamente de la
 * división.
 */
export function generateCompetitions(country: Country, divisionsPerCountry: number): Competition[] {
  const competitions: Competition[] = [];

  for (let level = 1; level <= divisionsPerCountry; level++) {
    const divisionName = DIVISION_ORDINAL[level] ?? `División ${level}`;
    competitions.push({
      id: `league-${country.code}-${level}`,
      name: `${divisionName} de ${country.name}`,
      type: 'league',
      countryCode: country.code,
      level,
    });
  }

  return competitions;
}
