import { useCallback, useState, type JSX } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { BOARD_TUNING, addDays, calculateAge, resignCoach } from '@leyenda/engine';

import { Screen, Button, Text, StatRow } from '@/components';
import { theme } from '@/theme';
import { FORMATION_LABELS, MENTALITY_LABELS, OBJECTIVE_LABELS } from '@/labels';
import { updateCoach } from '@/persistence/coaches.repository';
import { coachSeasonQuery, loadCoachContext, type CoachContext } from '@/coach/coach-context';
import { generateClubsForCountry } from '@/world/generate-clubs-for-country';
import { resolveStandings } from '@/world/resolve-standings';
import { findWeekMatch } from '@/world/resolve-week-match';

const LOOKAHEAD_WEEKS = 12;

function confidenceColor(confidence: number): 'accent' | 'error' | undefined {
  if (confidence < BOARD_TUNING.ultimatumThreshold) return 'error';
  if (confidence >= 60) return 'accent';
  return undefined;
}

/** Panel del Modo Entrenador (GDD §6): club, directiva, próximo partido y accesos. */
export default function CoachCareerScreen(): JSX.Element {
  const router = useRouter();
  const [context, setContext] = useState<CoachContext | null>(() => loadCoachContext());

  // Recargar al volver de otras pantallas (semana, partido, tácticas...).
  useFocusEffect(
    useCallback(() => {
      setContext(loadCoachContext());
    }, [])
  );

  if (!context) {
    return (
      <Screen>
        <Text variant="subtitle" style={styles.emptyText}>
          Todavía no tienes ninguna carrera de entrenador
        </Text>
        <Button label="Menú principal" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  const { save, coach, protagonist } = context;
  const clubs = generateClubsForCountry(save.seed, context.worldState.countryCode);
  const clubName = (id: string): string => clubs.find((c) => c.id === id)?.name ?? id;
  const age = calculateAge(protagonist.dateOfBirth, save.gameDate);

  const handleRetire = (): void => {
    Alert.alert('Retirarte', '¿Quieres poner fin a tu vida deportiva?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Retirarme', style: 'destructive', onPress: () => router.replace('/life-end') },
    ]);
  };

  if (coach.status !== 'employed') {
    return (
      <Screen style={styles.screen}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Text variant="subtitle">
            {protagonist.firstName} {protagonist.lastName}
          </Text>
          <Text variant="body" color="error" style={styles.sectionLabel}>
            Sin club. Tu etapa en {clubName(coach.clubId)} ha terminado.
          </Text>
          <StatRow label="Reputación" value={`${coach.reputation}/20`} />
          <StatRow label="Edad" value={age} />
          <Button label="Buscar trabajo" onPress={() => router.replace('/coach-job-offers')} />
          <Button label="Retirarte" onPress={handleRetire} />
        </ScrollView>
      </Screen>
    );
  }

  const query = coachSeasonQuery(context);
  const standings = resolveStandings(query, save.gameDate, { fixedResults: coach.results });
  const myStanding = standings?.standings.find((s) => s.clubId === coach.clubId);
  const seasonStarted = standings?.standings.some((s) => s.played > 0) ?? false;

  let nextMatch: ReturnType<typeof findWeekMatch> = null;
  for (let week = 0; week < LOOKAHEAD_WEEKS && !nextMatch; week++) {
    nextMatch = findWeekMatch(query, addDays(save.gameDate, week * 7));
  }
  const injured = coach.squad.filter((p) => p.injuryWeeks > 0).length;

  const handleResign = (): void => {
    Alert.alert('Dimitir', '¿Seguro que quieres dejar el club?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Dimitir',
        style: 'destructive',
        onPress: () => {
          updateCoach(context.coachRowId, resignCoach(coach));
          setContext(loadCoachContext());
        },
      },
    ]);
  };

  return (
    <Screen style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text variant="subtitle">
          Míster {protagonist.firstName} {protagonist.lastName}
        </Text>
        <Text variant="body" color="accent" style={styles.sectionLabel}>
          {clubName(coach.clubId)}
        </Text>
        <Text variant="caption">Semana del {save.gameDate}</Text>

        {coach.ultimatumGiven && (
          <Text variant="body" color="warning" style={styles.sectionLabel}>
            Ultimátum de la directiva: necesitas resultados ya o te despedirán.
          </Text>
        )}

        <View style={styles.block}>
          {coach.objective && (
            <StatRow
              label="Objetivo"
              value={`${OBJECTIVE_LABELS[coach.objective.kind]} (≤ ${coach.objective.targetPosition}º)`}
            />
          )}
          <StatRow
            label="Confianza de la directiva"
            value={`${Math.round(coach.boardConfidence)}/100`}
            valueColor={confidenceColor(coach.boardConfidence)}
          />
          {myStanding && (
            <StatRow
              label="Clasificación"
              value={
                seasonStarted
                  ? `${myStanding.position}º · ${myStanding.points} pts`
                  : 'La liga no ha empezado'
              }
            />
          )}
          <StatRow label="Reputación" value={`${coach.reputation}/20`} />
          <StatRow
            label="Tácticas"
            value={`${coach.tactics.formation} · ${MENTALITY_LABELS[coach.tactics.mentality]}`}
          />
          <StatRow
            label="Lesionados"
            value={injured}
            valueColor={injured > 0 ? 'error' : undefined}
          />
        </View>

        {nextMatch ? (
          <Text variant="body" style={styles.sectionLabel}>
            Próximo partido ({nextMatch.match.date}):{' '}
            {nextMatch.isHome
              ? `${nextMatch.homeClub.name} – ${nextMatch.awayClub.name} (en casa)`
              : `${nextMatch.homeClub.name} – ${nextMatch.awayClub.name} (fuera)`}
          </Text>
        ) : (
          <Text variant="body" color="textSecondary" style={styles.sectionLabel}>
            Pretemporada: no hay partidos en las próximas semanas.
          </Text>
        )}

        <Button label="Semana" onPress={() => router.push('/coach-week')} />
        <Button label="Plantilla" onPress={() => router.push('/coach-squad')} />
        <Button
          label={`Tácticas (${FORMATION_LABELS[coach.tactics.formation]})`}
          onPress={() => router.push('/coach-tactics')}
        />
        <Button label="Clasificación" onPress={() => router.push('/standings')} />
        <Button label="Historial" onPress={() => router.push('/coach-history')} />
        <Button label="Dimitir" onPress={handleResign} />
        <Button label="Retirarte" onPress={handleRetire} />
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
  block: {
    marginVertical: theme.spacing.md,
  },
  sectionLabel: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    marginBottom: theme.spacing.md,
  },
});
