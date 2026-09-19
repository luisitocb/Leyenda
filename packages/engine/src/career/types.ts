import type { CountryCode, EntityId, Foot, ISODate, Position } from '@leyenda/shared';

/**
 * Subconjunto numérico de un origen (GDD §4.1) que el motor necesita para
 * calcular al personaje. El motor no depende de @leyenda/content: quien
 * llama a `createCharacter` pasa el origen ya cargado y validado
 * (estructuralmente compatible, sin mapeo necesario).
 */
export interface OriginModifier {
  attributeGroupBonus: {
    physical: number;
    technical: number;
    mental: number;
  };
  startingAgeOverride: number | null;
  startingMoney: number;
  agentRelationBonus: number;
}

/** Reparto de puntos iniciales por grupo (GDD §4.1: "por grupo", no atributo a atributo). */
export interface AttributeGroupAllocation {
  physical: number;
  technical: number;
  mental: number;
}

export interface CreateCharacterInput {
  id: EntityId;
  firstName: string;
  lastName: string;
  nationality: CountryCode;
  position: Position;
  foot: Foot;
  origin: OriginModifier;
  groupAllocation: AttributeGroupAllocation;
  clubId: EntityId;
  /** Fecha de la partida en la que se crea el personaje (para calcular fecha de nacimiento y contrato). */
  startDate: ISODate;
}

/** Puntos totales a repartir entre los 3 grupos de atributos. */
export const POINT_POOL = 150;
export const GROUP_MIN = 30;
export const GROUP_MAX = 70;

/** Ruido individual por atributo dentro de un grupo, igual de forma que worldgen (no se reutiliza el código, es un paquete distinto). */
export const ATTRIBUTE_NOISE = 8;

export const PERSONALITY_MIN = 20;
export const PERSONALITY_MAX = 90;

/** Rango de los estados vitales de partida: personaje debutante, sin desgaste todavía. */
export const NEUTRAL_STATE_MIN = 70;
export const NEUTRAL_STATE_MAX = 90;

/** Edad de partida por defecto (GDD §4.1 la sitúa "~17-18"), salvo que el origen la sobrescriba (p. ej. Tardío → 19). */
export const BASE_AGE = 17;

/** Margen de potencial sobre la capacidad actual de partida (todo debutante tiene recorrido de mejora). */
export const POTENTIAL_MARGIN_MIN = 5;
export const POTENTIAL_MARGIN_MAX = 30;

/** Duración del primer contrato al fichar por el club inicial. */
export const INITIAL_CONTRACT_YEARS = 2;
