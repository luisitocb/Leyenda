import { describe, expect, it } from 'vitest';

import type { CoachCareer, CoachSeasonRecord } from '@leyenda/shared';

import { RNG } from '../rng';
import { makeClub, makeSquad } from './__fixtures__/squad';
import {
  calculateInitialCoachReputation,
  closeCoachSeason,
  createCoachCareer,
  generateJobOffers,
  hireCoach,
  isCurrentCoachCareer,
  isLegacyCoachCareer,
  pointsFor,
  recordCoachMatch,
  sackCoach,
  upgradeLegacyCoachCareer,
} from './coach-career';

function makeCoach(): CoachCareer {
  return createCoachCareer({
    id: 'coach-1',
    clubId: 'club-1',
    legacyScore: 2500,
    squad: makeSquad(60),
    objective: { kind: 'top_half', targetPosition: 6, seasonIndex: 0 },
    ambition: 'realistic',
  });
}

describe('calculateInitialCoachReputation', () => {
  it('clampa en el mínimo (1) con un Legado bajo o nulo', () => {
    expect(calculateInitialCoachReputation(0)).toBe(1);
    expect(calculateInitialCoachReputation(100)).toBe(1);
  });

  it('clampa en el máximo (20) con un Legado muy alto', () => {
    expect(calculateInitialCoachReputation(1_000_000)).toBe(20);
  });

  it('escala de forma proporcional en el rango medio', () => {
    expect(calculateInitialCoachReputation(2500)).toBe(10);
  });
});

describe('generateJobOffers', () => {
  const clubs = [
    makeClub({ id: 'club-low', reputation: 1 }),
    makeClub({ id: 'club-mid-1', reputation: 8 }),
    makeClub({ id: 'club-mid-2', reputation: 9 }),
    makeClub({ id: 'club-mid-3', reputation: 9 }),
    makeClub({ id: 'club-mid-4', reputation: 10 }),
    makeClub({ id: 'club-mid-5', reputation: 10 }),
    makeClub({ id: 'club-mid-6', reputation: 10 }),
    makeClub({ id: 'club-mid-7', reputation: 11 }),
    makeClub({ id: 'club-mid-8', reputation: 11 }),
    makeClub({ id: 'club-mid-9', reputation: 12 }),
    makeClub({ id: 'club-high', reputation: 20 }),
  ];

  it('es determinista: misma seed produce las mismas ofertas', () => {
    const offersA = generateJobOffers(clubs, 10, new RNG(1));
    const offersB = generateJobOffers(clubs, 10, new RNG(1));
    expect(offersA.map((c) => c.id)).toEqual(offersB.map((c) => c.id));
  });

  it('devuelve exactamente `count` clubes', () => {
    expect(generateJobOffers(clubs, 10, new RNG(1), 3)).toHaveLength(3);
  });

  it('prioriza clubes con reputación cercana a la del entrenador', () => {
    const offerIds = generateJobOffers(clubs, 10, new RNG(1), 3).map((c) => c.id);
    expect(offerIds).not.toContain('club-low');
    expect(offerIds).not.toContain('club-high');
  });

  it('nunca devuelve más clubes de los disponibles', () => {
    expect(generateJobOffers([makeClub()], 10, new RNG(1), 3)).toHaveLength(1);
  });
});

describe('createCoachCareer', () => {
  it('crea una carrera empleada con reputación derivada del Legado y la plantilla dada', () => {
    const coach = makeCoach();
    expect(coach.reputation).toBe(10);
    expect(coach.status).toBe('employed');
    expect(coach.squad).toHaveLength(22);
    expect(coach.tactics).toEqual({ formation: '4-4-2', mentality: 'balanced' });
    expect(coach.boardConfidence).toBe(60);
  });
});

describe('partidas antiguas (forma v1)', () => {
  it('detecta y actualiza una carrera sin plantilla conservando id, club y reputación', () => {
    const legacy = { id: 'coach-old', clubId: 'club-9', reputation: 7 };
    expect(isLegacyCoachCareer(legacy)).toBe(true);
    const upgraded = upgradeLegacyCoachCareer(legacy, makeSquad(50));
    expect(isLegacyCoachCareer(upgraded)).toBe(false);
    expect(isCurrentCoachCareer(upgraded)).toBe(true);
    expect(upgraded.id).toBe('coach-old');
    expect(upgraded.clubId).toBe('club-9');
    expect(upgraded.reputation).toBe(7);
    expect(upgraded.status).toBe('employed');
    expect(upgraded.squad).toHaveLength(22);
  });
});

describe('recordCoachMatch', () => {
  it('guarda el resultado y suma victoria/empate/derrota desde el punto de vista del club', () => {
    let coach = makeCoach();
    coach = recordCoachMatch(coach, 'm1', { homeGoals: 2, awayGoals: 0 }, true);
    coach = recordCoachMatch(coach, 'm2', { homeGoals: 2, awayGoals: 0 }, false);
    coach = recordCoachMatch(coach, 'm3', { homeGoals: 1, awayGoals: 1 }, false);
    expect(coach.results['m1']).toEqual({ homeGoals: 2, awayGoals: 0 });
    expect(coach.stats).toMatchObject({ matches: 3, wins: 1, losses: 1, draws: 1 });
  });

  it('pointsFor da 3/1/0', () => {
    expect(pointsFor({ homeGoals: 1, awayGoals: 0 }, true)).toBe(3);
    expect(pointsFor({ homeGoals: 1, awayGoals: 1 }, false)).toBe(1);
    expect(pointsFor({ homeGoals: 1, awayGoals: 0 }, false)).toBe(0);
  });
});

describe('closeCoachSeason', () => {
  const record: CoachSeasonRecord = {
    seasonIndex: 0,
    year: 2026,
    clubId: 'club-1',
    divisionLevel: 2,
    finalPosition: 1,
    objectiveMet: true,
    champion: true,
    promoted: true,
    relegated: false,
  };

  it('suma títulos, ascensos e historial y sube la reputación', () => {
    const coach = closeCoachSeason(makeCoach(), record, false);
    expect(coach.stats.titles).toBe(1);
    expect(coach.stats.promotions).toBe(1);
    expect(coach.history).toEqual([record]);
    expect(coach.reputation).toBe(15);
    expect(coach.results).toEqual({});
  });

  it('un despido a final de temporada deja al entrenador sin club y baja la reputación', () => {
    const failed = { ...record, champion: false, promoted: false, objectiveMet: false };
    const coach = closeCoachSeason(makeCoach(), failed, true);
    expect(coach.status).toBe('unemployed');
    expect(coach.stats.sackings).toBe(1);
    expect(coach.reputation).toBe(7);
  });
});

describe('sackCoach / hireCoach', () => {
  it('despedir y volver a contratar cambia de club y reinicia la directiva', () => {
    const played = recordCoachMatch(makeCoach(), 'm1', { homeGoals: 0, awayGoals: 3 }, true);
    const sacked = sackCoach({ ...played, boardConfidence: 5, ultimatumGiven: true });
    expect(sacked.status).toBe('unemployed');
    const hired = hireCoach(sacked, {
      clubId: 'club-2',
      squad: makeSquad(55),
      objective: null,
      ambition: 'ambitious',
    });
    expect(hired.status).toBe('employed');
    expect(hired.clubId).toBe('club-2');
    expect(hired.boardConfidence).toBe(70);
    expect(hired.ultimatumGiven).toBe(false);
    expect(hired.stats.sackings).toBe(1);
    // Los resultados de la temporada con el club anterior siguen contando.
    expect(hired.results['m1']).toEqual({ homeGoals: 0, awayGoals: 3 });
  });
});
