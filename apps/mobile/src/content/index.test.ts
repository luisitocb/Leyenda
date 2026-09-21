import {
  brandDeals,
  clubNamePool,
  countries,
  events,
  injuries,
  keyMoments,
  namePools,
  origins,
  purchasableAssets,
  realClubRosters,
  weeklyActions,
} from './index';

describe('content adapter (import estático, sin fs)', () => {
  it('carga los 15 países (10 ficticios + 5 con plantilla real)', () => {
    expect(countries).toHaveLength(15);
    expect(countries[0]?.code).toBe('XA');
    expect(countries.map((c) => c.code)).toEqual(
      expect.arrayContaining(['ES', 'GB', 'IT', 'DE', 'FR'])
    );
  });

  it('carga las plantillas reales de club (ADR-004)', () => {
    expect(realClubRosters.ES?.['1']).toHaveLength(20);
    expect(realClubRosters.ES?.['2']).toHaveLength(22);
    expect(realClubRosters.ES?.['1']?.map((c) => c.name)).toContain('Real Madrid CF');
    expect(realClubRosters.GB?.['1']).toHaveLength(20);
    expect(realClubRosters.GB?.['2']).toHaveLength(24);
    expect(realClubRosters.IT?.['1']).toHaveLength(20);
    expect(realClubRosters.IT?.['2']).toHaveLength(20);
    expect(realClubRosters.DE?.['1']).toHaveLength(18);
    expect(realClubRosters.DE?.['2']).toHaveLength(18);
    expect(realClubRosters.FR?.['1']).toHaveLength(18);
    expect(realClubRosters.FR?.['2']).toHaveLength(18);
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

  it('carga los pools de nombres de los 15 países', () => {
    expect(Object.keys(namePools)).toHaveLength(15);
    expect(namePools.XA?.firstNames.length).toBeGreaterThan(0);
    expect(namePools.ES?.firstNames.length).toBeGreaterThan(0);
    expect(namePools.GB?.firstNames.length).toBeGreaterThan(0);
  });

  it('carga los 6 momentos clave', () => {
    expect(keyMoments).toHaveLength(6);
    expect(keyMoments.map((m) => m.id)).toContain('intervencion-portero');
  });

  it('carga los 100 eventos de decisión', () => {
    expect(events).toHaveLength(100);
    expect(events.map((e) => e.id)).toContain('fiesta-antes-del-partido');
  });

  it('carga los 5 tipos de lesión', () => {
    expect(injuries).toHaveLength(5);
    expect(injuries.map((i) => i.id)).toContain('esguince-tobillo');
  });

  it('carga los 6 artículos de patrimonio', () => {
    expect(purchasableAssets).toHaveLength(6);
    expect(purchasableAssets.map((a) => a.id)).toContain('coche-deportivo');
  });

  it('carga los 5 acuerdos de marca', () => {
    expect(brandDeals).toHaveLength(5);
    expect(brandDeals.map((b) => b.id)).toContain('campana-benefica');
  });
});
