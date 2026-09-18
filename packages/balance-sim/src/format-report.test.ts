import { describe, expect, it } from 'vitest';

import { formatReport } from './format-report';
import type { BalanceReport } from './types';

function buildReport(overrides: Partial<BalanceReport> = {}): BalanceReport {
  return {
    seasonsSimulated: 5,
    totalMatches: 100,
    averageGoalsPerMatch: 2.6,
    dominantClubs: [],
    extremeMatches: [],
    anomalousPlayerSeasons: [],
    ...overrides,
  };
}

describe('formatReport', () => {
  it('incluye las secciones esperadas', () => {
    const text = formatReport(buildReport());
    expect(text).toContain('RESULTADOS GLOBALES:');
    expect(text).toContain('DISTRIBUCIÓN DE TÍTULOS:');
    expect(text).toContain('ANOMALÍAS DETECTADAS:');
    expect(text).toContain('RECOMENDACIONES:');
    expect(text).toContain('NOTA DE ALCANCE:');
  });

  it('marca ✅ cuando la media de goles está en el objetivo', () => {
    const text = formatReport(buildReport({ averageGoalsPerMatch: 2.6 }));
    expect(text).toMatch(/2\.60 ✅/);
  });

  it('marca ⚠️ y recomienda bajar cuando la media de goles está por encima del objetivo', () => {
    const text = formatReport(buildReport({ averageGoalsPerMatch: 2.99 }));
    expect(text).toMatch(/2\.99 ⚠️/);
    expect(text).toContain('considera bajar');
  });

  it('marca ❌ para clubes dominantes', () => {
    const text = formatReport(
      buildReport({
        dominantClubs: [
          {
            competitionId: 'comp-1',
            clubId: 'A',
            clubName: 'Club A',
            titles: 21,
            totalSeasons: 50,
            share: 0.42,
          },
        ],
      })
    );
    expect(text).toContain('Club A');
    expect(text).toMatch(/42% .* ❌/);
  });

  it('lista partidos y jugadores anómalos', () => {
    const text = formatReport(
      buildReport({
        extremeMatches: [
          { competitionId: 'comp-1', homeTeamId: 'A', awayTeamId: 'B', homeGoals: 9, awayGoals: 0 },
        ],
        anomalousPlayerSeasons: [{ playerId: 'p1', competitionId: 'comp-1', goals: 45 }],
      })
    );
    expect(text).toContain('Marcador extremo');
    expect(text).toContain('45 goles');
  });
});
