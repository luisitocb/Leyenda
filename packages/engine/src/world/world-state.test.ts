import { describe, expect, it } from 'vitest';

import type { Standing } from '@leyenda/shared';

import {
  applyPromotionRelegation,
  closeSeason,
  createWorldState,
  getDivisionsForSeason,
  isSeasonClosed,
  promotionSpots,
} from './world-state';

function standingsFor(clubIds: string[]): Standing[] {
  return clubIds.map((clubId, i) => ({
    position: i + 1,
    clubId,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 100 - i,
  }));
}

const DIV1 = Array.from({ length: 14 }, (_, i) => `d1-${i + 1}`);
const DIV2 = Array.from({ length: 12 }, (_, i) => `d2-${i + 1}`);

describe('promotionSpots', () => {
  it('2 plazas en ligas pequeñas, 3 si ambas divisiones tienen 18+ clubes', () => {
    expect(promotionSpots(14, 12)).toBe(2);
    expect(promotionSpots(20, 22)).toBe(3);
    expect(promotionSpots(20, 12)).toBe(2);
  });
});

describe('applyPromotionRelegation', () => {
  it('baja a los últimos de primera y sube a los primeros de segunda', () => {
    const result = applyPromotionRelegation({ 1: standingsFor(DIV1), 2: standingsFor(DIV2) });
    expect(result.relegated).toEqual(['d1-13', 'd1-14']);
    expect(result.promoted).toEqual(['d2-1', 'd2-2']);
    expect(result.divisionByClub['d1-14']).toBe(2);
    expect(result.divisionByClub['d2-1']).toBe(1);
    expect(result.divisionByClub['d1-1']).toBe(1);
    expect(result.divisionByClub['d2-12']).toBe(2);
  });

  it('conserva el tamaño de cada división', () => {
    const result = applyPromotionRelegation({ 1: standingsFor(DIV1), 2: standingsFor(DIV2) });
    const counts = Object.values(result.divisionByClub).reduce<Record<number, number>>(
      (acc, level) => ({ ...acc, [level]: (acc[level] ?? 0) + 1 }),
      {}
    );
    expect(counts).toEqual({ 1: 14, 2: 12 });
  });

  it('con una sola división no mueve a nadie', () => {
    const result = applyPromotionRelegation({ 1: standingsFor(DIV1) });
    expect(result.promoted).toEqual([]);
    expect(result.relegated).toEqual([]);
  });
});

describe('closeSeason', () => {
  const standingsByLevel = { 1: standingsFor(DIV1), 2: standingsFor(DIV2) };

  it('registra campeones y la composición de la temporada siguiente', () => {
    const state = closeSeason(createWorldState('XA'), {
      seasonIndex: 0,
      year: 2026,
      standingsByLevel,
    });
    expect(state.seasonHistory).toHaveLength(1);
    expect(state.seasonHistory[0]!.championsByDivision).toEqual({ 1: 'd1-1', 2: 'd2-1' });
    expect(getDivisionsForSeason(state, 1)?.['d2-1']).toBe(1);
    expect(isSeasonClosed(state, 0)).toBe(true);
    expect(isSeasonClosed(state, 1)).toBe(false);
  });

  it('es idempotente: cerrar dos veces la misma temporada no cambia nada', () => {
    const once = closeSeason(createWorldState('XA'), {
      seasonIndex: 0,
      year: 2026,
      standingsByLevel,
    });
    const twice = closeSeason(once, { seasonIndex: 0, year: 2026, standingsByLevel });
    expect(twice).toBe(once);
  });
});

describe('getDivisionsForSeason', () => {
  it('sin entradas devuelve null (composición de worldgen)', () => {
    expect(getDivisionsForSeason(createWorldState('XA'), 0)).toBeNull();
  });

  it('hereda la última composición conocida anterior o igual', () => {
    const state = {
      ...createWorldState('XA'),
      divisionsBySeason: { 2: { a: 1 }, 5: { a: 2 } },
    };
    expect(getDivisionsForSeason(state, 1)).toBeNull();
    expect(getDivisionsForSeason(state, 3)).toEqual({ a: 1 });
    expect(getDivisionsForSeason(state, 9)).toEqual({ a: 2 });
  });
});
