import { describe, expect, it } from 'vitest';

import type { CoachCareer, PressConference } from '@leyenda/shared';

import { RNG } from '../rng';
import { makeSquad } from './__fixtures__/squad';
import { createCoachCareer } from './coach-career';
import { applyPressAnswer, pressContextFor, selectPressConference } from './press-conference';

const pool: PressConference[] = [
  {
    id: 'a',
    context: 'after_loss',
    question: '¿?',
    weight: 1,
    answers: [
      { id: 'x', label: 'x', effects: { squadMorale: 5, boardConfidence: -4, reputation: 1 } },
      { id: 'y', label: 'y', effects: { squadMorale: 0, boardConfidence: 0, reputation: 0 } },
    ],
  },
];

function makeCoach(): CoachCareer {
  return createCoachCareer({
    id: 'c',
    clubId: 'club-1',
    legacyScore: 2500,
    squad: makeSquad(60),
    objective: null,
    ambition: 'realistic',
  });
}

describe('pressContextFor', () => {
  it('depende del último resultado', () => {
    expect(pressContextFor(null)).toBe('pre_match');
    expect(pressContextFor({ result: { homeGoals: 0, awayGoals: 2 }, isHome: true })).toBe(
      'after_loss'
    );
    expect(pressContextFor({ result: { homeGoals: 0, awayGoals: 2 }, isHome: false })).toBe(
      'after_win'
    );
  });
});

describe('selectPressConference', () => {
  it('solo elige preguntas del contexto pedido', () => {
    for (let seed = 0; seed < 50; seed++) {
      const chosen = selectPressConference(pool, 'after_win', new RNG(seed));
      expect(chosen).toBeNull();
    }
  });

  it('a veces hay rueda de prensa y a veces no', () => {
    const results = Array.from({ length: 60 }, (_, seed) =>
      selectPressConference(pool, 'after_loss', new RNG(seed))
    );
    expect(results.some((r) => r === null)).toBe(true);
    expect(results.some((r) => r?.id === 'a')).toBe(true);
  });
});

describe('applyPressAnswer', () => {
  it('aplica moral, confianza y reputación', () => {
    const coach = makeCoach();
    const { coach: after } = applyPressAnswer(coach, pool[0]!.answers[0]!);
    expect(after.squad[0]!.morale).toBe(coach.squad[0]!.morale + 5);
    expect(after.boardConfidence).toBe(coach.boardConfidence - 4);
    expect(after.reputation).toBe(coach.reputation + 1);
  });
});
