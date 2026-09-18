import { describe, expect, it } from 'vitest';

import type { BasePlayer, EntityId, Match, Position } from '@leyenda/shared';

import { simulateMatchday } from './simulate-match';

let playerCounter = 0;

function makePlayer(position: Position, clubId: string): BasePlayer {
  playerCounter++;
  const currentAbility = 40 + (playerCounter % 40);
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
    ['GK', 3],
    ['CB', 5],
    ['LB', 2],
    ['RB', 2],
    ['DMF', 3],
    ['CMF', 4],
    ['AMF', 3],
    ['LW', 2],
    ['RW', 2],
    ['CF', 2],
  ];
  return counts.flatMap(([position, count]) =>
    Array.from({ length: count }, () => makePlayer(position, clubId))
  );
}

describe('simulateMatchday (regla 9: <500ms por jornada)', () => {
  it('resuelve ~130 partidos simultáneos (una jornada completa del mundo) en menos de 500ms', () => {
    const CLUB_COUNT = 260;
    const playersByClub = new Map<EntityId, BasePlayer[]>();
    for (let i = 0; i < CLUB_COUNT; i++) {
      const clubId = `club-${i}`;
      playersByClub.set(clubId, buildSquad(clubId));
    }

    const matches: Match[] = [];
    for (let i = 0; i < CLUB_COUNT; i += 2) {
      matches.push({
        id: `match-${i}`,
        homeTeamId: `club-${i}`,
        awayTeamId: `club-${i + 1}`,
        competitionId: 'league-test',
        date: '2026-08-01',
        result: { homeGoals: 0, awayGoals: 0 },
        events: [],
        seed: i,
        simulated: false,
      });
    }

    expect(matches).toHaveLength(130);

    const start = performance.now();
    const results = simulateMatchday(matches, playersByClub);
    const elapsed = performance.now() - start;

    expect(results).toHaveLength(130);
    expect(results.every((m) => m.simulated)).toBe(true);
    expect(elapsed).toBeLessThan(500);
  });
});
