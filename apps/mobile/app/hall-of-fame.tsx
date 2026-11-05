import { useMemo, type JSX } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useRouter } from 'expo-router';

import type { HallOfFameEntry } from '@leyenda/shared';

import { Screen, Button, Text } from '@/components';
import { theme } from '@/theme';
import { countries } from '@/content';
import { listHallOfFame } from '@/persistence/hall-of-fame.repository';

interface EntryRowProps {
  entry: HallOfFameEntry;
  rank: number;
}

function EntryRow({ entry, rank }: EntryRowProps): JSX.Element {
  const country = countries.find((c) => c.code === entry.nationality)?.name ?? entry.nationality;
  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <Text variant="body">
          {rank}. {entry.name}
        </Text>
        <Text variant="body" color="accent">
          {entry.totalScore}
        </Text>
      </View>
      <Text variant="caption" color="textSecondary">
        {country} · Retirado en {entry.finishedOn.slice(0, 4)}
      </Text>
      <Text variant="caption" color="textSecondary">
        Jugador: {entry.player.gamesPlayed} PJ, {entry.player.goals} goles, {entry.player.titles}{' '}
        títulos
        {entry.coach
          ? ` · Entrenador: ${entry.coach.seasons} temporadas, ${entry.coach.titles} ligas`
          : ''}
      </Text>
    </View>
  );
}

/** Salón de la Fama personal (GDD §9, RF-17): todas tus vidas deportivas terminadas. */
export default function HallOfFameScreen(): JSX.Element {
  const router = useRouter();
  const entries = useMemo(() => listHallOfFame(), []);

  return (
    <Screen style={styles.screen}>
      <FlatList
        style={styles.list}
        data={entries}
        keyExtractor={(e) => e.id}
        ListHeaderComponent={
          <Text variant="subtitle" style={styles.header}>
            Salón de la Fama
          </Text>
        }
        ListEmptyComponent={
          <Text variant="body" color="textSecondary" style={styles.header}>
            Todavía no hay ninguna leyenda. Termina una vida deportiva para entrar aquí.
          </Text>
        }
        renderItem={({ item, index }) => <EntryRow entry={item} rank={index + 1} />}
        ListFooterComponent={<Button label="Menú principal" onPress={() => router.replace('/')} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  list: {
    width: '100%',
  },
  header: {
    marginBottom: theme.spacing.md,
  },
  row: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
