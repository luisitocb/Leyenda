import type {
  DecisionEvent,
  DecisionEventEffects,
  PlayerTrait,
  ProtagonistPlayer,
} from '@leyenda/shared';
import { RNG } from '../rng';

import { pickWeighted } from '../match/math';
import { clamp, getAttributeValue, trainGroup } from './math';
import {
  ATTRIBUTE_SUCCESS_WEIGHT,
  EVENT_CHANCE_PER_WEEK,
  FORM_SUCCESS_WEIGHT,
  MORALE_SUCCESS_WEIGHT,
  SUCCESS_CHANCE_MAX,
  SUCCESS_CHANCE_MIN,
} from './types';

/**
 * Decide si toca evento de decisión esta semana (GDD §4.6) y, si toca,
 * elige uno por peso relativo. Sin condiciones de disparo ni cooldown
 * todavía — cualquier evento del pool es siempre elegible.
 */
export function selectEvent(allEvents: DecisionEvent[], rng: RNG): DecisionEvent | null {
  if (!rng.chance(EVENT_CHANCE_PER_WEEK)) return null;
  if (allEvents.length === 0) return null;
  return pickWeighted(allEvents, (event) => event.weight, rng);
}

export interface EventChoiceOutcome {
  protagonist: ProtagonistPlayer;
  success: boolean | null;
  grantedTrait: PlayerTrait | null;
}

/** No toca `attributeGroup`: eso necesita `rng` y lo aplica `resolveEventChoice` aparte. */
function applyEffects(
  protagonist: ProtagonistPlayer,
  effects: DecisionEventEffects
): ProtagonistPlayer {
  return {
    ...protagonist,
    money: protagonist.money + effects.moneyDelta,
    health: clamp(protagonist.health + effects.vitalStateDelta.health, 0, 99),
    mentalHealth: clamp(protagonist.mentalHealth + effects.vitalStateDelta.mentalHealth, 0, 99),
    form: clamp(protagonist.form + effects.vitalStateDelta.form, 0, 99),
    fitness: clamp(protagonist.fitness + effects.vitalStateDelta.fitness, 0, 100),
    personality: {
      ...protagonist.personality,
      ...Object.fromEntries(
        Object.entries(effects.personalityDelta).map(([key, delta]) => [
          key,
          clamp(
            protagonist.personality[key as keyof ProtagonistPlayer['personality']] + delta,
            1,
            99
          ),
        ])
      ),
    },
    relations: {
      ...protagonist.relations,
      ...Object.fromEntries(
        Object.entries(effects.relationsDelta).map(([key, delta]) => [
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

/**
 * Resuelve la elección del protagonista en un evento de decisión. Si la
 * opción no tiene `check`, aplica `effects` directo; si lo tiene, calcula
 * la probabilidad de éxito con la misma fórmula que un momento clave de
 * partido (`resolveKeyMomentChoice`) y aplica `effects` o `onFailEffects`
 * según toque.
 */
export function resolveEventChoice(
  protagonist: ProtagonistPlayer,
  event: DecisionEvent,
  choiceId: string,
  rng: RNG
): EventChoiceOutcome {
  const choice = event.choices.find((c) => c.id === choiceId);
  if (!choice) {
    throw new Error(`Elección desconocida "${choiceId}" para el evento "${event.id}"`);
  }

  let success: boolean | null = null;
  let effects = choice.effects;

  if (choice.check) {
    const attributeValue = getAttributeValue(protagonist, choice.check.determinedBy);
    const successProbability = clamp(
      choice.check.baseSuccessChance +
        (attributeValue - 50) / ATTRIBUTE_SUCCESS_WEIGHT +
        (protagonist.form - 70) / FORM_SUCCESS_WEIGHT +
        (protagonist.morale - 70) / MORALE_SUCCESS_WEIGHT,
      SUCCESS_CHANCE_MIN,
      SUCCESS_CHANCE_MAX
    );
    success = rng.chance(successProbability);
    effects = success ? choice.effects : (choice.onFailEffects ?? choice.effects);
  }

  let updated = applyEffects(protagonist, effects);
  if (effects.attributeGroup) {
    updated = { ...updated, ...trainGroup(effects.attributeGroup, updated, rng) };
  }

  let grantedTrait: PlayerTrait | null = null;
  if (choice.grantsTrait && rng.chance(choice.grantsTrait.chance)) {
    const { trait } = choice.grantsTrait;
    if (!updated.traits.includes(trait)) {
      updated = { ...updated, traits: [...updated.traits, trait] };
    }
    grantedTrait = trait;
  }

  return { protagonist: updated, success, grantedTrait };
}
