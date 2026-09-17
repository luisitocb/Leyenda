import { describe, expect, it } from 'vitest';
import type { LiveSituation } from '@leyenda/shared';

import { RNG } from '../rng';
import { resolveChance } from './chance';
import { resolvePenalty } from './penalty';
import { resolveLivePlay } from './resolve-live-play';
import type { GestureData, PenaltyGestureData, SwipeGestureData } from './types';

const penaltySituation: LiveSituation = {
  type: 'penalty',
  minute: 90,
  playerId: 'player-1',
  team: 'home',
  seed: 1,
  pressure: 20,
};

const penaltyGesture: PenaltyGestureData = {
  type: 'penalty',
  aimTarget: { x: 0.3, y: 0.5 },
  barValue: 0.7,
};

const chanceSituation: LiveSituation = {
  type: 'chance',
  minute: 45,
  playerId: 'player-1',
  team: 'home',
  seed: 1,
  pressure: 20,
};

const chanceGesture: SwipeGestureData = {
  type: 'chance',
  startPoint: { x: 0.5, y: 0.5 },
  endPoint: { x: 0.5, y: 1.0 },
  durationMs: 180,
  curvature: 0,
};

describe('resolveLivePlay', () => {
  it('enruta penalty a resolvePenalty', () => {
    expect(resolveLivePlay(penaltySituation, penaltyGesture, new RNG(7))).toEqual(
      resolvePenalty(penaltySituation, penaltyGesture, new RNG(7))
    );
  });

  it('enruta chance a resolveChance', () => {
    expect(resolveLivePlay(chanceSituation, chanceGesture, new RNG(7))).toEqual(
      resolveChance(chanceSituation, chanceGesture, new RNG(7))
    );
  });

  it('lanza si el tipo del gesto no coincide con el de la situación', () => {
    expect(() => resolveLivePlay(penaltySituation, chanceGesture, new RNG(7))).toThrow();
  });

  it('lanza para tipos de Jugada en Vivo no implementados en Fase 0.5', () => {
    const situation: LiveSituation = { ...penaltySituation, type: 'free_kick' };
    const gesture = { ...penaltyGesture, type: 'free_kick' } as unknown as GestureData;
    expect(() => resolveLivePlay(situation, gesture, new RNG(7))).toThrow();
  });
});
