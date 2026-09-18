import type { BasePlayer, Club, Competition, Country } from '@leyenda/shared';

export interface World {
  countries: Country[];
  clubs: Club[];
  competitions: Competition[];
  players: BasePlayer[];
}

export interface WorldgenConfig {
  divisionsPerCountry: number;
  clubsPerDivision: Record<number, number>;
  squadSize: number;
}
