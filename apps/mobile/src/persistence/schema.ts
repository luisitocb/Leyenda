import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

import type {
  CoachCareer,
  HallOfFameEntry,
  LegacyCoachCareerV1,
  ProtagonistPlayer,
  WorldState,
} from '@leyenda/shared';

/**
 * GDD §14 — entidad Save: id, versión de esquema, semilla, fecha de juego, modo actual.
 * Este fichero no importa expo-sqlite para poder ejecutarse tanto en el runtime
 * (drizzle-orm/expo-sqlite) como en los tests (drizzle-orm/sql-js).
 */
export const saves = sqliteTable('saves', {
  id: text('id').primaryKey(),
  schemaVersion: integer('schema_version').notNull(),
  seed: integer('seed').notNull(),
  gameDate: text('game_date').notNull(),
  currentMode: text('current_mode', { enum: ['player', 'coach', 'finished'] }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export type Save = typeof saves.$inferSelect;
export type NewSave = typeof saves.$inferInsert;

/**
 * GDD §4.1 — protagonista del Modo Jugador. `data` guarda el `ProtagonistPlayer`
 * completo como JSON: el acceso siempre es "cargar el protagonista entero de
 * este save", no hay consultas parciales por columna que justifiquen
 * normalizar ~30 campos anidados todavía.
 */
export const protagonists = sqliteTable('protagonists', {
  id: text('id').primaryKey(),
  saveId: text('save_id')
    .notNull()
    .references(() => saves.id),
  data: text('data', { mode: 'json' }).$type<ProtagonistPlayer>().notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export type ProtagonistRow = typeof protagonists.$inferSelect;
export type NewProtagonistRow = typeof protagonists.$inferInsert;

/**
 * GDD §6.1/§14 — carrera de entrenador (Modo Entrenador). Mismo patrón que
 * `protagonists`: `data` guarda la `CoachCareer` entera como JSON, sin
 * normalizar columna a columna.
 */
export const coaches = sqliteTable('coaches', {
  id: text('id').primaryKey(),
  saveId: text('save_id')
    .notNull()
    .references(() => saves.id),
  /**
   * Las partidas de la primera historia de Fase 4 guardaron la forma
   * `LegacyCoachCareerV1`; `coaches.repository` la actualiza al leerla.
   */
  data: text('data', { mode: 'json' }).$type<CoachCareer | LegacyCoachCareerV1>().notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export type CoachRow = typeof coaches.$inferSelect;
export type NewCoachRow = typeof coaches.$inferInsert;

/**
 * Parte dinámica del mundo (ADR-005): divisiones por temporada (ascensos y
 * descensos) e historial de campeones. Una fila por save, `data` como JSON.
 */
export const worldStates = sqliteTable('world_states', {
  id: text('id').primaryKey(),
  saveId: text('save_id')
    .notNull()
    .references(() => saves.id),
  data: text('data', { mode: 'json' }).$type<WorldState>().notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export type WorldStateRow = typeof worldStates.$inferSelect;

/**
 * Salón de la Fama (GDD §9, RF-17): vidas deportivas terminadas. No
 * depende de ningún save — sobrevive aunque se borre la partida.
 */
export const hallOfFame = sqliteTable('hall_of_fame', {
  id: text('id').primaryKey(),
  data: text('data', { mode: 'json' }).$type<HallOfFameEntry>().notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export type HallOfFameRow = typeof hallOfFame.$inferSelect;
