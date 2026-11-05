import type { ISODate } from '@leyenda/shared';

import { addDays, addYears } from './date-utils';

const DAYS_IN_WEEK = 7;
const MS_PER_DAY = 86_400_000;

/**
 * Semanas que dura una temporada de liga (GDD §8: calendario con parones y
 * pretemporada). Las jornadas se reparten en este periodo — agosto a
 * finales de mayo — y quedan ~10 semanas de pretemporada antes de la
 * siguiente. Cabe la división más larga con plantilla real (22 clubes →
 * 42 jornadas, una por semana).
 */
export const SEASON_LENGTH_WEEKS = 42;

function daysBetween(from: ISODate, to: ISODate): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / MS_PER_DAY);
}

/**
 * Fecha de inicio de la temporada `seasonIndex`: la primera fecha de la
 * cuadrícula semanal de la partida (`firstSeasonStart` + k semanas) en o
 * después del aniversario de `firstSeasonStart`. Así los partidos siempre
 * caen en una fecha que `save.gameDate` alcanza exactamente, y la
 * temporada no deriva por el año de 52 semanas + 1 día.
 */
export function getSeasonStartDate(firstSeasonStart: ISODate, seasonIndex: number): ISODate {
  if (seasonIndex <= 0) return firstSeasonStart;
  const anniversary = addYears(firstSeasonStart, seasonIndex);
  const weeks = Math.ceil(daysBetween(firstSeasonStart, anniversary) / DAYS_IN_WEEK);
  return addDays(firstSeasonStart, weeks * DAYS_IN_WEEK);
}

/** Temporada en curso en una fecha: la última que ya ha empezado (0 si ninguna). */
export function getSeasonIndexForDate(firstSeasonStart: ISODate, date: ISODate): number {
  if (date <= firstSeasonStart) return 0;
  let index = Math.max(0, Number(date.slice(0, 4)) - Number(firstSeasonStart.slice(0, 4)));
  while (index > 0 && getSeasonStartDate(firstSeasonStart, index) > date) index--;
  while (getSeasonStartDate(firstSeasonStart, index + 1) <= date) index++;
  return index;
}

/** Año de inicio de la temporada (el que aparece en ids de temporada y partidos). */
export function getSeasonYear(firstSeasonStart: ISODate, seasonIndex: number): number {
  return Number(getSeasonStartDate(firstSeasonStart, seasonIndex).slice(0, 4));
}
