import { useMemo, type JSX } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen, Button, Text } from '@/components';
import { theme } from '@/theme';
import { getLatestSave } from '@/persistence/saves.repository';
import { getProtagonistBySave } from '@/persistence/protagonists.repository';
import { resolveStandings } from '@/world/resolve-standings';

/** Clasificación de la división del club del protagonista, recalculada siempre desde la seed del save. */
export default function StandingsScreen(): JSX.Element {
  const router = useRouter();

  const save = useMemo(() => getLatestSave(), []);
  const protagonist = useMemo(
    () => (save ? getProtagonistBySave(save.id)?.data : undefined),
    [save]
  );

  const resolution = useMemo(() => {
    if (!save || !protagonist) return null;
    return resolveStandings(save.seed, protagonist, save.gameDate);
  }, [save, protagonist]);

  if (!save || !protagonist || !resolution) {
    return (
      <Screen>
        <Text variant="subtitle" style={styles.emptyText}>
          Todavía no hay clasificación que mostrar
        </Text>
        <Button label="Volver" onPress={() => router.replace('/career')} />
      </Screen>
    );
  }

  const { divisionClubs, standings } = resolution;
  const seasonStarted = standings.some((s) => s.played > 0);

  return (
    <Screen style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text variant="subtitle" style={styles.sectionLabel}>
          Clasificación
        </Text>

        {!seasonStarted && (
          <Text variant="body" color="textSecondary">
            La temporada aún no ha empezado.
          </Text>
        )}

        <View style={styles.headerRow}>
          <Text variant="caption" color="textSecondary" style={styles.posCol}>
            #
          </Text>
          <Text variant="caption" color="textSecondary" style={styles.clubCol}>
            Club
          </Text>
          <Text variant="caption" color="textSecondary" style={styles.numCol}>
            PJ
          </Text>
          <Text variant="caption" color="textSecondary" style={styles.numCol}>
            Pts
          </Text>
        </View>

        {standings.map((standing) => {
          const club = divisionClubs.find((c) => c.id === standing.clubId);
          const isMyClub = standing.clubId === protagonist.clubId;
          return (
            <View key={standing.clubId} style={styles.row}>
              <Text
                variant="body"
                color={isMyClub ? 'accent' : 'textPrimary'}
                style={styles.posCol}
              >
                {standing.position}
              </Text>
              <Text
                variant="body"
                color={isMyClub ? 'accent' : 'textPrimary'}
                style={styles.clubCol}
              >
                {club?.shortName ?? '???'}
              </Text>
              <Text
                variant="body"
                color={isMyClub ? 'accent' : 'textPrimary'}
                style={styles.numCol}
              >
                {standing.played}
              </Text>
              <Text
                variant="body"
                color={isMyClub ? 'accent' : 'textPrimary'}
                style={styles.numCol}
              >
                {standing.points}
              </Text>
            </View>
          );
        })}
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
    marginBottom: theme.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: theme.spacing.xs,
  },
  posCol: {
    width: 28,
  },
  clubCol: {
    flex: 1,
  },
  numCol: {
    width: 36,
    textAlign: 'right',
  },
  emptyText: {
    marginBottom: theme.spacing.md,
  },
});
