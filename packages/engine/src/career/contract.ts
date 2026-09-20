import type { ISODate, ProtagonistPlayer } from '@leyenda/shared';

import { addDays } from '../world/date-utils';
import { CONTRACT_EXPIRY_WARNING_WEEKS, DAYS_PER_WEEK } from './types';

/** Cobro del sueldo semanal (GDD §4.8). Pura, sin RNG: el sueldo ya está fijado en el contrato. */
export function paySalary(protagonist: ProtagonistPlayer): ProtagonistPlayer {
  return { ...protagonist, money: protagonist.money + protagonist.salary };
}

/**
 * Si el contrato expira dentro de `CONTRACT_EXPIRY_WARNING_WEEKS` semanas
 * (o ya expiró). Comparación de fechas ISO como string: ordenan igual
 * lexicográfica que cronológicamente (mismo truco que en `resolveDivisionCalendar`).
 */
export function isContractExpiringSoon(
  contractExpiry: ISODate | null,
  currentDate: ISODate
): boolean {
  if (!contractExpiry) return false;
  return currentDate >= addDays(contractExpiry, -CONTRACT_EXPIRY_WARNING_WEEKS * DAYS_PER_WEEK);
}

/**
 * True solo la semana exacta en que empieza el aviso de expiración próxima.
 * `contractExpiry` se calcula con `addYears`, así que (a diferencia de
 * `season.endDate`, anclado a la misma cuadrícula de 7 días que
 * `save.gameDate`) no cae necesariamente en una fecha que la secuencia de
 * semanas del save vaya a pisar nunca — comparar con la semana anterior
 * (que sí está garantizada en esa secuencia) detecta el cruce con robustez.
 */
export function isContractRenewalWeek(
  contractExpiry: ISODate | null,
  thisWeekDate: ISODate
): boolean {
  if (!contractExpiry) return false;
  const wasExpiringSoon = isContractExpiringSoon(
    contractExpiry,
    addDays(thisWeekDate, -DAYS_PER_WEEK)
  );
  return isContractExpiringSoon(contractExpiry, thisWeekDate) && !wasExpiringSoon;
}
