import { describe, expect, it } from 'vitest';

import { RNG } from '@leyenda/engine';
import type { Club } from '@leyenda/shared';

import { pickCandidateClubs } from './pick-candidate-clubs';

function makeClub(id: string, countryCode: string, divisionLevel: number): Club {
  return {
    id,
    name: id,
    shortName: id,
    countryCode,
    reputation: 10,
    divisionLevel,
    money: 100_000,
  };
}

function makeClubs(): Club[] {
  return [
    ...Array.from({ length: 14 }, (_, i) => makeClub(`club-XA-1-${i + 1}`, 'XA', 1)),
    ...Array.from({ length: 12 }, (_, i) => makeClub(`club-XA-2-${i + 1}`, 'XA', 2)),
    ...Array.from({ length: 12 }, (_, i) => makeClub(`club-XB-2-${i + 1}`, 'XB', 2)),
  ];
}

describe('pickCandidateClubs', () => {
  it('devuelve 3 clubes por defecto', () => {
    const candidates = pickCandidateClubs(makeClubs(), 'XA', new RNG(1));
    expect(candidates).toHaveLength(3);
  });

  it('solo devuelve clubes de la división más baja del país elegido', () => {
    const candidates = pickCandidateClubs(makeClubs(), 'XA', new RNG(1));
    for (const club of candidates) {
      expect(club.countryCode).toBe('XA');
      expect(club.divisionLevel).toBe(2);
    }
  });

  it('nunca repite un club en el mismo resultado', () => {
    const candidates = pickCandidateClubs(makeClubs(), 'XA', new RNG(7));
    const ids = new Set(candidates.map((c) => c.id));
    expect(ids.size).toBe(candidates.length);
  });

  it('es determinista dado el mismo seed', () => {
    const a = pickCandidateClubs(makeClubs(), 'XA', new RNG(42));
    const b = pickCandidateClubs(makeClubs(), 'XA', new RNG(42));
    expect(a).toEqual(b);
  });

  it('seeds distintos pueden producir selecciones distintas', () => {
    const results = new Set<string>();
    for (let seed = 0; seed < 10; seed++) {
      const candidates = pickCandidateClubs(makeClubs(), 'XA', new RNG(seed));
      results.add(candidates.map((c) => c.id).join(','));
    }
    expect(results.size).toBeGreaterThan(1);
  });

  it('respeta el parámetro count', () => {
    const candidates = pickCandidateClubs(makeClubs(), 'XA', new RNG(1), 5);
    expect(candidates).toHaveLength(5);
  });
});
