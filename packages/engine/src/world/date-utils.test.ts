import { describe, expect, it } from 'vitest';

import { addDays } from './date-utils';

describe('addDays', () => {
  it('suma días dentro del mismo mes', () => {
    expect(addDays('2026-08-01', 7)).toBe('2026-08-08');
  });

  it('cruza el límite de mes', () => {
    expect(addDays('2026-08-28', 7)).toBe('2026-09-04');
  });

  it('cruza el límite de año', () => {
    expect(addDays('2026-12-28', 7)).toBe('2027-01-04');
  });

  it('con 0 días devuelve la misma fecha', () => {
    expect(addDays('2026-08-01', 0)).toBe('2026-08-01');
  });
});
