import {
  buildBoardObjective,
  createCoachSquad,
  getSeasonIndexForDate,
  isSeasonClosed,
  promotionSpots,
  type BuildObjectiveInput,
} from '@leyenda/engine';
import type {
  BoardObjective,
  Club,
  InterviewAmbition,
  ISODate,
  SquadPlayer,
  WorldState,
} from '@leyenda/shared';
import { SEASON_ONE_START_DATE } from '@leyenda/worldgen/src/constants';

import { countries } from '@/content';
import type { Save } from '@/persistence/schema';
import { generateSquadForClub } from '@/world/generate-squad-for-club';
import { resolveCountryClubs } from '@/world/resolve-division-calendar';

/*
 * Helpers puros del Modo Entrenador (sin SQLite), compartidos por
 * `coach-context.ts`, las pantallas y las pruebas de integración.
 */

/**
 * Temporada "activa" para el entrenador: la del calendario en curso, o la
 * siguiente si esa ya se cerró (pretemporada).
 */
export function activeSeasonIndex(worldState: WorldState, date: ISODate): number {
  const index = getSeasonIndexForDate(SEASON_ONE_START_DATE, date);
  return isSeasonClosed(worldState, index) ? index + 1 : index;
}

/** Plantilla inicial de un club al llegar el entrenador (la misma que simula la IA, con fechas al día). */
export function initialSquadFor(seed: number, club: Club, date: ISODate): SquadPlayer[] {
  return createCoachSquad(generateSquadForClub(seed, club, countries), SEASON_ONE_START_DATE, date);
}

/** Clubes del país del entrenador con la división de la temporada activa. */
export function clubsForActiveSeason(
  save: Pick<Save, 'seed' | 'gameDate'>,
  worldState: WorldState,
  date: ISODate = save.gameDate
): Club[] {
  return resolveCountryClubs(
    save.seed,
    worldState.countryCode,
    worldState,
    activeSeasonIndex(worldState, date)
  );
}

/** Objetivo de la directiva para un club en la temporada activa (GDD §6.1). */
export function objectiveFor(
  club: Club,
  clubs: Club[],
  seasonIndex: number,
  ambition: InterviewAmbition
): BoardObjective {
  const levels = [...new Set(clubs.map((c) => c.divisionLevel))].sort((a, b) => a - b);
  const divisionClubs = clubs.filter((c) => c.divisionLevel === club.divisionLevel);
  const sizeOf = (level: number): number => clubs.filter((c) => c.divisionLevel === level).length;
  const upper = levels.filter((l) => l < club.divisionLevel).pop();
  const lower = levels.find((l) => l > club.divisionLevel);
  const input: BuildObjectiveInput = {
    club,
    divisionClubs,
    seasonIndex,
    ambition,
    promotionSpots: upper === undefined ? 0 : promotionSpots(sizeOf(upper), divisionClubs.length),
    relegationSpots: lower === undefined ? 0 : promotionSpots(divisionClubs.length, sizeOf(lower)),
  };
  return buildBoardObjective(input);
}
