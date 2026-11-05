import { describe, expect, it } from 'vitest';

import type { CoachCareer } from '@leyenda/shared';

import { makeClub, makeSquad } from './__fixtures__/squad';
import {
  BOARD_TUNING,
  applyBoardConfidenceDelta,
  applyMatchToBoard,
  buildBoardObjective,
  evaluateSeasonForBoard,
  expectedPointsPerMatch,
  expectedPosition,
} from './board';
import { createCoachCareer } from './coach-career';

const division = Array.from({ length: 12 }, (_, i) =>
  makeClub({ id: `c${String(i + 1).padStart(2, '0')}`, reputation: 20 - i })
);

function makeCoach(targetPosition = 6): CoachCareer {
  return createCoachCareer({
    id: 'coach',
    clubId: 'c06',
    legacyScore: 2500,
    squad: makeSquad(60),
    objective: { kind: 'top_half', targetPosition, seasonIndex: 0 },
    ambition: 'realistic',
  });
}

describe('expectedPosition', () => {
  it('es el puesto por reputación dentro de la división', () => {
    expect(expectedPosition(division[0]!, division)).toBe(1);
    expect(expectedPosition(division[11]!, division)).toBe(12);
  });
});

describe('buildBoardObjective', () => {
  const base = { divisionClubs: division, seasonIndex: 0, promotionSpots: 0, relegationSpots: 2 };

  it('el favorito tiene que ganar la liga', () => {
    const o = buildBoardObjective({ ...base, club: division[0]!, ambition: 'realistic' });
    expect(o).toEqual({ kind: 'title', targetPosition: 1, seasonIndex: 0 });
  });

  it('el más débil tiene que evitar el descenso', () => {
    const o = buildBoardObjective({ ...base, club: division[11]!, ambition: 'realistic' });
    expect(o.kind).toBe('avoid_relegation');
    expect(o.targetPosition).toBe(10);
  });

  it('prometer ambición endurece el objetivo y la prudencia lo suaviza', () => {
    const club = division[5]!;
    const ambitious = buildBoardObjective({ ...base, club, ambition: 'ambitious' });
    const cautious = buildBoardObjective({ ...base, club, ambition: 'cautious' });
    expect(ambitious.targetPosition).toBeLessThan(cautious.targetPosition);
  });

  it('en segunda, los de arriba tienen que ascender', () => {
    const o = buildBoardObjective({
      divisionClubs: division,
      seasonIndex: 0,
      promotionSpots: 2,
      relegationSpots: 0,
      club: division[1]!,
      ambition: 'realistic',
    });
    expect(o.kind).toBe('promotion');
  });
});

describe('expectedPointsPerMatch', () => {
  it('decrece con el objetivo', () => {
    expect(expectedPointsPerMatch(1, 12)).toBeCloseTo(BOARD_TUNING.expectedPointsTop);
    expect(expectedPointsPerMatch(12, 12)).toBeCloseTo(BOARD_TUNING.expectedPointsBottom);
    expect(expectedPointsPerMatch(3, 12)).toBeGreaterThan(expectedPointsPerMatch(9, 12));
  });
});

describe('applyMatchToBoard', () => {
  it('ganar sube la confianza y perder la baja', () => {
    const coach = makeCoach();
    expect(applyMatchToBoard(coach, 3, 12).coach.boardConfidence).toBeGreaterThan(60);
    expect(applyMatchToBoard(coach, 0, 12).coach.boardConfidence).toBeLessThan(60);
  });

  it('da un ultimátum una sola vez y después despide', () => {
    let coach = { ...makeCoach(1), boardConfidence: 32 };
    const first = applyMatchToBoard(coach, 0, 12);
    expect(first.verdict).toBe('ultimatum');
    coach = first.coach;
    const second = applyMatchToBoard(coach, 0, 12);
    expect(second.verdict).toBe('none');
    let verdict = second.verdict;
    coach = second.coach;
    for (let i = 0; i < 10 && verdict !== 'sacked'; i++) {
      const next = applyMatchToBoard(coach, 0, 12);
      coach = next.coach;
      verdict = next.verdict;
    }
    expect(verdict).toBe('sacked');
  });

  it('la confianza no sale de 0-100', () => {
    let coach = { ...makeCoach(12), boardConfidence: 99 };
    for (let i = 0; i < 30; i++) coach = applyMatchToBoard(coach, 3, 12).coach;
    expect(coach.boardConfidence).toBe(100);
    const low = applyBoardConfidenceDelta({ ...coach, boardConfidence: 3 }, -50);
    expect(low.coach.boardConfidence).toBe(0);
    expect(low.verdict).toBe('sacked');
  });
});

describe('evaluateSeasonForBoard', () => {
  it('cumplir el objetivo da confianza y nunca despide', () => {
    const result = evaluateSeasonForBoard({ ...makeCoach(6), boardConfidence: 40 }, 4);
    expect(result.objectiveMet).toBe(true);
    expect(result.sacked).toBe(false);
    expect(result.coach.boardConfidence).toBe(60);
  });

  it('fallar por mucho con poca confianza cuesta el puesto', () => {
    const result = evaluateSeasonForBoard({ ...makeCoach(3), boardConfidence: 45 }, 10);
    expect(result.objectiveMet).toBe(false);
    expect(result.sacked).toBe(true);
  });

  it('fallar por poco solo baja la confianza', () => {
    const result = evaluateSeasonForBoard({ ...makeCoach(3), boardConfidence: 60 }, 5);
    expect(result.sacked).toBe(false);
    expect(result.coach.boardConfidence).toBe(45);
  });
});
