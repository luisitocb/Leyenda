import type { ProtagonistPlayer } from '@leyenda/shared';
import { randomUUID } from 'expo-crypto';
import { eq } from 'drizzle-orm';

import { protagonists, type ProtagonistRow } from './schema';
import { db } from './db';

export interface CreateProtagonistInput {
  saveId: string;
  data: ProtagonistPlayer;
}

/** expo-sqlite (openDatabaseSync) es un driver síncrono: estas operaciones no devuelven promesas. */
export function createProtagonist(input: CreateProtagonistInput): ProtagonistRow {
  const now = new Date();
  const created = db
    .insert(protagonists)
    .values({
      id: randomUUID(),
      saveId: input.saveId,
      data: input.data,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  if (!created) {
    throw new Error('No se pudo crear el protagonista');
  }

  return created;
}

export function getProtagonistBySave(saveId: string): ProtagonistRow | undefined {
  return db.select().from(protagonists).where(eq(protagonists.saveId, saveId)).get();
}
