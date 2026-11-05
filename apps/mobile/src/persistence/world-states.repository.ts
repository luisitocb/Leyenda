import type { CountryCode, WorldState } from '@leyenda/shared';
import { createWorldState } from '@leyenda/engine';
import { randomUUID } from 'expo-crypto';
import { eq } from 'drizzle-orm';

import { worldStates } from './schema';
import { db } from './db';

/** expo-sqlite (openDatabaseSync) es un driver síncrono: estas operaciones no devuelven promesas. */
export function getWorldState(saveId: string): WorldState | undefined {
  return db.select().from(worldStates).where(eq(worldStates.saveId, saveId)).get()?.data;
}

/**
 * Estado dinámico del mundo de un save. Las partidas anteriores a ADR-005
 * no tienen fila: se crea vacía (composición de worldgen) la primera vez.
 */
export function getOrCreateWorldState(saveId: string, countryCode: CountryCode): WorldState {
  const existing = getWorldState(saveId);
  if (existing) return existing;
  const data = createWorldState(countryCode);
  const now = new Date();
  db.insert(worldStates)
    .values({ id: randomUUID(), saveId, data, createdAt: now, updatedAt: now })
    .run();
  return data;
}

export function saveWorldState(saveId: string, data: WorldState): void {
  const existing = db.select().from(worldStates).where(eq(worldStates.saveId, saveId)).get();
  const now = new Date();
  if (existing) {
    db.update(worldStates)
      .set({ data, updatedAt: now })
      .where(eq(worldStates.id, existing.id))
      .run();
  } else {
    db.insert(worldStates)
      .values({ id: randomUUID(), saveId, data, createdAt: now, updatedAt: now })
      .run();
  }
}
