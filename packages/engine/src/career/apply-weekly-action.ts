import type { ProtagonistPlayer } from '@leyenda/shared';
import { RNG } from '../rng';

import { clamp, trainGroup } from './math';
import type { WeeklyActionEffect } from './types';

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
