import { describe, expect, it } from 'vitest';
import fc from 'fast-check';

import type { MatchEvent } from '@leyenda/shared';

import { RNG } from '../rng';
import { calculateAge } from '../career/decline';
import { makeSquad, makeSquadPlayer } from './__fixtures__/squad';
import {
  SQUAD_TUNING,
  applyMatchToSquad,
  applySeasonRollover,
  applySquadMoraleDelta,
  applyWeeklyTraining,
  createCoachSquad,
  selectCoachXI,
  shiftAbility,
} from './squad';

const TODAY = '2040-08-04';

describe('createCoachSquad', () => {
  it('desplaza las fechas para conservar las edades de la plantilla generada', () => {
    const generated = [makeSquadPlayer('CF', 60, { dateOfBirth: '2005-03-10' })];
    const [player] = createCoachSquad(generated, '2026-08-01', TODAY);
    expect(calculateAge('2005-03-10', '2026-08-01')).toBe(calculateAge(player!.dateOfBirth, TODAY));
    expect(player!.injuryWeeks).toBe(0);
  });
});

describe('selectCoachXI', () => {
  it('no alinea lesionados', () => {
    const squad = makeSquad(60);
    const star = makeSquadPlayer('CF', 90, { injuryWeeks: 3 });
    const xi = selectCoachXI('club-1', [...squad, star], {
      formation: '4-4-2',
      mentality: 'balanced',
    });
    expect([xi.goalkeeper, ...xi.outfield].map((p) => p.id)).not.toContain(star.id);
  });
});

describe('shiftAbility', () => {
  it('mueve media y atributos a la vez y respeta 1-99 (propiedad)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 99 }), fc.integer({ min: -10, max: 10 }), (a, d) => {
        const shifted = shiftAbility(makeSquadPlayer('CMF', a), d);
        expect(shifted.currentAbility).toBeGreaterThanOrEqual(1);
        expect(shifted.currentAbility).toBeLessThanOrEqual(99);
        expect(shifted.physical.speed).toBe(Math.min(99, Math.max(1, a + d)));
      })
    );
  });
});

describe('applyWeeklyTraining', () => {
  it('es determinista', () => {
    const squad = makeSquad(60);
    expect(applyWeeklyTraining(squad, 'physical', TODAY, new RNG(3))).toEqual(
      applyWeeklyTraining(squad, 'physical', TODAY, new RNG(3))
    );
  });

  it('el descanso recupera más condición física que el entrenamiento físico', () => {
    const squad = makeSquad(60).map((p) => ({ ...p, fitness: 40 }));
    const rest = applyWeeklyTraining(squad, 'rest', TODAY, new RNG(1));
    const physical = applyWeeklyTraining(squad, 'physical', TODAY, new RNG(1));
    expect(rest[0]!.fitness).toBeGreaterThan(physical[0]!.fitness);
  });

  it('los jóvenes con margen mejoran con el tiempo y nunca pasan su potencial', () => {
    let squad = [
      makeSquadPlayer('CMF', 50, { dateOfBirth: '2022-01-01', potential: 60 }),
      makeSquadPlayer('CMF', 50, { dateOfBirth: '2005-01-01', potential: 80 }),
    ];
    const rng = new RNG(11);
    for (let week = 0; week < 150; week++) {
      squad = applyWeeklyTraining(squad, 'technical', TODAY, rng).map((p) => ({
        ...p,
        injuryWeeks: 0,
      }));
    }
    expect(squad[0]!.currentAbility).toBeGreaterThan(50);
    expect(squad[0]!.currentAbility).toBeLessThanOrEqual(60);
    // 35 años: ya no crece por entrenamiento.
    expect(squad[1]!.currentAbility).toBe(50);
  });

  it('descuenta una semana de baja a los lesionados', () => {
    const squad = [makeSquadPlayer('CB', 60, { injuryWeeks: 2 })];
    expect(applyWeeklyTraining(squad, 'rest', TODAY, new RNG(1))[0]!.injuryWeeks).toBe(1);
  });
});

describe('applyMatchToSquad', () => {
  it('cansa a los titulares, cuenta goles y apariciones y aplica lesiones', () => {
    const squad = makeSquad(60);
    const scorer = squad[20]!;
    const hurt = squad[2]!;
    const events: MatchEvent[] = [
      { minute: 10, type: 'goal', playerId: scorer.id, team: 'home' },
      { minute: 30, type: 'injury', playerId: hurt.id, team: 'home' },
      { minute: 40, type: 'goal', playerId: 'rival', team: 'away' },
    ];
    const starters = [scorer.id, hurt.id];
    const after = applyMatchToSquad(squad, starters, events, 'home', 'win', new RNG(1));
    const s = after.find((p) => p.id === scorer.id)!;
    expect(s.seasonGoals).toBe(1);
    expect(s.seasonAppearances).toBe(1);
    expect(s.fitness).toBe(80 - SQUAD_TUNING.matchFitnessCost);
    expect(after.find((p) => p.id === hurt.id)!.injuryWeeks).toBeGreaterThan(0);
    const bench = after.find((p) => p.id === squad[0]!.id)!;
    expect(bench.seasonAppearances).toBe(0);
    expect(bench.morale).toBe(
      70 + SQUAD_TUNING.matchMoraleDelta.win + SQUAD_TUNING.benchMoraleDelta
    );
  });

  it('perder baja la moral', () => {
    const squad = makeSquad(60);
    const after = applyMatchToSquad(squad, [], [], 'away', 'loss', new RNG(1));
    expect(after[0]!.morale).toBeLessThan(squad[0]!.morale);
  });
});

describe('applySquadMoraleDelta', () => {
  it('respeta los límites', () => {
    const squad = applySquadMoraleDelta(makeSquad(60), -500);
    expect(squad.every((p) => p.morale === SQUAD_TUNING.moraleMin)).toBe(true);
  });
});

describe('applySeasonRollover', () => {
  it('retira a los de 38+, suma la cantera y reinicia estadísticas', () => {
    const veteran = makeSquadPlayer('CB', 70, { dateOfBirth: '2000-01-01', seasonGoals: 3 });
    const young = makeSquadPlayer('CF', 60, { dateOfBirth: '2018-01-01', seasonGoals: 9 });
    const youth = makeSquadPlayer('CMF', 45, { dateOfBirth: '2023-03-01' });
    const result = applySeasonRollover([veteran, young], TODAY, [youth], new RNG(1));
    expect(result.retired.map((p) => p.id)).toEqual([veteran.id]);
    expect(result.squad.map((p) => p.id)).toEqual([young.id, youth.id]);
    expect(result.squad[0]!.seasonGoals).toBe(0);
  });

  it('los veteranos de 30+ pierden nivel', () => {
    const thirtyTwo = makeSquadPlayer('CB', 70, { dateOfBirth: '2008-01-01' });
    const result = applySeasonRollover([thirtyTwo], TODAY, [], new RNG(1));
    expect(result.squad[0]!.currentAbility).toBeLessThan(70);
  });

  it('no deja la plantilla por encima del máximo ni con menos de 2 porteros', () => {
    const squad = Array.from({ length: 32 }, (_, i) =>
      makeSquadPlayer(i < 3 ? 'GK' : 'CMF', i < 3 ? 30 : 60, { dateOfBirth: '2015-01-01' })
    );
    const result = applySeasonRollover(squad, TODAY, [], new RNG(1));
    expect(result.squad).toHaveLength(SQUAD_TUNING.maxSquadSize);
    expect(result.squad.filter((p) => p.position === 'GK').length).toBeGreaterThanOrEqual(2);
  });
});
