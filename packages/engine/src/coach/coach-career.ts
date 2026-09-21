import type { Club, CoachCareer, EntityId } from '@leyenda/shared';

import type { RNG } from '../rng';
import { clamp } from '../career/math';

/**
 * Cuánto Legado (ver `calculateLegacyScore`) equivale a un punto de
 * reputación de entrenador. Aproximación de primer intento (GDD §5:
 * "Reputación → nivel de clubes que te ofrecen trabajo al empezar"),
 * pendiente de calibrar con datos reales si Fase 4/5 añaden un
 * `balance-sim` de entrenador.
 */
export const COACH_REPUTATION_DIVISOR = 250;

export const JOB_OFFERS_COUNT = 3;

/** Reputación inicial de entrenador (1-20, misma escala que `Club.reputation`) a partir del Legado como jugador. */
export function calculateInitialCoachReputation(legacyScore: number): number {
  return clamp(Math.round(legacyScore / COACH_REPUTATION_DIVISOR), 1, 20);
}

/**
 * Ofertas de trabajo iniciales: clubes cuya reputación se acerca a la del
 * entrenador, con algo de variedad. Determinista dado el mismo `rng`.
 */
export function generateJobOffers(
  candidateClubs: Club[],
  coachReputation: number,
  rng: RNG,
  count: number = JOB_OFFERS_COUNT
): Club[] {
  const sortedByProximity = [...candidateClubs].sort(
    (a, b) => Math.abs(a.reputation - coachReputation) - Math.abs(b.reputation - coachReputation)
  );
  const pool = sortedByProximity.slice(0, count * 3);
  return rng.shuffle(pool).slice(0, count);
}

export interface CreateCoachCareerInput {
  id: EntityId;
  clubId: EntityId;
  legacyScore: number;
}

/** Pura: el `id` lo genera el llamador (mismo patrón que `createCharacter`). */
export function createCoachCareer(input: CreateCoachCareerInput): CoachCareer {
  return {
    id: input.id,
    clubId: input.clubId,
    reputation: calculateInitialCoachReputation(input.legacyScore),
  };
}
