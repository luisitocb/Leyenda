import type { BasePlayer, MatchEvent } from '@leyenda/shared';
import type { RNG } from '../rng';

import { clamp, pickWeighted } from './math';
import { MATCH_TUNING } from './types';

function average(values: number[]): number {
  return values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
}

/**
 * Resuelve tarjetas de un equipo en un tramo: la probabilidad depende
 * del temperamento medio del equipo; si ocurre, el jugador concreto se
 * elige ponderado inversamente por su propio temperamento (peor
 * temperamento, más probable). Segunda amarilla al mismo jugador en el
 * partido → también roja.
 */
export function resolveCards(
  players: BasePlayer[],
  team: 'home' | 'away',
  minute: number,
  rng: RNG,
  cautioned: Set<string>
): MatchEvent[] {
  if (players.length === 0) return [];

  const avgTemperament = average(players.map((p) => p.personality.temperament));
  const factor = 1 + (50 - avgTemperament) / 100;
  const chance = clamp(
    MATCH_TUNING.baseCardChancePerChunk * factor,
    MATCH_TUNING.cardChanceMin,
    MATCH_TUNING.cardChanceMax
  );

  if (!rng.chance(chance)) return [];

  const player = pickWeighted(players, (p) => Math.max(1, 100 - p.personality.temperament), rng);
  const events: MatchEvent[] = [{ minute, type: 'yellow_card', playerId: player.id, team }];

  if (cautioned.has(player.id)) {
    events.push({ minute, type: 'red_card', playerId: player.id, team });
  } else {
    cautioned.add(player.id);
  }

  return events;
}

/**
 * Resuelve lesiones de un equipo en un tramo: probabilidad ligada a la
 * condición física media del equipo. v1 no recalcula la fuerza del
 * equipo a mitad de partido ni modela sustituciones — el evento se
 * registra, no altera la simulación en curso (limitación conocida,
 * documentada aquí igual que en ADR-002).
 */
export function resolveInjuries(
  players: BasePlayer[],
  team: 'home' | 'away',
  minute: number,
  rng: RNG
): MatchEvent[] {
  if (players.length === 0) return [];

  const avgFitness = average(players.map((p) => p.fitness));
  const factor = 1 + (70 - avgFitness) / 100;
  const chance = clamp(
    MATCH_TUNING.baseInjuryChancePerChunk * factor,
    MATCH_TUNING.injuryChanceMin,
    MATCH_TUNING.injuryChanceMax
  );

  if (!rng.chance(chance)) return [];

  const player = rng.pick(players);
  return [{ minute, type: 'injury', playerId: player.id, team }];
}
