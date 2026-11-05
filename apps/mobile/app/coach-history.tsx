import { useMemo, type JSX } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

import { calculateCoachLegacyScore } from '@leyenda/engine';

import { Screen, Button, Text, StatRow } from '@/components';
import { theme } from '@/theme';
import { loadCoachContext } from '@/coach/coach-context';
import { generateClubsForCountry } from '@/world/generate-clubs-for-country';

/** Historial del entrenador: temporadas, títulos y Legado como míster. */
export default function CoachHistoryScreen(): JSX.Element {
  const router = useRouter();
  const context = useMemo(() => loadCoachContext(), []);

  if (!context) {
    return (
      <Screen>
        <Text variant="subtitle" style={styles.emptyText}>
          Todavía no tienes historial como entrenador
        </Text>
        <Button label="Volver" onPress={() => router.replace('/coach-career')} />
      </Screen>
    );
  }

  const { coach, save, worldState } = context;
  const clubs = generateClubsForCountry(save.seed, worldState.countryCode);
  const clubName = (id: string): string => clubs.find((c) => c.id === id)?.shortName ?? id;

  return (
    <Screen style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text variant="subtitle">Carrera de entrenador</Text>
        <View style={styles.block}>
          <StatRow label="Partidos" value={coach.stats.matches} />
          <StatRow
            label="Victorias / Empates / Derrotas"
            value={`${coach.stats.wins} / ${coach.stats.draws} / ${coach.stats.losses}`}
          />
          <StatRow label="Ligas ganadas" value={coach.stats.titles} />
          <StatRow label="Ascensos" value={coach.stats.promotions} />
          <StatRow label="Despidos" value={coach.stats.sackings} />
          <StatRow label="Legado como entrenador" value={calculateCoachLegacyScore(coach)} />
        </View>

        <Text variant="subtitle" style={styles.sectionLabel}>
          Temporadas
        </Text>
        {coach.history.length === 0 && (
          <Text variant="body" color="textSecondary">
            Aún no has terminado ninguna temporada.
          </Text>
        )}
        {[...coach.history].reverse().map((season) => (
          <StatRow
            key={`${season.seasonIndex}-${season.clubId}`}
            label={`${season.year} · ${clubName(season.clubId)} (Div. ${season.divisionLevel})`}
            value={`${season.finalPosition}º${season.champion ? ' 🏆' : ''}${season.promoted ? ' ↑' : ''}${season.relegated ? ' ↓' : ''}`}
            valueColor={season.objectiveMet ? 'accent' : 'error'}
          />
        ))}
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
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  emptyText: {
    marginBottom: theme.spacing.md,
  },
});
