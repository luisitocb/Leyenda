import { describe, expect, it } from 'vitest';

import { advanceWeek } from './advance-week';

describe('advanceWeek', () => {
  it('suma 7 días', () => {
    expect(advanceWeek('2026-08-01')).toBe('2026-08-08');
  });

  it('cruza de mes', () => {
    expect(advanceWeek('2026-08-28')).toBe('2026-09-04');
  });

  it('cruza de año', () => {
    expect(advanceWeek('2026-12-28')).toBe('2027-01-04');
  });

  it('es determinista', () => {
    expect(advanceWeek('2026-08-01')).toBe(advanceWeek('2026-08-01'));
  });
});
