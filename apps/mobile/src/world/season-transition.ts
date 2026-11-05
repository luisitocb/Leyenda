import { closeSeason, getSeasonYear, isSeasonClosed } from '@leyenda/engine';
import type { CountryCode, ProtagonistPlayer, WorldState } from '@leyenda/shared';
import { SEASON_ONE_START_DATE } from '@leyenda/worldgen/src/constants';

import { getOrCreateWorldState, saveWorldState } from '@/persistence/world-states.repository';
import type { Save } from '@/persistence/schema';
import type { ClubSeasonQuery } from './resolve-division-calendar';
import { resolveFinalStandingsByLevel, type StandingsOptions } from './resolve-standings';

/** Estado dinámico del mundo del save, en el país del protagonista (único con calendario jugable). */
export function loadWorldState(save: Save, countryCode: CountryCode): WorldState {
  return getOrCreateWorldState(save.id, countryCode);
}

/** Consulta de temporada del club del protagonista (Modo Jugador). */
export function playerSeasonQuery(
  save: Save,
  protagonist: ProtagonistPlayer,
  worldState: WorldState | null
): ClubSeasonQuery {
  return {
    seed: save.seed,
    countryCode: protagonist.nationality,
    clubId: protagonist.clubId ?? '',
    worldState,
  };
}

/**
 * Cierra la temporada `seasonIndex` (campeones + ascensos/descensos) si no
 * lo estaba ya, y la persiste. Idempotente: se puede llamar desde la
 * semana que termina la temporada y desde la pantalla de fin de temporada.
 */
export function closeSeasonIfNeeded(
  save: Save,
  worldState: WorldState,
  seasonIndex: number,
  options: StandingsOptions = {}
): WorldState {
  if (isSeasonClosed(worldState, seasonIndex)) return worldState;
  const standingsByLevel = resolveFinalStandingsByLevel(
    save.seed,
    worldState.countryCode,
    worldState,
    seasonIndex,
    options
  );
  const closed = closeSeason(worldState, {
    seasonIndex,
    year: getSeasonYear(SEASON_ONE_START_DATE, seasonIndex),
    standingsByLevel,
  });
  saveWorldState(save.id, closed);
  return closed;
}
