import type { AttributeValue, ProtagonistPlayer } from '@leyenda/shared';
import { RNG } from '../rng';

import { clamp } from './math';
import { TRAINING_GAIN_MAX, TRAINING_GAIN_MIN, type WeeklyActionEffect } from './types';

function trainAttribute(current: AttributeValue, rng: RNG): AttributeValue {
  return clamp(current + rng.nextInt(TRAINING_GAIN_MIN, TRAINING_GAIN_MAX), 1, 99);
}

function trainGroup(
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

/**
 * Aplica una acción semanal (GDD §4.5) al protagonista. Función pura y
 * determinista: valida en la frontera (energía/dinero insuficiente vienen
 * de una elección del usuario en la UI) y lanza si no se puede pagar.
 */
export function applyWeeklyAction(
  protagonist: ProtagonistPlayer,
  action: WeeklyActionEffect,
  rng: RNG
): ProtagonistPlayer {
  if (action.energyCost > 0 && protagonist.energy < action.energyCost) {
    throw new Error(
      `Energía insuficiente: hacen falta ${action.energyCost}, quedan ${protagonist.energy}`
    );
  }
  if (protagonist.money + action.effects.moneyDelta < 0) {
    throw new Error(
      `Dinero insuficiente: cuesta ${-action.effects.moneyDelta}, quedan ${protagonist.money}`
    );
  }

  const { attributeGroup, vitalStateDelta, relationsDelta, moneyDelta } = action.effects;
  const trained = attributeGroup
    ? trainGroup(attributeGroup, protagonist, rng)
    : {
        physical: protagonist.physical,
        technical: protagonist.technical,
        mental: protagonist.mental,
      };

  return {
    ...protagonist,
    ...trained,
    energy: clamp(protagonist.energy - action.energyCost, 0, 100),
    money: protagonist.money + moneyDelta,
    health: clamp(protagonist.health + vitalStateDelta.health, 0, 99),
    mentalHealth: clamp(protagonist.mentalHealth + vitalStateDelta.mentalHealth, 0, 99),
    form: clamp(protagonist.form + vitalStateDelta.form, 0, 99),
    fitness: clamp(protagonist.fitness + vitalStateDelta.fitness, 0, 100),
    relations: {
      ...protagonist.relations,
      ...Object.fromEntries(
        Object.entries(relationsDelta).map(([key, delta]) => [
          key,
          clamp(
            protagonist.relations[key as keyof ProtagonistPlayer['relations']] + delta,
            -100,
            100
          ),
        ])
      ),
    },
  };
}
