import type { World } from '@leyenda/worldgen';

import {
  TITLE_DOMINANCE_THRESHOLD,
  type BalanceReport,
  type SeasonRunResult,
  type TitleDominance,
} from './types';

/** Agrega los resultados de todas las temporadas simuladas en un informe. */
export function aggregateReport(results: SeasonRunResult[], world: World): BalanceReport {
  const seasonsSimulated = results.length;
  const totalMatches = results.reduce((sum, r) => sum + r.totalMatches, 0);
  const totalGoals = results.reduce((sum, r) => sum + r.totalGoals, 0);
  const averageGoalsPerMatch = totalMatches > 0 ? totalGoals / totalMatches : 0;

  const titleCounts = new Map<string, number>();
  const competitionSeasonCounts = new Map<string, number>();

  for (const result of results) {
    for (const [competitionId, clubId] of result.championByCompetition) {
      const key = `${competitionId}|${clubId}`;
      titleCounts.set(key, (titleCounts.get(key) ?? 0) + 1);
      competitionSeasonCounts.set(
        competitionId,
        (competitionSeasonCounts.get(competitionId) ?? 0) + 1
      );
    }
  }

  const clubById = new Map(world.clubs.map((c) => [c.id, c]));
  const dominantClubs: TitleDominance[] = [];

  for (const [key, titles] of titleCounts) {
    const separatorIndex = key.indexOf('|');
    const competitionId = key.slice(0, separatorIndex);
    const clubId = key.slice(separatorIndex + 1);
    const totalSeasons = competitionSeasonCounts.get(competitionId) ?? seasonsSimulated;
    const share = totalSeasons > 0 ? titles / totalSeasons : 0;

    if (share > TITLE_DOMINANCE_THRESHOLD) {
      const club = clubById.get(clubId);
      dominantClubs.push({
        competitionId,
        clubId,
        clubName: club?.name ?? clubId,
        titles,
        totalSeasons,
        share,
      });
    }
  }

  dominantClubs.sort((a, b) => b.share - a.share);

  return {
    seasonsSimulated,
    totalMatches,
    averageGoalsPerMatch,
    dominantClubs,
    extremeMatches: results.flatMap((r) => r.extremeMatches),
    anomalousPlayerSeasons: results.flatMap((r) => r.anomalousPlayerSeasons),
  };
}
