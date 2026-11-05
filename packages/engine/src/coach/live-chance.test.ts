import { describe, expect, it } from 'vitest';

import { RNG } from '../rng';
import { makeSquadPlayer } from './__fixtures__/squad';
import {
  COACH_LIVE_TUNING,
  addLiveGoal,
  autoLiveGoalProbability,
  autoResolveLiveChance,
  pickLiveShooter,
} from './live-chance';

describe('Jugada en Vivo del entrenador (resolución automática)', () => {
  it('un delantero mejor tiene más probabilidad de gol, siempre dentro de los límites', () => {
    const keeper = makeSquadPlayer('GK', 60);
    const weak = autoLiveGoalProbability(makeSquadPlayer('CF', 40), keeper);
    const strong = autoLiveGoalProbability(makeSquadPlayer('CF', 90), keeper);
    expect(strong).toBeGreaterThan(weak);
    expect(weak).toBeGreaterThanOrEqual(COACH_LIVE_TUNING.min);
    expect(strong).toBeLessThanOrEqual(COACH_LIVE_TUNING.max);
  });

  it('la frecuencia de gol automática se acerca a la probabilidad calculada', () => {
    const shooter = makeSquadPlayer('CF', 70);
    const keeper = makeSquadPlayer('GK', 60);
    const rng = new RNG(5);
    let goals = 0;
    for (let i = 0; i < 4000; i++) {
      if (autoResolveLiveChance(shooter, keeper, rng).type === 'goal') goals++;
    }
    expect(goals / 4000).toBeCloseTo(autoLiveGoalProbability(shooter, keeper), 1);
  });

  it('elige como rematador al de más Tiro + Compostura', () => {
    const best = makeSquadPlayer('CF', 85);
    expect(pickLiveShooter([makeSquadPlayer('CB', 50), best])?.id).toBe(best.id);
    expect(pickLiveShooter([])).toBeNull();
  });

  it('addLiveGoal suma al lado correcto', () => {
    expect(addLiveGoal({ homeGoals: 1, awayGoals: 1 }, 'away')).toEqual({
      homeGoals: 1,
      awayGoals: 2,
    });
  });
});
