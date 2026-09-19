import type { LiveOutcome, LiveSituation } from '@leyenda/shared';
import type { RNG } from '../rng';

import { clamp } from './math';
import { PENALTY_TUNING as T, SHOOTER_SKILL_WEIGHT, type PenaltyGestureData } from './types';

/**
 * Resuelve un penalti (GDD §7B.3): apuntar arrastrando + soltar una barra
 * de potencia oscilante en su zona buena. El gesto manda; Tiro/Compostura
 * del protagonista dan un empujón acotado encima (GDD §7B.4).
 */
export function resolvePenalty(
  situation: LiveSituation,
  gesture: PenaltyGestureData,
  rng: RNG
): LiveOutcome {
  const sweetHalfWidth =
    T.sweetHalfWidthAtNoPressure -
    (situation.pressure / 100) * T.sweetHalfWidthReductionAtMaxPressure;

  const powerError = Math.abs(gesture.barValue - T.sweetCenter);
  const powerQuality =
    powerError <= sweetHalfWidth ? 1 : clamp(1 - powerError / T.powerErrorFullMiss, 0, 1);

  const aimError = Math.sqrt(gesture.aimTarget.x ** 2 + ((gesture.aimTarget.y - 0.5) * 0.6) ** 2);
  const precision = clamp(1 - aimError, 0, 1) * powerQuality;

  const skillBonus =
    ((situation.shooterShooting + situation.shooterComposure) / 2 - 50) / SHOOTER_SKILL_WEIGHT;

  const noisyPrecision = clamp(
    precision + skillBonus - rng.nextFloat(0, (situation.pressure / 100) * T.pressureNoiseFactor),
    0,
    1
  );

  if (noisyPrecision > T.goalThreshold) {
    const keeperReachChance = clamp(
      T.keeperReachBase - noisyPrecision * T.keeperReachPrecisionFactor,
      T.keeperReachMin,
      T.keeperReachMax
    );
    const keeperReaches = rng.chance(keeperReachChance);

    if (keeperReaches && noisyPrecision < T.keeperSaveThreshold) {
      return { success: false, type: 'save' };
    }
    return { success: true, type: 'goal' };
  }

  const hitsPost = rng.chance(T.postChance);
  return { success: false, type: hitsPost ? 'post' : 'out' };
}
