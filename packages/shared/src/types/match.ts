import type { EntityId, ISODate, Position, Seed } from './common';

/**
 * Resultado de un partido
 */
export interface MatchResult {
  homeGoals: number;
  awayGoals: number;
}

/**
 * Tipo de evento en un partido
 */
export type MatchEventType =
  | 'goal'
  | 'assist'
  | 'yellow_card'
  | 'red_card'
  | 'substitution'
  | 'injury'
  | 'penalty_awarded'
  | 'penalty_scored'
  | 'penalty_missed'
  | 'key_moment'; // Momento clave de decisión

/**
 * Evento de un partido
 */
export interface MatchEvent {
  minute: number;
  type: MatchEventType;
  playerId?: EntityId;
  team: 'home' | 'away';
  data?: Record<string, unknown>;
}

/**
 * Partido simulado
 */
export interface Match {
  id: EntityId;
  homeTeamId: EntityId;
  awayTeamId: EntityId;
  competitionId: EntityId;
  date: ISODate;
  result: MatchResult;
  events: MatchEvent[];
  seed: Seed;
  simulated: boolean; // true = simulado sin intervención
}

/**
 * Momento clave (decisión rápida en el partido, GDD §4.7): el protagonista
 * vive esta situación durante un partido normal. `positions` filtra a
 * quién le puede tocar ('any' = cualquier posición).
 */
export interface KeyMoment {
  id: string;
  situation: string;
  positions: Position[] | 'any';
  choices: KeyMomentChoice[];
}

/**
 * Opción en un momento clave. `baseSuccessChance` es el punto de partida
 * antes de sumar el atributo relevante, la forma y la moral (GDD §4.7):
 * la probabilidad final no es un literal fijo, se calcula.
 */
export interface KeyMomentChoice {
  id: string;
  label: string;
  determinedBy: string; // nombre de un atributo físico/técnico/mental
  baseSuccessChance: number; // 0-1
  ratingDelta: { onSuccess: number; onFail: number };
  fanRelationDelta: { onSuccess: number; onFail: number };
}

/**
 * Situación de Jugada en Vivo
 */
export interface LiveSituation {
  type: 'penalty' | 'chance' | 'free_kick' | 'corner' | 'one_on_one';
  minute: number;
  playerId: EntityId;
  team: 'home' | 'away';
  seed: Seed;
  pressure: number; // 0-100 (afecta dificultad)
  // ... más datos según el tipo de jugada
}

/**
 * Resultado de una Jugada en Vivo
 */
export interface LiveOutcome {
  success: boolean;
  type: 'goal' | 'save' | 'miss' | 'post' | 'foul' | 'out';
  // Datos para la repetición
  replayData?: unknown;
}
