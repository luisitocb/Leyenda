import type { BasePlayer, LiveOutcome, MatchResult } from '@leyenda/shared';

import type { RNG } from '../rng';
import { clamp } from '../career/math';

/**
 * Jugada en Vivo del Modo Entrenador, versión base (GDD §7B.2): una
 * ocasión clara por partido para cada equipo. La tuya la puedes jugar con
 * el dedo (minijuego de ocasión/penalti) o resolverla automáticamente; la
 * del rival siempre se resuelve sola. Un gol en la jugada suma un gol al
 * marcador simulado (aproximación del paso 5 de GDD §7B.5).
 */
export const COACH_LIVE_TUNING = {
  base: 0.35,
  divisor: 150,
  min: 0.1,
  max: 0.75,
  penaltyChance: 0.3,
} as const;

function shootingOf(p: BasePlayer): number {
  return 'shooting' in p.technical ? p.technical.shooting : 0;
}

function keepingOf(p: BasePlayer): number {
  return 'reflexes' in p.technical
    ? (p.technical.reflexes + p.technical.positioning) / 2
    : p.currentAbility;
}

/** El mejor rematador del XI (más Tiro + Compostura). */
export function pickLiveShooter(outfield: BasePlayer[]): BasePlayer | null {
  if (outfield.length === 0) return null;
  return [...outfield].sort(
    (a, b) =>
      shootingOf(b) + b.mental.composure - (shootingOf(a) + a.mental.composure) ||
      a.id.localeCompare(b.id)
  )[0]!;
}

/** Probabilidad de gol de la resolución automática ("jugador humano de nivel medio", GDD §7B.5). */
export function autoLiveGoalProbability(shooter: BasePlayer, goalkeeper: BasePlayer): number {
  const T = COACH_LIVE_TUNING;
  const attack = (shootingOf(shooter) + shooter.mental.composure) / 2;
  return clamp(T.base + (attack - keepingOf(goalkeeper)) / T.divisor, T.min, T.max);
}

export function autoResolveLiveChance(
  shooter: BasePlayer,
  goalkeeper: BasePlayer,
  rng: RNG
): LiveOutcome {
  const goal = rng.chance(autoLiveGoalProbability(shooter, goalkeeper));
  if (goal) return { success: true, type: 'goal' };
  return { success: false, type: rng.chance(0.5) ? 'save' : 'miss' };
}

/** Tipo de jugada que toca: penalti o ocasión. */
export function pickLivePlayType(rng: RNG): 'penalty' | 'chance' {
  return rng.chance(COACH_LIVE_TUNING.penaltyChance) ? 'penalty' : 'chance';
}

/** Suma al marcador el gol de una Jugada en Vivo. */
export function addLiveGoal(result: MatchResult, side: 'home' | 'away'): MatchResult {
  return side === 'home'
    ? { ...result, homeGoals: result.homeGoals + 1 }
    : { ...result, awayGoals: result.awayGoals + 1 };
}
