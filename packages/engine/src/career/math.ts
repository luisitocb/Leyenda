import type { AttributeValue, ProtagonistPlayer } from '@leyenda/shared';
import { RNG } from '../rng';

import { TRAINING_GAIN_MAX, TRAINING_GAIN_MIN } from './types';

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function trainAttribute(current: AttributeValue, rng: RNG): AttributeValue {
  return clamp(current + rng.nextInt(TRAINING_GAIN_MIN, TRAINING_GAIN_MAX), 1, 99);
}

/** Sube un poco cada atributo individual del grupo entrenado (acciones semanales y eventos de decisión). */
export function trainGroup(
  group: 'physical' | 'technical' | 'mental',
  protagonist: ProtagonistPlayer,
  rng: RNG
): Pick<ProtagonistPlayer, 'physical' | 'technical' | 'mental'> {
  if (group === 'physical') {
    return {
      physical: {
        speed: trainAttribute(protagonist.physical.speed, rng),
        stamina: trainAttribute(protagonist.physical.stamina, rng),
        strength: trainAttribute(protagonist.physical.strength, rng),
        jumping: trainAttribute(protagonist.physical.jumping, rng),
      },
      technical: protagonist.technical,
      mental: protagonist.mental,
    };
  }

  if (group === 'mental') {
    return {
      physical: protagonist.physical,
      technical: protagonist.technical,
      mental: {
        vision: trainAttribute(protagonist.mental.vision, rng),
        composure: trainAttribute(protagonist.mental.composure, rng),
        leadership: trainAttribute(protagonist.mental.leadership, rng),
        teamwork: trainAttribute(protagonist.mental.teamwork, rng),
      },
    };
  }

  const technical =
    'reflexes' in protagonist.technical
      ? {
          reflexes: trainAttribute(protagonist.technical.reflexes, rng),
          positioning: trainAttribute(protagonist.technical.positioning, rng),
          aerialAbility: trainAttribute(protagonist.technical.aerialAbility, rng),
        }
      : {
          passing: trainAttribute(protagonist.technical.passing, rng),
          dribbling: trainAttribute(protagonist.technical.dribbling, rng),
          shooting: trainAttribute(protagonist.technical.shooting, rng),
          ballControl: trainAttribute(protagonist.technical.ballControl, rng),
          defending: trainAttribute(protagonist.technical.defending, rng),
          heading: trainAttribute(protagonist.technical.heading, rng),
        };

  return { physical: protagonist.physical, technical, mental: protagonist.mental };
}

function numberFields(obj: object): Record<string, number> {
  return obj as unknown as Record<string, number>;
}

/**
 * Busca el valor de un atributo por nombre en físico/técnico/mental/personalidad
 * (usado por los cálculos de probabilidad de momentos clave y eventos de decisión).
 */
export function getAttributeValue(protagonist: ProtagonistPlayer, attribute: string): number {
  if (attribute in protagonist.physical) {
    return numberFields(protagonist.physical)[attribute]!;
  }
  if (attribute in protagonist.technical) {
    return numberFields(protagonist.technical)[attribute]!;
  }
  if (attribute in protagonist.mental) {
    return numberFields(protagonist.mental)[attribute]!;
  }
  if (attribute in protagonist.personality) {
    return numberFields(protagonist.personality)[attribute]!;
  }
  throw new Error(`Atributo desconocido: ${attribute}`);
}
