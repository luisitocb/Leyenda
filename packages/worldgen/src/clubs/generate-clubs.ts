import type { ClubNamePool, RealClubRoster } from '@leyenda/content';
import { RNG } from '@leyenda/engine';
import type { Club, Country } from '@leyenda/shared';

import { generateClubNames } from './club-names';

export interface GenerateClubsInput {
  rng: RNG;
  country: Country;
  clubNamePool: ClubNamePool;
  divisionsPerCountry: number;
  clubsPerDivision: Record<number, number>;
  /**
   * Plantilla real de club (ADR-004), si el país la tiene. Cuando está
   * presente, sustituye por completo la generación procedural: nombre,
   * nombre corto y reputación salen de la lista autorada, y el número de
   * clubes por división lo decide el tamaño de la lista, no
   * `clubsPerDivision` (los países reales no tienen por qué coincidir con
   * el tamaño de división por defecto de los países ficticios).
   */
  realRoster?: RealClubRoster | null;
}

/**
 * Genera los clubes de un país repartidos en divisiones. Sin `realRoster`:
 * ficticio y procedural, reputación de división 1 ronda `reputationBase`
 * (división 2 sistemáticamente peor). Con `realRoster` (ADR-004): nombres y
 * reputación ya decididos a mano club a club.
 */
export function generateClubs({
  rng,
  country,
  clubNamePool,
  divisionsPerCountry,
  clubsPerDivision,
  realRoster,
}: GenerateClubsInput): Club[] {
  if (realRoster) {
    return generateRealClubs(rng, country, realRoster);
  }

  const totalClubs = Array.from({ length: divisionsPerCountry }, (_, i) => i + 1).reduce(
    (sum, level) => sum + (clubsPerDivision[level] ?? 0),
    0
  );
  const names = generateClubNames(rng, clubNamePool, totalClubs);

  const clubs: Club[] = [];
  let nameIndex = 0;

  for (let divisionLevel = 1; divisionLevel <= divisionsPerCountry; divisionLevel++) {
    const clubCount = clubsPerDivision[divisionLevel] ?? 0;

    for (let i = 0; i < clubCount; i++) {
      const generatedName = names[nameIndex];
      if (!generatedName) {
        throw new Error('Se agotaron los nombres de club generados');
      }
      nameIndex++;

      const reputation =
        divisionLevel === 1
          ? clamp(country.reputationBase + rng.nextInt(-2, 3), 1, 20)
          : clamp(country.reputationBase - 5 + rng.nextInt(-2, 2), 1, 20);

      clubs.push({
        id: `club-${country.code}-${divisionLevel}-${i + 1}`,
        name: generatedName.name,
        shortName: generatedName.shortName,
        countryCode: country.code,
        reputation,
        divisionLevel,
        money: reputation * rng.nextInt(80_000, 150_000),
      });
    }
  }

  return clubs;
}

function generateRealClubs(rng: RNG, country: Country, realRoster: RealClubRoster): Club[] {
  const clubs: Club[] = [];

  for (const [divisionKey, roster] of Object.entries(realRoster)) {
    const divisionLevel = Number(divisionKey);
    roster.forEach((realClub, i) => {
      clubs.push({
        id: `club-${country.code}-${divisionLevel}-${i + 1}`,
        name: realClub.name,
        shortName: realClub.shortName,
        countryCode: country.code,
        reputation: realClub.reputation,
        divisionLevel,
        money: realClub.reputation * rng.nextInt(80_000, 150_000),
      });
    });
  }

  return clubs;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
