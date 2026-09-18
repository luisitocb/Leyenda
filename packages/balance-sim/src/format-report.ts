import { TARGET_GOALS_PER_MATCH, type BalanceReport } from './types';

const MAX_LISTED_ANOMALIES = 10;

/** Formatea el informe siguiendo el estilo de .claude/agents/balance-analyst.md. */
export function formatReport(report: BalanceReport): string {
  const lines: string[] = [];
  const goalsInRange =
    report.averageGoalsPerMatch >= TARGET_GOALS_PER_MATCH.min &&
    report.averageGoalsPerMatch <= TARGET_GOALS_PER_MATCH.max;

  lines.push('=== BALANCE SIMULATION REPORT ===', '');
  lines.push(`Temporadas simuladas: ${report.seasonsSimulated}`);
  lines.push(`Partidos simulados: ${report.totalMatches}`, '');

  lines.push('RESULTADOS GLOBALES:');
  lines.push(
    `- Media de goles/partido: ${report.averageGoalsPerMatch.toFixed(2)} ${goalsInRange ? '✅' : '⚠️'} (objetivo GDD §16: ${TARGET_GOALS_PER_MATCH.min}-${TARGET_GOALS_PER_MATCH.max})`
  );
  lines.push('');

  lines.push('DISTRIBUCIÓN DE TÍTULOS:');
  const LOW_SAMPLE_SEASONS_THRESHOLD = 50;
  if (report.seasonsSimulated < LOW_SAMPLE_SEASONS_THRESHOLD) {
    lines.push(
      `  (con solo ${report.seasonsSimulated} temporadas la dominancia es poco fiable estadísticamente — el objetivo del 40% del GDD §16 está pensado para 50 temporadas; usa \`pnpm balance\` sin --quick para un chequeo real)`
    );
  }
  if (report.dominantClubs.length === 0) {
    lines.push('- Ningún club supera el 40% de títulos en ninguna liga ✅');
  } else {
    for (const d of report.dominantClubs) {
      lines.push(
        `- ${d.clubName} ganó ${(d.share * 100).toFixed(0)}% de las temporadas de ${d.competitionId} (${d.titles}/${d.totalSeasons}) ❌`
      );
    }
  }
  lines.push('');

  lines.push('ANOMALÍAS DETECTADAS:');
  if (report.extremeMatches.length === 0 && report.anomalousPlayerSeasons.length === 0) {
    lines.push('- Ninguna detectada ✅');
  } else {
    for (const m of report.extremeMatches.slice(0, MAX_LISTED_ANOMALIES)) {
      lines.push(
        `- Marcador extremo en ${m.competitionId}: ${m.homeTeamId} ${m.homeGoals}-${m.awayGoals} ${m.awayTeamId} ⚠️`
      );
    }
    if (report.extremeMatches.length > MAX_LISTED_ANOMALIES) {
      lines.push(`  ... y ${report.extremeMatches.length - MAX_LISTED_ANOMALIES} más`);
    }
    for (const p of report.anomalousPlayerSeasons.slice(0, MAX_LISTED_ANOMALIES)) {
      lines.push(
        `- Jugador ${p.playerId} marcó ${p.goals} goles en una temporada de ${p.competitionId} ⚠️`
      );
    }
    if (report.anomalousPlayerSeasons.length > MAX_LISTED_ANOMALIES) {
      lines.push(`  ... y ${report.anomalousPlayerSeasons.length - MAX_LISTED_ANOMALIES} más`);
    }
  }
  lines.push('');

  const recommendations: string[] = [];
  if (!goalsInRange) {
    const direction = report.averageGoalsPerMatch > TARGET_GOALS_PER_MATCH.max ? 'bajar' : 'subir';
    recommendations.push(
      `Media de goles ${report.averageGoalsPerMatch.toFixed(2)} fuera de [${TARGET_GOALS_PER_MATCH.min}, ${TARGET_GOALS_PER_MATCH.max}] → considera ${direction} baseChancePerChunk/baseConversion en packages/engine/src/match/types.ts (MATCH_TUNING).`
    );
  }
  if (report.dominantClubs.length > 0) {
    recommendations.push(
      'Hay clubes dominando ligas por encima del 40% → revisar la dispersión de reputación por país en worldgen o la ventaja de campo/pesos de zona en MATCH_TUNING.'
    );
  }
  if (recommendations.length === 0) {
    recommendations.push('Ninguna: los números están dentro de los objetivos del GDD §16.');
  }

  lines.push('RECOMENDACIONES:');
  recommendations.forEach((r, i) => lines.push(`${i + 1}. ${r}`));
  lines.push('');

  lines.push('NOTA DE ALCANCE:');
  lines.push(
    '- Esta simulación mide temporadas de liga (calendario + motor de partidos), no carreras de jugador con bots de estilo (profesional/fiestero/aleatorio) — eso depende de packages/engine/src/career/, que todavía no existe (Fase 2). Los objetivos del GDD §16 sobre títulos por carrera y edad de retirada no se pueden validar todavía.'
  );

  return lines.join('\n');
}
