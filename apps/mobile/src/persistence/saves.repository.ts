import { randomUUID } from 'expo-crypto';
import { desc, eq } from 'drizzle-orm';

import { saves, type Save } from './schema';
import { db } from './db';

const SCHEMA_VERSION = 1;

export interface CreateSaveInput {
  seed: number;
  gameDate: string;
  currentMode: Save['currentMode'];
}

/** expo-sqlite (openDatabaseSync) es un driver síncrono: estas operaciones no devuelven promesas. */
export function createSave(input: CreateSaveInput): Save {
  const now = new Date();
  const created = db
    .insert(saves)
    .values({
      id: randomUUID(),
      schemaVersion: SCHEMA_VERSION,
      seed: input.seed,
      gameDate: input.gameDate,
      currentMode: input.currentMode,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  if (!created) {
    throw new Error('No se pudo crear el guardado');
  }

  return created;
}

export function listSaves(): Save[] {
  return db.select().from(saves).all();
}

export function getSave(id: string): Save | undefined {
  return db.select().from(saves).where(eq(saves.id, id)).get();
}

/** No existe todavía el concepto de "partida activa": por ahora se usa siempre la más reciente. */
export function getLatestSave(): Save | undefined {
  return db.select().from(saves).orderBy(desc(saves.createdAt)).limit(1).get();
}

export function updateSave(id: string, changes: Partial<CreateSaveInput>): Save | undefined {
  return db
    .update(saves)
    .set({ ...changes, updatedAt: new Date() })
    .where(eq(saves.id, id))
    .returning()
    .get();
}
