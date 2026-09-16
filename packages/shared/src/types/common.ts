/**
 * Tipos comunes utilizados en todo el proyecto
 */

/** ID único de una entidad */
export type EntityId = string;

/** Fecha en formato ISO (YYYY-MM-DD) */
export type ISODate = string;

/** Semilla para el RNG */
export type Seed = number;

/** Rango de valores [min, max] */
export interface Range {
  min: number;
  max: number;
}

/** Atributo con valor 0-99 */
export type AttributeValue = number;

/** Nacionalidad (código ISO de 2 letras) */
export type CountryCode = string;

/** Posición en el campo */
export type Position =
  | 'GK' // Portero
  | 'LB' // Lateral izquierdo
  | 'CB' // Central
  | 'RB' // Lateral derecho
  | 'DMF' // Mediocentro defensivo
  | 'CMF' // Centrocampista
  | 'AMF' // Mediapunta
  | 'LW' // Extremo izquierdo
  | 'RW' // Extremo derecho
  | 'CF'; // Delantero centro

/** Pie dominante */
export type Foot = 'left' | 'right' | 'both';

/** Relación entre entidades (-100 a +100) */
export type RelationValue = number;
