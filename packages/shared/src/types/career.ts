import type { EntityId } from './common';
import type { PlayerTrait } from './player';

/**
 * Claves de las relaciones del protagonista (mismo conjunto que
 * `ProtagonistPlayer['relations']`), reutilizado por los efectos de
 * acciones semanales y eventos de decisión.
 */
export type RelationKey =
  'coach' | 'squad' | 'fans' | 'board' | 'press' | 'partner' | 'family' | 'agent' | 'sponsors';

/**
 * Efecto de una elección de evento de decisión (GDD §4.6). A diferencia
 * de una acción semanal, también puede tocar Personalidad — GDD §4.2 dice
 * explícitamente que la personalidad cambia por "Decisiones".
 */
export interface DecisionEventEffects {
  attributeGroup: 'physical' | 'technical' | 'mental' | null;
  personalityDelta: Partial<Record<'professionalism' | 'charisma' | 'ego' | 'temperament', number>>;
  vitalStateDelta: {
    health: number;
    mentalHealth: number;
    form: number;
    fitness: number;
  };
  relationsDelta: Partial<Record<RelationKey, number>>;
  moneyDelta: number;
}

/**
 * Una opción dentro de un evento de decisión. Si `check` es `null`,
 * `effects` se aplica siempre. Si no, `effects` es la rama de éxito y
 * `onFailEffects` la de fallo (GDD §4.6: "si una opción tiene riesgo, se
 * muestra la probabilidad y el atributo que la determina").
 */
export interface DecisionEventChoice {
  id: string;
  label: string;
  check: { determinedBy: string; baseSuccessChance: number } | null;
  effects: DecisionEventEffects;
  onFailEffects: DecisionEventEffects | null;
  grantsTrait: { trait: PlayerTrait; chance: number } | null;
}

/** Tarjeta de decisión semanal (GDD §4.6, "el corazón del modo"). */
export interface DecisionEvent {
  id: string;
  category: string;
  text: string;
  weight: number;
  choices: DecisionEventChoice[];
}

/**
 * Oferta de contrato (GDD §4.8): renovación con el club actual o fichaje de
 * otro. `clubId` distingue el caso — si coincide con el club actual del
 * protagonista es una renovación, si no, un fichaje.
 */
export interface ContractOffer {
  clubId: EntityId;
  salary: number;
  durationYears: number;
  signingBonus: number;
}
