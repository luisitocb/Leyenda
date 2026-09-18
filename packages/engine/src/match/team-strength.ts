import type { BasePlayer, EntityId, Position } from '@leyenda/shared';

import { FORMATION_4_4_2, HOME_ADVANTAGE_ATTACK, HOME_ADVANTAGE_DEFENSE } from './types';
import type { StartingXI, TeamStrength } from './types';

function compatiblePositions(slot: Position): Position[] {
  if (slot === 'CMF') return ['CMF', 'DMF', 'AMF'];
  return [slot];
}

/**
 * Selecciona el XI titular con la formación fija 4-4-2: para cada hueco,
 * el jugador disponible de mayor currentAbility en una posición
 * compatible (DMF/AMF pueden cubrir un hueco de CMF). Sin sistema de
 * tácticas todavía.
 */
export function selectStartingXI(clubId: EntityId, squad: BasePlayer[]): StartingXI {
  const used = new Set<string>();
  const outfield: BasePlayer[] = [];
  let goalkeeper: BasePlayer | undefined;

  for (const slot of FORMATION_4_4_2) {
    const compatible = compatiblePositions(slot);
    const candidates = squad
      .filter((p) => !used.has(p.id) && compatible.includes(p.position))
      .sort((a, b) => b.currentAbility - a.currentAbility);

    let pick = candidates[0];
    if (!pick) {
      const fallback = squad
        .filter((p) => !used.has(p.id))
        .sort((a, b) => b.currentAbility - a.currentAbility)[0];
      if (!fallback) {
        throw new Error(`No hay jugadores suficientes para completar el XI de ${clubId}`);
      }
      pick = fallback;
    }

    used.add(pick.id);
    if (slot === 'GK') {
      goalkeeper = pick;
    } else {
      outfield.push(pick);
    }
  }

  if (!goalkeeper) {
    throw new Error(`No se pudo asignar portero para ${clubId}`);
  }

  return { clubId, goalkeeper, outfield };
}

/** Contribución de un jugador a la fuerza de su zona, modulada por forma/moral/fitness. */
function contribution(p: BasePlayer): number {
  return (
    p.currentAbility *
    (0.7 + 0.3 * (p.form / 99)) *
    (0.85 + 0.15 * (p.morale / 99)) *
    (0.5 + 0.5 * (p.fitness / 100))
  );
}

function weightedAverage(entries: Array<[BasePlayer, number]>): number {
  const totalWeight = entries.reduce((sum, [, w]) => sum + w, 0);
  if (totalWeight === 0) return 0;
  const totalValue = entries.reduce((sum, [p, w]) => sum + contribution(p) * w, 0);
  return totalValue / totalWeight;
}

/**
 * Fuerza del equipo por zona (defensa, medio, ataque, portería), con
 * ventaja de campo aplicada después de promediar las zonas para no
 * contaminar el promedio con datos de jugadores.
 */
export function computeTeamStrength(xi: StartingXI, isHome: boolean): TeamStrength {
  const defenders = xi.outfield.filter(
    (p) => p.position === 'CB' || p.position === 'LB' || p.position === 'RB'
  );
  const midfielders = xi.outfield.filter(
    (p) => p.position === 'CMF' || p.position === 'DMF' || p.position === 'AMF'
  );
  const wingers = xi.outfield.filter((p) => p.position === 'LW' || p.position === 'RW');
  const forwards = xi.outfield.filter((p) => p.position === 'CF');

  const withWeight = (players: BasePlayer[], weight: number): Array<[BasePlayer, number]> =>
    players.map((p) => [p, weight]);

  const defense = weightedAverage([[xi.goalkeeper, 0.3], ...withWeight(defenders, 1.0)]);
  const midfield = weightedAverage([
    ...withWeight(midfielders, 1.0),
    ...withWeight(wingers, 0.6),
    ...withWeight(defenders, 0.2),
    ...withWeight(forwards, 0.2),
  ]);
  const attack = weightedAverage([
    ...withWeight(forwards, 1.0),
    ...withWeight(wingers, 0.8),
    ...withWeight(midfielders, 0.2),
  ]);
  const goalkeeping = contribution(xi.goalkeeper);

  return {
    defense: defense + (isHome ? HOME_ADVANTAGE_DEFENSE : 0),
    midfield,
    attack: attack + (isHome ? HOME_ADVANTAGE_ATTACK : 0),
    goalkeeping,
  };
}
