import { describe, expect, it } from 'vitest';

import type { BrandDeal, ProtagonistPlayer } from '@leyenda/shared';
import { RNG } from '../rng';

import {
  acceptBrandDeal,
  advanceBrandDeal,
  generateBrandDealOffer,
  shouldReceiveBrandDealOffer,
} from './brand-deal';

function baseProtagonist(overrides: Partial<ProtagonistPlayer> = {}): ProtagonistPlayer {
  return {
    id: 'protagonist-1',
    firstName: 'Test',
    lastName: 'Player',
    nationality: 'XA',
    dateOfBirth: '2000-01-01',
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
      fans: 90,
      board: 0,
      press: 90,
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
    ...overrides,
  };
}

const DEAL: BrandDeal = {
  id: 'marca-videojuegos',
  name: 'Marca de videojuegos',
  description: 'Apareces en su próximo videojuego',
  signingBonus: 2000,
  weeklyIncome: 200,
  weeklyRelationsDelta: { fans: 2, press: 5 },
  durationWeeks: 3,
  breachPenalty: 1200,
};

describe('shouldReceiveBrandDealOffer', () => {
  it('a veces toca y a veces no', () => {
    const results = new Set<boolean>();
    for (let seed = 0; seed < 200; seed++) {
      results.add(shouldReceiveBrandDealOffer(new RNG(seed)));
    }
    expect(results.has(true)).toBe(true);
    expect(results.has(false)).toBe(true);
  });
});

describe('generateBrandDealOffer', () => {
  it('elige siempre un acuerdo del catálogo', () => {
    const deals = [DEAL, { ...DEAL, id: 'otro' }];
    for (let seed = 0; seed < 20; seed++) {
      const offer = generateBrandDealOffer(deals, new RNG(seed));
      expect(deals.map((d) => d.id)).toContain(offer.id);
    }
  });
});

describe('acceptBrandDeal', () => {
  it('suma la prima de fichaje y fija el acuerdo activo', () => {
    const protagonist = baseProtagonist({ money: 1000 });
    const result = acceptBrandDeal(protagonist, DEAL);
    expect(result.money).toBe(3000);
    expect(result.activeBrandDeal).toEqual({ dealId: 'marca-videojuegos', weeksRemaining: 3 });
  });
});

describe('advanceBrandDeal', () => {
  it('no hace nada sin acuerdo activo', () => {
    const protagonist = baseProtagonist();
    expect(advanceBrandDeal(protagonist, [DEAL])).toEqual(protagonist);
  });

  it('cobra, aplica relationsDelta con clamp y descuenta una semana', () => {
    const protagonist = baseProtagonist({
      money: 1000,
      activeBrandDeal: { dealId: 'marca-videojuegos', weeksRemaining: 3 },
    });
    const result = advanceBrandDeal(protagonist, [DEAL]);
    expect(result.money).toBe(1200);
    expect(result.relations.fans).toBe(92);
    expect(result.relations.press).toBe(95);
    expect(result.activeBrandDeal).toEqual({ dealId: 'marca-videojuegos', weeksRemaining: 2 });
  });

  it('termina limpio al llegar a 0 semanas', () => {
    const protagonist = baseProtagonist({
      activeBrandDeal: { dealId: 'marca-videojuegos', weeksRemaining: 1 },
    });
    const result = advanceBrandDeal(protagonist, [DEAL]);
    expect(result.activeBrandDeal).toBeNull();
  });

  it('se rompe con penalización si el protagonista es controversial', () => {
    const protagonist = baseProtagonist({
      money: 1000,
      traits: ['controversial'],
      activeBrandDeal: { dealId: 'marca-videojuegos', weeksRemaining: 2 },
    });
    const result = advanceBrandDeal(protagonist, [DEAL]);
    expect(result.activeBrandDeal).toBeNull();
    expect(result.money).toBe(1000 - 1200);
  });
});
