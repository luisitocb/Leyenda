import type { EntityId } from '@leyenda/shared';

/** Umbral de goles de un equipo en un partido para marcarlo como anómalo. */
export const EXTREME_SCORELINE_THRESHOLD = 8;
/** Umbral de goles de un jugador en una temporada para marcarlo como anómalo. */
export const ANOMALOUS_PLAYER_GOALS_THRESHOLD = 40;
/** Umbral de dominancia de títulos de un club en una liga (GDD §16). */
export const TITLE_DOMINANCE_THRESHOLD = 0.4;
/** Rango objetivo de goles/partido (GDD §16). */
export const TARGET_GOALS_PER_MATCH = { min: 2.4, max: 2.9 };

export interface ExtremeMatch {
  competitionId: EntityId;
  homeTeamId: EntityId;
  awayTeamId: EntityId;
  homeGoals: number;
  awayGoals: number;
}

export interface AnomalousPlayerSeason {
  playerId: EntityId;
  competitionId: EntityId;
  goals: number;
}

export interface SeasonRunResult {
  totalGoals: number;
  totalMatches: number;
  /** Campeón (posición 1) de cada liga en esta temporada. */
  championByCompetition: Map<EntityId, EntityId>;
  extremeMatches: ExtremeMatch[];
  anomalousPlayerSeasons: AnomalousPlayerSeason[];
}

export interface TitleDominance {
  competitionId: EntityId;
  clubId: EntityId;
  clubName: string;
  titles: number;
  totalSeasons: number;
  share: number; // 0-1
}

export interface BalanceReport {
  seasonsSimulated: number;
  totalMatches: number;
  averageGoalsPerMatch: number;
  dominantClubs: TitleDominance[]; // solo los que superan TITLE_DOMINANCE_THRESHOLD
  extremeMatches: ExtremeMatch[];
  anomalousPlayerSeasons: AnomalousPlayerSeason[];
}
