/**
 * Motor de simulación de "Leyenda"
 *
 * REGLAS CRÍTICAS:
 * 1. Este paquete es PURO: sin imports de React, Expo, SQLite ni APIs de plataforma
 * 2. NUNCA usar Math.random(): toda aleatoriedad pasa por el RNG con semilla
 * 3. Sin `any`: todo tipado estricto
 * 4. Funciones puras: mismo input → mismo output
 */

export * from './rng';
export * from './types';
export * from './live';
