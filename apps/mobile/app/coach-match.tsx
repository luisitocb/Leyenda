import { useMemo, useState, type JSX } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import type { BasePlayer, LiveOutcome, LiveSituation, MatchEvent } from '@leyenda/shared';
import {
  RNG,
  addLiveGoal,
  applyMatchToBoard,
  applyMatchToSquad,
  autoResolveLiveChance,
  availablePlayers,
  pickLivePlayType,
  pickLiveShooter,
  pointsFor,
  recordCoachMatch,
  sackCoach,
  selectCoachXI,
  selectStartingXI,
  simulateMatch,
  type MatchOutcome,
} from '@leyenda/engine';

import { Screen, Button, Text } from '@/components';
import { theme } from '@/theme';
import { countries } from '@/content';
import { ChanceMinigame, LivePlayResultOverlay, PenaltyMinigame } from '@/features/live-play';
import { updateCoach } from '@/persistence/coaches.repository';
import { coachSeasonQuery, loadCoachContext } from '@/coach/coach-context';
import { generateSquadForClub } from '@/world/generate-squad-for-club';
import { findWeekMatch } from '@/world/resolve-week-match';

/**
 * Offsets de seed locales a esta pantalla, sobre la seed del partido (ver
 * `generateSeasonCalendar`): tipo de Jugada en Vivo, la jugada en sí, la
 * ocasión del rival y las lesiones del partido.
 */
const LIVE_TYPE_SEED_OFFSET = 101;
const LIVE_SITUATION_SEED_OFFSET = 102;
const RIVAL_LIVE_SEED_OFFSET = 103;
const SQUAD_SEED_OFFSET = 104;
const LIVE_PLAY_MINUTE = 75;
const PRESSURE_NORMAL = 50;
const PRESSURE_ULTIMATUM = 80;

type Phase = 'live' | 'result';

/**
 * Partido como entrenador (GDD §6.6, §7): el motor simula con tus tácticas
 * y tu plantilla; una Jugada en Vivo por equipo (la tuya la juegas con el
 * dedo o la resuelves en automático, GDD §7B.2) y después el resultado,
 * con sus consecuencias en plantilla y directiva.
 */
export default function CoachMatchScreen(): JSX.Element {
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date: string }>();
  const context = useMemo(() => loadCoachContext(), []);
  const [phase, setPhase] = useState<Phase>('live');
  const [playing, setPlaying] = useState(false);
  const [myLive, setMyLive] = useState<LiveOutcome | null>(null);

  const setup = useMemo(() => {
    if (!context || !date || context.coach.status !== 'employed') return null;
    const scheduled = findWeekMatch(coachSeasonQuery(context), date);
    if (!scheduled) return null;
    const { match, isHome, homeClub, awayClub } = scheduled;
    const side: 'home' | 'away' = isHome ? 'home' : 'away';
    const opponent = isHome ? awayClub : homeClub;
    const opponentSquad = generateSquadForClub(context.save.seed, opponent, countries);
    const mySquad = availablePlayers(context.coach.squad);
    const simulated = simulateMatch(
      match,
      isHome ? mySquad : opponentSquad,
      isHome ? opponentSquad : mySquad,
      new RNG(match.seed),
      isHome ? { homeTactics: context.coach.tactics } : { awayTactics: context.coach.tactics }
    );
    const myXI = selectCoachXI(context.coach.clubId, context.coach.squad, context.coach.tactics);
    const rivalXI = selectStartingXI(opponent.id, opponentSquad);
    const shooter = pickLiveShooter(myXI.outfield);
    const rivalShooter = pickLiveShooter(rivalXI.outfield);
    const rivalLive = rivalShooter
      ? autoResolveLiveChance(
          rivalShooter,
          myXI.goalkeeper,
          new RNG(match.seed + RIVAL_LIVE_SEED_OFFSET)
        )
      : null;
    const situation: LiveSituation | null = shooter
      ? {
          type: pickLivePlayType(new RNG(match.seed + LIVE_TYPE_SEED_OFFSET)),
          minute: LIVE_PLAY_MINUTE,
          playerId: shooter.id,
          team: side,
          seed: match.seed + LIVE_SITUATION_SEED_OFFSET,
          pressure: context.coach.ultimatumGiven ? PRESSURE_ULTIMATUM : PRESSURE_NORMAL,
          shooterShooting: 'shooting' in shooter.technical ? shooter.technical.shooting : 0,
          shooterComposure: shooter.mental.composure,
        }
      : null;
    const names = new Map<string, BasePlayer>(
      [...context.coach.squad, ...opponentSquad].map((p) => [p.id, p])
    );
    return {
      scheduled,
      side,
      simulated,
      myXI,
      rivalXI,
      shooter,
      rivalShooter,
      rivalLive,
      situation,
      names,
    };
  }, [context, date]);

  const outcome = useMemo(() => {
    if (!context || !setup || phase !== 'result') return null;
    const { scheduled, side, simulated, myXI, shooter, rivalShooter, rivalLive } = setup;
    const rivalSide = side === 'home' ? 'away' : 'home';
    let result = simulated.result;
    const liveEvents: MatchEvent[] = [];
    if (myLive?.type === 'goal' && shooter) {
      result = addLiveGoal(result, side);
      liveEvents.push({ minute: LIVE_PLAY_MINUTE, type: 'goal', playerId: shooter.id, team: side });
    }
    if (rivalLive?.type === 'goal' && rivalShooter) {
      result = addLiveGoal(result, rivalSide);
      liveEvents.push({
        minute: LIVE_PLAY_MINUTE + 5,
        type: 'goal',
        playerId: rivalShooter.id,
        team: rivalSide,
      });
    }
    const events = [...simulated.events, ...liveEvents].sort((a, b) => a.minute - b.minute);
    const points = pointsFor(result, scheduled.isHome);
    const matchOutcome: MatchOutcome = points === 3 ? 'win' : points === 1 ? 'draw' : 'loss';

    const squad = applyMatchToSquad(
      context.coach.squad,
      [myXI.goalkeeper, ...myXI.outfield].map((p) => p.id),
      events,
      side,
      matchOutcome,
      new RNG(scheduled.match.seed + SQUAD_SEED_OFFSET)
    );
    const recorded = recordCoachMatch(
      { ...context.coach, squad },
      scheduled.match.id,
      result,
      scheduled.isHome
    );
    const board = applyMatchToBoard(recorded, points, scheduled.divisionClubs.length);
    return { result, events, matchOutcome, board };
  }, [context, setup, phase, myLive]);

  if (!context || !setup || !date) {
    return (
      <Screen>
        <Text variant="subtitle" style={styles.emptyText}>
          No hay partido que mostrar
        </Text>
        <Button label="Volver" onPress={() => router.replace('/coach-career')} />
      </Screen>
    );
  }

  const { scheduled, situation, shooter, rivalXI } = setup;
  const title = `${scheduled.homeClub.name} – ${scheduled.awayClub.name}`;

  const resolveAuto = (): void => {
    if (!shooter) {
      setPhase('result');
      return;
    }
    setMyLive(
      autoResolveLiveChance(
        shooter,
        rivalXI.goalkeeper,
        new RNG(scheduled.match.seed + LIVE_SITUATION_SEED_OFFSET)
      )
    );
  };

  const handleFinish = (): void => {
    if (!outcome) return;
    const { board } = outcome;
    const coach = board.verdict === 'sacked' ? sackCoach(board.coach) : board.coach;
    updateCoach(context.coachRowId, coach);
    router.replace('/coach-career');
  };

  if (phase === 'live') {
    return (
      <Screen style={styles.screen}>
        <Text variant="subtitle">{title}</Text>
        {!myLive && !playing && (
          <View style={styles.card}>
            <Text variant="body" style={styles.paragraph}>
              Minuto {LIVE_PLAY_MINUTE}: ¡ocasión clara para {shooter?.firstName}{' '}
              {shooter?.lastName}!{' '}
              {situation?.type === 'penalty'
                ? 'Penalti a favor.'
                : 'Se queda solo ante el portero.'}
            </Text>
            <Button label="Jugar la Jugada en Vivo" onPress={() => setPlaying(true)} />
            <Button label="Resolver automáticamente" onPress={resolveAuto} />
          </View>
        )}
        {!myLive &&
          playing &&
          situation &&
          (situation.type === 'penalty' ? (
            <PenaltyMinigame situation={situation} onResult={setMyLive} />
          ) : (
            <ChanceMinigame situation={situation} onResult={setMyLive} />
          ))}
        {myLive && (
          <View style={styles.card}>
            <LivePlayResultOverlay outcome={myLive} />
            <Button label="Ver el resultado" onPress={() => setPhase('result')} />
          </View>
        )}
      </Screen>
    );
  }

  if (!outcome) return <Screen>{null}</Screen>;
  const { result, events, matchOutcome, board } = outcome;
  const goals = events.filter((e) => e.type === 'goal');
  const nameOf = (id: string | undefined): string => {
    const p = id ? setup.names.get(id) : undefined;
    return p ? `${p.firstName} ${p.lastName}` : '';
  };

  return (
    <Screen style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text variant="subtitle">{title}</Text>
        <Text
          variant="title"
          color={matchOutcome === 'win' ? 'accent' : matchOutcome === 'loss' ? 'error' : undefined}
        >
          {result.homeGoals} - {result.awayGoals}
        </Text>
        {goals.map((goal, i) => (
          <Text key={`${goal.minute}-${i}`} variant="body" color="textSecondary">
            {goal.minute}'{' '}
            {goal.team === 'home' ? scheduled.homeClub.shortName : scheduled.awayClub.shortName} ·{' '}
            {nameOf(goal.playerId)}
          </Text>
        ))}
        {events
          .filter((e) => (e.type === 'injury' || e.type === 'red_card') && e.team === setup.side)
          .map((e, i) => (
            <Text key={`incident-${i}`} variant="body" color="error">
              {e.minute}' {e.type === 'injury' ? 'Lesión' : 'Roja'}: {nameOf(e.playerId)}
            </Text>
          ))}

        <Text variant="body" style={styles.paragraph}>
          Confianza de la directiva: {Math.round(board.coach.boardConfidence)}/100
        </Text>
        {board.verdict === 'ultimatum' && (
          <Text variant="body" color="warning" style={styles.paragraph}>
            La directiva te da un ultimátum: o mejoran los resultados o estás fuera.
          </Text>
        )}
        {board.verdict === 'sacked' && (
          <Text variant="body" color="error" style={styles.paragraph}>
            La directiva ha decidido prescindir de ti. Estás despedido.
          </Text>
        )}
        <Button label="Continuar" onPress={handleFinish} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  scroll: {
    width: '100%',
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  card: {
    marginTop: theme.spacing.lg,
  },
  paragraph: {
    marginVertical: theme.spacing.md,
  },
  emptyText: {
    marginBottom: theme.spacing.md,
  },
});
