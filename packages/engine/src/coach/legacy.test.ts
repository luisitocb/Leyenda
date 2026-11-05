import { describe, expect, it } from 'vitest';

import type { CoachCareer, ProtagonistPlayer } from '@leyenda/shared';

import { calculateLegacyScore } from '../career/decline';
import { makeSquad } from './__fixtures__/squad';
import { buildHallOfFameEntry, calculateCoachLegacyScore } from './legacy';
import { closeCoachSeason, createCoachCareer, recordCoachMatch } from './coach-career';

const protagonist = {
  firstName: 'Ana',
  lastName: 'Ejemplo',
  nationality: 'XA',
  gamesPlayed: 300,
  goalsScored: 120,
  assists: 40,
  titlesWon: ['t1', 't2'],
  nationalTeamCaps: 12,
  relations: { fans: 50 },
} as unknown as ProtagonistPlayer;

function makeCoach(): CoachCareer {
  return createCoachCareer({
    id: 'c',
    clubId: 'club-1',
    legacyScore: 1000,
    squad: makeSquad(50),
    objective: null,
    ambition: 'realistic',
  });
}

describe('calculateCoachLegacyScore', () => {
  it('crece con victorias, títulos y temporadas', () => {
    const base = makeCoach();
    let better = recordCoachMatch(base, 'm', { homeGoals: 1, awayGoals: 0 }, true);
    better = closeCoachSeason(
      better,
      {
        seasonIndex: 0,
        year: 2040,
        clubId: 'club-1',
        divisionLevel: 1,
        finalPosition: 1,
        objectiveMet: true,
        champion: true,
        promoted: false,
        relegated: false,
      },
      false
    );
    expect(calculateCoachLegacyScore(better)).toBeGreaterThan(calculateCoachLegacyScore(base));
  });
});

describe('buildHallOfFameEntry', () => {
  it('suma el Legado de jugador y el de entrenador', () => {
    const coach = makeCoach();
    const entry = buildHallOfFameEntry({ id: 'e', protagonist, coach, finishedOn: '2070-01-01' });
    expect(entry.name).toBe('Ana Ejemplo');
    expect(entry.playerLegacy).toBe(calculateLegacyScore(protagonist));
    expect(entry.totalScore).toBe(entry.playerLegacy + entry.coachLegacy);
    expect(entry.player.titles).toBe(2);
    expect(entry.coach?.seasons).toBe(0);
  });

  it('sin carrera de entrenador solo cuenta el Legado de jugador', () => {
    const entry = buildHallOfFameEntry({
      id: 'e',
      protagonist,
      coach: null,
      finishedOn: '2050-01-01',
    });
    expect(entry.coach).toBeNull();
    expect(entry.totalScore).toBe(entry.playerLegacy);
  });
});
