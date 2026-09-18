import { describe, expect, it } from 'vitest';

import { RNG } from '@leyenda/engine';
import type { Club } from '@leyenda/shared';
import { loadPersonNamePool } from '@leyenda/content';

import { generatePlayer } from './generate-player';

const CLUB: Club = {
  id: 'club-XA-1-1',
  name: 'Rivermouth United',
  shortName: 'RIV',
  countryCode: 'XA',
  reputation: 18,
  divisionLevel: 1,
  money: 1_000_000,
};

const NAME_POOL = loadPersonNamePool('XA');

describe('generatePlayer', () => {
  it('es determinista', () => {
    const input = {
      id: 'p1',
      club: CLUB,
      position: 'CF' as const,
      age: 25,
      nationality: 'XA',
      namePool: NAME_POOL,
    };
    const a = generatePlayer({ ...input, rng: new RNG(9) });
    const b = generatePlayer({ ...input, rng: new RNG(9) });
    expect(a).toEqual(b);
  });

  it('un portero recibe GoalkeeperAttributes en vez de TechnicalAttributes', () => {
    const gk = generatePlayer({
      rng: new RNG(1),
      id: 'p2',
      club: CLUB,
      position: 'GK',
      age: 25,
      nationality: 'XA',
      namePool: NAME_POOL,
    });
    expect(gk.technical).toHaveProperty('reflexes');
    expect(gk.technical).not.toHaveProperty('shooting');
  });

  it('un jugador de campo recibe TechnicalAttributes', () => {
    const cf = generatePlayer({
      rng: new RNG(1),
      id: 'p3',
      club: CLUB,
      position: 'CF',
      age: 25,
      nationality: 'XA',
      namePool: NAME_POOL,
    });
    expect(cf.technical).toHaveProperty('shooting');
    expect(cf.technical).not.toHaveProperty('reflexes');
  });

  it('genera nombre, fecha de nacimiento, potencial y currentAbility válidos', () => {
    const player = generatePlayer({
      rng: new RNG(1),
      id: 'p4',
      club: CLUB,
      position: 'CMF',
      age: 25,
      nationality: 'XA',
      namePool: NAME_POOL,
    });
    expect(player.firstName.length).toBeGreaterThan(0);
    expect(player.lastName.length).toBeGreaterThan(0);
    expect(player.dateOfBirth).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(player.potential).toBeGreaterThanOrEqual(1);
    expect(player.potential).toBeLessThanOrEqual(99);
    expect(player.currentAbility).toBeGreaterThanOrEqual(1);
    expect(player.currentAbility).toBeLessThanOrEqual(99);
    expect(player.clubId).toBe(CLUB.id);
  });
});
