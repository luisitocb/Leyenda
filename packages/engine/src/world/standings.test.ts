import { describe, expect, it } from 'vitest';

import type { Match } from '@leyenda/shared';

import { computeStandings } from './standings';

function makeMatch(
  homeTeamId: string,
  awayTeamId: string,
  homeGoals: number,
  awayGoals: number,
  simulated = true
): Match {
  return {
    id: `match-${homeTeamId}-${awayTeamId}`,
    homeTeamId,
    awayTeamId,
    competitionId: 'league-XA-1',
    date: '2026-08-01',
    result: { homeGoals, awayGoals },
    events: [],
    seed: 1,
    simulated,
  };
}

describe('computeStandings', () => {
  it('calcula puntos, GF, GC y DG correctamente para un set de resultados hecho a mano', () => {
    const matches = [
      makeMatch('A', 'B', 2, 0), // A gana
      makeMatch('B', 'C', 1, 1), // empate
      makeMatch('C', 'A', 0, 3), // A gana
    ];
    const standings = computeStandings(matches, ['A', 'B', 'C']);

    const a = standings.find((s) => s.clubId === 'A')!;
    const b = standings.find((s) => s.clubId === 'B')!;
    const c = standings.find((s) => s.clubId === 'C')!;

    expect(a.played).toBe(2);
    expect(a.won).toBe(2);
    expect(a.points).toBe(6);
    expect(a.goalsFor).toBe(5);
    expect(a.goalsAgainst).toBe(0);
    expect(a.goalDifference).toBe(5);

    expect(b.played).toBe(2);
    expect(b.drawn).toBe(1);
    expect(b.lost).toBe(1);
    expect(b.points).toBe(1);

    expect(c.played).toBe(2);
    expect(c.drawn).toBe(1);
    expect(c.lost).toBe(1);
    expect(c.points).toBe(1);

    expect(standings[0]?.clubId).toBe('A');
  });

  it('desempata por goles a favor cuando puntos y DG coinciden', () => {
    const matches = [
      makeMatch('A', 'X', 3, 1), // A: +2 GD, 3 GF
      makeMatch('B', 'Y', 2, 0), // B: +2 GD, 2 GF
    ];
    const standings = computeStandings(matches, ['A', 'B', 'X', 'Y']);
    const aIndex = standings.findIndex((s) => s.clubId === 'A');
    const bIndex = standings.findIndex((s) => s.clubId === 'B');
    expect(aIndex).toBeLessThan(bIndex);
  });

  it('desempata por clubId alfabético cuando todo lo demás es igual', () => {
    const matches = [makeMatch('Z', 'A', 1, 1)];
    const standings = computeStandings(matches, ['Z', 'A']);
    expect(standings[0]?.clubId).toBe('A');
    expect(standings[1]?.clubId).toBe('Z');
  });

  it('ignora partidos no simulados', () => {
    const matches = [makeMatch('A', 'B', 5, 0, false)];
    const standings = computeStandings(matches, ['A', 'B']);
    expect(standings.every((s) => s.played === 0)).toBe(true);
  });
});
