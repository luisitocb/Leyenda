import type { CountryCode, EntityId, ISODate } from './common';

/**
 * País ficticio
 */
export interface Country {
  code: CountryCode;
  name: string;
  reputationBase: number; // 1-20, media de reputación de clubes de este país
}

/**
 * Club de fútbol
 */
export interface Club {
  id: EntityId;
  name: string;
  shortName: string;
  countryCode: CountryCode;
  reputation: number; // 1-20
  divisionLevel: number; // 1 = primera división
  money: number;
  // ... más propiedades
}

/**
 * Competición
 */
export interface Competition {
  id: EntityId;
  name: string;
  type: 'league' | 'cup' | 'continental' | 'international';
  countryCode: CountryCode | null; // null para competiciones internacionales
  level: number; // 1 = primera división/torneo más importante
}

/**
 * Temporada
 */
export interface Season {
  id: EntityId;
  competitionId: EntityId;
  year: number; // Año de inicio
  startDate: ISODate;
  endDate: ISODate;
}

/**
 * Jornada de la temporada
 */
export interface Fixture {
  id: EntityId;
  seasonId: EntityId;
  round: number;
  date: ISODate;
  matches: EntityId[]; // IDs de partidos
}

/**
 * Clasificación
 */
export interface Standing {
  position: number;
  clubId: EntityId;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

/**
 * Resumen de una temporada cerrada (GDD §8, RF-08): campeón de cada
 * división y movimientos de ascenso/descenso. Alimenta el historial del
 * mundo y el Salón de la Fama.
 */
export interface SeasonSummary {
  seasonIndex: number;
  year: number;
  /** Nivel de división → club campeón. */
  championsByDivision: Record<number, EntityId>;
  promoted: EntityId[];
  relegated: EntityId[];
}

/**
 * Parte dinámica del mundo que NO se puede regenerar desde la seed (el
 * resto del `World` se regenera siempre, ver ADR-005): en qué división
 * juega cada club cada temporada y el historial de temporadas cerradas.
 * Solo cubre el país del protagonista (el único con calendario jugable).
 */
export interface WorldState {
  countryCode: CountryCode;
  /**
   * Índice de temporada → (clubId → nivel de división). La temporada 0 no
   * necesita entrada: es la composición de worldgen. Una temporada sin
   * entrada hereda la de la última temporada anterior que sí la tenga.
   */
  divisionsBySeason: Record<number, Record<EntityId, number>>;
  seasonHistory: SeasonSummary[];
}
