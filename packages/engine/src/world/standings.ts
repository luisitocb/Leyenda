import type { EntityId, Match, Standing } from '@leyenda/shared';

/**
 * Calcula la clasificación a partir de los partidos simulados de una
 * competición (los no simulados se ignoran). Desempate: puntos →
 * diferencia de goles → goles a favor → clubId alfabético (determinista,
 * no depende del orden de inserción).
 */
export function computeStandings(matches: Match[], clubIds: EntityId[]): Standing[] {
  const table = new Map<EntityId, Standing>(
    clubIds.map((clubId) => [
      clubId,
      {
        position: 0,
        clubId,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      },
    ])
  );

  for (const match of matches) {
    if (!match.simulated) continue;

    const home = table.get(match.homeTeamId);
    const away = table.get(match.awayTeamId);
    if (!home || !away) continue;

    const { homeGoals, awayGoals } = match.result;

    home.played++;
    away.played++;
    home.goalsFor += homeGoals;
    home.goalsAgainst += awayGoals;
    away.goalsFor += awayGoals;
    away.goalsAgainst += homeGoals;

    if (homeGoals > awayGoals) {
      home.won++;
      home.points += 3;
      away.lost++;
    } else if (homeGoals < awayGoals) {
      away.won++;
      away.points += 3;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
      home.points += 1;
      away.points += 1;
    }
  }

  for (const standing of table.values()) {
    standing.goalDifference = standing.goalsFor - standing.goalsAgainst;
  }

  const sorted = [...table.values()].sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;
    if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference;
    if (a.goalsFor !== b.goalsFor) return b.goalsFor - a.goalsFor;
    return a.clubId.localeCompare(b.clubId);
  });

  sorted.forEach((standing, index) => {
    standing.position = index + 1;
  });

  return sorted;
}
