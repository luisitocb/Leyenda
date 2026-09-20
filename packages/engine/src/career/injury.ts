import type { InjuryType, ProtagonistPlayer } from '@leyenda/shared';
import { RNG } from '../rng';

import { pickWeighted } from '../match/math';
import { clamp } from './math';
import {
  EARLY_RETURN_FORM_PENALTY,
  INJURY_BASE_CHANCE,
  INJURY_CHANCE_MAX,
  INJURY_FITNESS_WEIGHT,
  RELAPSE_HEALTH_PENALTY,
  SUCCESS_CHANCE_MAX,
  SUCCESS_CHANCE_MIN,
} from './types';

/**
 * Decide si toca lesionarse esta semana (GDD §4.8). Quien llama solo debe
 * invocarla cuando `activeInjury` es `null` — no comprueba eso aquí, mismo
 * reparto de responsabilidades que `shouldTriggerLivePlay`.
 */
export function rollInjuryChance(protagonist: ProtagonistPlayer, rng: RNG): boolean {
  const chance = clamp(
    INJURY_BASE_CHANCE + (70 - protagonist.fitness) / INJURY_FITNESS_WEIGHT,
    0,
    INJURY_CHANCE_MAX
  );
  return rng.chance(chance);
}

/**
 * Aplica una lesión nueva: elige tipo ponderado por `weight` (más grave,
 * más raro), tira la duración dentro de su rango y resta la penalización de
 * salud del tipo elegido.
 */
export function applyInjuryOnset(
  protagonist: ProtagonistPlayer,
  injuryTypes: InjuryType[],
  rng: RNG
): ProtagonistPlayer {
  const type = pickWeighted(injuryTypes, (t) => t.weight, rng);
  const weeksRemaining = rng.nextInt(type.minWeeks, type.maxWeeks);
  return {
    ...protagonist,
    activeInjury: { typeId: type.id, weeksRemaining },
    health: clamp(protagonist.health + type.healthPenalty, 0, 99),
  };
}

/** Reposo completo: una semana menos de baja, sin riesgo. Pura, sin RNG. */
export function advanceInjuryRest(protagonist: ProtagonistPlayer): ProtagonistPlayer {
  if (!protagonist.activeInjury) return protagonist;
  const weeksRemaining = protagonist.activeInjury.weeksRemaining - 1;
  return {
    ...protagonist,
    activeInjury: weeksRemaining > 0 ? { ...protagonist.activeInjury, weeksRemaining } : null,
  };
}

export interface EarlyReturnResult {
  protagonist: ProtagonistPlayer;
  success: boolean;
}

/**
 * Volver antes de tiempo (GDD §4.8: "riesgo de recaída si vuelves antes de
 * tiempo — decisión del jugador"). Con éxito, la lesión se da por superada
 * de golpe (a cambio de una pequeña penalización de forma); con fallo, la
 * misma lesión se recae y se vuelve a tirar su duración.
 */
export function attemptEarlyReturn(
  protagonist: ProtagonistPlayer,
  injuryTypes: InjuryType[],
  rng: RNG
): EarlyReturnResult {
  if (!protagonist.activeInjury) {
    throw new Error('No hay ninguna lesión activa de la que volver');
  }

  const successProbability = clamp(
    0.5 + (protagonist.health - 70) / 300,
    SUCCESS_CHANCE_MIN,
    SUCCESS_CHANCE_MAX
  );
  const success = rng.chance(successProbability);

  if (success) {
    return {
      protagonist: {
        ...protagonist,
        activeInjury: null,
        form: clamp(protagonist.form - EARLY_RETURN_FORM_PENALTY, 0, 99),
      },
      success,
    };
  }

  const type = injuryTypes.find((t) => t.id === protagonist.activeInjury!.typeId);
  const weeksRemaining = type
    ? rng.nextInt(type.minWeeks, type.maxWeeks)
    : protagonist.activeInjury.weeksRemaining;

  return {
    protagonist: {
      ...protagonist,
      activeInjury: { typeId: protagonist.activeInjury.typeId, weeksRemaining },
      health: clamp(protagonist.health - RELAPSE_HEALTH_PENALTY, 0, 99),
    },
    success,
  };
}
