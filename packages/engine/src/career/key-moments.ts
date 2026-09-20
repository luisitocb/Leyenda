import type { KeyMoment, Position, ProtagonistPlayer } from '@leyenda/shared';
import { RNG } from '../rng';

import { clamp, getAttributeValue } from './math';
import {
  ATTRIBUTE_SUCCESS_WEIGHT,
  BASE_MATCH_RATING,
  FORM_SUCCESS_WEIGHT,
  MATCH_RATING_FORM_BOOST_THRESHOLD,
  MATCH_RATING_FORM_DELTA,
  MATCH_RATING_FORM_PENALTY_THRESHOLD,
  MORALE_SUCCESS_WEIGHT,
  SUCCESS_CHANCE_MAX,
  SUCCESS_CHANCE_MIN,
  type KeyMomentOutcome,
} from './types';

/** Elige los momentos clave de un partido, filtrando por posición (GDD §4.7). */
export function selectKeyMoments(
  position: Position,
  allMoments: KeyMoment[],
  rng: RNG,
  count: number
): KeyMoment[] {
  const applicable = allMoments.filter(
    (moment) => moment.positions === 'any' || moment.positions.includes(position)
  );
  return rng.shuffle([...applicable]).slice(0, count);
}

/**
 * Resuelve la elección del protagonista en un momento clave. Probabilidad
 * de éxito = `baseSuccessChance` + el atributo relevante, la forma y la
 * moral (GDD §4.7: "depende de tus atributos, la forma y la moral").
 */
export function resolveKeyMomentChoice(
  protagonist: ProtagonistPlayer,
  moment: KeyMoment,
  choiceId: string,
  rng: RNG
): KeyMomentOutcome {
  const choice = moment.choices.find((c) => c.id === choiceId);
  if (!choice) {
    throw new Error(`Elección desconocida "${choiceId}" para el momento clave "${moment.id}"`);
  }

  const attributeValue = getAttributeValue(protagonist, choice.determinedBy);
  const successProbability = clamp(
    choice.baseSuccessChance +
      (attributeValue - 50) / ATTRIBUTE_SUCCESS_WEIGHT +
      (protagonist.form - 70) / FORM_SUCCESS_WEIGHT +
      (protagonist.morale - 70) / MORALE_SUCCESS_WEIGHT,
    SUCCESS_CHANCE_MIN,
    SUCCESS_CHANCE_MAX
  );
  const success = rng.chance(successProbability);

  return {
    momentId: moment.id,
    choiceId,
    success,
    ratingDelta: success ? choice.ratingDelta.onSuccess : choice.ratingDelta.onFail,
    fanRelationDelta: success ? choice.fanRelationDelta.onSuccess : choice.fanRelationDelta.onFail,
    // Un fallo nunca cuenta como gol/asistencia, aunque la opción esté etiquetada.
    implies: success ? choice.implies : null,
  };
}

/** Nota de partido (1-10) a partir de los momentos clave ya resueltos. */
export function computeMatchRating(outcomes: KeyMomentOutcome[]): number {
  const total = BASE_MATCH_RATING + outcomes.reduce((sum, o) => sum + o.ratingDelta, 0);
  return clamp(Math.round(total * 10) / 10, 1, 10);
}

/**
 * Aplica los efectos acumulados de un partido (afición, forma, estadísticas
 * de carrera) al protagonista. Solo se llama cuando ha habido partido, así
 * que `gamesPlayed` sube siempre; `goalsScored`/`assists` solo con los
 * momentos marcados `implies` que hayan tenido éxito.
 */
export function applyMatchExperience(
  protagonist: ProtagonistPlayer,
  outcomes: KeyMomentOutcome[],
  rating: number
): ProtagonistPlayer {
  const fanRelationDelta = outcomes.reduce((sum, o) => sum + o.fanRelationDelta, 0);
  const formDelta =
    rating >= MATCH_RATING_FORM_BOOST_THRESHOLD
      ? MATCH_RATING_FORM_DELTA
      : rating <= MATCH_RATING_FORM_PENALTY_THRESHOLD
        ? -MATCH_RATING_FORM_DELTA
        : 0;
  const goals = outcomes.filter((o) => o.implies === 'goal').length;
  const assists = outcomes.filter((o) => o.implies === 'assist').length;

  return {
    ...protagonist,
    form: clamp(protagonist.form + formDelta, 0, 99),
    relations: {
      ...protagonist.relations,
      fans: clamp(protagonist.relations.fans + fanRelationDelta, -100, 100),
    },
    gamesPlayed: protagonist.gamesPlayed + 1,
    goalsScored: protagonist.goalsScored + goals,
    assists: protagonist.assists + assists,
  };
}
