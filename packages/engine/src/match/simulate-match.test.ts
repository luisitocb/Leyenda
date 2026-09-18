import { describe, expect, it } from 'vitest';

import type { BasePlayer, Match, Position } from '@leyenda/shared';
import { RNG } from '../rng';

import { simulateMatch } from './simulate-match';

let playerCounter = 0;

function makePlayer(position: Position, currentAbility: number, clubId: string): BasePlayer {
  playerCounter++;
  const isGK = position === 'GK';
  return {
    id: `player-${clubId}-${playerCounter}`,
    firstName: 'Test',
    lastName: `Player${playerCounter}`,
    nationality: 'XA',
    dateOfBirth: '2000-01-01',
    position,
    foot: 'right',
    physical: {
      speed: currentAbility,
      stamina: currentAbility,
      strength: currentAbility,
      jumping: currentAbility,
    },
    technical: isGK
      ? { reflexes: currentAbility, positioning: currentAbility, aerialAbility: currentAbility }
      : {
          passing: currentAbility,
          dribbling: currentAbility,
          shooting: currentAbility,
          ballControl: currentAbility,
          defending: currentAbility,
          heading: currentAbility,
        },
    mental: {
      vision: currentAbility,
      composure: currentAbility,
      leadership: currentAbility,
      teamwork: currentAbility,
    },
    personality: { professionalism: 50, charisma: 50, ego: 50, temperament: 50 },
    potential: currentAbility,
    currentAbility,
    form: 70,
    morale: 70,
    fitness: 90,
    clubId,
    contractExpiry: '2028-08-01',
    value: 1000,
  };
}

function buildSquad(currentAbility: number, clubId: string): BasePlayer[] {
  const counts: Array<[Position, number]> = [
    ['GK', 2],
    ['CB', 3],
    ['LB', 2],
    ['RB', 2],
    ['CMF', 3],
    ['LW', 2],
    ['RW', 2],
    ['CF', 3],
  ];
  return counts.flatMap(([position, count]) =>
    Array.from({ length: count }, () => makePlayer(position, currentAbility, clubId))
  );
}

function makeMatch(seed: number): Match {
  return {
    id: 'match-1',
    homeTeamId: 'club-home',
    awayTeamId: 'club-away',
    competitionId: 'league-XA-1',
    date: '2026-08-01',
    result: { homeGoals: 0, awayGoals: 0 },
    events: [],
    seed,
    simulated: false,
  };
}

describe('simulateMatch', () => {
  it('es determinista', () => {
    const homeSquad = buildSquad(60, 'club-home');
    const awaySquad = buildSquad(60, 'club-away');
    const a = simulateMatch(makeMatch(1), homeSquad, awaySquad, new RNG(1));
    const b = simulateMatch(makeMatch(1), homeSquad, awaySquad, new RNG(1));
    expect(a).toEqual(b);
  });

  it('homeGoals/awayGoals coincide con el conteo de eventos goal', () => {
    const homeSquad = buildSquad(60, 'club-home');
    const awaySquad = buildSquad(60, 'club-away');
    const result = simulateMatch(makeMatch(7), homeSquad, awaySquad, new RNG(7));

    const homeGoalEvents = result.events.filter(
      (e) => e.type === 'goal' && e.team === 'home'
    ).length;
    const awayGoalEvents = result.events.filter(
      (e) => e.type === 'goal' && e.team === 'away'
    ).length;

    expect(result.result.homeGoals).toBe(homeGoalEvents);
    expect(result.result.awayGoals).toBe(awayGoalEvents);
  });

  it('todos los eventos tienen minuto entre 1 y 90 y están ordenados', () => {
    const homeSquad = buildSquad(60, 'club-home');
    const awaySquad = buildSquad(60, 'club-away');
    const result = simulateMatch(makeMatch(3), homeSquad, awaySquad, new RNG(3));

    for (const event of result.events) {
      expect(event.minute).toBeGreaterThanOrEqual(1);
      expect(event.minute).toBeLessThanOrEqual(90);
    }
    for (let i = 1; i < result.events.length; i++) {
      expect(result.events[i]!.minute).toBeGreaterThanOrEqual(result.events[i - 1]!.minute);
    }
  });

  it('marca simulated=true', () => {
    const homeSquad = buildSquad(60, 'club-home');
    const awaySquad = buildSquad(60, 'club-away');
    const result = simulateMatch(makeMatch(1), homeSquad, awaySquad, new RNG(1));
    expect(result.simulated).toBe(true);
  });

  it('la media de goles en 500 partidos entre equipos típicos cae en una banda amplia de cordura [1.5, 4.5] (no la de precisión de balance-sim)', () => {
    let totalGoals = 0;
    const trials = 500;
    for (let seed = 0; seed < trials; seed++) {
      const homeSquad = buildSquad(55, 'club-home');
      const awaySquad = buildSquad(55, 'club-away');
      const result = simulateMatch(makeMatch(seed), homeSquad, awaySquad, new RNG(seed));
      totalGoals += result.result.homeGoals + result.result.awayGoals;
    }
    const average = totalGoals / trials;
    expect(average).toBeGreaterThan(1.5);
    expect(average).toBeLessThan(4.5);
  });

  it('un equipo de currentAbility alto gana claramente más que uno de currentAbility bajo', () => {
    let eliteWins = 0;
    const trials = 200;
    for (let seed = 0; seed < trials; seed++) {
      const eliteSquad = buildSquad(90, 'club-elite');
      const weakSquad = buildSquad(35, 'club-weak');
      const match: Match = {
        ...makeMatch(seed),
        homeTeamId: 'club-elite',
        awayTeamId: 'club-weak',
      };
      const result = simulateMatch(match, eliteSquad, weakSquad, new RNG(seed));
      if (result.result.homeGoals > result.result.awayGoals) eliteWins++;
    }
    // Umbral calibrado tras el ajuste de balance-sim (2026-09-19): los
    // divisores de zona se subieron a propósito para que la diferencia
    // de nivel pese menos partido a partido (evitar que un club domine
    // >70% de las temporadas de una liga, GDD §16) — incluso una
    // diferencia enorme (90 vs 35) ya no gana >80%, gana ~78-79%.
    expect(eliteWins / trials).toBeGreaterThan(0.7);
  });

  it('no lanza con fuerzas extremas (currentAbility 99 vs 1) en varios seeds', () => {
    for (let seed = 0; seed < 20; seed++) {
      const strongSquad = buildSquad(99, 'club-strong');
      const weakSquad = buildSquad(1, 'club-weak2');
      const match: Match = {
        ...makeMatch(seed),
        homeTeamId: 'club-strong',
        awayTeamId: 'club-weak2',
      };
      expect(() => simulateMatch(match, strongSquad, weakSquad, new RNG(seed))).not.toThrow();
    }
  });
});
