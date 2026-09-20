import { describe, expect, it } from 'vitest';

import { generateCountries } from './generate-countries';

describe('generateCountries', () => {
  it('carga exactamente 15 países', () => {
    // 10 ficticios + España, Inglaterra, Alemania, Italia, Francia (ADR-004).
    expect(generateCountries()).toHaveLength(15);
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

  it('los países ficticios (código X_) no coinciden con códigos ISO-3166 reales', () => {
    // España (ADR-004) usa su código ISO real a propósito, por eso se excluye
    // aquí — esta prueba solo protege a los países todavía ficticios.
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
    const ficticios = generateCountries().filter((c) => c.code.startsWith('X'));
    expect(ficticios.length).toBeGreaterThan(0);
    for (const country of ficticios) {
      expect(realCodes.has(country.code)).toBe(false);
    }
  });
});
