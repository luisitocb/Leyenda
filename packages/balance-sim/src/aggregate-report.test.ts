import { describe, expect, it } from 'vitest';

import type { Club } from '@leyenda/shared';
import type { World } from '@leyenda/worldgen';

import { aggregateReport } from './aggregate-report';
import type { SeasonRunResult } from './types';

function buildWorld(): World {
  const clubs: Club[] = [
    {
      id: 'A',
      name: 'Club A',
      shortName: 'A',
      countryCode: 'XA',
      reputation: 18,
      divisionLevel: 1,
      money: 1,
    },
    {
      id: 'B',
      name: 'Club B',
      shortName: 'B',
      countryCode: 'XA',
      reputation: 10,
      divisionLevel: 1,
      money: 1,
    },
    {
      id: 'C',
      name: 'Club C',
      shortName: 'C',
      countryCode: 'XA',
      reputation: 8,
      divisionLevel: 1,
      money: 1,
    },
  ];
  return { countries: [], clubs, competitions: [], players: [] };
}

describe('aggregateReport', () => {
  it('calcula la media de goles/partido sobre todas las temporadas', () => {
    const results: SeasonRunResult[] = [
      {
        totalGoals: 30,
        totalMatches: 10,
        championByCompetition: new Map(),
        extremeMatches: [],
        anomalousPlayerSeasons: [],
      },
      {
        totalGoals: 20,
        totalMatches: 10,
        championByCompetition: new Map(),
        extremeMatches: [],
        anomalousPlayerSeasons: [],
      },
    ];
    const report = aggregateReport(results, buildWorld());
    expect(report.totalMatches).toBe(20);
    expect(report.averageGoalsPerMatch).toBe(2.5);
    expect(report.seasonsSimulated).toBe(2);
  });

  it('detecta un club que domina más del 40% de los títulos', () => {
    const results: SeasonRunResult[] = Array.from({ length: 5 }, () => ({
      totalGoals: 0,
      totalMatches: 0,
      championByCompetition: new Map([['comp-1', 'A']]),
      extremeMatches: [],
      anomalousPlayerSeasons: [],
    }));
    const report = aggregateReport(results, buildWorld());
    expect(report.dominantClubs).toHaveLength(1);
    expect(report.dominantClubs[0]?.clubId).toBe('A');
    expect(report.dominantClubs[0]?.clubName).toBe('Club A');
    expect(report.dominantClubs[0]?.share).toBe(1);
  });

  it('no marca dominancia si ningún club supera el 40% de los títulos', () => {
    // 5 temporadas, A y B ganan 2 cada uno (40% exacto, no supera el umbral) y C gana 1.
    const results: SeasonRunResult[] = [
      {
        totalGoals: 0,
        totalMatches: 0,
        championByCompetition: new Map([['comp-1', 'A']]),
        extremeMatches: [],
        anomalousPlayerSeasons: [],
      },
      {
        totalGoals: 0,
        totalMatches: 0,
        championByCompetition: new Map([['comp-1', 'A']]),
        extremeMatches: [],
        anomalousPlayerSeasons: [],
      },
      {
        totalGoals: 0,
        totalMatches: 0,
        championByCompetition: new Map([['comp-1', 'B']]),
        extremeMatches: [],
        anomalousPlayerSeasons: [],
      },
      {
        totalGoals: 0,
        totalMatches: 0,
        championByCompetition: new Map([['comp-1', 'B']]),
        extremeMatches: [],
        anomalousPlayerSeasons: [],
      },
      {
        totalGoals: 0,
        totalMatches: 0,
        championByCompetition: new Map([['comp-1', 'C']]),
        extremeMatches: [],
        anomalousPlayerSeasons: [],
      },
    ];
    const report = aggregateReport(results, buildWorld());
    expect(report.dominantClubs).toHaveLength(0);
  });

  it('agrega partidos y jugadores anómalos de todas las temporadas', () => {
    const results: SeasonRunResult[] = [
      {
        totalGoals: 0,
        totalMatches: 0,
        championByCompetition: new Map(),
        extremeMatches: [
          { competitionId: 'comp-1', homeTeamId: 'A', awayTeamId: 'B', homeGoals: 9, awayGoals: 0 },
        ],
        anomalousPlayerSeasons: [{ playerId: 'p1', competitionId: 'comp-1', goals: 45 }],
      },
    ];
    const report = aggregateReport(results, buildWorld());
    expect(report.extremeMatches).toHaveLength(1);
    expect(report.anomalousPlayerSeasons).toHaveLength(1);
  });
});
