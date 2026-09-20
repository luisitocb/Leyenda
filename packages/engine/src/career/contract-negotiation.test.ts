import { describe, expect, it } from 'vitest';

import type { ProtagonistPlayer } from '@leyenda/shared';
import { RNG } from '../rng';

import { acceptContractOffer, generateRenewalOffer, negotiateOffer } from './contract-negotiation';

function baseProtagonist(overrides: Partial<ProtagonistPlayer> = {}): ProtagonistPlayer {
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
    form: 70,
    morale: 70,
    fitness: 70,
    clubId: 'club-1',
    contractExpiry: '2028-08-01',
    value: 50_000,
    health: 70,
    mentalHealth: 70,
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
    ...overrides,
  };
}

describe('generateRenewalOffer', () => {
  it('es determinista', () => {
    const protagonist = baseProtagonist();
    const a = generateRenewalOffer(protagonist, new RNG(1));
    const b = generateRenewalOffer(protagonist, new RNG(1));
    expect(a).toEqual(b);
  });

  it('usa el club actual del protagonista', () => {
    const protagonist = baseProtagonist({ clubId: 'club-XA-2-1' });
    const offer = generateRenewalOffer(protagonist, new RNG(1));
    expect(offer.clubId).toBe('club-XA-2-1');
  });

  it('una mejor relación con la directiva da un sueldo mayor', () => {
    const goodBoard = baseProtagonist({ relations: { ...baseProtagonist().relations, board: 80 } });
    const badBoard = baseProtagonist({ relations: { ...baseProtagonist().relations, board: -80 } });
    const goodOffer = generateRenewalOffer(goodBoard, new RNG(1));
    const badOffer = generateRenewalOffer(badBoard, new RNG(1));
    expect(goodOffer.salary).toBeGreaterThan(badOffer.salary);
  });

  it('lanza si no hay club actual', () => {
    expect(() => generateRenewalOffer(baseProtagonist({ clubId: null }), new RNG(1))).toThrow();
  });
});

describe('negotiateOffer', () => {
  it('con éxito sube el sueldo respecto a la oferta original', () => {
    const protagonist = baseProtagonist({
      relations: { ...baseProtagonist().relations, agent: 90 },
      personality: { ...baseProtagonist().personality, charisma: 90 },
    });
    const offer = generateRenewalOffer(protagonist, new RNG(1));
    let sawSuccess = false;
    for (let seed = 0; seed < 50; seed++) {
      const result = negotiateOffer(offer, protagonist, new RNG(seed));
      if (result.success) {
        sawSuccess = true;
        expect(result.offer.salary).toBeGreaterThan(offer.salary);
      } else {
        expect(result.offer.salary).toBe(offer.salary);
      }
    }
    expect(sawSuccess).toBe(true);
  });
});

describe('acceptContractOffer', () => {
  it('actualiza club, sueldo, expiración y suma la prima al dinero', () => {
    const protagonist = baseProtagonist({ money: 1000 });
    const offer = { clubId: 'club-nuevo', salary: 800, durationYears: 2, signingBonus: 300 };
    const result = acceptContractOffer(protagonist, offer, '2027-01-01');
    expect(result.clubId).toBe('club-nuevo');
    expect(result.salary).toBe(800);
    expect(result.contractExpiry).toBe('2029-01-01');
    expect(result.money).toBe(1300);
  });
});
