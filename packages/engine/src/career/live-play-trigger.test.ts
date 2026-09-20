import { describe, expect, it } from 'vitest';

import type { LiveOutcome } from '@leyenda/shared';
import { RNG } from '../rng';

import { convertLiveOutcomeToKeyMomentOutcome, shouldTriggerLivePlay } from './live-play-trigger';

describe('shouldTriggerLivePlay', () => {
  it('el portero nunca dispara', () => {
    for (let seed = 0; seed < 100; seed++) {
      expect(shouldTriggerLivePlay('GK', new RNG(seed))).toBeNull();
    }
  });

  it('es determinista', () => {
    const a = shouldTriggerLivePlay('CF', new RNG(7));
    const b = shouldTriggerLivePlay('CF', new RNG(7));
    expect(a).toBe(b);
  });

  it('a veces toca partido y a veces no, para una posición de campo', () => {
    const results = new Set<'penalty' | 'chance' | null>();
    for (let seed = 0; seed < 100; seed++) {
      results.add(shouldTriggerLivePlay('CF', new RNG(seed)));
    }
    expect(results.has(null)).toBe(true);
    expect(results.size).toBeGreaterThan(1);
  });

  it('cuando toca, reparte entre penalty y chance', () => {
    const types = new Set<'penalty' | 'chance'>();
    for (let seed = 0; seed < 300; seed++) {
      const result = shouldTriggerLivePlay('CF', new RNG(seed));
      if (result) types.add(result);
    }
    expect(types.has('penalty')).toBe(true);
    expect(types.has('chance')).toBe(true);
  });
});

describe('convertLiveOutcomeToKeyMomentOutcome', () => {
  it('un gol da más nota que un fuera', () => {
    const goal: LiveOutcome = { success: true, type: 'goal' };
    const out: LiveOutcome = { success: false, type: 'out' };
    const goalOutcome = convertLiveOutcomeToKeyMomentOutcome(goal);
    const outOutcome = convertLiveOutcomeToKeyMomentOutcome(out);
    expect(goalOutcome.ratingDelta).toBeGreaterThan(outOutcome.ratingDelta);
    expect(goalOutcome.fanRelationDelta).toBeGreaterThan(outOutcome.fanRelationDelta);
  });

  it('conserva success y el tipo como choiceId', () => {
    const save: LiveOutcome = { success: false, type: 'save' };
    const result = convertLiveOutcomeToKeyMomentOutcome(save);
    expect(result.success).toBe(false);
    expect(result.choiceId).toBe('save');
    expect(result.momentId).toBe('live-play');
  });

  it('un gol lleva implies "goal"; el resto de resultados, null', () => {
    const goal: LiveOutcome = { success: true, type: 'goal' };
    const save: LiveOutcome = { success: false, type: 'save' };
    const post: LiveOutcome = { success: false, type: 'post' };
    const out: LiveOutcome = { success: false, type: 'out' };
    expect(convertLiveOutcomeToKeyMomentOutcome(goal).implies).toBe('goal');
    expect(convertLiveOutcomeToKeyMomentOutcome(save).implies).toBeNull();
    expect(convertLiveOutcomeToKeyMomentOutcome(post).implies).toBeNull();
    expect(convertLiveOutcomeToKeyMomentOutcome(out).implies).toBeNull();
  });
});
