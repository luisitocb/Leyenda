import {
  RNG,
  COACH_RETIREMENT_AGE,
  advanceWeek,
  applySeasonRollover,
  applyWeeklyTraining,
  calculateAge,
  closeCoachSeason,
  evaluateSeasonForBoard,
  pressContextFor,
  selectPressConference,
} from '@leyenda/engine';
import type { CoachCareer, CoachSeasonRecord, ISODate, MatchResult } from '@leyenda/shared';

import { pressConferences } from '@/content';
import { updateCoach } from '@/persistence/coaches.repository';
import { updateSave } from '@/persistence/saves.repository';
import { isSeasonJustEnded, resolveDivisionCalendar } from '@/world/resolve-division-calendar';
import { resolveStandings } from '@/world/resolve-standings';
import { findWeekMatch } from '@/world/resolve-week-match';
import { closeSeasonIfNeeded } from '@/world/season-transition';

import { coachSeasonQuery, type CoachContext } from './coach-context';
import { generateYouthIntake } from './youth';

export type CoachWeekRoute =
  | { pathname: '/coach-career' }
  | { pathname: '/coach-match'; params: { date: ISODate } }
  | { pathname: '/coach-press'; params: { date: ISODate; conferenceId: string } }
  | { pathname: '/coach-season-end' }
  | { pathname: '/life-end' };

/** Último resultado del club del entrenador (para el tono de la rueda de prensa). */
function lastResult(
  context: CoachContext,
  date: ISODate
): { result: MatchResult; isHome: boolean } | null {
  const resolved = resolveDivisionCalendar(coachSeasonQuery(context), date);
  if (!resolved) return null;
  const clubId = context.coach.clubId;
  const played = resolved.calendar.matches
    .filter(
      (m) =>
        m.date < date &&
        (m.homeTeamId === clubId || m.awayTeamId === clubId) &&
        context.coach.results[m.id]
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  const last = played[0];
  if (!last) return null;
  return { result: context.coach.results[last.id]!, isHome: last.homeTeamId === clubId };
}

/** Cierra la temporada del entrenador: liga, directiva, reputación y plantilla. */
function closeSeasonForCoach(
  context: CoachContext,
  date: ISODate,
  seasonIndex: number
): CoachCareer {
  const { save, coach } = context;
  const worldState = closeSeasonIfNeeded(save, context.worldState, seasonIndex, {
    fixedResults: coach.results,
  });
  const query = { ...coachSeasonQuery(context), worldState };
  const standings = resolveStandings(query, date, { fixedResults: coach.results });
  const division = resolveDivisionCalendar(query, date);
  const summary = worldState.seasonHistory.find((s) => s.seasonIndex === seasonIndex);
  const finalPosition =
    standings?.standings.find((s) => s.clubId === coach.clubId)?.position ??
    Number.MAX_SAFE_INTEGER;

  const evaluation = evaluateSeasonForBoard(coach, finalPosition);
  const record: CoachSeasonRecord = {
    seasonIndex,
    year: division?.calendar.season.year ?? 0,
    clubId: coach.clubId,
    divisionLevel: division?.myClub.divisionLevel ?? 0,
    finalPosition,
    objectiveMet: evaluation.objectiveMet,
    champion: finalPosition === 1,
    promoted: summary?.promoted.includes(coach.clubId) ?? false,
    relegated: summary?.relegated.includes(coach.clubId) ?? false,
  };
  const closed = closeCoachSeason(evaluation.coach, record, evaluation.sacked);

  if (closed.status !== 'employed' || !division) return closed;
  const youth = generateYouthIntake(save.seed, division.myClub, seasonIndex, date);
  const rollover = applySeasonRollover(
    closed.squad,
    date,
    youth,
    new RNG(save.seed + seasonIndex * 31 + 17)
  );
  return { ...closed, squad: rollover.squad };
}

/**
 * Avanza una semana del Modo Entrenador (GDD §3: la semana es la unidad
 * de tiempo; §6.4 entrenamiento; §6.1 ruedas de prensa y directiva).
 * Persiste el entrenador y la nueva fecha y devuelve adónde ir.
 * `weekSeed` aporta la aleatoriedad de la semana (entrenamiento y prensa).
 */
export function advanceCoachWeek(context: CoachContext, weekSeed: number): CoachWeekRoute {
  const { save, protagonist, coachRowId } = context;
  const date = save.gameDate;
  const nextDate = advanceWeek(date);

  if (calculateAge(protagonist.dateOfBirth, date) >= COACH_RETIREMENT_AGE) {
    return { pathname: '/life-end' };
  }

  let coach: CoachCareer = {
    ...context.coach,
    squad: applyWeeklyTraining(
      context.coach.squad,
      context.coach.trainingFocus,
      date,
      new RNG(weekSeed)
    ),
  };

  const query = coachSeasonQuery({ ...context, coach });
  const division = resolveDivisionCalendar(query, date);
  if (division && isSeasonJustEnded(division.calendar, date)) {
    coach = closeSeasonForCoach({ ...context, coach }, date, division.seasonIndex);
    updateCoach(coachRowId, coach);
    updateSave(save.id, { gameDate: nextDate });
    return { pathname: '/coach-season-end' };
  }

  updateCoach(coachRowId, coach);
  updateSave(save.id, { gameDate: nextDate });

  const scheduled = findWeekMatch(query, date);
  if (!scheduled) return { pathname: '/coach-career' };

  const conference = selectPressConference(
    pressConferences,
    pressContextFor(lastResult({ ...context, coach }, date)),
    new RNG(weekSeed + 1)
  );
  if (conference) {
    return { pathname: '/coach-press', params: { date, conferenceId: conference.id } };
  }
  return { pathname: '/coach-match', params: { date } };
}
