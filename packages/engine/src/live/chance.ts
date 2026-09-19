import type { LiveOutcome, LiveSituation } from '@leyenda/shared';
import type { RNG } from '../rng';

import { clamp } from './math';
import { CHANCE_TUNING as T, SHOOTER_SKILL_WEIGHT, type SwipeGestureData } from './types';

/**
 * Centro de la portería en el sistema de coordenadas normalizado del
 * campo ([0,1] x [0,1]); el ataque avanza hacia y=1.
 */
const GOAL_CENTER = { x: 0.5, y: 1 };

/**
 * Resuelve una ocasión de gol (GDD §7B.3): un único swipe hacia la
 * portería, donde la velocidad marca la potencia y el ángulo marca la
 * colocación. El gesto manda; Tiro/Compostura del protagonista dan un
 * empujón acotado encima (GDD §7B.4).
 */
export function resolveChance(
  situation: LiveSituation,
  gesture: SwipeGestureData,
  rng: RNG
): LiveOutcome {
  const dx = gesture.endPoint.x - gesture.startPoint.x;
  const dy = gesture.endPoint.y - gesture.startPoint.y;
  const distance = Math.sqrt(dx ** 2 + dy ** 2);
  const power = clamp(distance / gesture.durationMs / T.speedReference, 0, 1);

  const shotAngle = Math.atan2(dy, dx);
  const idealAngle = Math.atan2(
    GOAL_CENTER.y - gesture.startPoint.y,
    GOAL_CENTER.x - gesture.startPoint.x
  );
  const angleDeviation = Math.abs(shotAngle - idealAngle);
  const placementError = clamp(angleDeviation / T.maxUsefulAngle, 0, 1);

  const powerPenalty =
    power < T.powerGoodMin
      ? T.powerGoodMin - power
      : power > T.powerGoodMax
        ? power - T.powerGoodMax
        : 0;

  const basePrecision = clamp(1 - placementError - powerPenalty, 0, 1);
  const skillBonus =
    ((situation.shooterShooting + situation.shooterComposure) / 2 - 50) / SHOOTER_SKILL_WEIGHT;
  const noisyPrecision = clamp(
    basePrecision +
      skillBonus -
      rng.nextFloat(0, (situation.pressure / 100) * T.pressureNoiseFactor),
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

  if (power < T.outWeakPowerThreshold) {
    return { success: false, type: 'out' };
  }

  const hitsPost = rng.chance(T.postChance);
  return { success: false, type: hitsPost ? 'post' : 'out' };
}
