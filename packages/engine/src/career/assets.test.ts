import { describe, expect, it } from 'vitest';

import type { ProtagonistPlayer, PurchasableAsset } from '@leyenda/shared';

import { purchaseAsset } from './assets';

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
    money: 30_000,
    assets: 0,
    salary: 500,
    relations: {
      coach: 0,
      squad: 0,
      fans: 96,
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
    ...overrides,
  };
}

const SPORTS_CAR: PurchasableAsset = {
  id: 'coche-deportivo',
  name: 'Coche deportivo',
  description: 'Da que hablar',
  category: 'car',
  price: 20_000,
  relationsDelta: { fans: 6, press: 3 },
};

describe('purchaseAsset', () => {
  it('resta el precio de money y lo suma a assets', () => {
    const protagonist = baseProtagonist({ money: 30_000, assets: 1000 });
    const result = purchaseAsset(protagonist, SPORTS_CAR);
    expect(result.money).toBe(10_000);
    expect(result.assets).toBe(21_000);
  });

  it('aplica relationsDelta', () => {
    const protagonist = baseProtagonist({
      relations: { ...baseProtagonist().relations, fans: 50, press: 10 },
    });
    const result = purchaseAsset(protagonist, SPORTS_CAR);
    expect(result.relations.fans).toBe(56);
    expect(result.relations.press).toBe(13);
  });

  it('aplica clamp a 100 en relationsDelta', () => {
    const protagonist = baseProtagonist({
      relations: { ...baseProtagonist().relations, fans: 98 },
    });
    const result = purchaseAsset(protagonist, SPORTS_CAR);
    expect(result.relations.fans).toBe(100);
  });

  it('no valida dinero suficiente: puede dejar money en negativo', () => {
    const protagonist = baseProtagonist({ money: 100 });
    const result = purchaseAsset(protagonist, SPORTS_CAR);
    expect(result.money).toBe(100 - 20_000);
  });
});
