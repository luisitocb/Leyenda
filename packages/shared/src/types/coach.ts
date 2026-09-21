import type { EntityId } from './common';

/**
 * Carrera de entrenador (GDD §6.1, §14). Primera historia de Fase 4: solo
 * reputación y club actual. Licencias, estilo y historial (GDD §14) quedan
 * fuera hasta que exista una mecánica que los use.
 */
export interface CoachCareer {
  id: EntityId;
  clubId: EntityId;
  /** Misma escala 1-20 que `Club.reputation`, para poder comparar directamente. */
  reputation: number;
}
