/**
 * Sistema de contenido data-driven
 *
 * Los eventos del juego se definen en archivos de datos (YAML/JSON)
 * validados con esquemas Zod, no en código.
 */

export * from './schemas/event';
export * from './schemas/i18n';
export * from './schemas/worldgen';
export * from './schemas/career';
export * from './worldgen/load';
export * from './career/load';
