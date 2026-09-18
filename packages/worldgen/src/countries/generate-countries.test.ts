import { describe, expect, it } from 'vitest';

import { generateCountries } from './generate-countries';

describe('generateCountries', () => {
  it('carga exactamente 10 países', () => {
    expect(generateCountries()).toHaveLength(10);
  });

  it('todos los países tienen código de 2 letras mayúsculas y reputationBase 1-20', () => {
    for (const country of generateCountries()) {
      expect(country.code).toMatch(/^[A-Z]{2}$/);
      expect(country.reputationBase).toBeGreaterThanOrEqual(1);
      expect(country.reputationBase).toBeLessThanOrEqual(20);
      expect(country.name.length).toBeGreaterThan(0);
    }
  });

  it('los códigos de país son únicos', () => {
    const codes = generateCountries().map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('no coincide con códigos ISO-3166 reales de países reconocibles', () => {
    const realCodes = new Set([
      'ES',
      'FR',
      'DE',
      'IT',
      'PT',
      'GB',
      'US',
      'BR',
      'AR',
      'NL',
      'BE',
      'CH',
      'AT',
      'PL',
      'RU',
      'CN',
      'JP',
      'IN',
      'MX',
      'CA',
    ]);
    for (const country of generateCountries()) {
      expect(realCodes.has(country.code)).toBe(false);
    }
  });
});
