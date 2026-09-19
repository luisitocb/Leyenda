import type { LiveOutcome, Position } from '@leyenda/shared';
import { RNG } from '../rng';

import { LIVE_PLAY_MATCH_CHANCE, LIVE_PLAY_OUTCOME_EFFECTS, type KeyMomentOutcome } from './types';

/**
 * Decide si el partido de esta semana incluye una Jugada en Vivo (GDD
 * §7B.2) y de qué tipo. El portero nunca dispara — "Penalti (portero)" es
 * otro minijuego, fuera de alcance todavía. Sin detección de "partido
 * importante" real (derbis, finales...): probabilidad plana por partido.
 */
export function shouldTriggerLivePlay(position: Position, rng: RNG): 'penalty' | 'chance' | null {
  if (position === 'GK') return null;
  if (!rng.chance(LIVE_PLAY_MATCH_CHANCE)) return null;
  return rng.chance(0.5) ? 'penalty' : 'chance';
}

/**
 * Convierte el resultado de una Jugada en Vivo al mismo formato que un
 * momento clave de partido, para que cuente en `computeMatchRating`/
 * `applyMatchExperience` (GDD §4.7) sin tocar esas dos funciones.
 */
export function convertLiveOutcomeToKeyMomentOutcome(outcome: LiveOutcome): KeyMomentOutcome {
  const effects = LIVE_PLAY_OUTCOME_EFFECTS[outcome.type];
  return {
    momentId: 'live-play',
    choiceId: outcome.type,
    success: outcome.success,
    ratingDelta: effects.ratingDelta,
    fanRelationDelta: effects.fanRelationDelta,
  };
}
