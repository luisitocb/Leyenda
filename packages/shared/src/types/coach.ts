import type { CountryCode, EntityId, ISODate } from './common';
import type { MatchResult } from './match';
import type { BasePlayer } from './player';

/** Formaciones disponibles en la versión base de tácticas (GDD §6.6). */
export type FormationId = '4-4-2' | '4-3-3' | '4-2-3-1' | '5-3-2' | '3-5-2';

/** Mentalidad del equipo: de defensiva a ofensiva (GDD §6.6). */
export type Mentality = 'defensive' | 'balanced' | 'attacking';

/** Tácticas del equipo (GDD §6.6, versión base: formación + mentalidad). */
export interface Tactics {
  formation: FormationId;
  mentality: Mentality;
}

/** Foco del plan de entrenamiento semanal del grupo (GDD §6.4). */
export type TrainingFocus = 'physical' | 'technical' | 'tactical' | 'rest';

/**
 * Jugador de la plantilla del entrenador: un `BasePlayer` más el estado
 * que solo existe mientras está a tus órdenes (lesión y estadísticas de la
 * temporada en curso).
 */
export interface SquadPlayer extends BasePlayer {
  /** Semanas de baja restantes (0 = disponible). */
  injuryWeeks: number;
  seasonAppearances: number;
  seasonGoals: number;
}

/** Tipo de objetivo que fija la directiva (GDD §6.1). */
export type BoardObjectiveKind =
  'title' | 'top_positions' | 'top_half' | 'avoid_relegation' | 'promotion' | 'mid_table';

/** Objetivo de la directiva para una temporada: posición mínima a alcanzar. */
export interface BoardObjective {
  kind: BoardObjectiveKind;
  targetPosition: number;
  seasonIndex: number;
}

/** Ambición prometida en la entrevista con la directiva (GDD §6.1). */
export type InterviewAmbition = 'ambitious' | 'realistic' | 'cautious';

/** Temporada terminada como entrenador (historial de la carrera). */
export interface CoachSeasonRecord {
  seasonIndex: number;
  year: number;
  clubId: EntityId;
  divisionLevel: number;
  finalPosition: number;
  objectiveMet: boolean;
  champion: boolean;
  promoted: boolean;
  relegated: boolean;
}

export interface CoachStats {
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  titles: number;
  promotions: number;
  sackings: number;
}

/** `employed` = dirige un club; `unemployed` = despedido o dimitido; `retired` = fin de la vida deportiva. */
export type CoachStatus = 'employed' | 'unemployed' | 'retired';

/**
 * Carrera de entrenador (GDD §6.1, §14). `clubId` es el club actual, o el
 * último dirigido si `status` no es `employed`.
 */
export interface CoachCareer {
  id: EntityId;
  clubId: EntityId;
  /** Misma escala 1-20 que `Club.reputation`, para poder comparar directamente. */
  reputation: number;
  status: CoachStatus;
  squad: SquadPlayer[];
  tactics: Tactics;
  trainingFocus: TrainingFocus;
  /** Confianza de la directiva, 0-100 (GDD §6.1). */
  boardConfidence: number;
  /** Si la directiva ya dio el ultimátum esta temporada. */
  ultimatumGiven: boolean;
  objective: BoardObjective | null;
  /**
   * Resultados de los partidos del club del entrenador (matchId →
   * resultado). La plantilla cambia con el tiempo, así que re-simular un
   * partido pasado daría otro marcador: la clasificación usa estos.
   */
  results: Record<EntityId, MatchResult>;
  stats: CoachStats;
  history: CoachSeasonRecord[];
}

/** Forma persistida por la primera historia de Fase 4 (antes de plantilla y directiva). */
export interface LegacyCoachCareerV1 {
  id: EntityId;
  clubId: EntityId;
  reputation: number;
}

/**
 * Entrada del Salón de la Fama (GDD §3, §9, RF-17): una vida deportiva
 * terminada, con la puntuación final de jugador + entrenador.
 */
export interface HallOfFameEntry {
  id: EntityId;
  name: string;
  nationality: CountryCode;
  finishedOn: ISODate;
  playerLegacy: number;
  coachLegacy: number;
  totalScore: number;
  player: {
    gamesPlayed: number;
    goals: number;
    assists: number;
    titles: number;
    caps: number;
  };
  coach: {
    seasons: number;
    matches: number;
    wins: number;
    titles: number;
    promotions: number;
  } | null;
}

/** Momento en que puede salir una rueda de prensa (depende del último resultado). */
export type PressConferenceContext = 'pre_match' | 'after_win' | 'after_loss';

/** Efecto de una respuesta en rueda de prensa (GDD §6.1: "afectan a la moral, la afición y la directiva"). */
export interface PressConferenceEffects {
  squadMorale: number;
  boardConfidence: number;
  reputation: number;
}

export interface PressConferenceAnswer {
  id: string;
  label: string;
  effects: PressConferenceEffects;
}

/** Rueda de prensa del Modo Entrenador: una pregunta con 2-4 respuestas (contenido data-driven). */
export interface PressConference {
  id: string;
  context: PressConferenceContext;
  question: string;
  weight: number;
  answers: PressConferenceAnswer[];
}
