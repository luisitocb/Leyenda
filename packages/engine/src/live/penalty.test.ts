import { describe, expect, it } from 'vitest';
import type { LiveSituation } from '@leyenda/shared';

import { RNG } from '../rng';
import { resolvePenalty } from './penalty';
import type { PenaltyGestureData } from './types';

function situation(pressure: number): LiveSituation {
  return {
    type: 'penalty',
    minute: 90,
    playerId: 'player-1',
    team: 'home',
    seed: 1,
    pressure,
  };
}

const PERFECT_GESTURE: PenaltyGestureData = {
  type: 'penalty',
  aimTarget: { x: 0, y: 0.5 },
  barValue: 0.7,
};

const CORNER_GESTURE: PenaltyGestureData = {
  type: 'penalty',
  aimTarget: { x: 1, y: 1 },
  barValue: 0.7,
};

describe('resolvePenalty', () => {
  it('es determinista: mismo seed + input → mismo resultado', () => {
    const outcomeA = resolvePenalty(situation(50), PERFECT_GESTURE, new RNG(42));
    const outcomeB = resolvePenalty(situation(50), PERFECT_GESTURE, new RNG(42));
    expect(outcomeA).toEqual(outcomeB);
  });

  it('aim y potencia perfectos con presión 0 siempre marcan gol', () => {
    for (let seed = 0; seed < 20; seed++) {
      const outcome = resolvePenalty(situation(0), PERFECT_GESTURE, new RNG(seed));
      expect(outcome).toEqual({ success: true, type: 'goal' });
    }
  });

  it('potencia muy fuera de la zona buena nunca marca gol', () => {
    const badPower: PenaltyGestureData = {
      type: 'penalty',
      aimTarget: { x: 0, y: 0.5 },
      barValue: 0.1,
    };
    for (let seed = 0; seed < 20; seed++) {
      const outcome = resolvePenalty(situation(0), badPower, new RNG(seed));
      expect(outcome.type).not.toBe('goal');
    }
  });

  it('apuntar a la esquina extrema nunca marca gol', () => {
    for (let seed = 0; seed < 20; seed++) {
      const outcome = resolvePenalty(situation(0), CORNER_GESTURE, new RNG(seed));
      expect(outcome.type).not.toBe('goal');
    }
  });

  it('cubre las ramas goal, save, post y out', () => {
    const midGesture: PenaltyGestureData = {
      type: 'penalty',
      aimTarget: { x: 0.55, y: 0.5 },
      barValue: 0.7,
    };
    const outcomes = new Set<string>();
    for (let seed = 0; seed < 200; seed++) {
      outcomes.add(resolvePenalty(situation(0), midGesture, new RNG(seed)).type);
      outcomes.add(resolvePenalty(situation(0), CORNER_GESTURE, new RNG(seed)).type);
    }
    expect(outcomes.has('goal')).toBe(true);
    expect(outcomes.has('save')).toBe(true);
    expect(outcomes.has('post')).toBe(true);
    expect(outcomes.has('out')).toBe(true);
  });

  it('la presión alta estrecha la zona buena de potencia de forma medible', () => {
    const boundaryGesture: PenaltyGestureData = {
      type: 'penalty',
      aimTarget: { x: 0.2, y: 0.5 },
      barValue: 0.85,
    };
    let goalsAtNoPressure = 0;
    let goalsAtMaxPressure = 0;
    const trials = 100;
    for (let seed = 0; seed < trials; seed++) {
      if (resolvePenalty(situation(0), boundaryGesture, new RNG(seed)).type === 'goal') {
        goalsAtNoPressure++;
      }
      if (resolvePenalty(situation(100), boundaryGesture, new RNG(seed)).type === 'goal') {
        goalsAtMaxPressure++;
      }
    }
    expect(goalsAtNoPressure).toBeGreaterThan(goalsAtMaxPressure);
  });
});
