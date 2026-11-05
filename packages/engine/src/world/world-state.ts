import type { CountryCode, EntityId, Standing, WorldState } from '@leyenda/shared';

/** Clubes por división a partir de los que se usan 3 plazas de ascenso/descenso (como en ligas de 18-22 clubes). */
const LARGE_DIVISION_SIZE = 18;

/** Plazas de ascenso/descenso entre dos divisiones consecutivas (GDD §8, RF-08). */
export function promotionSpots(upperDivisionSize: number, lowerDivisionSize: number): number {
  return Math.min(upperDivisionSize, lowerDivisionSize) >= LARGE_DIVISION_SIZE ? 3 : 2;
}

export interface PromotionRelegationResult {
  divisionByClub: Record<EntityId, number>;
  promoted: EntityId[];
  relegated: EntityId[];
}

/**
 * Aplica ascensos y descensos a partir de la clasificación final de cada
 * división (nivel → clasificación ordenada). Intercambia el mismo número
 * de clubes entre divisiones consecutivas, así que el tamaño de cada una
 * se conserva. Pura y sin RNG.
 */
export function applyPromotionRelegation(
  standingsByLevel: Record<number, Standing[]>
): PromotionRelegationResult {
  const levels = Object.keys(standingsByLevel)
    .map(Number)
    .sort((a, b) => a - b);

  const divisionByClub: Record<EntityId, number> = {};
  for (const level of levels) {
    for (const standing of standingsByLevel[level] ?? []) {
      divisionByClub[standing.clubId] = level;
    }
  }

  const promoted: EntityId[] = [];
  const relegated: EntityId[] = [];

  for (let i = 0; i < levels.length - 1; i++) {
    const upperLevel = levels[i]!;
    const lowerLevel = levels[i + 1]!;
    const upper = standingsByLevel[upperLevel] ?? [];
    const lower = standingsByLevel[lowerLevel] ?? [];
    const spots = promotionSpots(upper.length, lower.length);

    for (const standing of upper.slice(-spots)) {
      divisionByClub[standing.clubId] = lowerLevel;
      relegated.push(standing.clubId);
    }
    for (const standing of lower.slice(0, spots)) {
      divisionByClub[standing.clubId] = upperLevel;
      promoted.push(standing.clubId);
    }
  }

  return { divisionByClub, promoted, relegated };
}

export function createWorldState(countryCode: CountryCode): WorldState {
  return { countryCode, divisionsBySeason: {}, seasonHistory: [] };
}

export function isSeasonClosed(state: WorldState, seasonIndex: number): boolean {
  return state.seasonHistory.some((s) => s.seasonIndex === seasonIndex);
}

/**
 * Composición de divisiones vigente en `seasonIndex`: la entrada de esa
 * temporada o la última anterior. `null` = la composición original de
 * worldgen (nunca ha habido ascensos/descensos todavía).
 */
export function getDivisionsForSeason(
  state: WorldState,
  seasonIndex: number
): Record<EntityId, number> | null {
  const known = Object.keys(state.divisionsBySeason)
    .map(Number)
    .filter((index) => index <= seasonIndex)
    .sort((a, b) => b - a);
  const latest = known[0];
  return latest === undefined ? null : (state.divisionsBySeason[latest] ?? null);
}

export interface CloseSeasonInput {
  seasonIndex: number;
  year: number;
  /** Clasificación final de cada división (nivel → clasificación ordenada). */
  standingsByLevel: Record<number, Standing[]>;
}

/**
 * Cierra una temporada: guarda el campeón de cada división y la
 * composición de la siguiente (ascensos/descensos). Idempotente: si la
 * temporada ya estaba cerrada devuelve el mismo estado, para que llamarla
 * desde varias pantallas no duplique el historial.
 */
export function closeSeason(state: WorldState, input: CloseSeasonInput): WorldState {
  if (isSeasonClosed(state, input.seasonIndex)) return state;

  const { divisionByClub, promoted, relegated } = applyPromotionRelegation(input.standingsByLevel);
  const championsByDivision: Record<number, EntityId> = {};
  for (const [level, standings] of Object.entries(input.standingsByLevel)) {
    const champion = standings[0];
    if (champion) championsByDivision[Number(level)] = champion.clubId;
  }

  return {
    ...state,
    divisionsBySeason: { ...state.divisionsBySeason, [input.seasonIndex + 1]: divisionByClub },
    seasonHistory: [
      ...state.seasonHistory,
      {
        seasonIndex: input.seasonIndex,
        year: input.year,
        championsByDivision,
        promoted,
        relegated,
      },
    ],
  };
}
