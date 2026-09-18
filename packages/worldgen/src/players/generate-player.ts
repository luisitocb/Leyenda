import type { PersonNamePool } from '@leyenda/content';
import { RNG } from '@leyenda/engine';
import type { BasePlayer, Club, CountryCode, Foot, Position } from '@leyenda/shared';

import { RIGHT_FOOT_CHANCE, LEFT_FOOT_CHANCE, SEASON_ONE_START_DATE } from '../constants';
import { addYears, dateOfBirthForAge } from '../date-utils';
import {
  approxGaussian,
  clubQualityScore,
  currentAbilityFromPotential,
  generateFieldAttributes,
  generateGoalkeeperAttributes,
  generateNeutralState,
  generatePersonality,
} from './attributes';

export interface GeneratePlayerInput {
  rng: RNG;
  id: string;
  club: Club;
  position: Position;
  age: number;
  nationality: CountryCode;
  namePool: PersonNamePool;
}

const POTENTIAL_STD_DEV = 12;
const VALUE_MULTIPLIER = 1000;
const VALUE_AGE_DECLINE_START = 30;
const VALUE_AGE_DECLINE_RATE = 0.08;
const VALUE_AGE_FLOOR = 0.2;

function pickFoot(rng: RNG): Foot {
  const roll = rng.next();
  if (roll < RIGHT_FOOT_CHANCE) return 'right';
  if (roll < RIGHT_FOOT_CHANCE + LEFT_FOOT_CHANCE) return 'left';
  return 'both';
}

function marketValue(currentAbility: number, age: number): number {
  const ageFactor =
    age <= VALUE_AGE_DECLINE_START
      ? 1
      : Math.max(1 - (age - VALUE_AGE_DECLINE_START) * VALUE_AGE_DECLINE_RATE, VALUE_AGE_FLOOR);
  return Math.round(currentAbility ** 2 * ageFactor * VALUE_MULTIPLIER);
}

export function generatePlayer({
  rng,
  id,
  club,
  position,
  age,
  nationality,
  namePool,
}: GeneratePlayerInput): BasePlayer {
  const quality = clubQualityScore(club.reputation, club.divisionLevel);
  const potential = Math.min(
    Math.max(Math.round(approxGaussian(rng, quality, POTENTIAL_STD_DEV)), 1),
    99
  );
  const currentAbility = currentAbilityFromPotential(potential, age, rng);

  const technicalOrGoalkeeper =
    position === 'GK'
      ? generateGoalkeeperAttributes(currentAbility, rng)
      : generateFieldAttributes(position, currentAbility, rng);

  return {
    id,
    firstName: rng.pick(namePool.firstNames),
    lastName: rng.pick(namePool.lastNames),
    nationality,
    dateOfBirth: dateOfBirthForAge(SEASON_ONE_START_DATE, age, rng.nextInt(0, 364)),
    position,
    foot: pickFoot(rng),
    physical: technicalOrGoalkeeper.physical,
    technical: technicalOrGoalkeeper.technical,
    mental: technicalOrGoalkeeper.mental,
    personality: generatePersonality(rng),
    potential,
    currentAbility,
    form: generateNeutralState(rng),
    morale: generateNeutralState(rng),
    fitness: generateNeutralState(rng),
    clubId: club.id,
    contractExpiry: addYears(SEASON_ONE_START_DATE, rng.nextInt(1, 4)),
    value: marketValue(currentAbility, age),
  };
}
