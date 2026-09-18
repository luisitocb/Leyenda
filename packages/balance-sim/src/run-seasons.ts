import { computeStandings, generateSeasonCalendar, RNG, simulateMatch } from '@leyenda/engine';
import type { BasePlayer, Competition, EntityId, Match } from '@leyenda/shared';
import type { World } from '@leyenda/worldgen';

import {
  ANOMALOUS_PLAYER_GOALS_THRESHOLD,
  EXTREME_SCORELINE_THRESHOLD,
  type AnomalousPlayerSeason,
  type ExtremeMatch,
  type SeasonRunResult,
} from './types';

/** Semilla determinista derivada de (baseSeed, temporada, competición). */
function seedFor(baseSeed: number, seasonIndex: number, competitionId: string): number {
  let hash = (baseSeed + seasonIndex * 7919) >>> 0;
  for (let i = 0; i < competitionId.length; i++) {
    hash = (Math.imul(hash, 31) + competitionId.charCodeAt(i)) >>> 0;
  }
  return hash >>> 0;
}

export interface RunSeasonsInput {
  world: World;
  seasons: number;
  baseSeed: number;
  seasonStartDate: string;
}

/**
 * Simula `seasons` temporadas independientes de todas las ligas del
 * mundo, reutilizando las mismas plantillas (sin regeneración de
 * jugadores retirados todavía — eso es de una fase posterior). Cada
 * temporada usa semillas de partido distintas, así que mide si la
 * varianza del propio motor evita que un club domine sistemáticamente.
 */
export function runSeasons({
  world,
  seasons,
  baseSeed,
  seasonStartDate,
}: RunSeasonsInput): SeasonRunResult[] {
  const leagues = world.competitions.filter((c) => c.type === 'league');
  const playersByClub = new Map<EntityId, BasePlayer[]>();
  for (const club of world.clubs) {
    playersByClub.set(club.id, []);
  }
  for (const player of world.players) {
    if (player.clubId) {
      playersByClub.get(player.clubId)?.push(player);
    }
  }

  const results: SeasonRunResult[] = [];
  for (let seasonIndex = 0; seasonIndex < seasons; seasonIndex++) {
    results.push(
      runSeason({ world, playersByClub, leagues, seasonIndex, baseSeed, seasonStartDate })
    );
  }
  return results;
}

interface RunSeasonInput {
  world: World;
  playersByClub: Map<EntityId, BasePlayer[]>;
  leagues: Competition[];
  seasonIndex: number;
  baseSeed: number;
  seasonStartDate: string;
}

function runSeason({
  world,
  playersByClub,
  leagues,
  seasonIndex,
  baseSeed,
  seasonStartDate,
}: RunSeasonInput): SeasonRunResult {
  let totalGoals = 0;
  let totalMatches = 0;
  const championByCompetition = new Map<EntityId, EntityId>();
  const extremeMatches: ExtremeMatch[] = [];
  const anomalousPlayerSeasons: AnomalousPlayerSeason[] = [];

  for (const competition of leagues) {
    const clubs = world.clubs.filter(
      (c) => c.countryCode === competition.countryCode && c.divisionLevel === competition.level
    );
    const rng = new RNG(seedFor(baseSeed, seasonIndex, competition.id));
    const calendar = generateSeasonCalendar({
      competition,
      clubs,
      year: 2026 + seasonIndex,
      seasonStartDate,
      rng,
    });

    const playerGoals = new Map<EntityId, number>();
    const simulatedMatches: Match[] = calendar.matches.map((match) => {
      const homeSquad = playersByClub.get(match.homeTeamId) ?? [];
      const awaySquad = playersByClub.get(match.awayTeamId) ?? [];
      const result = simulateMatch(match, homeSquad, awaySquad, new RNG(match.seed));

      totalGoals += result.result.homeGoals + result.result.awayGoals;
      totalMatches += 1;

      if (
        result.result.homeGoals >= EXTREME_SCORELINE_THRESHOLD ||
        result.result.awayGoals >= EXTREME_SCORELINE_THRESHOLD
      ) {
        extremeMatches.push({
          competitionId: competition.id,
          homeTeamId: match.homeTeamId,
          awayTeamId: match.awayTeamId,
          homeGoals: result.result.homeGoals,
          awayGoals: result.result.awayGoals,
        });
      }

      for (const event of result.events) {
        if (event.type === 'goal' && event.playerId) {
          playerGoals.set(event.playerId, (playerGoals.get(event.playerId) ?? 0) + 1);
        }
      }

      return result;
    });

    const standings = computeStandings(
      simulatedMatches,
      clubs.map((c) => c.id)
    );
    const champion = standings[0];
    if (champion) {
      championByCompetition.set(competition.id, champion.clubId);
    }

    for (const [playerId, goals] of playerGoals) {
      if (goals > ANOMALOUS_PLAYER_GOALS_THRESHOLD) {
        anomalousPlayerSeasons.push({ playerId, competitionId: competition.id, goals });
      }
    }
  }

  return {
    totalGoals,
    totalMatches,
    championByCompetition,
    extremeMatches,
    anomalousPlayerSeasons,
  };
}
