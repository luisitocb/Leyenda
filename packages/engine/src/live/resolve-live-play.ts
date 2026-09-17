import type { LiveOutcome, LiveSituation } from '@leyenda/shared';
import type { RNG } from '../rng';

import { resolveChance } from './chance';
import { resolvePenalty } from './penalty';
import type { GestureData } from './types';

/**
 * Resuelve una Jugada en Vivo (GDD §7B.5). Solo 'penalty' y 'chance' están
 * implementados en la Fase 0.5 (prototipo); el resto de tipos de
 * LiveSituation quedan para fases posteriores.
 */
export function resolveLivePlay(
  situation: LiveSituation,
  gesture: GestureData,
  rng: RNG
): LiveOutcome {
  if (situation.type !== gesture.type) {
    throw new Error(
      `El tipo de gesto (${gesture.type}) no coincide con el tipo de situación (${situation.type})`
    );
  }

  switch (situation.type) {
    case 'penalty':
      return resolvePenalty(situation, gesture as Extract<GestureData, { type: 'penalty' }>, rng);
    case 'chance':
      return resolveChance(situation, gesture as Extract<GestureData, { type: 'chance' }>, rng);
    default:
      throw new Error(
        `Tipo de Jugada en Vivo no implementado en Fase 0.5: ${String(situation.type)}`
      );
  }
}
