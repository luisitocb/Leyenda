import {
  RNG,
  addDays,
  applyMatchToBoard,
  applyMatchToSquad,
  applySeasonRollover,
  applyWeeklyTraining,
  availablePlayers,
  closeCoachSeason,
  closeSeason,
  createCoachCareer,
  createWorldState,
  evaluateSeasonForBoard,
  pointsFor,
  recordCoachMatch,
  sackCoach,
  selectCoachXI,
  simulateMatch,
  type MatchOutcome,
} from '@leyenda/engine';
import type { CoachCareer, Tactics, WorldState } from '@leyenda/shared';
import { SEASON_ONE_START_DATE } from '@leyenda/worldgen/src/constants';

import { countries } from '@/content';
import { generateSquadForClub } from '@/world/generate-squad-for-club';
import {
  isSeasonJustEnded,
  resolveDivisionCalendar,
  type ClubSeasonQuery,
} from '@/world/resolve-division-calendar';
import { resolveFinalStandingsByLevel, resolveStandings } from '@/world/resolve-standings';
import { findWeekMatch } from '@/world/resolve-week-match';

import { clubsForActiveSeason, initialSquadFor, objectiveFor } from './coach-world';
import { generateYouthIntake } from './youth';

interface SeasonRun {
  coach: CoachCareer;
  worldState: WorldState;
  matchesPlayed: number;
  sackedMidSeason: boolean;
  date: string;
}

/**
 * Juega una temporada entera como entrenador con las mismas funciones que
 * usan las pantallas (sin SQLite): entrenamiento semanal, partidos con
 * tácticas, directiva y cierre de temporada con ascensos/descensos.
 */
function playCoachSeason(
  seed: number,
  coachIn: CoachCareer,
  worldIn: WorldState,
  startDate: string,
  tactics: Tactics
): SeasonRun {
  let coach: CoachCareer = { ...coachIn, tactics };
  let worldState = worldIn;
  let date = startDate;
  let matchesPlayed = 0;
  let sackedMidSeason = false;

  for (let week = 0; week < 60; week++) {
    const query: ClubSeasonQuery = {
      seed,
      countryCode: 'XA',
      clubId: coach.clubId,
      worldState,
    };
    coach = {
      ...coach,
      squad: applyWeeklyTraining(coach.squad, coach.trainingFocus, date, new RNG(seed + week)),
    };
    const division = resolveDivisionCalendar(query, date, countries)!;

    if (isSeasonJustEnded(division.calendar, date)) {
      const fixedResults = coach.results;
      const standingsByLevel = resolveFinalStandingsByLevel(
        seed,
        'XA',
        worldState,
        division.seasonIndex,
        { fixedResults },
        countries
      );
      worldState = closeSeason(worldState, {
        seasonIndex: division.seasonIndex,
        year: division.calendar.season.year,
        standingsByLevel,
      });
      const finalPosition = resolveStandings(
        query,
        date,
        { fixedResults },
        countries
      )!.standings.find((s) => s.clubId === coach.clubId)!.position;
      const summary = worldState.seasonHistory.find((s) => s.seasonIndex === division.seasonIndex)!;
      const evaluation = evaluateSeasonForBoard(coach, finalPosition);
      coach = closeCoachSeason(
        evaluation.coach,
        {
          seasonIndex: division.seasonIndex,
          year: division.calendar.season.year,
          clubId: coach.clubId,
          divisionLevel: division.myClub.divisionLevel,
          finalPosition,
          objectiveMet: evaluation.objectiveMet,
          champion: finalPosition === 1,
          promoted: summary.promoted.includes(coach.clubId),
          relegated: summary.relegated.includes(coach.clubId),
        },
        evaluation.sacked
      );
      const youth = generateYouthIntake(seed, division.myClub, division.seasonIndex, date);
      coach = {
        ...coach,
        squad: applySeasonRollover(coach.squad, date, youth, new RNG(seed)).squad,
      };
      return { coach, worldState, matchesPlayed, sackedMidSeason, date };
    }

    const scheduled = findWeekMatch(query, date, countries);
    if (scheduled && !sackedMidSeason) {
      const { match, isHome, homeClub, awayClub } = scheduled;
      const side = isHome ? 'home' : 'away';
      const opponentSquad = generateSquadForClub(seed, isHome ? awayClub : homeClub, countries);
      const mine = availablePlayers(coach.squad);
      const simulated = simulateMatch(
        match,
        isHome ? mine : opponentSquad,
        isHome ? opponentSquad : mine,
        new RNG(match.seed),
        isHome ? { homeTactics: coach.tactics } : { awayTactics: coach.tactics }
      );
      const points = pointsFor(simulated.result, isHome);
      const outcome: MatchOutcome = points === 3 ? 'win' : points === 1 ? 'draw' : 'loss';
      const xi = selectCoachXI(coach.clubId, coach.squad, coach.tactics);
      coach = {
        ...coach,
        squad: applyMatchToSquad(
          coach.squad,
          [xi.goalkeeper, ...xi.outfield].map((p) => p.id),
          simulated.events,
          side,
          outcome,
          new RNG(match.seed + 1)
        ),
      };
      coach = recordCoachMatch(coach, match.id, simulated.result, isHome);
      const board = applyMatchToBoard(coach, points, scheduled.divisionClubs.length);
      coach = board.coach;
      matchesPlayed++;
      if (board.verdict === 'sacked') {
        coach = sackCoach(coach);
        sackedMidSeason = true;
      }
    }
    date = addDays(date, 7);
  }
  throw new Error('La temporada no terminó en 60 semanas');
}

function newCoach(seed: number, clubId: string): { coach: CoachCareer; worldState: WorldState } {
  const worldState = createWorldState('XA');
  const clubs = clubsForActiveSeason({ seed, gameDate: SEASON_ONE_START_DATE }, worldState);
  const club = clubs.find((c) => c.id === clubId)!;
  const coach = createCoachCareer({
    id: 'coach',
    clubId,
    legacyScore: 2500,
    squad: initialSquadFor(seed, club, SEASON_ONE_START_DATE),
    objective: objectiveFor(club, clubs, 0, 'realistic'),
    ambition: 'realistic',
  });
  return { coach, worldState };
}

describe('temporada completa como entrenador (criterio de salida de Fase 4)', () => {
  it('se juega de principio a fin y deja historial, clasificación y plantilla coherentes', () => {
    const seed = 42;
    const { coach, worldState } = newCoach(seed, 'club-XA-1-7');
    const run = playCoachSeason(seed, coach, worldState, SEASON_ONE_START_DATE, coach.tactics);

    if (!run.sackedMidSeason) {
      // 14 clubes → 26 jornadas, todas jugadas por el entrenador.
      expect(run.matchesPlayed).toBe(26);
      expect(run.coach.stats.matches).toBe(26);
    }
    expect(run.coach.history).toHaveLength(1);
    expect(run.worldState.seasonHistory).toHaveLength(1);
    expect(run.coach.results).toEqual({});
    expect(run.coach.squad.length).toBeGreaterThanOrEqual(22);
    expect(run.coach.squad.length).toBeLessThanOrEqual(30);
    expect(run.coach.squad.some((p) => p.id.startsWith('youth-'))).toBe(true);
    expect(run.coach.reputation).toBeGreaterThanOrEqual(1);
    expect(run.coach.reputation).toBeLessThanOrEqual(20);
  });

  it('la clasificación usa los resultados que jugó el entrenador', () => {
    const seed = 7;
    const { coach, worldState } = newCoach(seed, 'club-XA-2-3');
    const run = playCoachSeason(seed, coach, worldState, SEASON_ONE_START_DATE, {
      formation: '4-3-3',
      mentality: 'attacking',
    });
    const record = run.coach.history[0]!;
    const summary = run.worldState.seasonHistory[0]!;
    if (record.finalPosition <= 2) expect(summary.promoted).toContain('club-XA-2-3');
    expect(record.champion).toBe(summary.championsByDivision[2] === 'club-XA-2-3');
  });

  it('la directiva no despide a la mayoría de entrenadores con objetivo realista (balance)', () => {
    let sackings = 0;
    let objectivesMet = 0;
    const runs = 8;
    for (let i = 0; i < runs; i++) {
      const seed = 100 + i;
      const clubId = `club-XA-${(i % 2) + 1}-${(i % 10) + 1}`;
      const { coach, worldState } = newCoach(seed, clubId);
      const run = playCoachSeason(seed, coach, worldState, SEASON_ONE_START_DATE, coach.tactics);
      if (run.coach.stats.sackings > 0) sackings++;
      if (run.coach.history[0]?.objectiveMet) objectivesMet++;
    }
    // Sin hacer nada especial (tácticas por defecto), ser despedido debe ser
    // la excepción y cumplir el objetivo, algo habitual pero no garantizado.
    expect(sackings).toBeLessThanOrEqual(runs / 2);
    expect(objectivesMet).toBeGreaterThanOrEqual(1);
  });
});
