import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

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
  currentMode: text('current_mode', { enum: ['player', 'coach'] }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export type Save = typeof saves.$inferSelect;
export type NewSave = typeof saves.$inferInsert;
