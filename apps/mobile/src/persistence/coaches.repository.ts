import type { CoachCareer } from '@leyenda/shared';
import { randomUUID } from 'expo-crypto';
import { eq } from 'drizzle-orm';

import { coaches, type CoachRow } from './schema';
import { db } from './db';

export interface CreateCoachInput {
  saveId: string;
  data: CoachCareer;
}

/** expo-sqlite (openDatabaseSync) es un driver síncrono: estas operaciones no devuelven promesas. */
export function createCoach(input: CreateCoachInput): CoachRow {
  const now = new Date();
  const created = db
    .insert(coaches)
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
    throw new Error('No se pudo crear la carrera de entrenador');
  }

  return created;
}

export function getCoachBySave(saveId: string): CoachRow | undefined {
  return db.select().from(coaches).where(eq(coaches.saveId, saveId)).get();
}

export function updateCoach(id: string, data: CoachCareer): CoachRow | undefined {
  return db
    .update(coaches)
    .set({ data, updatedAt: new Date() })
    .where(eq(coaches.id, id))
    .returning()
    .get();
}
