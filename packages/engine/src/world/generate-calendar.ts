import type { Club, Competition, Fixture, Match, Season } from '@leyenda/shared';
import { RNG } from '../rng';

import { addDays } from './date-utils';
import type { SeasonCalendar } from './types';

interface UnorderedPair {
  a: Club;
  b: Club;
}

interface Pairing {
  home: Club;
  away: Club;
}

/**
 * Método del círculo (round-robin): dado un array de N clubes (N par),
 * devuelve N-1 rondas de N/2 emparejamientos cada una (sin decidir
 * todavía local/visitante), donde cada club juega contra todos los
 * demás exactamente una vez.
 */
function roundRobinPairs(clubs: Club[]): UnorderedPair[][] {
  const n = clubs.length;
  if (n % 2 !== 0) {
    throw new Error('roundRobinPairs requiere un número par de clubes');
  }

  const fixed = clubs[0]!;
  const rotating = clubs.slice(1);
  const rounds: UnorderedPair[][] = [];

  for (let round = 0; round < n - 1; round++) {
    const current = [fixed, ...rotating];
    const roundPairs: UnorderedPair[] = [];

    for (let i = 0; i < n / 2; i++) {
      roundPairs.push({ a: current[i]!, b: current[n - 1 - i]! });
    }

    rounds.push(roundPairs);
    rotating.unshift(rotating.pop()!);
  }

  return rounds;
}

/**
 * Decide local/visitante ronda a ronda favoreciendo siempre al club con
 * menos partidos como local acumulados hasta el momento — evita rachas
 * largas de forma mucho más robusta que una regla de paridad fija.
 */
function assignHomeAway(rounds: UnorderedPair[][]): Pairing[][] {
  const homeCounts = new Map<string, number>();

  return rounds.map((roundPairs, roundIndex) =>
    roundPairs.map(({ a, b }) => {
      const homeA = homeCounts.get(a.id) ?? 0;
      const homeB = homeCounts.get(b.id) ?? 0;

      let home: Club;
      let away: Club;
      if (homeA < homeB) {
        home = a;
        away = b;
      } else if (homeB < homeA) {
        home = b;
        away = a;
      } else {
        [home, away] = roundIndex % 2 === 0 ? [a, b] : [b, a];
      }

      homeCounts.set(home.id, (homeCounts.get(home.id) ?? 0) + 1);
      return { home, away };
    })
  );
}

export interface GenerateSeasonCalendarInput {
  competition: Competition;
  clubs: Club[];
  year: number;
  seasonStartDate: string;
  rng: RNG;
}

/**
 * Genera el calendario de una liga: temporada + jornadas + partidos sin
 * simular (método del círculo, doble vuelta). Determinista dado
 * (competition, clubs, year, seasonStartDate, seed del rng) — el RNG
 * solo decide el orden inicial de los clubes en el polígono (variedad
 * de calendario entre seeds) y la semilla de cada partido, nunca el
 * algoritmo de rotación en sí.
 */
export function generateSeasonCalendar({
  competition,
  clubs,
  year,
  seasonStartDate,
  rng,
}: GenerateSeasonCalendarInput): SeasonCalendar {
  const orderedClubs = [...clubs].sort((a, b) => a.id.localeCompare(b.id));
  rng.shuffle(orderedClubs);

  const firstLeg = assignHomeAway(roundRobinPairs(orderedClubs));
  const secondLeg = firstLeg.map((round) =>
    round.map(({ home, away }) => ({ home: away, away: home }))
  );
  const allRounds = [...firstLeg, ...secondLeg];

  const season: Season = {
    id: `season-${competition.id}-${year}`,
    competitionId: competition.id,
    year,
    startDate: seasonStartDate,
    endDate: addDays(seasonStartDate, (allRounds.length - 1) * 7),
  };

  const fixtures: Fixture[] = [];
  const matches: Match[] = [];

  allRounds.forEach((pairings, roundIndex) => {
    const round = roundIndex + 1;
    const date = addDays(seasonStartDate, roundIndex * 7);
    const matchIds: string[] = [];

    for (const { home, away } of pairings) {
      const matchId = `match-${competition.id}-${year}-${round}-${home.id}-${away.id}`;
      matches.push({
        id: matchId,
        homeTeamId: home.id,
        awayTeamId: away.id,
        competitionId: competition.id,
        date,
        result: { homeGoals: 0, awayGoals: 0 },
        events: [],
        seed: rng.nextInt(0, 0xffffffff),
        simulated: false,
      });
      matchIds.push(matchId);
    }

    fixtures.push({
      id: `fixture-${competition.id}-${year}-${round}`,
      seasonId: season.id,
      round,
      date,
      matches: matchIds,
    });
  });

  return { season, fixtures, matches };
}
