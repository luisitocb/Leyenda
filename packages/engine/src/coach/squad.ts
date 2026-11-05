import type {
  BasePlayer,
  EntityId,
  ISODate,
  MatchEvent,
  SquadPlayer,
  Tactics,
  TrainingFocus,
} from '@leyenda/shared';

import type { RNG } from '../rng';
import { calculateAge } from '../career/decline';
import { clamp } from '../career/math';
import { FORMATIONS } from '../match/tactics';
import { selectStartingXI } from '../match/team-strength';
import type { StartingXI } from '../match/types';
import { addYears } from '../world/date-utils';

/**
 * Constantes del día a día de la plantilla (GDD §6.2, §6.4). Calibradas
 * para que, con el foco por defecto (técnico) y un partido cada ~1,6
 * semanas, los titulares se estabilicen en el mismo estado que las
 * plantillas de la IA (forma/moral/condición ~65-75, ver worldgen): la
 * gestión da ventajas pequeñas, no un +15 % de fuerza gratis. Condición,
 * forma y moral tienden a un objetivo cada semana (regresión) en vez de
 * acumularse sin límite.
 */
export const SQUAD_TUNING = {
  /** Condición física a la que tiende cada jugador según el foco de la semana. */
  fitnessTarget: { physical: 78, technical: 82, tactical: 80, rest: 92 } as Record<
    TrainingFocus,
    number
  >,
  fitnessRegression: 0.3,
  formDelta: { physical: 0, technical: 0, tactical: 2, rest: -1 } as Record<TrainingFocus, number>,
  formTarget: 65,
  formRegression: 0.2,
  moraleTarget: 70,
  moraleRegression: 0.1,
  growthChance: { physical: 0.1, technical: 0.12, tactical: 0.06, rest: 0.02 } as Record<
    TrainingFocus,
    number
  >,
  trainingInjuryChance: { physical: 0.01, technical: 0.005, tactical: 0.003, rest: 0 } as Record<
    TrainingFocus,
    number
  >,
  growthMaxAge: 24,
  matchFitnessCost: 6,
  matchFormDelta: { win: 4, draw: 1, loss: -3 },
  matchMoraleDelta: { win: 4, draw: 0, loss: -4 },
  benchMoraleDelta: -1,
  moraleMin: 20,
  injuryWeeksMin: 1,
  injuryWeeksMax: 5,
  declineStartAge: 30,
  goalkeeperDeclineStartAge: 33,
  declineMin: 1,
  declineMax: 3,
  retirementStartAge: 35,
  goalkeeperRetirementStartAge: 37,
  retirementChance: 0.5,
  forcedRetirementAge: 38,
  maxSquadSize: 30,
  minGoalkeepers: 2,
} as const;

export type MatchOutcome = 'win' | 'draw' | 'loss';

/**
 * Convierte una plantilla generada por worldgen (fechas relativas a la
 * primera temporada) en plantilla del entrenador en `currentDate`:
 * desplaza nacimiento y contrato los años transcurridos para que las
 * edades sigan siendo las de una plantilla recién generada.
 */
export function createCoachSquad(
  players: BasePlayer[],
  generatedAt: ISODate,
  currentDate: ISODate
): SquadPlayer[] {
  const years = Math.max(0, calculateAge(generatedAt, currentDate));
  return players.map((p) => ({
    ...p,
    dateOfBirth: addYears(p.dateOfBirth, years),
    contractExpiry: p.contractExpiry ? addYears(p.contractExpiry, years) : null,
    injuryWeeks: 0,
    seasonAppearances: 0,
    seasonGoals: 0,
  }));
}

export function availablePlayers(squad: SquadPlayer[]): SquadPlayer[] {
  return squad.filter((p) => p.injuryWeeks === 0);
}

/** XI titular automático para las tácticas elegidas, sin lesionados. */
export function selectCoachXI(
  clubId: EntityId,
  squad: SquadPlayer[],
  tactics: Tactics
): StartingXI {
  return selectStartingXI(clubId, availablePlayers(squad), FORMATIONS[tactics.formation]);
}

function shiftValue(value: number, delta: number): number {
  return clamp(value + delta, 1, 99);
}

/** Sube/baja la media y todos los atributos de juego a la vez, para que sigan siendo coherentes. */
export function shiftAbility<T extends BasePlayer>(player: T, delta: number): T {
  if (delta === 0) return player;
  const technical =
    'reflexes' in player.technical
      ? {
          reflexes: shiftValue(player.technical.reflexes, delta),
          positioning: shiftValue(player.technical.positioning, delta),
          aerialAbility: shiftValue(player.technical.aerialAbility, delta),
        }
      : {
          passing: shiftValue(player.technical.passing, delta),
          dribbling: shiftValue(player.technical.dribbling, delta),
          shooting: shiftValue(player.technical.shooting, delta),
          ballControl: shiftValue(player.technical.ballControl, delta),
          defending: shiftValue(player.technical.defending, delta),
          heading: shiftValue(player.technical.heading, delta),
        };
  return {
    ...player,
    currentAbility: shiftValue(player.currentAbility, delta),
    physical: {
      speed: shiftValue(player.physical.speed, delta),
      stamina: shiftValue(player.physical.stamina, delta),
      strength: shiftValue(player.physical.strength, delta),
      jumping: shiftValue(player.physical.jumping, delta),
    },
    technical,
    mental: {
      vision: shiftValue(player.mental.vision, delta),
      composure: shiftValue(player.mental.composure, delta),
      leadership: shiftValue(player.mental.leadership, delta),
      teamwork: shiftValue(player.mental.teamwork, delta),
    },
  };
}

/**
 * Una semana de entrenamiento del grupo (GDD §6.4): recuperación física,
 * forma, mejora de los jóvenes con margen de potencial (más con buena
 * Profesionalidad) y riesgo de lesión según la carga. También descuenta
 * una semana de baja a los lesionados.
 */
export function applyWeeklyTraining(
  squad: SquadPlayer[],
  focus: TrainingFocus,
  currentDate: ISODate,
  rng: RNG
): SquadPlayer[] {
  const T = SQUAD_TUNING;
  return squad.map((player) => {
    const wasInjured = player.injuryWeeks > 0;
    let updated: SquadPlayer = {
      ...player,
      injuryWeeks: Math.max(0, player.injuryWeeks - 1),
      fitness: clamp(
        Math.round(
          player.fitness + (T.fitnessTarget[focus] - player.fitness) * T.fitnessRegression
        ),
        0,
        100
      ),
      form: clamp(
        Math.round(
          player.form + T.formDelta[focus] + (T.formTarget - player.form) * T.formRegression
        ),
        1,
        99
      ),
      morale: clamp(
        Math.round(player.morale + (T.moraleTarget - player.morale) * T.moraleRegression),
        T.moraleMin,
        99
      ),
    };
    if (wasInjured) return updated;

    const age = calculateAge(player.dateOfBirth, currentDate);
    const professionalism = clamp(player.personality.professionalism / 50, 0.5, 1.5);
    if (
      age < T.growthMaxAge &&
      player.currentAbility < player.potential &&
      rng.chance(T.growthChance[focus] * professionalism)
    ) {
      updated = shiftAbility(updated, 1);
    }

    if (rng.chance(T.trainingInjuryChance[focus])) {
      updated = { ...updated, injuryWeeks: rng.nextInt(T.injuryWeeksMin, T.injuryWeeksMax) };
    }
    return updated;
  });
}

/**
 * Consecuencias de un partido en la plantilla: cansancio, forma y
 * estadísticas de los titulares, moral de todo el grupo (los suplentes
 * pierden un poco: quieren minutos, GDD §6.2) y lesiones del partido.
 */
export function applyMatchToSquad(
  squad: SquadPlayer[],
  startingIds: readonly EntityId[],
  events: readonly MatchEvent[],
  side: 'home' | 'away',
  outcome: MatchOutcome,
  rng: RNG
): SquadPlayer[] {
  const T = SQUAD_TUNING;
  const starters = new Set(startingIds);
  const goalsBy = new Map<EntityId, number>();
  const injured = new Set<EntityId>();
  for (const event of events) {
    if (event.team !== side || !event.playerId) continue;
    if (event.type === 'goal') goalsBy.set(event.playerId, (goalsBy.get(event.playerId) ?? 0) + 1);
    if (event.type === 'injury') injured.add(event.playerId);
  }

  return squad.map((player) => {
    const started = starters.has(player.id);
    const moraleDelta = T.matchMoraleDelta[outcome] + (started ? 0 : T.benchMoraleDelta);
    let updated: SquadPlayer = {
      ...player,
      morale: clamp(player.morale + moraleDelta, T.moraleMin, 99),
    };
    if (started) {
      updated = {
        ...updated,
        fitness: clamp(player.fitness - T.matchFitnessCost, 0, 100),
        form: clamp(player.form + T.matchFormDelta[outcome], 1, 99),
        seasonAppearances: player.seasonAppearances + 1,
        seasonGoals: player.seasonGoals + (goalsBy.get(player.id) ?? 0),
      };
    }
    if (injured.has(player.id)) {
      updated = { ...updated, injuryWeeks: rng.nextInt(T.injuryWeeksMin, T.injuryWeeksMax) };
    }
    return updated;
  });
}

/** Cambia la moral de toda la plantilla (ruedas de prensa, GDD §6.1). */
export function applySquadMoraleDelta(squad: SquadPlayer[], delta: number): SquadPlayer[] {
  if (delta === 0) return squad;
  return squad.map((p) => ({
    ...p,
    morale: clamp(p.morale + delta, SQUAD_TUNING.moraleMin, 99),
  }));
}

export interface SeasonRolloverResult {
  squad: SquadPlayer[];
  retired: SquadPlayer[];
  released: SquadPlayer[];
}

function retirementAgeStart(player: BasePlayer): number {
  return player.position === 'GK'
    ? SQUAD_TUNING.goalkeeperRetirementStartAge
    : SQUAD_TUNING.retirementStartAge;
}

function declineAgeStart(player: BasePlayer): number {
  return player.position === 'GK'
    ? SQUAD_TUNING.goalkeeperDeclineStartAge
    : SQUAD_TUNING.declineStartAge;
}

/**
 * Cambio de temporada de la plantilla (GDD §6.2, §6.4): declive de los
 * veteranos (los porteros duran más), retiradas, llegada de juveniles de
 * la cantera (`youthIntake`, generados fuera porque worldgen no es parte
 * del motor) y, si la plantilla se pasa de tamaño, salida de los peores
 * (sin dejarla con menos de 2 porteros). Reinicia las estadísticas de la
 * temporada.
 */
export function applySeasonRollover(
  squad: SquadPlayer[],
  currentDate: ISODate,
  youthIntake: BasePlayer[],
  rng: RNG
): SeasonRolloverResult {
  const T = SQUAD_TUNING;
  const retired: SquadPlayer[] = [];
  const staying: SquadPlayer[] = [];

  for (const player of squad) {
    const age = calculateAge(player.dateOfBirth, currentDate);
    const retires =
      age >= T.forcedRetirementAge ||
      (age >= retirementAgeStart(player) && rng.chance(T.retirementChance));
    if (retires) {
      retired.push(player);
      continue;
    }
    const decline = age >= declineAgeStart(player) ? rng.nextInt(T.declineMin, T.declineMax) : 0;
    staying.push({ ...shiftAbility(player, -decline), seasonAppearances: 0, seasonGoals: 0 });
  }

  const youth: SquadPlayer[] = youthIntake.map((p) => ({
    ...p,
    injuryWeeks: 0,
    seasonAppearances: 0,
    seasonGoals: 0,
  }));
  const combined = [...staying, ...youth];

  const released: SquadPlayer[] = [];
  if (combined.length > T.maxSquadSize) {
    const ranked = [...combined].sort((a, b) => a.currentAbility - b.currentAbility);
    let goalkeepers = combined.filter((p) => p.position === 'GK').length;
    for (const candidate of ranked) {
      if (combined.length - released.length <= T.maxSquadSize) break;
      if (youth.includes(candidate)) continue;
      if (candidate.position === 'GK') {
        if (goalkeepers <= T.minGoalkeepers) continue;
        goalkeepers--;
      }
      released.push(candidate);
    }
  }

  const releasedIds = new Set(released.map((p) => p.id));
  return { squad: combined.filter((p) => !releasedIds.has(p.id)), retired, released };
}
