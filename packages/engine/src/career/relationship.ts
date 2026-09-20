import type { ProtagonistPlayer } from '@leyenda/shared';
import { RNG } from '../rng';

import { clamp } from './math';
import { SUCCESS_CHANCE_MAX, SUCCESS_CHANCE_MIN } from './types';

export interface RelationshipAttemptResult {
  protagonist: ProtagonistPlayer;
  success: boolean;
}

/**
 * Buscar pareja (GDD §4.9: "conocer"). Solo tiene sentido desde `single` —
 * quien llama lo garantiza, igual que `attemptEarlyReturn` exige lesión
 * activa.
 */
export function startDating(protagonist: ProtagonistPlayer, rng: RNG): RelationshipAttemptResult {
  const successProbability = clamp(
    0.5 + (protagonist.personality.charisma - 50) / 300,
    SUCCESS_CHANCE_MIN,
    SUCCESS_CHANCE_MAX
  );
  const success = rng.chance(successProbability);
  if (!success) return { protagonist, success };
  return {
    protagonist: {
      ...protagonist,
      relationshipStatus: 'dating',
      relations: {
        ...protagonist.relations,
        partner: clamp(protagonist.relations.partner + 15, -100, 100),
      },
    },
    success,
  };
}

/** Formalizar la relación (`dating` → `relationship`): paso consciente, sin riesgo. */
export function formalizeRelationship(protagonist: ProtagonistPlayer): ProtagonistPlayer {
  return {
    ...protagonist,
    relationshipStatus: 'relationship',
    relations: {
      ...protagonist.relations,
      partner: clamp(protagonist.relations.partner + 10, -100, 100),
    },
  };
}

/**
 * Pedir matrimonio (GDD §4.9: "matrimonio"). Solo desde `relationship`. La
 * probabilidad pesa mucho la relación ya construida, no solo el carisma.
 */
export function proposeMarriage(
  protagonist: ProtagonistPlayer,
  rng: RNG
): RelationshipAttemptResult {
  const successProbability = clamp(
    0.3 + protagonist.relations.partner / 200 + (protagonist.personality.charisma - 50) / 400,
    SUCCESS_CHANCE_MIN,
    SUCCESS_CHANCE_MAX
  );
  const success = rng.chance(successProbability);
  if (success) {
    return {
      protagonist: {
        ...protagonist,
        relationshipStatus: 'married',
        relations: {
          ...protagonist.relations,
          partner: clamp(protagonist.relations.partner + 20, -100, 100),
        },
      },
      success,
    };
  }
  return {
    protagonist: {
      ...protagonist,
      relations: {
        ...protagonist.relations,
        partner: clamp(protagonist.relations.partner - 15, -100, 100),
      },
    },
    success,
  };
}

/** Romper (GDD §4.9: "ruptura"), desde cualquier estado con pareja. Decisión propia, sin riesgo. */
export function breakUp(protagonist: ProtagonistPlayer): ProtagonistPlayer {
  return {
    ...protagonist,
    relationshipStatus: 'single',
    relations: { ...protagonist.relations, partner: 0 },
  };
}
