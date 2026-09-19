import type {
  AttributeValue,
  GoalkeeperAttributes,
  MentalAttributes,
  PersonalityAttributes,
  PhysicalAttributes,
  ProtagonistPlayer,
  TechnicalAttributes,
} from '@leyenda/shared';
import { RNG } from '../rng';

import {
  ATTRIBUTE_NOISE,
  BASE_AGE,
  GROUP_MAX,
  GROUP_MIN,
  INITIAL_CONTRACT_YEARS,
  NEUTRAL_STATE_MAX,
  NEUTRAL_STATE_MIN,
  PERSONALITY_MAX,
  PERSONALITY_MIN,
  POINT_POOL,
  POTENTIAL_MARGIN_MAX,
  POTENTIAL_MARGIN_MIN,
  type CreateCharacterInput,
} from './types';

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function weighted(groupValue: number, rng: RNG): AttributeValue {
  return clamp(Math.round(groupValue + rng.nextInt(-ATTRIBUTE_NOISE, ATTRIBUTE_NOISE)), 1, 99);
}

function neutralState(rng: RNG): number {
  return rng.nextInt(NEUTRAL_STATE_MIN, NEUTRAL_STATE_MAX);
}

function dateOfBirthForAge(referenceDate: string, age: number, dayOffset: number): string {
  const ref = new Date(referenceDate);
  const birth = new Date(Date.UTC(ref.getUTCFullYear() - age, ref.getUTCMonth(), ref.getUTCDate()));
  birth.setUTCDate(birth.getUTCDate() - dayOffset);
  return birth.toISOString().slice(0, 10);
}

function addYears(date: string, years: number): string {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear() + years, d.getUTCMonth(), d.getUTCDate()))
    .toISOString()
    .slice(0, 10);
}

/** Valida el reparto de puntos: es entrada de usuario (frontera del sistema), a diferencia del resto del cálculo interno. */
function validateGroupAllocation(allocation: CreateCharacterInput['groupAllocation']): void {
  const { physical, technical, mental } = allocation;
  for (const [group, value] of Object.entries({ physical, technical, mental })) {
    if (value < GROUP_MIN || value > GROUP_MAX) {
      throw new Error(`El grupo "${group}" (${value}) debe estar entre ${GROUP_MIN} y ${GROUP_MAX}`);
    }
  }
  const total = physical + technical + mental;
  if (total !== POINT_POOL) {
    throw new Error(`El reparto de puntos debe sumar ${POINT_POOL}, suma actual: ${total}`);
  }
}

/**
 * Crea un personaje protagonista (GDD §4.1). Función pura y determinista:
 * el mismo input + rng siempre produce el mismo personaje.
 */
export function createCharacter(input: CreateCharacterInput, rng: RNG): ProtagonistPlayer {
  validateGroupAllocation(input.groupAllocation);

  const effectivePhysical = clamp(
    input.groupAllocation.physical + input.origin.attributeGroupBonus.physical,
    1,
    99
  );
  const effectiveTechnical = clamp(
    input.groupAllocation.technical + input.origin.attributeGroupBonus.technical,
    1,
    99
  );
  const effectiveMental = clamp(
    input.groupAllocation.mental + input.origin.attributeGroupBonus.mental,
    1,
    99
  );

  const physical: PhysicalAttributes = {
    speed: weighted(effectivePhysical, rng),
    stamina: weighted(effectivePhysical, rng),
    strength: weighted(effectivePhysical, rng),
    jumping: weighted(effectivePhysical, rng),
  };

  const technical: TechnicalAttributes | GoalkeeperAttributes =
    input.position === 'GK'
      ? ({
          reflexes: weighted(effectiveTechnical, rng),
          positioning: weighted(effectiveTechnical, rng),
          aerialAbility: weighted(effectiveTechnical, rng),
        } satisfies GoalkeeperAttributes)
      : ({
          passing: weighted(effectiveTechnical, rng),
          dribbling: weighted(effectiveTechnical, rng),
          shooting: weighted(effectiveTechnical, rng),
          ballControl: weighted(effectiveTechnical, rng),
          defending: weighted(effectiveTechnical, rng),
          heading: weighted(effectiveTechnical, rng),
        } satisfies TechnicalAttributes);

  const mental: MentalAttributes = {
    vision: weighted(effectiveMental, rng),
    composure: weighted(effectiveMental, rng),
    leadership: weighted(effectiveMental, rng),
    teamwork: weighted(effectiveMental, rng),
  };

  const personality: PersonalityAttributes = {
    professionalism: rng.nextInt(PERSONALITY_MIN, PERSONALITY_MAX),
    charisma: rng.nextInt(PERSONALITY_MIN, PERSONALITY_MAX),
    ego: rng.nextInt(PERSONALITY_MIN, PERSONALITY_MAX),
    temperament: rng.nextInt(PERSONALITY_MIN, PERSONALITY_MAX),
  };

  const currentAbility = clamp(
    Math.round((effectivePhysical + effectiveTechnical + effectiveMental) / 3),
    1,
    99
  );
  const potential = clamp(
    currentAbility + rng.nextInt(POTENTIAL_MARGIN_MIN, POTENTIAL_MARGIN_MAX),
    1,
    99
  );

  const age = input.origin.startingAgeOverride ?? BASE_AGE;

  return {
    id: input.id,
    firstName: input.firstName,
    lastName: input.lastName,
    nationality: input.nationality,
    dateOfBirth: dateOfBirthForAge(input.startDate, age, rng.nextInt(0, 364)),
    position: input.position,
    foot: input.foot,
    physical,
    technical,
    mental,
    personality,
    potential,
    currentAbility,
    form: neutralState(rng),
    morale: neutralState(rng),
    fitness: neutralState(rng),
    clubId: input.clubId,
    contractExpiry: addYears(input.startDate, INITIAL_CONTRACT_YEARS),
    value: currentAbility * 1000,
    health: neutralState(rng),
    mentalHealth: neutralState(rng),
    energy: 100,
    money: input.origin.startingMoney,
    assets: 0,
    relations: {
      coach: 0,
      squad: 0,
      fans: 0,
      board: 0,
      press: 0,
      partner: 0,
      family: 0,
      agent: input.origin.agentRelationBonus,
      sponsors: 0,
    },
    traits: [],
    gamesPlayed: 0,
    goalsScored: 0,
    assists: 0,
    titlesWon: [],
  };
}
