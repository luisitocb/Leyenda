/**
 * Generador procedural del mundo de "Leyenda" (GDD §8).
 *
 * REGLAS CRÍTICAS: puro y determinista, como el motor — sin
 * Math.random(), toda la aleatoriedad pasa por @leyenda/engine RNG.
 */

export * from './types';
export * from './constants';
export * from './generate-world';
export * from './countries/generate-countries';
export * from './clubs/generate-clubs';
export * from './clubs/club-names';
export * from './clubs/pick-candidate-clubs';
export * from './competitions/generate-competitions';
export * from './players/generate-player';
export * from './players/generate-squad';
export * from './players/attributes';
