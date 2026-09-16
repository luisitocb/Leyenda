import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';

import { db } from './db';
import migrations from './migrations';

/**
 * Corre las migraciones pendientes contra la DB del dispositivo.
 * Debe llamarse una única vez, en el layout raíz, antes de renderizar la app.
 */
export function useDatabaseMigrations(): { success: boolean; error?: Error } {
  const { success, error } = useMigrations(db, migrations);
  return { success, error };
}
