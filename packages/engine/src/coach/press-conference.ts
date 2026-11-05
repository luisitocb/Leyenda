import type {
  CoachCareer,
  MatchResult,
  PressConference,
  PressConferenceAnswer,
  PressConferenceContext,
} from '@leyenda/shared';

import type { RNG } from '../rng';
import { clamp } from '../career/math';
import { pickWeighted } from '../match/math';
import { applyBoardConfidenceDelta, type BoardVerdict } from './board';
import { pointsFor } from './coach-career';
import { applySquadMoraleDelta } from './squad';

/** Probabilidad de rueda de prensa en una semana con partido (GDD §6.1). */
export const PRESS_CONFERENCE_CHANCE = 0.4;

/** Contexto de la rueda de prensa según el último partido del club. */
export function pressContextFor(
  lastResult: { result: MatchResult; isHome: boolean } | null
): PressConferenceContext {
  if (!lastResult) return 'pre_match';
  const points = pointsFor(lastResult.result, lastResult.isHome);
  if (points === 3) return 'after_win';
  if (points === 0) return 'after_loss';
  return 'pre_match';
}

/**
 * Decide si esta semana hay rueda de prensa y cuál, ponderada por `weight`
 * entre las del contexto. Determinista dado el `rng`.
 */
export function selectPressConference(
  pool: PressConference[],
  context: PressConferenceContext,
  rng: RNG
): PressConference | null {
  if (!rng.chance(PRESS_CONFERENCE_CHANCE)) return null;
  const candidates = pool.filter((c) => c.context === context);
  if (candidates.length === 0) return null;
  return pickWeighted(candidates, (c) => c.weight, rng);
}

export interface PressAnswerResult {
  coach: CoachCareer;
  verdict: BoardVerdict;
}

/** Aplica una respuesta: moral del vestuario, confianza de la directiva y reputación. */
export function applyPressAnswer(
  coach: CoachCareer,
  answer: PressConferenceAnswer
): PressAnswerResult {
  const withMorale: CoachCareer = {
    ...coach,
    squad: applySquadMoraleDelta(coach.squad, answer.effects.squadMorale),
    reputation: clamp(coach.reputation + answer.effects.reputation, 1, 20),
  };
  return applyBoardConfidenceDelta(withMorale, answer.effects.boardConfidence);
}
