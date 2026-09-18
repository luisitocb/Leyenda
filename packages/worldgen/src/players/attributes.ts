import { RNG } from '@leyenda/engine';
import type {
  AttributeValue,
  GoalkeeperAttributes,
  MentalAttributes,
  PersonalityAttributes,
  PhysicalAttributes,
  Position,
  TechnicalAttributes,
} from '@leyenda/shared';

type FieldWeights = Record<
  keyof PhysicalAttributes | keyof TechnicalAttributes | keyof MentalAttributes,
  number
>;
type GoalkeeperWeights = Record<
  keyof PhysicalAttributes | keyof GoalkeeperAttributes | keyof MentalAttributes,
  number
>;

/**
 * Pesos por posición (GDD §7B.4 inspiró el reparto, aunque aquí se usa
 * para worldgen, no para Jugadas en Vivo): multiplican `currentAbility`
 * para que los atributos relevantes a la posición se acerquen más a la
 * capacidad general del jugador y el resto quede por debajo.
 */
const FIELD_POSITION_WEIGHTS: Record<Exclude<Position, 'GK'>, FieldWeights> = {
  CB: {
    speed: 0.75,
    stamina: 0.9,
    strength: 1.1,
    jumping: 1.1,
    passing: 0.75,
    dribbling: 0.6,
    shooting: 0.55,
    ballControl: 0.75,
    defending: 1.15,
    heading: 1.1,
    vision: 0.8,
    composure: 0.9,
    leadership: 0.9,
    teamwork: 0.9,
  },
  LB: {
    speed: 1.0,
    stamina: 1.05,
    strength: 0.9,
    jumping: 0.75,
    passing: 0.85,
    dribbling: 0.8,
    shooting: 0.6,
    ballControl: 0.85,
    defending: 1.05,
    heading: 0.7,
    vision: 0.85,
    composure: 0.85,
    leadership: 0.8,
    teamwork: 0.9,
  },
  RB: {
    speed: 1.0,
    stamina: 1.05,
    strength: 0.9,
    jumping: 0.75,
    passing: 0.85,
    dribbling: 0.8,
    shooting: 0.6,
    ballControl: 0.85,
    defending: 1.05,
    heading: 0.7,
    vision: 0.85,
    composure: 0.85,
    leadership: 0.8,
    teamwork: 0.9,
  },
  DMF: {
    speed: 0.8,
    stamina: 1.05,
    strength: 1.0,
    jumping: 0.8,
    passing: 1.0,
    dribbling: 0.75,
    shooting: 0.65,
    ballControl: 0.9,
    defending: 1.1,
    heading: 0.8,
    vision: 0.95,
    composure: 0.9,
    leadership: 0.85,
    teamwork: 0.95,
  },
  CMF: {
    speed: 0.85,
    stamina: 1.0,
    strength: 0.85,
    jumping: 0.7,
    passing: 1.1,
    dribbling: 0.9,
    shooting: 0.8,
    ballControl: 1.0,
    defending: 0.8,
    heading: 0.7,
    vision: 1.05,
    composure: 0.95,
    leadership: 0.85,
    teamwork: 0.95,
  },
  AMF: {
    speed: 0.9,
    stamina: 0.85,
    strength: 0.75,
    jumping: 0.7,
    passing: 1.05,
    dribbling: 1.05,
    shooting: 1.0,
    ballControl: 1.05,
    defending: 0.55,
    heading: 0.65,
    vision: 1.1,
    composure: 1.0,
    leadership: 0.8,
    teamwork: 0.9,
  },
  LW: {
    speed: 1.1,
    stamina: 0.9,
    strength: 0.7,
    jumping: 0.65,
    passing: 0.85,
    dribbling: 1.1,
    shooting: 0.95,
    ballControl: 1.0,
    defending: 0.5,
    heading: 0.6,
    vision: 0.9,
    composure: 0.9,
    leadership: 0.75,
    teamwork: 0.85,
  },
  RW: {
    speed: 1.1,
    stamina: 0.9,
    strength: 0.7,
    jumping: 0.65,
    passing: 0.85,
    dribbling: 1.1,
    shooting: 0.95,
    ballControl: 1.0,
    defending: 0.5,
    heading: 0.6,
    vision: 0.9,
    composure: 0.9,
    leadership: 0.75,
    teamwork: 0.85,
  },
  CF: {
    speed: 1.0,
    stamina: 0.8,
    strength: 0.95,
    jumping: 0.9,
    passing: 0.75,
    dribbling: 0.95,
    shooting: 1.15,
    ballControl: 0.95,
    defending: 0.45,
    heading: 1.0,
    vision: 0.8,
    composure: 1.0,
    leadership: 0.8,
    teamwork: 0.85,
  },
};

const GOALKEEPER_WEIGHTS: GoalkeeperWeights = {
  speed: 0.6,
  stamina: 0.7,
  strength: 0.8,
  jumping: 1.0,
  reflexes: 1.15,
  positioning: 1.1,
  aerialAbility: 1.05,
  vision: 0.7,
  composure: 0.9,
  leadership: 0.8,
  teamwork: 0.9,
};

const ATTRIBUTE_NOISE = 8;
const PERSONALITY_MIN = 20;
const PERSONALITY_MAX = 90;
const NEUTRAL_STATE_MIN = 60;
const NEUTRAL_STATE_MAX = 80;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function weighted(currentAbility: number, weight: number, rng: RNG): AttributeValue {
  return clamp(
    Math.round(currentAbility * weight + rng.nextInt(-ATTRIBUTE_NOISE, ATTRIBUTE_NOISE)),
    1,
    99
  );
}

export interface GeneratedFieldAttributes {
  physical: PhysicalAttributes;
  technical: TechnicalAttributes;
  mental: MentalAttributes;
}

export interface GeneratedGoalkeeperAttributes {
  physical: PhysicalAttributes;
  technical: GoalkeeperAttributes;
  mental: MentalAttributes;
}

export function generateFieldAttributes(
  position: Exclude<Position, 'GK'>,
  currentAbility: number,
  rng: RNG
): GeneratedFieldAttributes {
  const w = FIELD_POSITION_WEIGHTS[position];
  return {
    physical: {
      speed: weighted(currentAbility, w.speed, rng),
      stamina: weighted(currentAbility, w.stamina, rng),
      strength: weighted(currentAbility, w.strength, rng),
      jumping: weighted(currentAbility, w.jumping, rng),
    },
    technical: {
      passing: weighted(currentAbility, w.passing, rng),
      dribbling: weighted(currentAbility, w.dribbling, rng),
      shooting: weighted(currentAbility, w.shooting, rng),
      ballControl: weighted(currentAbility, w.ballControl, rng),
      defending: weighted(currentAbility, w.defending, rng),
      heading: weighted(currentAbility, w.heading, rng),
    },
    mental: {
      vision: weighted(currentAbility, w.vision, rng),
      composure: weighted(currentAbility, w.composure, rng),
      leadership: weighted(currentAbility, w.leadership, rng),
      teamwork: weighted(currentAbility, w.teamwork, rng),
    },
  };
}

export function generateGoalkeeperAttributes(
  currentAbility: number,
  rng: RNG
): GeneratedGoalkeeperAttributes {
  const w = GOALKEEPER_WEIGHTS;
  return {
    physical: {
      speed: weighted(currentAbility, w.speed, rng),
      stamina: weighted(currentAbility, w.stamina, rng),
      strength: weighted(currentAbility, w.strength, rng),
      jumping: weighted(currentAbility, w.jumping, rng),
    },
    technical: {
      reflexes: weighted(currentAbility, w.reflexes, rng),
      positioning: weighted(currentAbility, w.positioning, rng),
      aerialAbility: weighted(currentAbility, w.aerialAbility, rng),
    },
    mental: {
      vision: weighted(currentAbility, w.vision, rng),
      composure: weighted(currentAbility, w.composure, rng),
      leadership: weighted(currentAbility, w.leadership, rng),
      teamwork: weighted(currentAbility, w.teamwork, rng),
    },
  };
}

export function generatePersonality(rng: RNG): PersonalityAttributes {
  return {
    professionalism: rng.nextInt(PERSONALITY_MIN, PERSONALITY_MAX),
    charisma: rng.nextInt(PERSONALITY_MIN, PERSONALITY_MAX),
    ego: rng.nextInt(PERSONALITY_MIN, PERSONALITY_MAX),
    temperament: rng.nextInt(PERSONALITY_MIN, PERSONALITY_MAX),
  };
}

export function generateNeutralState(rng: RNG): number {
  return rng.nextInt(NEUTRAL_STATE_MIN, NEUTRAL_STATE_MAX);
}

/** Media de una distribución gaussiana aproximada (suma de 3 uniformes) alrededor de `mean`. */
export function approxGaussian(rng: RNG, mean: number, stdDev: number): number {
  const sum = rng.next() + rng.next() + rng.next(); // media 1.5, en [0,3]
  return mean + (sum - 1.5) * (stdDev / 0.5);
}

export function clubQualityScore(reputation: number, divisionLevel: number): number {
  return clamp(reputation * 4 - (divisionLevel - 1) * 8, 10, 85);
}

export interface AgeCurveBand {
  maxAge: number;
  min: number;
  max: number;
}

const AGE_CURVE: AgeCurveBand[] = [
  { maxAge: 20, min: 0.55, max: 0.75 },
  { maxAge: 23, min: 0.7, max: 0.88 },
  { maxAge: 30, min: 0.9, max: 1.0 },
  { maxAge: 33, min: 0.8, max: 0.93 },
  { maxAge: Infinity, min: 0.65, max: 0.85 },
];

export function currentAbilityFromPotential(potential: number, age: number, rng: RNG): number {
  const band = AGE_CURVE.find((b) => age <= b.maxAge) ?? AGE_CURVE[AGE_CURVE.length - 1]!;
  return clamp(Math.round(potential * rng.nextFloat(band.min, band.max)), 1, 99);
}
