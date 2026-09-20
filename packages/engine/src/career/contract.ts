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
