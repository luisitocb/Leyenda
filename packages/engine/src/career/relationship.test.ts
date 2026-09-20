import { describe, expect, it } from 'vitest';

import type { ProtagonistPlayer } from '@leyenda/shared';
import { RNG } from '../rng';

import { breakUp, formalizeRelationship, proposeMarriage, startDating } from './relationship';

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
    ...overrides,
  };
}

describe('startDating', () => {
  it('es determinista', () => {
    const protagonist = baseProtagonist();
    const a = startDating(protagonist, new RNG(1));
    const b = startDating(protagonist, new RNG(1));
    expect(a).toEqual(b);
  });

  it('un carisma más alto da más éxitos en muchas tiradas', () => {
    const charismatic = baseProtagonist({
      personality: { ...baseProtagonist().personality, charisma: 95 },
    });
    const shy = baseProtagonist({
      personality: { ...baseProtagonist().personality, charisma: 10 },
    });
    let charismaticSuccesses = 0;
    let shySuccesses = 0;
    for (let seed = 0; seed < 200; seed++) {
      if (startDating(charismatic, new RNG(seed)).success) charismaticSuccesses++;
      if (startDating(shy, new RNG(seed)).success) shySuccesses++;
    }
    expect(charismaticSuccesses).toBeGreaterThan(shySuccesses);
  });

  it('con éxito pasa a dating y sube la relación', () => {
    for (let seed = 0; seed < 50; seed++) {
      const result = startDating(baseProtagonist(), new RNG(seed));
      if (result.success) {
        expect(result.protagonist.relationshipStatus).toBe('dating');
        expect(result.protagonist.relations.partner).toBe(15);
      } else {
        expect(result.protagonist.relationshipStatus).toBe('single');
        expect(result.protagonist.relations.partner).toBe(0);
      }
    }
  });
});

describe('formalizeRelationship', () => {
  it('pasa a relationship y sube la relación, sin RNG', () => {
    const protagonist = baseProtagonist({
      relationshipStatus: 'dating',
      relations: { ...baseProtagonist().relations, partner: 15 },
    });
    const result = formalizeRelationship(protagonist);
    expect(result.relationshipStatus).toBe('relationship');
    expect(result.relations.partner).toBe(25);
  });
});

describe('proposeMarriage', () => {
  it('con éxito pasa a married y sube la relación', () => {
    const protagonist = baseProtagonist({
      relationshipStatus: 'relationship',
      relations: { ...baseProtagonist().relations, partner: 90 },
      personality: { ...baseProtagonist().personality, charisma: 90 },
    });
    let sawSuccess = false;
    for (let seed = 0; seed < 50; seed++) {
      const result = proposeMarriage(protagonist, new RNG(seed));
      if (result.success) {
        sawSuccess = true;
        expect(result.protagonist.relationshipStatus).toBe('married');
        expect(result.protagonist.relations.partner).toBeGreaterThan(90);
      }
    }
    expect(sawSuccess).toBe(true);
  });

  it('con fallo se queda en relationship y penaliza', () => {
    const protagonist = baseProtagonist({
      relationshipStatus: 'relationship',
      relations: { ...baseProtagonist().relations, partner: -80 },
      personality: { ...baseProtagonist().personality, charisma: 1 },
    });
    let sawFailure = false;
    for (let seed = 0; seed < 50; seed++) {
      const result = proposeMarriage(protagonist, new RNG(seed));
      if (!result.success) {
        sawFailure = true;
        expect(result.protagonist.relationshipStatus).toBe('relationship');
        expect(result.protagonist.relations.partner).toBeLessThan(-80);
      }
    }
    expect(sawFailure).toBe(true);
  });
});

describe('breakUp', () => {
  it('vuelve a single y resetea la relación a 0 desde cualquier estado', () => {
    for (const status of ['dating', 'relationship', 'married'] as const) {
      const protagonist = baseProtagonist({
        relationshipStatus: status,
        relations: { ...baseProtagonist().relations, partner: 70 },
      });
      const result = breakUp(protagonist);
      expect(result.relationshipStatus).toBe('single');
      expect(result.relations.partner).toBe(0);
    }
  });
});
