import path from 'node:path';

import initSqlJs from 'sql.js';
import { drizzle, type SQLJsDatabase } from 'drizzle-orm/sql-js';
import { migrate } from 'drizzle-orm/sql-js/migrator';

import type { ProtagonistPlayer } from '@leyenda/shared';

import { protagonists, saves } from './schema';

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

function makeProtagonist(): ProtagonistPlayer {
  return {
    id: 'protagonist-1',
    firstName: 'Test',
    lastName: 'Player',
    nationality: 'XA',
    dateOfBirth: '2008-08-01',
    position: 'CF',
    foot: 'right',
    physical: { speed: 50, stamina: 50, strength: 50, jumping: 50 },
    technical: { passing: 50, dribbling: 50, shooting: 50, ballControl: 50, defending: 50, heading: 50 },
    mental: { vision: 50, composure: 50, leadership: 50, teamwork: 50 },
    personality: { professionalism: 50, charisma: 50, ego: 50, temperament: 50 },
    potential: 60,
    currentAbility: 50,
    form: 80,
    morale: 80,
    fitness: 80,
    clubId: 'club-1',
    contractExpiry: '2028-08-01',
    value: 50_000,
    health: 80,
    mentalHealth: 80,
    energy: 100,
    money: 400,
    assets: 0,
    relations: {
      coach: 0,
      squad: 0,
      fans: 0,
      board: 0,
      press: 0,
      partner: 0,
      family: 0,
      agent: 0,
      sponsors: 0,
    },
    traits: [],
    gamesPlayed: 0,
    goalsScored: 0,
    assists: 0,
    titlesWon: [],
  };
}

describe('protagonists schema', () => {
  it('persiste y relee un protagonista con su ProtagonistPlayer completo como JSON', async () => {
    const db = await createMigratedDb();
    const createdAt = new Date('2026-09-19T12:00:00.000Z');

    await db.insert(saves).values({
      id: 'save-1',
      schemaVersion: 1,
      seed: 1,
      gameDate: '2026-08-01',
      currentMode: 'player',
      createdAt,
      updatedAt: createdAt,
    });

    const protagonist = makeProtagonist();
    await db.insert(protagonists).values({
      id: 'protagonist-1',
      saveId: 'save-1',
      data: protagonist,
      createdAt,
      updatedAt: createdAt,
    });

    const [row] = await db.select().from(protagonists);

    expect(row).toBeDefined();
    expect(row?.saveId).toBe('save-1');
    expect(row?.data).toEqual(protagonist);
  });
});
