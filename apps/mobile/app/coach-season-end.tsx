import { useMemo, type JSX } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen, Button, Text, StatRow } from '@/components';
import { theme } from '@/theme';
import { loadCoachContext } from '@/coach/coach-context';
import { generateClubsForCountry } from '@/world/generate-clubs-for-country';

/** Fin de temporada del entrenador (GDD §6.1): clasificación, objetivo y veredicto de la directiva. */
export default function CoachSeasonEndScreen(): JSX.Element {
  const router = useRouter();
  const context = useMemo(() => loadCoachContext(), []);
  const record = context?.coach.history[context.coach.history.length - 1];

  if (!context || !record) {
    return (
      <Screen>
        <Text variant="subtitle" style={styles.emptyText}>
          Todavía no hay temporada que cerrar
        </Text>
        <Button label="Volver" onPress={() => router.replace('/coach-career')} />
      </Screen>
    );
  }

  const { coach, worldState, save } = context;
  const clubs = generateClubsForCountry(save.seed, worldState.countryCode);
  const clubName = (id: string | undefined): string => clubs.find((c) => c.id === id)?.name ?? '—';
  const summary = worldState.seasonHistory.find((s) => s.seasonIndex === record.seasonIndex);
  const sacked = coach.status !== 'employed';

  return (
    <Screen style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text variant="subtitle">Fin de la temporada {record.year}</Text>
        <Text variant="body" color="accent" style={styles.sectionLabel}>
          {clubName(record.clubId)}
        </Text>
        {record.champion && (
          <Text variant="subtitle" color="accent">
            ¡Campeones de liga!
          </Text>
        )}
        {record.promoted && (
          <Text variant="body" color="accent">
            ¡Ascenso de división!
          </Text>
        )}
        {record.relegated && (
          <Text variant="body" color="error">
            El equipo desciende de división.
          </Text>
        )}

        <StatRow label="Puesto final" value={`${record.finalPosition}º`} />
        <StatRow
          label="Objetivo de la directiva"
          value={record.objectiveMet ? 'Cumplido' : 'No cumplido'}
          valueColor={record.objectiveMet ? 'accent' : 'error'}
        />
        <StatRow label="Reputación" value={`${coach.reputation}/20`} />
        <StatRow
          label="Confianza de la directiva"
          value={`${Math.round(coach.boardConfidence)}/100`}
        />

        {summary && (
          <>
            <Text variant="subtitle" style={styles.sectionLabel}>
              Campeones
            </Text>
            {Object.entries(summary.championsByDivision).map(([level, clubId]) => (
              <StatRow key={level} label={`División ${level}`} value={clubName(clubId)} />
            ))}
          </>
        )}

        <Text variant="body" color={sacked ? 'error' : 'textSecondary'} style={styles.sectionLabel}>
          {sacked
            ? 'La directiva no renueva su confianza en ti: estás despedido.'
            : 'La directiva sigue contando contigo. Llegan juveniles de la cantera y empieza la pretemporada.'}
        </Text>
        <Button label="Continuar" onPress={() => router.replace('/coach-career')} />
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
  sectionLabel: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  emptyText: {
    marginBottom: theme.spacing.md,
  },
});
