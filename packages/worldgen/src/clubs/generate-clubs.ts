import type { ClubNamePool } from '@leyenda/content';
import { RNG } from '@leyenda/engine';
import type { Club, Country } from '@leyenda/shared';

import { generateClubNames } from './club-names';

export interface GenerateClubsInput {
  rng: RNG;
  country: Country;
  clubNamePool: ClubNamePool;
  divisionsPerCountry: number;
  clubsPerDivision: Record<number, number>;
}

/**
 * Genera los clubes de un país repartidos en divisiones. La reputación de
 * división 1 ronda `reputationBase`; división 2 es sistemáticamente peor.
 */
export function generateClubs({
  rng,
  country,
  clubNamePool,
  divisionsPerCountry,
  clubsPerDivision,
}: GenerateClubsInput): Club[] {
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
