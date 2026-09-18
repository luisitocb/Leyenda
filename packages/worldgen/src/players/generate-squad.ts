import type { PersonNamePool } from '@leyenda/content';
import { RNG } from '@leyenda/engine';
import type { BasePlayer, Club, Country, CountryCode, Position } from '@leyenda/shared';

import { AGE_BANDS, FOREIGN_PLAYER_CHANCE, SQUAD_POSITION_COUNTS } from '../constants';
import { generatePlayer } from './generate-player';

export interface GenerateSquadInput {
  rng: RNG;
  club: Club;
  countries: Country[];
  namePools: Record<CountryCode, PersonNamePool>;
}

function pickAge(rng: RNG): number {
  const totalWeight = AGE_BANDS.reduce((sum, band) => sum + band.weight, 0);
  let roll = rng.nextFloat(0, totalWeight);

  for (const band of AGE_BANDS) {
    if (roll < band.weight) {
      return rng.nextInt(band.min, band.max);
    }
    roll -= band.weight;
  }

  const lastBand = AGE_BANDS[AGE_BANDS.length - 1]!;
  return rng.nextInt(lastBand.min, lastBand.max);
}

function pickNationality(rng: RNG, club: Club, countries: Country[]): CountryCode {
  if (rng.chance(FOREIGN_PLAYER_CHANCE)) {
    const foreignCountries = countries.filter((country) => country.code !== club.countryCode);
    if (foreignCountries.length > 0) {
      return rng.pick(foreignCountries).code;
    }
  }
  return club.countryCode;
}

function flattenPositions(): Position[] {
  const positions: Position[] = [];
  for (const [position, count] of Object.entries(SQUAD_POSITION_COUNTS) as [Position, number][]) {
    for (let i = 0; i < count; i++) {
      positions.push(position);
    }
  }
  return positions;
}

/** Genera la plantilla completa de un club (posiciones, edades y nacionalidades según constants.ts). */
export function generateSquad({
  rng,
  club,
  countries,
  namePools,
}: GenerateSquadInput): BasePlayer[] {
  const positions = flattenPositions();

  return positions.map((position, index) => {
    const age = pickAge(rng);
    const nationality = pickNationality(rng, club, countries);
    const namePool = namePools[nationality];
    if (!namePool) {
      throw new Error(`No hay pool de nombres para el país ${nationality}`);
    }

    return generatePlayer({
      rng,
      id: `player-${club.id}-${index + 1}`,
      club,
      position,
      age,
      nationality,
      namePool,
    });
  });
}
