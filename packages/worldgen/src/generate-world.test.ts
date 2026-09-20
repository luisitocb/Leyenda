import { beforeAll, describe, expect, it } from 'vitest';

import { loadRealClubRoster } from '@leyenda/content';

import type { World } from './types';
import { generateWorld } from './generate-world';

// Nombres de clubes y apellidos de futbolistas reales muy conocidos, como
// red de seguridad anti-colisión (regla 6 de CLAUDE.md). No exhaustivo.
const REAL_CLUB_NAMES = [
  'real madrid',
  'barcelona',
  'manchester united',
  'manchester city',
  'liverpool',
  'bayern munich',
  'juventus',
  'ac milan',
  'inter milan',
  'paris saint-germain',
  'arsenal',
  'chelsea',
  'boca juniors',
  'river plate',
  'flamengo',
];

const REAL_PLAYER_SURNAMES = [
  'messi',
  'ronaldo',
  'mbappe',
  'neymar',
  'haaland',
  'benzema',
  'modric',
  'lewandowski',
  'de bruyne',
  'salah',
  'kane',
  'mane',
  'pele',
  'maradona',
  'beckenbauer',
];

describe('generateWorld', () => {
  let world: World;

  beforeAll(() => {
    world = generateWorld(1);
  });

  it('es determinista: misma seed produce el mismo mundo', () => {
    const other = generateWorld(1);
    expect(other).toEqual(world);
  });

  it('seeds distintas producen mundos distintos', () => {
    const other = generateWorld(2);
    expect(other.clubs[0]?.name).not.toBe(world.clubs[0]?.name);
  });

  it('genera exactamente 15 países, 458 clubes, 30 competiciones y 12824 jugadores', () => {
    // 10 países ficticios (260 clubes) + 5 con plantilla real (ADR-004):
    // España 42, Inglaterra 44, Italia 40, Alemania 36, Francia 36 = 198 clubes reales.
    expect(world.countries).toHaveLength(15);
    expect(world.clubs).toHaveLength(458);
    expect(world.competitions).toHaveLength(30);
    expect(world.players).toHaveLength(12824);
  });

  it('cada club tiene exactamente 28 jugadores', () => {
    for (const club of world.clubs) {
      const squad = world.players.filter((p) => p.clubId === club.id);
      expect(squad).toHaveLength(28);
    }
  });

  it('división 1 tiene mejor currentAbility media que división 2 dentro del mismo país', () => {
    for (const country of world.countries) {
      const countryClubs = world.clubs.filter((c) => c.countryCode === country.code);
      const div1ClubIds = new Set(
        countryClubs.filter((c) => c.divisionLevel === 1).map((c) => c.id)
      );
      const div2ClubIds = new Set(
        countryClubs.filter((c) => c.divisionLevel === 2).map((c) => c.id)
      );

      const avgAbility = (clubIds: Set<string>): number => {
        const players = world.players.filter((p) => p.clubId && clubIds.has(p.clubId));
        return players.reduce((sum, p) => sum + p.currentAbility, 0) / players.length;
      };

      expect(avgAbility(div1ClubIds)).toBeGreaterThan(avgAbility(div2ClubIds));
    }
  });

  it('clubes de reputación alta tienen plantillas de mejor currentAbility medio que los de reputación baja', () => {
    const sorted = [...world.clubs].sort((a, b) => b.reputation - a.reputation);
    const topQuartile = sorted.slice(0, Math.floor(sorted.length / 4));
    const bottomQuartile = sorted.slice(-Math.floor(sorted.length / 4));

    const avgAbility = (clubs: typeof sorted): number => {
      const clubIds = new Set(clubs.map((c) => c.id));
      const players = world.players.filter((p) => p.clubId && clubIds.has(p.clubId));
      return players.reduce((sum, p) => sum + p.currentAbility, 0) / players.length;
    };

    expect(avgAbility(topQuartile)).toBeGreaterThan(avgAbility(bottomQuartile));
  });

  it('la distribución de edad cae dentro de tolerancia de la campana esperada', () => {
    const total = world.players.length;
    const bandCounts = { '18-20': 0, '21-23': 0, '24-27': 0, '28-30': 0, '31-35': 0 };
    const seasonStartYear = 2026;

    for (const player of world.players) {
      const birthYear = Number(player.dateOfBirth.slice(0, 4));
      const age = seasonStartYear - birthYear;
      if (age <= 20) bandCounts['18-20']++;
      else if (age <= 23) bandCounts['21-23']++;
      else if (age <= 27) bandCounts['24-27']++;
      else if (age <= 30) bandCounts['28-30']++;
      else bandCounts['31-35']++;
    }

    const expected = { '18-20': 15, '21-23': 25, '24-27': 30, '28-30': 20, '31-35': 10 };
    for (const [band, expectedPct] of Object.entries(expected)) {
      const actualPct = (bandCounts[band as keyof typeof bandCounts] / total) * 100;
      expect(Math.abs(actualPct - expectedPct)).toBeLessThan(5);
    }
  });

  it('los clubes procedurales/ficticios no coinciden con clubes reales conocidos', () => {
    // España (ADR-004) usa nombres reales a propósito, por eso se excluye
    // aquí — esta prueba solo protege a los países todavía procedurales.
    const proceduralClubs = world.clubs.filter((c) => loadRealClubRoster(c.countryCode) === null);
    expect(proceduralClubs.length).toBeGreaterThan(0);
    for (const club of proceduralClubs) {
      const lowerName = club.name.toLowerCase();
      for (const realName of REAL_CLUB_NAMES) {
        expect(lowerName.includes(realName)).toBe(false);
      }
    }
  });

  it('no genera apellidos de jugadores coincidentes con futbolistas reales muy conocidos', () => {
    for (const player of world.players) {
      const lowerLastName = player.lastName.toLowerCase();
      expect(REAL_PLAYER_SURNAMES.includes(lowerLastName)).toBe(false);
    }
  });

  it('genera el mundo completo en menos de 3000ms (presupuesto propio, no el de la regla 9)', () => {
    const start = performance.now();
    generateWorld(999);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(3000);
  });
});
