import { useMemo, type JSX } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useRouter } from 'expo-router';

import type { Position, SquadPlayer } from '@leyenda/shared';
import { calculateAge } from '@leyenda/engine';

import { Screen, Button, Text } from '@/components';
import { theme } from '@/theme';
import { POSITION_SHORT_LABELS } from '@/labels';
import { loadCoachContext } from '@/coach/coach-context';

const POSITION_ORDER: Position[] = ['GK', 'LB', 'CB', 'RB', 'DMF', 'CMF', 'AMF', 'LW', 'RW', 'CF'];

/**
 * Margen de mejora aproximado (GDD §6.3: el potencial es oculto; los
 * jugadores de tu plantilla se conocen con más precisión, pero no del todo).
 */
function growthHint(player: SquadPlayer, age: number): string {
  const gap = player.potential - player.currentAbility;
  if (age >= 24 || gap <= 2) return '—';
  if (gap >= 15) return '★★★';
  if (gap >= 8) return '★★';
  return '★';
}

interface PlayerRowProps {
  player: SquadPlayer;
  age: number;
}

function PlayerRow({ player, age }: PlayerRowProps): JSX.Element {
  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <Text variant="body">
          {POSITION_SHORT_LABELS[player.position]} · {player.firstName} {player.lastName}
        </Text>
        <Text variant="body" color="accent">
          {player.currentAbility}
        </Text>
      </View>
      <Text variant="caption" color="textSecondary">
        {age} años · Potencial {growthHint(player, age)} · Físico {player.fitness} · Moral{' '}
        {player.morale} · {player.seasonAppearances} PJ · {player.seasonGoals} goles
      </Text>
      {player.injuryWeeks > 0 && (
        <Text variant="caption" color="error">
          Lesionado: {player.injuryWeeks} {player.injuryWeeks === 1 ? 'semana' : 'semanas'}
        </Text>
      )}
    </View>
  );
}

/** Plantilla (GDD §6.2): media, edad, margen de mejora, estado físico y moral. */
export default function CoachSquadScreen(): JSX.Element {
  const router = useRouter();
  const context = useMemo(() => loadCoachContext(), []);

  const players = useMemo(() => {
    if (!context) return [];
    return [...context.coach.squad].sort(
      (a, b) =>
        POSITION_ORDER.indexOf(a.position) - POSITION_ORDER.indexOf(b.position) ||
        b.currentAbility - a.currentAbility
    );
  }, [context]);

  if (!context || context.coach.status !== 'employed') {
    return (
      <Screen>
        <Text variant="subtitle" style={styles.emptyText}>
          No diriges ningún equipo ahora mismo
        </Text>
        <Button label="Volver" onPress={() => router.replace('/coach-career')} />
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <FlatList
        style={styles.list}
        data={players}
        keyExtractor={(p) => p.id}
        ListHeaderComponent={
          <Text variant="subtitle" style={styles.header}>
            Plantilla ({players.length})
          </Text>
        }
        renderItem={({ item }) => (
          <PlayerRow player={item} age={calculateAge(item.dateOfBirth, context.save.gameDate)} />
        )}
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
    marginBottom: theme.spacing.sm,
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
  emptyText: {
    marginBottom: theme.spacing.md,
  },
});
