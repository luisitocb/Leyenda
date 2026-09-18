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
