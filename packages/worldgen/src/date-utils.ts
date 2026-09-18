import type { ISODate } from '@leyenda/shared';

function toISODate(date: Date): ISODate {
  return date.toISOString().slice(0, 10);
}

/** Fecha de nacimiento aproximada para una edad dada, a fecha `referenceDate`. */
export function dateOfBirthForAge(referenceDate: ISODate, age: number, dayOffset: number): ISODate {
  const ref = new Date(referenceDate);
  const birth = new Date(Date.UTC(ref.getUTCFullYear() - age, ref.getUTCMonth(), ref.getUTCDate()));
  birth.setUTCDate(birth.getUTCDate() - dayOffset);
  return toISODate(birth);
}

/** Añade `years` años a una fecha ISO. */
export function addYears(date: ISODate, years: number): ISODate {
  const d = new Date(date);
  return toISODate(new Date(Date.UTC(d.getUTCFullYear() + years, d.getUTCMonth(), d.getUTCDate())));
}
