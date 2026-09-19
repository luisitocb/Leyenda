import type { ISODate } from '@leyenda/shared';

import { addDays } from '../world/date-utils';
import { DAYS_PER_WEEK } from './types';

/** Avanza la fecha de la partida una semana (GDD §4.5). */
export function advanceWeek(gameDate: ISODate): ISODate {
  return addDays(gameDate, DAYS_PER_WEEK);
}
