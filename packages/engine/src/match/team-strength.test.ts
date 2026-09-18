import { describe, expect, it } from 'vitest';

import type { BasePlayer, Position } from '@leyenda/shared';

import { computeTeamStrength, selectStartingXI } from './team-strength';

const CLUB_ID = 'club-test-1';

let playerCounter = 0;

function makePlayer(position: Position, currentAbility: number): BasePlayer {
  playerCounter++;
  const isGK = position === 'GK';
  return {
    id: `player-${playerCounter}`,
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
    clubId: CLUB_ID,
    contractExpiry: '2028-08-01',
    value: 1000,
  };
}

function buildSquad(currentAbility: number): BasePlayer[] {
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
    Array.from({ length: count }, () => makePlayer(position, currentAbility))
  );
}

describe('selectStartingXI', () => {
  it('selecciona 11 jugadores únicos con exactamente 1 GK y respeta la formación', () => {
    const squad = buildSquad(60);
    const xi = selectStartingXI(CLUB_ID, squad);

    expect(xi.outfield).toHaveLength(10);
    const ids = new Set([xi.goalkeeper.id, ...xi.outfield.map((p) => p.id)]);
    expect(ids.size).toBe(11);

    const byPosition = (pos: Position): number =>
      xi.outfield.filter((p) => p.position === pos).length;
    expect(byPosition('CB')).toBe(2);
    expect(byPosition('LB')).toBe(1);
    expect(byPosition('RB')).toBe(1);
    expect(byPosition('CMF')).toBe(2);
    expect(byPosition('LW')).toBe(1);
    expect(byPosition('RW')).toBe(1);
    expect(byPosition('CF')).toBe(2);
  });

  it('es determinista', () => {
    const squad = buildSquad(60);
    const a = selectStartingXI(CLUB_ID, squad);
    const b = selectStartingXI(CLUB_ID, squad);
    expect(a).toEqual(b);
  });
});

describe('computeTeamStrength', () => {
  it('un XI de currentAbility alto supera a uno bajo en las 3 zonas', () => {
    const highXI = selectStartingXI(CLUB_ID, buildSquad(90));
    const lowXI = selectStartingXI(CLUB_ID, buildSquad(30));

    const high = computeTeamStrength(highXI, false);
    const low = computeTeamStrength(lowXI, false);

    expect(high.defense).toBeGreaterThan(low.defense);
    expect(high.midfield).toBeGreaterThan(low.midfield);
    expect(high.attack).toBeGreaterThan(low.attack);
    expect(high.goalkeeping).toBeGreaterThan(low.goalkeeping);
  });

  it('la ventaja de campo aumenta defense y attack, no midfield', () => {
    const xi = selectStartingXI(CLUB_ID, buildSquad(60));
    const home = computeTeamStrength(xi, true);
    const away = computeTeamStrength(xi, false);

    expect(home.defense).toBeGreaterThan(away.defense);
    expect(home.attack).toBeGreaterThan(away.attack);
    expect(home.midfield).toBe(away.midfield);
  });
});
