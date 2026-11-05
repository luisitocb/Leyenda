import { isCurrentCoachCareer, upgradeLegacyCoachCareer } from '@leyenda/engine';
import type { CoachCareer, ProtagonistPlayer, WorldState } from '@leyenda/shared';

import { getCoachBySave, updateCoach } from '@/persistence/coaches.repository';
import { getProtagonistBySave } from '@/persistence/protagonists.repository';
import { getLatestSave } from '@/persistence/saves.repository';
import type { Save } from '@/persistence/schema';
import type { ClubSeasonQuery } from '@/world/resolve-division-calendar';
import { loadWorldState } from '@/world/season-transition';

import {
  activeSeasonIndex,
  clubsForActiveSeason,
  initialSquadFor,
  objectiveFor,
} from './coach-world';

export { activeSeasonIndex, clubsForActiveSeason, initialSquadFor, objectiveFor };

export interface CoachContext {
  save: Save;
  protagonist: ProtagonistPlayer;
  coachRowId: string;
  coach: CoachCareer;
  worldState: WorldState;
}

export function coachSeasonQuery(context: CoachContext): ClubSeasonQuery {
  return {
    seed: context.save.seed,
    countryCode: context.worldState.countryCode,
    clubId: context.coach.clubId,
    worldState: context.worldState,
  };
}

/**
 * Carga todo lo que necesita el Modo Entrenador de la partida más
 * reciente. Actualiza (y guarda) las carreras de la forma v1 y fija el
 * objetivo de la temporada activa si todavía no lo tiene.
 */
export function loadCoachContext(): CoachContext | null {
  const save = getLatestSave();
  if (!save) return null;
  const protagonist = getProtagonistBySave(save.id)?.data;
  const row = getCoachBySave(save.id);
  if (!protagonist || !row) return null;

  const worldState = loadWorldState(save, protagonist.nationality);
  const clubs = clubsForActiveSeason(save, worldState);

  let coach: CoachCareer;
  let changed = false;
  if (isCurrentCoachCareer(row.data)) {
    coach = row.data;
  } else {
    const legacy = row.data;
    const club = clubs.find((c) => c.id === legacy.clubId);
    coach = upgradeLegacyCoachCareer(
      legacy,
      club ? initialSquadFor(save.seed, club, save.gameDate) : []
    );
    changed = true;
  }

  const seasonIndex = activeSeasonIndex(worldState, save.gameDate);
  if (coach.status === 'employed' && coach.objective?.seasonIndex !== seasonIndex) {
    const club = clubs.find((c) => c.id === coach.clubId);
    if (club) {
      coach = { ...coach, objective: objectiveFor(club, clubs, seasonIndex, 'realistic') };
      changed = true;
    }
  }

  if (changed) updateCoach(row.id, coach);
  return { save, protagonist, coachRowId: row.id, coach, worldState };
}
