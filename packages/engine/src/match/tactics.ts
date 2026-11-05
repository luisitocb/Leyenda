import type { FormationId, Mentality, Position, Tactics } from '@leyenda/shared';

import { FORMATION_4_4_2, type TeamStrength } from './types';

/** Tácticas por defecto: las que usan todos los clubes de la IA (y el motor antes de Fase 4). */
export const DEFAULT_TACTICS: Tactics = { formation: '4-4-2', mentality: 'balanced' };

export const FORMATION_IDS: readonly FormationId[] = [
  '4-4-2',
  '4-3-3',
  '4-2-3-1',
  '5-3-2',
  '3-5-2',
];
export const MENTALITIES: readonly Mentality[] = ['defensive', 'balanced', 'attacking'];

/**
 * Huecos de cada formación en orden de selección (GDD §6.6). El 4-4-2 es
 * exactamente `FORMATION_4_4_2`, así que la IA elige el mismo XI de siempre.
 */
export const FORMATIONS: Record<FormationId, readonly Position[]> = {
  '4-4-2': FORMATION_4_4_2,
  '4-3-3': ['GK', 'CB', 'CB', 'LB', 'RB', 'DMF', 'CMF', 'CMF', 'LW', 'RW', 'CF'],
  '4-2-3-1': ['GK', 'CB', 'CB', 'LB', 'RB', 'DMF', 'DMF', 'AMF', 'LW', 'RW', 'CF'],
  '5-3-2': ['GK', 'CB', 'CB', 'CB', 'LB', 'RB', 'DMF', 'CMF', 'CMF', 'CF', 'CF'],
  '3-5-2': ['GK', 'CB', 'CB', 'CB', 'DMF', 'CMF', 'AMF', 'LW', 'RW', 'CF', 'CF'],
};

type ZoneModifier = Pick<TeamStrength, 'defense' | 'midfield' | 'attack'>;

/**
 * Sesgo de cada formación por zonas, en puntos de fuerza. Cada fila suma
 * 0: una formación no es "mejor", reparte la fuerza de otra manera.
 */
export const FORMATION_MODIFIERS: Record<FormationId, ZoneModifier> = {
  '4-4-2': { defense: 0, midfield: 0, attack: 0 },
  '4-3-3': { defense: -2, midfield: -2, attack: 4 },
  '4-2-3-1': { defense: 0, midfield: 4, attack: -4 },
  '5-3-2': { defense: 6, midfield: -2, attack: -4 },
  '3-5-2': { defense: -4, midfield: 6, attack: -2 },
};

/**
 * Multiplicador de la probabilidad de ocasión por tramo según la
 * mentalidad (GDD §6.6: "defensiva ↔ ofensiva"): ofensiva genera más
 * ocasiones propias Y concede más; defensiva cierra el partido (menos
 * goles en ambas porterías, bueno para un equipo inferior).
 */
export const MENTALITY_CHANCE_FACTOR: Record<Mentality, { own: number; conceded: number }> = {
  defensive: { own: 0.85, conceded: 0.85 },
  balanced: { own: 1, conceded: 1 },
  attacking: { own: 1.18, conceded: 1.15 },
};

/** Aplica el sesgo de la formación a la fuerza por zonas (la portería no cambia). */
export function applyFormationModifiers(strength: TeamStrength, tactics: Tactics): TeamStrength {
  const modifier = FORMATION_MODIFIERS[tactics.formation];
  return {
    defense: strength.defense + modifier.defense,
    midfield: strength.midfield + modifier.midfield,
    attack: strength.attack + modifier.attack,
    goalkeeping: strength.goalkeeping,
  };
}

/** Factor que multiplica la probabilidad de ocasión del equipo atacante. */
export function chanceFactor(attacking: Tactics, defending: Tactics): number {
  return (
    MENTALITY_CHANCE_FACTOR[attacking.mentality].own *
    MENTALITY_CHANCE_FACTOR[defending.mentality].conceded
  );
}
