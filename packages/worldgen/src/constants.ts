import type { Position } from '@leyenda/shared';

/** Fecha de inicio de la temporada 1 del mundo (GDD §8) */
export const SEASON_ONE_START_DATE = '2026-08-01';

export const DIVISIONS_PER_COUNTRY = 2;
export const CLUBS_PER_DIVISION: Record<number, number> = { 1: 14, 2: 12 };
export const SQUAD_SIZE = 28;

/** Distribución de posiciones por plantilla (suma 28) */
export const SQUAD_POSITION_COUNTS: Record<Position, number> = {
  GK: 3,
  CB: 5,
  LB: 2,
  RB: 2,
  DMF: 3,
  CMF: 4,
  AMF: 3,
  LW: 2,
  RW: 2,
  CF: 2,
};

export interface AgeBand {
  min: number;
  max: number;
  weight: number;
}

/** Distribución de edad por franja (campana sesgada joven), pesos relativos */
export const AGE_BANDS: AgeBand[] = [
  { min: 18, max: 20, weight: 15 },
  { min: 21, max: 23, weight: 25 },
  { min: 24, max: 27, weight: 30 },
  { min: 28, max: 30, weight: 20 },
  { min: 31, max: 35, weight: 10 },
];

export const FOREIGN_PLAYER_CHANCE = 0.25;
export const RIGHT_FOOT_CHANCE = 0.72;
export const LEFT_FOOT_CHANCE = 0.2; // resto (0.08) es 'both'
