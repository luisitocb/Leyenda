import type {
  BoardObjective,
  BoardObjectiveKind,
  Club,
  CoachCareer,
  InterviewAmbition,
} from '@leyenda/shared';

import { clamp } from '../career/math';

/**
 * Directiva (GDD §6.1): objetivos, confianza, ultimátum y despido. Un
 * equipo que rinde exactamente como se espera de él no gana ni pierde
 * confianza a lo largo de la temporada. Los puntos esperados por puesto
 * salen de medir el motor (40 temporadas por liga): el campeón saca ~1,9
 * puntos por partido y el último ~0,85-0,9.
 */
export const BOARD_TUNING = {
  initialConfidence: { ambitious: 70, realistic: 60, cautious: 50 } as Record<
    InterviewAmbition,
    number
  >,
  /** Puestos que la promesa de la entrevista mueve el objetivo (negativo = más exigente). */
  targetShift: { ambitious: -2, realistic: 0, cautious: 2 } as Record<InterviewAmbition, number>,
  /** Puntos esperados por partido del campeón y del último (interpolación lineal entre ambos). */
  expectedPointsTop: 1.95,
  expectedPointsBottom: 0.85,
  confidencePerPoint: 2.5,
  ultimatumThreshold: 30,
  sackThreshold: 12,
  objectiveMetBonus: 20,
  objectiveMissedPenalty: 15,
  /** Puestos por debajo del objetivo a partir de los que fallar el objetivo puede costar el puesto. */
  seasonSackMargin: 3,
  seasonSackConfidence: 50,
} as const;

/** Posición esperada del club en su división: su puesto por reputación (desempate por id). */
export function expectedPosition(club: Club, divisionClubs: Club[]): number {
  const ranked = [...divisionClubs].sort(
    (a, b) => b.reputation - a.reputation || a.id.localeCompare(b.id)
  );
  const index = ranked.findIndex((c) => c.id === club.id);
  return index === -1 ? divisionClubs.length : index + 1;
}

export interface BuildObjectiveInput {
  club: Club;
  divisionClubs: Club[];
  seasonIndex: number;
  ambition: InterviewAmbition;
  /** Plazas de ascenso/descenso con las divisiones vecinas (0 si no hay división arriba/abajo). */
  promotionSpots: number;
  relegationSpots: number;
}

/**
 * Objetivo de la temporada (GDD §6.1): parte del puesto esperado por
 * reputación, ajustado por lo que el entrenador prometió en la entrevista.
 */
export function buildBoardObjective(input: BuildObjectiveInput): BoardObjective {
  const size = input.divisionClubs.length;
  const expected = clamp(
    expectedPosition(input.club, input.divisionClubs) + BOARD_TUNING.targetShift[input.ambition],
    1,
    size
  );

  let kind: BoardObjectiveKind;
  let targetPosition = expected;
  if (expected === 1) {
    kind = 'title';
  } else if (input.promotionSpots > 0 && expected <= input.promotionSpots) {
    kind = 'promotion';
  } else if (expected <= Math.ceil(size / 4)) {
    kind = 'top_positions';
  } else if (expected <= Math.ceil(size / 2)) {
    kind = 'top_half';
  } else if (input.relegationSpots > 0 && expected > size - input.relegationSpots - 2) {
    kind = 'avoid_relegation';
    targetPosition = size - input.relegationSpots;
  } else {
    kind = 'mid_table';
  }

  return { kind, targetPosition, seasonIndex: input.seasonIndex };
}

/** Puntos por partido que la directiva espera para un objetivo dado. */
export function expectedPointsPerMatch(targetPosition: number, divisionSize: number): number {
  if (divisionSize <= 1) return BOARD_TUNING.expectedPointsTop;
  const t = (targetPosition - 1) / (divisionSize - 1);
  return (
    BOARD_TUNING.expectedPointsTop -
    (BOARD_TUNING.expectedPointsTop - BOARD_TUNING.expectedPointsBottom) * t
  );
}

export type BoardVerdict = 'none' | 'ultimatum' | 'sacked';

export interface BoardUpdate {
  coach: CoachCareer;
  verdict: BoardVerdict;
}

function verdictFor(coach: CoachCareer): BoardUpdate {
  if (coach.boardConfidence < BOARD_TUNING.sackThreshold) return { coach, verdict: 'sacked' };
  if (coach.boardConfidence < BOARD_TUNING.ultimatumThreshold && !coach.ultimatumGiven) {
    return { coach: { ...coach, ultimatumGiven: true }, verdict: 'ultimatum' };
  }
  return { coach, verdict: 'none' };
}

/**
 * Confianza tras un partido: sube o baja según los puntos conseguidos
 * frente a los esperados por el objetivo. Puede disparar el ultimátum
 * (una vez por temporada) o el despido.
 */
export function applyMatchToBoard(
  coach: CoachCareer,
  points: number,
  divisionSize: number
): BoardUpdate {
  const target = coach.objective?.targetPosition ?? Math.ceil(divisionSize / 2);
  const delta =
    (points - expectedPointsPerMatch(target, divisionSize)) * BOARD_TUNING.confidencePerPoint;
  return verdictFor({ ...coach, boardConfidence: clamp(coach.boardConfidence + delta, 0, 100) });
}

/** Cambia la confianza por una decisión fuera del campo (ruedas de prensa, GDD §6.1). */
export function applyBoardConfidenceDelta(coach: CoachCareer, delta: number): BoardUpdate {
  return verdictFor({ ...coach, boardConfidence: clamp(coach.boardConfidence + delta, 0, 100) });
}

export interface SeasonEvaluation {
  coach: CoachCareer;
  objectiveMet: boolean;
  sacked: boolean;
}

/**
 * Balance de la directiva al final de la temporada: cumplir el objetivo
 * da confianza; fallarlo por mucho con poca confianza cuesta el puesto.
 */
export function evaluateSeasonForBoard(
  coach: CoachCareer,
  finalPosition: number
): SeasonEvaluation {
  const target = coach.objective?.targetPosition ?? finalPosition;
  const objectiveMet = finalPosition <= target;
  const confidence = clamp(
    coach.boardConfidence +
      (objectiveMet ? BOARD_TUNING.objectiveMetBonus : -BOARD_TUNING.objectiveMissedPenalty),
    0,
    100
  );
  const sacked =
    confidence < BOARD_TUNING.sackThreshold ||
    (finalPosition > target + BOARD_TUNING.seasonSackMargin &&
      confidence < BOARD_TUNING.seasonSackConfidence);
  return {
    coach: { ...coach, boardConfidence: confidence, ultimatumGiven: false },
    objectiveMet,
    sacked,
  };
}
