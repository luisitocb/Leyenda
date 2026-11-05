import { describe, expect, it } from 'vitest';
import fc from 'fast-check';

import { addDays } from './date-utils';
import { getSeasonIndexForDate, getSeasonStartDate, getSeasonYear } from './seasons';

const FIRST = '2026-08-01';

function daysBetween(a: string, b: string): number {
  return (Date.parse(b) - Date.parse(a)) / 86_400_000;
}

describe('getSeasonStartDate', () => {
  it('la temporada 0 empieza en la fecha de la primera temporada', () => {
    expect(getSeasonStartDate(FIRST, 0)).toBe(FIRST);
  });

  it('cada temporada cae en la cuadrícula semanal de la partida', () => {
    for (let i = 0; i < 60; i++) {
      expect(daysBetween(FIRST, getSeasonStartDate(FIRST, i)) % 7).toBe(0);
    }
  });

  it('no deriva: siempre empieza entre el 1 y el 7 de agosto', () => {
    for (let i = 0; i < 60; i++) {
      const start = getSeasonStartDate(FIRST, i);
      expect(start.slice(5, 7)).toBe('08');
      expect(Number(start.slice(8, 10))).toBeLessThanOrEqual(7);
    }
  });
});

describe('getSeasonIndexForDate', () => {
  it('antes o el día de inicio de la primera temporada es la 0', () => {
    expect(getSeasonIndexForDate(FIRST, '2026-01-01')).toBe(0);
    expect(getSeasonIndexForDate(FIRST, FIRST)).toBe(0);
  });

  it('la víspera de la temporada siguiente sigue siendo la anterior', () => {
    const next = getSeasonStartDate(FIRST, 3);
    expect(getSeasonIndexForDate(FIRST, addDays(next, -7))).toBe(2);
    expect(getSeasonIndexForDate(FIRST, next)).toBe(3);
  });

  it('es la inversa de getSeasonStartDate (propiedad)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 80 }), fc.integer({ min: 0, max: 51 }), (i, w) => {
        const start = getSeasonStartDate(FIRST, i);
        const date = addDays(start, w * 7);
        const nextStart = getSeasonStartDate(FIRST, i + 1);
        const expected = date < nextStart ? i : i + 1;
        expect(getSeasonIndexForDate(FIRST, date)).toBe(expected);
      })
    );
  });
});

describe('getSeasonYear', () => {
  it('es el año de inicio de la temporada', () => {
    expect(getSeasonYear(FIRST, 0)).toBe(2026);
    expect(getSeasonYear(FIRST, 10)).toBe(2036);
  });
});
