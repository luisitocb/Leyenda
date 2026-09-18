import type { BasePlayer, EntityId, Position } from '@leyenda/shared';

/**
 * Formación fija 4-4-2 (sin sistema de tácticas todavía): GK + 4 defensas
 * + 2 CMF + 2 extremos + 2 delanteros = 11 titulares.
 */
export const FORMATION_4_4_2: readonly Position[] = [
  'GK',
  'CB',
  'CB',
  'LB',
  'RB',
  'CMF',
  'CMF',
  'LW',
  'RW',
  'CF',
  'CF',
];

export interface TeamStrength {
  defense: number;
  midfield: number;
  attack: number;
  goalkeeping: number;
}

export interface StartingXI {
  clubId: EntityId;
  goalkeeper: BasePlayer;
  outfield: BasePlayer[];
}

/**
 * Constantes de tuning del motor de partidos. Calibradas con
 * packages/balance-sim (2026-09-19), verificado con `pnpm balance`
 * (50 temporadas / 157.000 partidos reales, no solo --quick):
 *
 * 1. baseChancePerChunk/baseConversion bajados de 0.28/0.30 a 0.25/0.27
 *    — los originales daban ~3.0-3.04 goles/partido, por encima del
 *    objetivo 2.4-2.9 del GDD §16.
 * 2. dayFormVariance (0.15) añadido en simulate-match.ts — ruido de
 *    "el día de cada equipo", ayuda poco por sí solo porque una
 *    temporada de 26 partidos ya promedia el ruido partido a partido.
 * 3. chanceZoneDivisor/conversionZoneDivisor subidos de 300/250 a
 *    700/600 — el ajuste que de verdad funcionó: reduce cuánto pesa la
 *    diferencia de zona entre dos equipos en cada tramo, sin tocar el
 *    caso de equipos parejos (diferencia 0 → sin cambio). Antes de esto
 *    varios clubes ganaban 68-78% de las temporadas de su liga; ahora
 *    ningún club supera el 40% (objetivo del GDD §16) en la muestra de
 *    50 temporadas. Resultado final verificado: ~2.57 goles/partido,
 *    0% de clubes por encima del 40% de títulos.
 */
export const MATCH_TUNING = {
  chunkMinutes: 5,
  chunksPerMatch: 18,
  /** Ruido multiplicativo por partido/equipo ("el día de cada equipo") — ver simulate-match.ts. */
  dayFormVariance: 0.15,
  basePossession: 0.5,
  possessionZoneDivisor: 400,
  possessionClampMin: 0.25,
  possessionClampMax: 0.75,
  baseChancePerChunk: 0.25,
  chanceZoneDivisor: 700,
  possessionChanceBonus: 0.05,
  chanceClampMin: 0.05,
  chanceClampMax: 0.65,
  baseConversion: 0.27,
  conversionZoneDivisor: 600,
  conversionClampMin: 0.05,
  conversionClampMax: 0.75,
  assistProbability: 0.6,
  baseCardChancePerChunk: 0.02,
  cardChanceMin: 0.005,
  cardChanceMax: 0.06,
  baseInjuryChancePerChunk: 0.004,
  injuryChanceMin: 0.001,
  injuryChanceMax: 0.02,
} as const;

export const HOME_ADVANTAGE_DEFENSE = 5;
export const HOME_ADVANTAGE_ATTACK = 3;
