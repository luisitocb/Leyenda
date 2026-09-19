import { clubNamePool, countries, origins, weeklyActions } from './index';

describe('content adapter (import estático, sin fs)', () => {
  it('carga los 10 países', () => {
    expect(countries).toHaveLength(10);
    expect(countries[0]?.code).toBe('XA');
  });

  it('carga el pool de nombres de club', () => {
    expect(clubNamePool.cityPrefixes.length).toBeGreaterThan(0);
  });

  it('carga los 4 orígenes', () => {
    expect(origins).toHaveLength(4);
    expect(origins.map((o) => o.id)).toContain('barrio-humilde');
  });

  it('carga las 6 acciones semanales', () => {
    expect(weeklyActions).toHaveLength(6);
    expect(weeklyActions.map((a) => a.id)).toContain('descanso-activo');
  });
});
