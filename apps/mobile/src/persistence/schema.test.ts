import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import initSqlJs from 'sql.js';
import { eq } from 'drizzle-orm';
import { drizzle, type SQLJsDatabase } from 'drizzle-orm/sql-js';
import { migrate } from 'drizzle-orm/sql-js/migrator';

import type { CoachCareer, ProtagonistPlayer } from '@leyenda/shared';

import { coaches, protagonists, saves } from './schema';

/**
 * Usa drizzle-orm/sql-js (SQLite real vía WASM, sin compilación nativa) en
 * vez de expo-sqlite porque jest-expo mockea los módulos nativos: schema.ts
 * no importa expo-sqlite precisamente para poder reutilizarse aquí.
 */
const DRIZZLE_FOLDER = path.join(__dirname, '../../drizzle');

async function createMigratedDb(): Promise<SQLJsDatabase<Record<string, never>>> {
  const SQL = await initSqlJs();
  const client = new SQL.Database();
  const db = drizzle(client);
  migrate(db, { migrationsFolder: DRIZZLE_FOLDER });
  return db;
}

/**
 * Carpeta temporal con solo las 2 primeras migraciones (v1: saves +
 * protagonists), copiando los `.sql` reales y recortando `_journal.json` a
 * esas 2 entradas. El identificador de cada migración para drizzle es el
 * hash de su `.sql` + el timestamp `when` del journal, así que copiar el
 * archivo real byte a byte y conservar su `when` hace que, al migrar luego
 * esta misma DB contra la carpeta `drizzle/` completa, la 0000 y la 0001 se
 * reconozcan como ya aplicadas y solo se ejecute la migración nueva.
 */
function createV1OnlyMigrationsFolder(): string {
  const journal = JSON.parse(
    fs.readFileSync(path.join(DRIZZLE_FOLDER, 'meta/_journal.json'), 'utf-8')
  ) as { version: string; dialect: string; entries: { tag: string }[] };
  const v1Entries = journal.entries.slice(0, 2);

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'leyenda-migrations-v1-'));
  fs.mkdirSync(path.join(tempDir, 'meta'));
  fs.writeFileSync(
    path.join(tempDir, 'meta/_journal.json'),
    JSON.stringify({ ...journal, entries: v1Entries })
  );
  for (const entry of v1Entries) {
    fs.copyFileSync(
      path.join(DRIZZLE_FOLDER, `${entry.tag}.sql`),
      path.join(tempDir, `${entry.tag}.sql`)
    );
  }
  return tempDir;
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
    technical: {
      passing: 50,
      dribbling: 50,
      shooting: 50,
      ballControl: 50,
      defending: 50,
      heading: 50,
    },
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
    salary: 500,
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
    activeInjury: null,
    relationshipStatus: 'single',
    activeBrandDeal: null,
    nationalTeamCaps: 0,
    nationalTeamGoals: 0,
    nationalTeamAssists: 0,
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

function makeCoachCareer(): CoachCareer {
  return { id: 'coach-1', clubId: 'club-1', reputation: 10 };
}

describe('coaches schema', () => {
  it('persiste y relee una carrera de entrenador con su CoachCareer completo como JSON', async () => {
    const db = await createMigratedDb();
    const createdAt = new Date('2026-09-21T12:00:00.000Z');

    await db.insert(saves).values({
      id: 'save-1',
      schemaVersion: 1,
      seed: 1,
      gameDate: '2026-08-01',
      currentMode: 'coach',
      createdAt,
      updatedAt: createdAt,
    });

    const coach = makeCoachCareer();
    await db.insert(coaches).values({
      id: 'coach-1',
      saveId: 'save-1',
      data: coach,
      createdAt,
      updatedAt: createdAt,
    });

    const [row] = await db.select().from(coaches);

    expect(row).toBeDefined();
    expect(row?.saveId).toBe('save-1');
    expect(row?.data).toEqual(coach);
  });
});

describe('carga de partidas antiguas (regla 8 de CLAUDE.md)', () => {
  it('una partida guardada solo con el esquema v1 (saves+protagonists) se sigue leyendo bien tras aplicar la migración que añade "coaches"', async () => {
    const v1Folder = createV1OnlyMigrationsFolder();
    try {
      const SQL = await initSqlJs();
      const client = new SQL.Database();
      const db = drizzle(client);
      migrate(db, { migrationsFolder: v1Folder });

      const createdAt = new Date('2026-09-19T12:00:00.000Z');
      await db.insert(saves).values({
        id: 'save-old',
        schemaVersion: 1,
        seed: 42,
        gameDate: '2026-08-01',
        currentMode: 'player',
        createdAt,
        updatedAt: createdAt,
      });
      const protagonist = makeProtagonist();
      await db.insert(protagonists).values({
        id: 'protagonist-old',
        saveId: 'save-old',
        data: protagonist,
        createdAt,
        updatedAt: createdAt,
      });

      migrate(db, { migrationsFolder: DRIZZLE_FOLDER });

      const [saveRow] = await db.select().from(saves).where(eq(saves.id, 'save-old'));
      expect(saveRow?.seed).toBe(42);

      const [protagonistRow] = await db
        .select()
        .from(protagonists)
        .where(eq(protagonists.id, 'protagonist-old'));
      expect(protagonistRow?.data).toEqual(protagonist);

      const coachCreatedAt = new Date('2026-09-21T12:00:00.000Z');
      await db.insert(coaches).values({
        id: 'coach-new',
        saveId: 'save-old',
        data: makeCoachCareer(),
        createdAt: coachCreatedAt,
        updatedAt: coachCreatedAt,
      });
      const [coachRow] = await db.select().from(coaches).where(eq(coaches.id, 'coach-new'));
      expect(coachRow?.data).toEqual(makeCoachCareer());
    } finally {
      fs.rmSync(v1Folder, { recursive: true, force: true });
    }
  });
});
