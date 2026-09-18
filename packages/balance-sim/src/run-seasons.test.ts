import { describe, expect, it } from 'vitest';

import type { BasePlayer, Club, Competition, Country, Position } from '@leyenda/shared';
import type { World } from '@leyenda/worldgen';

import { runSeasons } from './run-seasons';

let playerCounter = 0;

function makePlayer(position: Position, clubId: string): BasePlayer {
  playerCounter++;
  const currentAbility = 50;
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

function buildSquad(clubId: string): BasePlayer[] {
  const counts: Array<[Position, number]> = [
    ['GK', 2],
    ['CB', 3],
    ['LB', 2],
    ['RB', 2],
    ['CMF', 3],
    ['LW', 2],
    ['RW', 2],
    ['CF', 2],
  ];
  return counts.flatMap(([position, count]) =>
    Array.from({ length: count }, () => makePlayer(position, clubId))
  );
}

function buildWorld(): World {
  const country: Country = { code: 'XA', name: 'Aurelia', reputationBase: 15 };
  const clubs: Club[] = Array.from({ length: 4 }, (_, i) => ({
    id: `club-${i + 1}`,
    name: `Club ${i + 1}`,
    shortName: `C${i + 1}`,
    countryCode: 'XA',
    reputation: 15,
    divisionLevel: 1,
    money: 1_000_000,
  }));
  const competition: Competition = {
    id: 'league-XA-1',
    name: 'Primera de Aurelia',
    type: 'league',
    countryCode: 'XA',
    level: 1,
  };
  const players = clubs.flatMap((c) => buildSquad(c.id));

  return { countries: [country], clubs, competitions: [competition], players };
}

describe('runSeasons', () => {
  it('es determinista', () => {
    const world = buildWorld();
    const a = runSeasons({ world, seasons: 2, baseSeed: 1, seasonStartDate: '2026-08-01' });
    const b = runSeasons({ world, seasons: 2, baseSeed: 1, seasonStartDate: '2026-08-01' });
    expect(a).toEqual(b);
  });

  it('simula el número correcto de temporadas y partidos por temporada', () => {
    const world = buildWorld();
    const results = runSeasons({ world, seasons: 3, baseSeed: 1, seasonStartDate: '2026-08-01' });
    expect(results).toHaveLength(3);
    for (const result of results) {
      expect(result.totalMatches).toBe(4 * 3); // N*(N-1) para N=4
    }
  });

  it('cada temporada asigna un campeón a la liga', () => {
    const world = buildWorld();
    const results = runSeasons({ world, seasons: 2, baseSeed: 1, seasonStartDate: '2026-08-01' });
    for (const result of results) {
      expect(result.championByCompetition.get('league-XA-1')).toBeDefined();
    }
  });
});
