import { RNG, createCoachSquad } from '@leyenda/engine';
import type { BasePlayer, Club, ISODate } from '@leyenda/shared';
import { SEASON_ONE_START_DATE } from '@leyenda/worldgen/src/constants';
import { generatePlayer } from '@leyenda/worldgen/src/players/generate-player';

import { namePools } from '@/content';

/** Juveniles que suben de la cantera cada verano (GDD §6.4: "llegada anual de juveniles"). */
export const YOUTH_INTAKE_PER_SEASON = 3;
const YOUTH_AGE = 17;
const YOUTH_POSITIONS = ['CB', 'CMF', 'LW', 'CF', 'GK', 'RB', 'AMF', 'DMF', 'LB', 'RW'] as const;

/** Offset de seed de la cantera, por temporada (ver registro en resolve-division-calendar.ts). */
const YOUTH_SEED_OFFSET = 6;

/**
 * Juveniles de la cantera de un club: generados como cualquier jugador de
 * worldgen (su calidad depende del nivel del club) y trasladados a la
 * fecha actual con 17 años.
 */
export function generateYouthIntake(
  seed: number,
  club: Club,
  seasonIndex: number,
  date: ISODate
): BasePlayer[] {
  const rng = new RNG(seed + YOUTH_SEED_OFFSET + seasonIndex * 7_919);
  const namePool = namePools[club.countryCode];
  if (!namePool) return [];
  const youth = Array.from({ length: YOUTH_INTAKE_PER_SEASON }, (_, i) =>
    generatePlayer({
      rng,
      id: `youth-${club.id}-${seasonIndex}-${i + 1}`,
      club,
      position:
        YOUTH_POSITIONS[(seasonIndex * YOUTH_INTAKE_PER_SEASON + i) % YOUTH_POSITIONS.length]!,
      age: YOUTH_AGE,
      nationality: club.countryCode,
      namePool,
    })
  );
  return createCoachSquad(youth, SEASON_ONE_START_DATE, date);
}
