import path from 'node:path';

import initSqlJs from 'sql.js';
import { drizzle, type SQLJsDatabase } from 'drizzle-orm/sql-js';
import { migrate } from 'drizzle-orm/sql-js/migrator';

import { saves } from './schema';

/**
 * Pauta para futuras migraciones (regla 8 de CLAUDE.md): cuando exista una
 * migración v2, añadir un fixture con una fila real en formato v1, crear una
 * DB, correr solo la migración v1, insertar el fixture, correr la v2 encima
 * y comprobar que la fila sigue siendo legible. Esta es la prueba real de
 * "carga de partidas antiguas". Con una única migración (v1) todavía no hay
 * ninguna partida antigua que cargar, así que este test cubre el patrón:
 * migrar una DB en limpio, escribir y releer.
 *
 * Usa drizzle-orm/sql-js (SQLite real vía WASM, sin compilación nativa) en
 * vez de expo-sqlite porque jest-expo mockea los módulos nativos: schema.ts
 * no importa expo-sqlite precisamente para poder reutilizarse aquí.
 */

async function createMigratedDb(): Promise<SQLJsDatabase<Record<string, never>>> {
  const SQL = await initSqlJs();
  const client = new SQL.Database();
  const db = drizzle(client);
  migrate(db, { migrationsFolder: path.join(__dirname, '../../drizzle') });
  return db;
}

describe('saves schema', () => {
  it('persiste y relee un guardado con los tipos correctos', async () => {
    const db = await createMigratedDb();
    const createdAt = new Date('2026-09-16T12:00:00.000Z');

    await db.insert(saves).values({
      id: 'save-1',
      schemaVersion: 1,
      seed: 12345,
      gameDate: '2026-08-01',
      currentMode: 'player',
      createdAt,
      updatedAt: createdAt,
    });

    const [row] = await db.select().from(saves);

    expect(row).toBeDefined();
    expect(row?.id).toBe('save-1');
    expect(row?.schemaVersion).toBe(1);
    expect(row?.seed).toBe(12345);
    expect(typeof row?.seed).toBe('number');
    expect(row?.gameDate).toBe('2026-08-01');
    expect(row?.currentMode).toBe('player');
    expect(row?.createdAt).toBeInstanceOf(Date);
    expect(row?.createdAt.getTime()).toBe(createdAt.getTime());
  });

  it('permite volver a correr la migración sin fallar (idempotencia)', async () => {
    const db = await createMigratedDb();

    expect(() => {
      migrate(db, { migrationsFolder: path.join(__dirname, '../../drizzle') });
    }).not.toThrow();
  });
});
