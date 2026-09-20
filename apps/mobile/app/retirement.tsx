import { useMemo, type JSX } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { calculateLegacyScore } from '@leyenda/engine';

import { Screen, Button, Text } from '@/components';
import { theme } from '@/theme';
import { getLatestSave } from '@/persistence/saves.repository';
import { getProtagonistBySave } from '@/persistence/protagonists.repository';

interface StatRowProps {
  label: string;
  value: string | number;
}

function StatRow({ label, value }: StatRowProps): JSX.Element {
  return (
    <View style={styles.statRow}>
      <Text variant="body" color="textSecondary">
        {label}
      </Text>
      <Text variant="body">{value}</Text>
    </View>
  );
}

/** Fin de carrera y Legado (GDD §5), voluntario o forzado por edad. */
export default function RetirementScreen(): JSX.Element {
  const router = useRouter();

  const save = useMemo(() => getLatestSave(), []);
  const protagonist = useMemo(
    () => (save ? getProtagonistBySave(save.id)?.data : undefined),
    [save]
  );

  if (!save || !protagonist) {
    return (
      <Screen>
        <Text variant="subtitle" style={styles.emptyText}>
          No hay ninguna carrera que retirar
        </Text>
        <Button label="Volver" onPress={() => router.replace('/career')} />
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <View style={styles.card}>
        <Text variant="title">Fin de carrera</Text>
        <Text variant="body" style={styles.text}>
          {protagonist.firstName} {protagonist.lastName} cuelga las botas.
        </Text>

        <Text variant="subtitle" style={styles.sectionLabel}>
          Legado
        </Text>
        <StatRow label="Puntuación" value={calculateLegacyScore(protagonist)} />
        <StatRow label="Partidos jugados" value={protagonist.gamesPlayed} />
        <StatRow label="Goles" value={protagonist.goalsScored} />
        <StatRow label="Asistencias" value={protagonist.assists} />
        <StatRow label="Títulos" value={protagonist.titlesWon.length} />

        <Button label="Nueva carrera" onPress={() => router.replace('/create-character')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  card: {
    marginTop: theme.spacing.lg,
  },
  text: {
    marginBottom: theme.spacing.md,
  },
  sectionLabel: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  emptyText: {
    marginBottom: theme.spacing.md,
  },
});
