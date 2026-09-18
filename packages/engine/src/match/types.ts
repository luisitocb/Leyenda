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
 * Constantes de tuning del motor de partidos. Valores de arranque sin
 * balance-sim (GDD §16) — para clubes parejos (~zonas iguales) dan
 * chanceProbability≈0.28, conversionProbability≈0.30 → ~0.084
 * goles/tramo/equipo → ~3.0 goles/partido total, ligeramente por encima
 * del objetivo 2.4-2.9. Calibración fina es trabajo de la futura slice
 * balance-sim, no de esta.
 */
export const MATCH_TUNING = {
  chunkMinutes: 5,
  chunksPerMatch: 18,
  basePossession: 0.5,
  possessionZoneDivisor: 400,
  possessionClampMin: 0.25,
  possessionClampMax: 0.75,
  baseChancePerChunk: 0.28,
  chanceZoneDivisor: 300,
  possessionChanceBonus: 0.05,
  chanceClampMin: 0.05,
  chanceClampMax: 0.65,
  baseConversion: 0.3,
  conversionZoneDivisor: 250,
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
