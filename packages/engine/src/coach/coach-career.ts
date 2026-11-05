import type {
  BoardObjective,
  Club,
  CoachCareer,
  CoachSeasonRecord,
  EntityId,
  InterviewAmbition,
  LegacyCoachCareerV1,
  MatchResult,
  SquadPlayer,
} from '@leyenda/shared';

import type { RNG } from '../rng';
import { clamp } from '../career/math';
import { DEFAULT_TACTICS } from '../match/tactics';
import { BOARD_TUNING } from './board';

/**
 * Cuánto Legado (ver `calculateLegacyScore`) equivale a un punto de
 * reputación de entrenador. Aproximación de primer intento (GDD §5:
 * "Reputación → nivel de clubes que te ofrecen trabajo al empezar").
 */
export const COACH_REPUTATION_DIVISOR = 250;

export const JOB_OFFERS_COUNT = 3;

/** Cambios de reputación de entrenador por lo que pasa en una temporada (escala 1-20). */
export const COACH_REPUTATION_DELTAS = {
  title: 2,
  promotion: 2,
  objectiveMet: 1,
  objectiveMissed: -1,
  relegation: -2,
  sacked: -2,
} as const;

/** Edad a la que el entrenador se jubila sí o sí (GDD §3: "hasta jubilarte"). */
export const COACH_RETIREMENT_AGE = 70;

/** Reputación inicial de entrenador (1-20, misma escala que `Club.reputation`) a partir del Legado como jugador. */
export function calculateInitialCoachReputation(legacyScore: number): number {
  return clamp(Math.round(legacyScore / COACH_REPUTATION_DIVISOR), 1, 20);
}

/**
 * Ofertas de trabajo: clubes cuya reputación se acerca a la del
 * entrenador, con algo de variedad. Determinista dado el mismo `rng`.
 */
export function generateJobOffers(
  candidateClubs: Club[],
  coachReputation: number,
  rng: RNG,
  count: number = JOB_OFFERS_COUNT
): Club[] {
  const sortedByProximity = [...candidateClubs].sort(
    (a, b) =>
      Math.abs(a.reputation - coachReputation) - Math.abs(b.reputation - coachReputation) ||
      a.id.localeCompare(b.id)
  );
  const pool = sortedByProximity.slice(0, count * 3);
  return rng.shuffle(pool).slice(0, count);
}

function emptyStats(): CoachCareer['stats'] {
  return { matches: 0, wins: 0, draws: 0, losses: 0, titles: 0, promotions: 0, sackings: 0 };
}

export interface CreateCoachCareerInput {
  id: EntityId;
  clubId: EntityId;
  legacyScore: number;
  squad: SquadPlayer[];
  objective: BoardObjective | null;
  ambition: InterviewAmbition;
}

/** Pura: el `id` y la plantilla los genera el llamador (mismo patrón que `createCharacter`). */
export function createCoachCareer(input: CreateCoachCareerInput): CoachCareer {
  return {
    id: input.id,
    clubId: input.clubId,
    reputation: calculateInitialCoachReputation(input.legacyScore),
    status: 'employed',
    squad: input.squad,
    tactics: DEFAULT_TACTICS,
    trainingFocus: 'technical',
    boardConfidence: BOARD_TUNING.initialConfidence[input.ambition],
    ultimatumGiven: false,
    objective: input.objective,
    results: {},
    stats: emptyStats(),
    history: [],
  };
}

/**
 * Guarda positiva: `LegacyCoachCareerV1` es un supertipo estructural de
 * `CoachCareer`, así que una guarda `data is LegacyCoachCareerV1` dejaría
 * la rama contraria en `never`.
 */
export function isCurrentCoachCareer(data: CoachCareer | LegacyCoachCareerV1): data is CoachCareer {
  return 'squad' in data;
}

export function isLegacyCoachCareer(data: CoachCareer | LegacyCoachCareerV1): boolean {
  return !isCurrentCoachCareer(data);
}

/**
 * "Migración" de las partidas de la primera historia de Fase 4 (regla 8
 * de CLAUDE.md): conservan id, club y reputación, y reciben la plantilla
 * que el llamador genera para ese club. El objetivo se fija al empezar la
 * siguiente temporada.
 */
export function upgradeLegacyCoachCareer(
  legacy: LegacyCoachCareerV1,
  squad: SquadPlayer[]
): CoachCareer {
  return {
    ...legacy,
    status: 'employed',
    squad,
    tactics: DEFAULT_TACTICS,
    trainingFocus: 'technical',
    boardConfidence: BOARD_TUNING.initialConfidence.realistic,
    ultimatumGiven: false,
    objective: null,
    results: {},
    stats: emptyStats(),
    history: [],
  };
}

/** Puntos de un resultado para el equipo del entrenador. */
export function pointsFor(result: MatchResult, isHome: boolean): number {
  const own = isHome ? result.homeGoals : result.awayGoals;
  const other = isHome ? result.awayGoals : result.homeGoals;
  if (own > other) return 3;
  if (own === other) return 1;
  return 0;
}

/** Guarda el resultado de un partido del club (para la clasificación) y suma estadísticas. */
export function recordCoachMatch(
  coach: CoachCareer,
  matchId: EntityId,
  result: MatchResult,
  isHome: boolean
): CoachCareer {
  const points = pointsFor(result, isHome);
  return {
    ...coach,
    results: { ...coach.results, [matchId]: result },
    stats: {
      ...coach.stats,
      matches: coach.stats.matches + 1,
      wins: coach.stats.wins + (points === 3 ? 1 : 0),
      draws: coach.stats.draws + (points === 1 ? 1 : 0),
      losses: coach.stats.losses + (points === 0 ? 1 : 0),
    },
  };
}

/**
 * Cierra la temporada del entrenador: historial, títulos, ascensos y
 * reputación. Los resultados guardados se vacían (la temporada siguiente
 * tiene partidos nuevos).
 */
export function closeCoachSeason(
  coach: CoachCareer,
  record: CoachSeasonRecord,
  sacked: boolean
): CoachCareer {
  const D = COACH_REPUTATION_DELTAS;
  const reputationDelta =
    (record.champion ? D.title : 0) +
    (record.promoted ? D.promotion : 0) +
    (record.objectiveMet ? D.objectiveMet : D.objectiveMissed) +
    (record.relegated ? D.relegation : 0) +
    (sacked ? D.sacked : 0);
  return {
    ...coach,
    reputation: clamp(coach.reputation + reputationDelta, 1, 20),
    status: sacked ? 'unemployed' : coach.status,
    results: {},
    objective: null,
    history: [...coach.history, record],
    stats: {
      ...coach.stats,
      titles: coach.stats.titles + (record.champion ? 1 : 0),
      promotions: coach.stats.promotions + (record.promoted ? 1 : 0),
      sackings: coach.stats.sackings + (sacked ? 1 : 0),
    },
  };
}

/** Despido a mitad de temporada (GDD §6.1: confianza por debajo del límite). */
export function sackCoach(coach: CoachCareer): CoachCareer {
  return {
    ...coach,
    status: 'unemployed',
    reputation: clamp(coach.reputation + COACH_REPUTATION_DELTAS.sacked, 1, 20),
    objective: null,
    stats: { ...coach.stats, sackings: coach.stats.sackings + 1 },
  };
}

/** Dimisión: sale del club sin el castigo de reputación de un despido. */
export function resignCoach(coach: CoachCareer): CoachCareer {
  return { ...coach, status: 'unemployed', objective: null };
}

export interface HireCoachInput {
  clubId: EntityId;
  squad: SquadPlayer[];
  objective: BoardObjective | null;
  ambition: InterviewAmbition;
}

/**
 * Fichaje por un club nuevo (tras despido, dimisión o desde el paro).
 * Conserva `results`: los partidos ya jugados esta temporada con el club
 * anterior deben seguir contando igual en la clasificación.
 */
export function hireCoach(coach: CoachCareer, input: HireCoachInput): CoachCareer {
  return {
    ...coach,
    clubId: input.clubId,
    status: 'employed',
    squad: input.squad,
    objective: input.objective,
    boardConfidence: BOARD_TUNING.initialConfidence[input.ambition],
    ultimatumGiven: false,
  };
}

export function retireCoach(coach: CoachCareer): CoachCareer {
  return { ...coach, status: 'retired' };
}
