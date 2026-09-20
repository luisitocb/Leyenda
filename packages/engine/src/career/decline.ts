import type { ISODate, ProtagonistPlayer } from '@leyenda/shared';

import { addDays } from '../world/date-utils';
import { clamp } from './math';
import {
  AGE_DECLINE_PER_YEAR,
  DAYS_PER_WEEK,
  DECLINE_START_AGE,
  FORCED_RETIREMENT_AGE,
} from './types';

/** Edad en años cumplidos a una fecha dada. */
export function calculateAge(dateOfBirth: ISODate, currentDate: ISODate): number {
  const birth = new Date(dateOfBirth);
  const current = new Date(currentDate);
  let age = current.getUTCFullYear() - birth.getUTCFullYear();
  const hadBirthdayThisYear =
    current.getUTCMonth() > birth.getUTCMonth() ||
    (current.getUTCMonth() === birth.getUTCMonth() && current.getUTCDate() >= birth.getUTCDate());
  if (!hadBirthdayThisYear) age--;
  return age;
}

/**
 * True solo la semana exacta en que se cumplen años. `dateOfBirth` no cae
 * en la cuadrícula de 7 días de `save.gameDate` (igual que `contractExpiry`
 * con `addYears`), así que se detecta comparando con la semana anterior en
 * vez de una fecha exacta — mismo patrón que `isContractRenewalWeek`.
 */
export function isBirthdayWeek(dateOfBirth: ISODate, thisWeekDate: ISODate): boolean {
  const previousWeek = addDays(thisWeekDate, -DAYS_PER_WEEK);
  return calculateAge(dateOfBirth, thisWeekDate) !== calculateAge(dateOfBirth, previousWeek);
}

/**
 * Declive físico por edad (GDD §4.8): a partir de `DECLINE_START_AGE` cada
 * cumpleaños resta `AGE_DECLINE_PER_YEAR` a los atributos físicos. Quien
 * llama solo debe invocarla en `isBirthdayWeek`.
 */
export function applyAgeDecline(
  protagonist: ProtagonistPlayer,
  currentDate: ISODate
): ProtagonistPlayer {
  const age = calculateAge(protagonist.dateOfBirth, currentDate);
  if (age < DECLINE_START_AGE) return protagonist;
  return {
    ...protagonist,
    physical: {
      speed: clamp(protagonist.physical.speed - AGE_DECLINE_PER_YEAR, 1, 99),
      stamina: clamp(protagonist.physical.stamina - AGE_DECLINE_PER_YEAR, 1, 99),
      strength: clamp(protagonist.physical.strength - AGE_DECLINE_PER_YEAR, 1, 99),
      jumping: clamp(protagonist.physical.jumping - AGE_DECLINE_PER_YEAR, 1, 99),
    },
  };
}

/** Retirada forzosa por edad (GDD §4.8). */
export function shouldForceRetirement(
  protagonist: ProtagonistPlayer,
  currentDate: ISODate
): boolean {
  return calculateAge(protagonist.dateOfBirth, currentDate) >= FORCED_RETIREMENT_AGE;
}

/**
 * Puntuación de Legado (GDD §5: "títulos, partidos, premios, reputación e
 * imagen"). Usa solo campos que ya existen — no hay un campo de fama/imagen
 * separado todavía, `relations.fans` hace de proxy.
 */
export function calculateLegacyScore(protagonist: ProtagonistPlayer): number {
  return (
    protagonist.titlesWon.length * 500 +
    protagonist.gamesPlayed * 5 +
    protagonist.goalsScored * 15 +
    protagonist.assists * 10 +
    protagonist.relations.fans * 3
  );
}
