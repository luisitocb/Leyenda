import { describe, expect, it } from 'vitest';

import type { BasePlayer } from '@leyenda/shared';
import { RNG } from '../rng';

import { resolveCards, resolveInjuries } from './secondary-events';

let playerCounter = 0;

function makePlayer(temperament: number, fitness: number): BasePlayer {
  playerCounter++;
  return {
    id: `player-${playerCounter}`,
    firstName: 'Test',
    lastName: `Player${playerCounter}`,
    nationality: 'XA',
    dateOfBirth: '2000-01-01',
    position: 'CMF',
    foot: 'right',
    physical: { speed: 60, stamina: 60, strength: 60, jumping: 60 },
    technical: {
      passing: 60,
      dribbling: 60,
      shooting: 60,
      ballControl: 60,
      defending: 60,
      heading: 60,
    },
    mental: { vision: 60, composure: 60, leadership: 60, teamwork: 60 },
    personality: { professionalism: 50, charisma: 50, ego: 50, temperament },
    potential: 60,
    currentAbility: 60,
    form: 70,
    morale: 70,
    fitness,
    clubId: 'club-1',
    contractExpiry: '2028-08-01',
    value: 1000,
  };
}

describe('resolveCards', () => {
  it('es determinista', () => {
    const players = [makePlayer(20, 90), makePlayer(20, 90)];
    const a = resolveCards(players, 'home', 10, new RNG(1), new Set());
    const b = resolveCards(players, 'home', 10, new RNG(1), new Set());
    expect(a).toEqual(b);
  });

  it('temperament bajo produce más tarjetas que temperament alto', () => {
    const hotheads = Array.from({ length: 11 }, () => makePlayer(5, 90));
    const calm = Array.from({ length: 11 }, () => makePlayer(95, 90));

    let hotheadCards = 0;
    let calmCards = 0;
    for (let seed = 0; seed < 300; seed++) {
      hotheadCards += resolveCards(hotheads, 'home', 10, new RNG(seed), new Set()).length;
      calmCards += resolveCards(calm, 'home', 10, new RNG(seed), new Set()).length;
    }

    expect(hotheadCards).toBeGreaterThan(calmCards);
  });

  it('la segunda amarilla al mismo jugador también genera roja', () => {
    const player = makePlayer(1, 90);
    const cautioned = new Set<string>();

    let firstCardSeed = -1;
    for (let seed = 0; seed < 1000; seed++) {
      const events = resolveCards([player], 'home', 10, new RNG(seed), new Set(cautioned));
      if (events.length > 0) {
        firstCardSeed = seed;
        cautioned.add(player.id);
        break;
      }
    }
    expect(firstCardSeed).toBeGreaterThanOrEqual(0);

    for (let seed = 0; seed < 1000; seed++) {
      const events = resolveCards([player], 'home', 20, new RNG(seed), new Set(cautioned));
      if (events.length > 0) {
        expect(events).toHaveLength(2);
        expect(events[0]?.type).toBe('yellow_card');
        expect(events[1]?.type).toBe('red_card');
        return;
      }
    }
    throw new Error('Ningún seed produjo una segunda tarjeta en el rango probado');
  });
});

describe('resolveInjuries', () => {
  it('es determinista', () => {
    const players = [makePlayer(50, 30), makePlayer(50, 30)];
    const a = resolveInjuries(players, 'home', 10, new RNG(1));
    const b = resolveInjuries(players, 'home', 10, new RNG(1));
    expect(a).toEqual(b);
  });

  it('fitness baja produce más lesiones que fitness alta', () => {
    const tired = Array.from({ length: 11 }, () => makePlayer(50, 20));
    const fresh = Array.from({ length: 11 }, () => makePlayer(50, 95));

    let tiredInjuries = 0;
    let freshInjuries = 0;
    for (let seed = 0; seed < 8000; seed++) {
      tiredInjuries += resolveInjuries(tired, 'home', 10, new RNG(seed)).length;
      freshInjuries += resolveInjuries(fresh, 'home', 10, new RNG(seed)).length;
    }

    expect(tiredInjuries).toBeGreaterThan(freshInjuries);
  });
});
