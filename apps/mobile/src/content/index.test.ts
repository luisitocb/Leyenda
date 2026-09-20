import {
  clubNamePool,
  countries,
  events,
  keyMoments,
  namePools,
  origins,
  weeklyActions,
} from './index';

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

  it('carga los pools de nombres de los 10 países', () => {
    expect(Object.keys(namePools)).toHaveLength(10);
    expect(namePools.XA?.firstNames.length).toBeGreaterThan(0);
  });

  it('carga los 6 momentos clave', () => {
    expect(keyMoments).toHaveLength(6);
    expect(keyMoments.map((m) => m.id)).toContain('intervencion-portero');
  });

  it('carga los 17 eventos de decisión', () => {
    expect(events).toHaveLength(17);
    expect(events.map((e) => e.id)).toContain('fiesta-antes-del-partido');
  });
});
