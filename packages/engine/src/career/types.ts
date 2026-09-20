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

/** Sueldo semanal inicial por punto de `currentAbility` (GDD §4.8). */
export const SALARY_PER_ABILITY = 10;

/** Semanas antes de `contractExpiry` en las que se avisa de expiración próxima. */
export const CONTRACT_EXPIRY_WARNING_WEEKS = 8;

/** Probabilidad de recibir una oferta de fichaje de otro club en una semana cualquiera (GDD §4.8). */
export const TRANSFER_OFFER_CHANCE_PER_WEEK = 0.05;

/**
 * Efecto de una acción semanal (GDD §4.5), ya resuelto (sin id/nombre/descripción):
 * el motor no depende de @leyenda/content, igual que `OriginModifier` — quien llama
 * a `applyWeeklyAction` pasa la acción ya cargada (estructuralmente compatible).
 */
export interface WeeklyActionEffect {
  energyCost: number;
  effects: {
    attributeGroup: 'physical' | 'technical' | 'mental' | null;
    vitalStateDelta: {
      health: number;
      mentalHealth: number;
      form: number;
      fitness: number;
    };
    relationsDelta: Partial<Record<keyof ProtagonistRelations, number>>;
    moneyDelta: number;
  };
}

export interface ProtagonistRelations {
  coach: number;
  squad: number;
  fans: number;
  board: number;
  press: number;
  partner: number;
  family: number;
  agent: number;
  sponsors: number;
}

/** Ganancia por sesión de entrenamiento, por atributo individual del grupo entrenado. */
export const TRAINING_GAIN_MIN = 0;
export const TRAINING_GAIN_MAX = 2;

/** Días que avanza `advanceWeek` en cada llamada. */
export const DAYS_PER_WEEK = 7;

/** Energía semanal con la que se llega a cada nueva semana. */
export const WEEKLY_ENERGY_RESET = 100;

/** Resultado de resolver la elección del protagonista en un momento clave (GDD §4.7). */
export interface KeyMomentOutcome {
  momentId: string;
  choiceId: string;
  success: boolean;
  ratingDelta: number;
  fanRelationDelta: number;
  /** Si un acierto cuenta como gol o asistencia del protagonista (estadísticas de carrera). */
  implies: 'goal' | 'assist' | null;
}

/** Cuántos momentos clave vive el protagonista por partido normal (GDD §4.7: "2-4"). */
export const KEY_MOMENTS_PER_MATCH = 3;

/** Nota de partido de partida, antes de sumar los `ratingDelta` de cada momento. */
export const BASE_MATCH_RATING = 6;

/** Cuánto pesan el atributo, la forma y la moral sobre `baseSuccessChance` (GDD §4.7). */
export const ATTRIBUTE_SUCCESS_WEIGHT = 200;
export const FORM_SUCCESS_WEIGHT = 300;
export const MORALE_SUCCESS_WEIGHT = 300;
export const SUCCESS_CHANCE_MIN = 0.1;
export const SUCCESS_CHANCE_MAX = 0.9;

/** Ajuste de forma tras el partido según la nota final. */
export const MATCH_RATING_FORM_BOOST_THRESHOLD = 7;
export const MATCH_RATING_FORM_PENALTY_THRESHOLD = 4;
export const MATCH_RATING_FORM_DELTA = 3;

/** Probabilidad de que toque un evento de decisión (GDD §4.6) al avanzar una semana. */
export const EVENT_CHANCE_PER_WEEK = 0.6;

/** Probabilidad de que un partido incluya una Jugada en Vivo (GDD §7B.2: "1 cada 5-8 partidos"). */
export const LIVE_PLAY_MATCH_CHANCE = 0.15;

/**
 * Ajuste de nota/afición por el resultado de una Jugada en Vivo — pesa más
 * que un momento clave normal (GDD §7B.6: un gol en Jugada en Vivo es
 * "momento histórico"). `miss`/`foul` no los devuelve ningún resolver de
 * penalti/ocasión todavía; se cubren solo por exhaustividad de tipos.
 */
export const LIVE_PLAY_OUTCOME_EFFECTS: Record<
  'goal' | 'save' | 'miss' | 'post' | 'foul' | 'out',
  { ratingDelta: number; fanRelationDelta: number }
> = {
  goal: { ratingDelta: 3, fanRelationDelta: 15 },
  save: { ratingDelta: -1.5, fanRelationDelta: -3 },
  post: { ratingDelta: -1, fanRelationDelta: -2 },
  out: { ratingDelta: -2, fanRelationDelta: -5 },
  miss: { ratingDelta: -2, fanRelationDelta: -5 },
  foul: { ratingDelta: -1, fanRelationDelta: -2 },
};

/** Probabilidad base de lesionarse en una semana cualquiera (GDD §4.8). */
export const INJURY_BASE_CHANCE = 0.02;

/** Cuánto pesa tener la forma física (fitness) baja sobre el riesgo de lesión: por debajo de 70 sube el riesgo. */
export const INJURY_FITNESS_WEIGHT = 500;

/** Tope de probabilidad de lesión en una semana, aunque la forma física esté muy baja. */
export const INJURY_CHANCE_MAX = 0.15;

/** Penalización de forma por volver antes de tiempo con éxito (GDD §4.8: "riesgo de recaída"). */
export const EARLY_RETURN_FORM_PENALTY = 3;

/** Penalización de salud extra si la vuelta anticipada sale mal (recaída). */
export const RELAPSE_HEALTH_PENALTY = 10;

/** Edad a partir de la que empieza el declive físico (GDD §4.8: "~31-34 años"). */
export const DECLINE_START_AGE = 31;

/** Edad a partir de la que la retirada es forzosa. */
export const FORCED_RETIREMENT_AGE = 38;

/** Puntos que baja cada atributo físico por cada cumpleaños a partir de `DECLINE_START_AGE`. */
export const AGE_DECLINE_PER_YEAR = 2;
