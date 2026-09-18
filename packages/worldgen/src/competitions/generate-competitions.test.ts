import { describe, expect, it } from 'vitest';

import type { Country } from '@leyenda/shared';

import { generateCompetitions } from './generate-competitions';

const COUNTRY: Country = { code: 'XA', name: 'Aurelia', reputationBase: 18 };

describe('generateCompetitions', () => {
  it('genera una competición de tipo league por división', () => {
    const competitions = generateCompetitions(COUNTRY, 2);
    expect(competitions).toHaveLength(2);
    expect(competitions.every((c) => c.type === 'league')).toBe(true);
    expect(competitions.map((c) => c.level).sort()).toEqual([1, 2]);
  });

  it('todas las competiciones referencian el countryCode del país', () => {
    const competitions = generateCompetitions(COUNTRY, 2);
    expect(competitions.every((c) => c.countryCode === 'XA')).toBe(true);
  });

  it('los ids son únicos', () => {
    const competitions = generateCompetitions(COUNTRY, 3);
    const ids = competitions.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
