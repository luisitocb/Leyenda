import type {
  CoachCareer,
  EntityId,
  HallOfFameEntry,
  ISODate,
  ProtagonistPlayer,
} from '@leyenda/shared';

import { calculateLegacyScore } from '../career/decline';

/** Pesos del Legado como entrenador (GDD §3: "Fin de vida deportiva → Puntuación final"). */
export const COACH_LEGACY_WEIGHTS = {
  title: 600,
  promotion: 300,
  win: 6,
  draw: 2,
  season: 40,
  objectiveMet: 100,
  reputation: 50,
} as const;

/** Legado como entrenador: títulos, ascensos, victorias, temporadas y reputación. */
export function calculateCoachLegacyScore(coach: CoachCareer): number {
  const W = COACH_LEGACY_WEIGHTS;
  return (
    coach.stats.titles * W.title +
    coach.stats.promotions * W.promotion +
    coach.stats.wins * W.win +
    coach.stats.draws * W.draw +
    coach.history.length * W.season +
    coach.history.filter((s) => s.objectiveMet).length * W.objectiveMet +
    coach.reputation * W.reputation
  );
}

export interface BuildHallOfFameEntryInput {
  id: EntityId;
  protagonist: ProtagonistPlayer;
  coach: CoachCareer | null;
  finishedOn: ISODate;
}

/**
 * Entrada del Salón de la Fama (GDD §9, RF-17): la vida deportiva entera,
 * jugador + entrenador, resumida en una puntuación final.
 */
export function buildHallOfFameEntry(input: BuildHallOfFameEntryInput): HallOfFameEntry {
  const { protagonist, coach } = input;
  const playerLegacy = Math.max(0, calculateLegacyScore(protagonist));
  const coachLegacy = coach ? calculateCoachLegacyScore(coach) : 0;
  return {
    id: input.id,
    name: `${protagonist.firstName} ${protagonist.lastName}`,
    nationality: protagonist.nationality,
    finishedOn: input.finishedOn,
    playerLegacy,
    coachLegacy,
    totalScore: playerLegacy + coachLegacy,
    player: {
      gamesPlayed: protagonist.gamesPlayed,
      goals: protagonist.goalsScored,
      assists: protagonist.assists,
      titles: protagonist.titlesWon.length,
      caps: protagonist.nationalTeamCaps,
    },
    coach: coach
      ? {
          seasons: coach.history.length,
          matches: coach.stats.matches,
          wins: coach.stats.wins,
          titles: coach.stats.titles,
          promotions: coach.stats.promotions,
        }
      : null,
  };
}
