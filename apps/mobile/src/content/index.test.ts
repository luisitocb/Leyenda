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
  it('carga los 11 países (10 ficticios + España)', () => {
    expect(countries).toHaveLength(11);
    expect(countries[0]?.code).toBe('XA');
    expect(countries.map((c) => c.code)).toContain('ES');
  });

  it('carga la plantilla real de España (ADR-004)', () => {
    expect(realClubRosters.ES?.['1']).toHaveLength(20);
    expect(realClubRosters.ES?.['2']).toHaveLength(22);
    expect(realClubRosters.ES?.['1']?.map((c) => c.name)).toContain('Real Madrid CF');
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

  it('carga los pools de nombres de los 11 países', () => {
    expect(Object.keys(namePools)).toHaveLength(11);
    expect(namePools.XA?.firstNames.length).toBeGreaterThan(0);
    expect(namePools.ES?.firstNames.length).toBeGreaterThan(0);
  });

  it('carga los 6 momentos clave', () => {
    expect(keyMoments).toHaveLength(6);
    expect(keyMoments.map((m) => m.id)).toContain('intervencion-portero');
  });

  it('carga los 50 eventos de decisión', () => {
    expect(events).toHaveLength(50);
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
