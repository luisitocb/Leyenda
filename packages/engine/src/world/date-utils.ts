import type { ISODate } from '@leyenda/shared';

function toISODate(date: Date): ISODate {
  return date.toISOString().slice(0, 10);
}

/** Añade `days` días a una fecha ISO. */
export function addDays(date: ISODate, days: number): ISODate {
  const d = new Date(date);
  return toISODate(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + days)));
}

/** Añade `years` años a una fecha ISO. */
export function addYears(date: ISODate, years: number): ISODate {
  const d = new Date(date);
  return toISODate(new Date(Date.UTC(d.getUTCFullYear() + years, d.getUTCMonth(), d.getUTCDate())));
}
