import { describe, expect, it } from 'vitest';

import type { Club } from '@leyenda/shared';

import { RNG } from '../rng';
import {
  calculateInitialCoachReputation,
  createCoachCareer,
  generateJobOffers,
} from './coach-career';

function makeClub(overrides: Partial<Club> = {}): Club {
  return {
    id: 'club-1',
    name: 'Club de Prueba',
    shortName: 'CDP',
    countryCode: 'XA',
    reputation: 10,
    divisionLevel: 1,
    money: 1_000_000,
    ...overrides,
  };
}

describe('calculateInitialCoachReputation', () => {
  it('clampa en el mínimo (1) con un Legado bajo o nulo', () => {
    expect(calculateInitialCoachReputation(0)).toBe(1);
    expect(calculateInitialCoachReputation(100)).toBe(1);
  });

  it('clampa en el máximo (20) con un Legado muy alto', () => {
    expect(calculateInitialCoachReputation(1_000_000)).toBe(20);
  });

  it('escala de forma proporcional en el rango medio', () => {
    expect(calculateInitialCoachReputation(2500)).toBe(10);
  });
});

describe('generateJobOffers', () => {
  const clubs: Club[] = [
    makeClub({ id: 'club-low', reputation: 1 }),
    makeClub({ id: 'club-mid-1', reputation: 8 }),
    makeClub({ id: 'club-mid-2', reputation: 9 }),
    makeClub({ id: 'club-mid-3', reputation: 9 }),
    makeClub({ id: 'club-mid-4', reputation: 10 }),
    makeClub({ id: 'club-mid-5', reputation: 10 }),
    makeClub({ id: 'club-mid-6', reputation: 10 }),
    makeClub({ id: 'club-mid-7', reputation: 11 }),
    makeClub({ id: 'club-mid-8', reputation: 11 }),
    makeClub({ id: 'club-mid-9', reputation: 12 }),
    makeClub({ id: 'club-high', reputation: 20 }),
  ];

  it('es determinista: misma seed produce las mismas ofertas', () => {
    const offersA = generateJobOffers(clubs, 10, new RNG(1));
    const offersB = generateJobOffers(clubs, 10, new RNG(1));
    expect(offersA.map((c) => c.id)).toEqual(offersB.map((c) => c.id));
  });

  it('devuelve exactamente `count` clubes', () => {
    const offers = generateJobOffers(clubs, 10, new RNG(1), 3);
    expect(offers).toHaveLength(3);
  });

  it('prioriza clubes con reputación cercana a la del entrenador', () => {
    const offers = generateJobOffers(clubs, 10, new RNG(1), 3);
    const offerIds = offers.map((c) => c.id);
    expect(offerIds).not.toContain('club-low');
    expect(offerIds).not.toContain('club-high');
  });

  it('nunca devuelve más clubes de los disponibles', () => {
    const offers = generateJobOffers([makeClub()], 10, new RNG(1), 3);
    expect(offers).toHaveLength(1);
  });
});

describe('createCoachCareer', () => {
  it('crea una CoachCareer con la reputación derivada del Legado', () => {
    const coach = createCoachCareer({ id: 'coach-1', clubId: 'club-1', legacyScore: 2500 });
    expect(coach).toEqual({ id: 'coach-1', clubId: 'club-1', reputation: 10 });
  });
});
