import { describe, expect, it } from 'vitest';

import type { BasePlayer, Match, Position, Tactics } from '@leyenda/shared';
import { RNG } from '../rng';

import { simulateMatch } from './simulate-match';
import {
  DEFAULT_TACTICS,
  FORMATIONS,
  FORMATION_IDS,
  FORMATION_MODIFIERS,
  applyFormationModifiers,
  chanceFactor,
} from './tactics';
import { selectStartingXI } from './team-strength';

function squad(clubId: string, base: number): BasePlayer[] {
  const positions: Position[] = [
    'GK',
    'GK',
    'CB',
    'CB',
    'CB',
    'LB',
    'RB',
    'DMF',
    'CMF',
    'CMF',
    'AMF',
    'LW',
    'RW',
    'CF',
    'CF',
    'CF',
  ];
  return positions.map((position, i) => {
    const a = base + ((i * 7) % 13);
    return {
      id: `${clubId}-${i}`,
      firstName: 'A',
      lastName: `B${i}`,
      nationality: 'XA',
      dateOfBirth: '2000-01-01',
      position,
      foot: 'right',
      physical: { speed: a, stamina: a, strength: a, jumping: a },
      technical:
        position === 'GK'
          ? { reflexes: a, positioning: a, aerialAbility: a }
          : {
              passing: a,
              dribbling: a,
              shooting: a,
              ballControl: a,
              defending: a,
              heading: a,
            },
      mental: { vision: a, composure: a, leadership: a, teamwork: a },
      personality: { professionalism: 50, charisma: 50, ego: 50, temperament: 30 + i * 3 },
      potential: a,
      currentAbility: a,
      form: 60 + i,
      morale: 70,
      fitness: 60 + i * 2,
      clubId,
      contractExpiry: null,
      value: 0,
    };
  });
}

function makeMatch(seed: number): Match {
  return {
    id: 'm',
    homeTeamId: 'h',
    awayTeamId: 'a',
    competitionId: 'c',
    date: '2026-08-01',
    result: { homeGoals: 0, awayGoals: 0 },
    events: [],
    seed,
    simulated: false,
  };
}

function totalGoals(homeTactics: Tactics, awayTactics: Tactics, seeds = 400): number {
  const home = squad('h', 55);
  const away = squad('a', 55);
  let goals = 0;
  for (let seed = 1; seed <= seeds; seed++) {
    const r = simulateMatch(makeMatch(seed), home, away, new RNG(seed), {
      homeTactics,
      awayTactics,
    });
    goals += r.result.homeGoals + r.result.awayGoals;
  }
  return goals;
}

describe('tácticas en simulateMatch', () => {
  it('sin tácticas el motor da exactamente lo mismo que antes de Fase 4 (huella de regresión)', () => {
    // Huella calculada con el código de antes de añadir tácticas: si cambia,
    // la IA (que no usa tácticas) y balance-sim habrían cambiado también.
    const home = squad('h', 55);
    const away = squad('a', 50);
    let fingerprint = 0;
    let events = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const r = simulateMatch(makeMatch(seed), home, away, new RNG(seed));
      fingerprint +=
        r.result.homeGoals * 31 + r.result.awayGoals * 7 + (seed % 3) * r.result.homeGoals;
      events += r.events.length;
    }
    expect(fingerprint).toBe(18387);
    expect(events).toBe(1732);
  });

  it('pasar DEFAULT_TACTICS explícitamente equivale a no pasar nada', () => {
    const home = squad('h', 55);
    const away = squad('a', 50);
    const a = simulateMatch(makeMatch(9), home, away, new RNG(9));
    const b = simulateMatch(makeMatch(9), home, away, new RNG(9), {
      homeTactics: DEFAULT_TACTICS,
      awayTactics: DEFAULT_TACTICS,
    });
    expect(b).toEqual(a);
  });

  it('dos equipos ofensivos marcan más goles en total que dos defensivos', () => {
    const attacking: Tactics = { formation: '4-4-2', mentality: 'attacking' };
    const defensive: Tactics = { formation: '4-4-2', mentality: 'defensive' };
    expect(totalGoals(attacking, attacking)).toBeGreaterThan(totalGoals(defensive, defensive));
  });

  it('todas las formaciones producen un XI de 11 con un portero', () => {
    for (const id of FORMATION_IDS) {
      expect(FORMATIONS[id]).toHaveLength(11);
      const xi = selectStartingXI('h', squad('h', 50), FORMATIONS[id]);
      expect(xi.goalkeeper.position).toBe('GK');
      expect(xi.outfield).toHaveLength(10);
    }
  });
});

describe('modificadores de formación', () => {
  it('cada formación reparte fuerza sin sumar ni restar en total', () => {
    for (const id of FORMATION_IDS) {
      const m = FORMATION_MODIFIERS[id];
      expect(m.defense + m.midfield + m.attack).toBe(0);
    }
  });

  it('5-3-2 sube la defensa y baja el ataque', () => {
    const base = { defense: 50, midfield: 50, attack: 50, goalkeeping: 50 };
    const modified = applyFormationModifiers(base, { formation: '5-3-2', mentality: 'balanced' });
    expect(modified.defense).toBeGreaterThan(50);
    expect(modified.attack).toBeLessThan(50);
    expect(modified.goalkeeping).toBe(50);
  });

  it('chanceFactor es 1 con mentalidades equilibradas', () => {
    expect(chanceFactor(DEFAULT_TACTICS, DEFAULT_TACTICS)).toBe(1);
  });
});
