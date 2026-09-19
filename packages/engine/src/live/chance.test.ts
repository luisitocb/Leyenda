import { describe, expect, it } from 'vitest';
import type { LiveSituation } from '@leyenda/shared';

import { RNG } from '../rng';
import { resolveChance } from './chance';
import type { SwipeGestureData } from './types';

function situation(pressure: number, shooting = 50, composure = 50): LiveSituation {
  return {
    type: 'chance',
    minute: 45,
    playerId: 'player-1',
    team: 'home',
    seed: 1,
    pressure,
    shooterShooting: shooting,
    shooterComposure: composure,
  };
}

const PERFECT_GESTURE: SwipeGestureData = {
  type: 'chance',
  startPoint: { x: 0.5, y: 0.5 },
  endPoint: { x: 0.5, y: 1.0 },
  durationMs: 180,
  curvature: 0,
};

const WEAK_GESTURE: SwipeGestureData = {
  type: 'chance',
  startPoint: { x: 0.5, y: 0.5 },
  endPoint: { x: 0.5, y: 1.0 },
  durationMs: 5000,
  curvature: 0,
};

const OFF_ANGLE_GESTURE: SwipeGestureData = {
  type: 'chance',
  startPoint: { x: 0.5, y: 0.5 },
  endPoint: { x: 1.0, y: 0.5 },
  durationMs: 180,
  curvature: 0,
};

const BOUNDARY_GESTURE: SwipeGestureData = {
  type: 'chance',
  startPoint: { x: 0.5, y: 0.5 },
  endPoint: { x: 0.5, y: 1.0 },
  durationMs: 417,
  curvature: 0,
};

describe('resolveChance', () => {
  it('es determinista: mismo seed + input → mismo resultado', () => {
    const outcomeA = resolveChance(situation(50), PERFECT_GESTURE, new RNG(42));
    const outcomeB = resolveChance(situation(50), PERFECT_GESTURE, new RNG(42));
    expect(outcomeA).toEqual(outcomeB);
  });

  it('un swipe recto, rápido y centrado con presión 0 siempre marca gol', () => {
    for (let seed = 0; seed < 20; seed++) {
      const outcome = resolveChance(situation(0), PERFECT_GESTURE, new RNG(seed));
      expect(outcome).toEqual({ success: true, type: 'goal' });
    }
  });

  it('un swipe demasiado lento nunca marca gol', () => {
    for (let seed = 0; seed < 20; seed++) {
      const outcome = resolveChance(situation(0), WEAK_GESTURE, new RNG(seed));
      expect(outcome).toEqual({ success: false, type: 'out' });
    }
  });

  it('un ángulo muy desviado nunca marca gol', () => {
    for (let seed = 0; seed < 20; seed++) {
      const outcome = resolveChance(situation(0), OFF_ANGLE_GESTURE, new RNG(seed));
      expect(outcome.type).not.toBe('goal');
    }
  });

  it('cubre las ramas goal, save, post y out', () => {
    const outcomes = new Set<string>();
    for (let seed = 0; seed < 100; seed++) {
      outcomes.add(resolveChance(situation(100), BOUNDARY_GESTURE, new RNG(seed)).type);
      outcomes.add(resolveChance(situation(0), OFF_ANGLE_GESTURE, new RNG(seed)).type);
    }
    expect(outcomes.has('goal')).toBe(true);
    expect(outcomes.has('save')).toBe(true);
    expect(outcomes.has('post')).toBe(true);
    expect(outcomes.has('out')).toBe(true);
  });

  it('la presión alta reduce la tasa de gol de forma medible', () => {
    let goalsAtNoPressure = 0;
    let goalsAtMaxPressure = 0;
    const trials = 100;
    for (let seed = 0; seed < trials; seed++) {
      if (resolveChance(situation(0), BOUNDARY_GESTURE, new RNG(seed)).type === 'goal') {
        goalsAtNoPressure++;
      }
      if (resolveChance(situation(100), BOUNDARY_GESTURE, new RNG(seed)).type === 'goal') {
        goalsAtMaxPressure++;
      }
    }
    expect(goalsAtNoPressure).toBeGreaterThan(goalsAtMaxPressure);
  });

  it('un tirador con Tiro/Compostura altos acierta más que uno bajo con el mismo gesto', () => {
    let goalsHighSkill = 0;
    let goalsLowSkill = 0;
    const trials = 200;
    for (let seed = 0; seed < trials; seed++) {
      if (resolveChance(situation(30, 95, 95), BOUNDARY_GESTURE, new RNG(seed)).type === 'goal') {
        goalsHighSkill++;
      }
      if (resolveChance(situation(30, 5, 5), BOUNDARY_GESTURE, new RNG(seed)).type === 'goal') {
        goalsLowSkill++;
      }
    }
    expect(goalsHighSkill).toBeGreaterThan(goalsLowSkill);
  });
});
