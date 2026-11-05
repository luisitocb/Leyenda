import type { HallOfFameEntry } from '@leyenda/shared';
import { desc } from 'drizzle-orm';

import { hallOfFame } from './schema';
import { db } from './db';

/**
 * expo-sqlite (openDatabaseSync) es un driver síncrono: estas operaciones
 * no devuelven promesas. Idempotente: el id de la entrada es el del save,
 * así que volver a la pantalla final no duplica la vida en el Salón.
 */
export function addHallOfFameEntry(entry: HallOfFameEntry): void {
  db.insert(hallOfFame)
    .values({ id: entry.id, data: entry, createdAt: new Date() })
    .onConflictDoNothing()
    .run();
}

/** Entradas ordenadas de mayor a menor puntuación final. */
export function listHallOfFame(): HallOfFameEntry[] {
  return db
    .select()
    .from(hallOfFame)
    .orderBy(desc(hallOfFame.createdAt))
    .all()
    .map((row) => row.data)
    .sort((a, b) => b.totalScore - a.totalScore);
}
