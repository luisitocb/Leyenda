import { useMemo, useState, type JSX } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import type { ProtagonistPlayer } from '@leyenda/shared';
import {
  RNG,
  breakUp,
  createRandomSeed,
  formalizeRelationship,
  proposeMarriage,
  startDating,
} from '@leyenda/engine';

import { Screen, Button, Text } from '@/components';
import { theme } from '@/theme';
import { getLatestSave } from '@/persistence/saves.repository';
import { getProtagonistBySave, updateProtagonist } from '@/persistence/protagonists.repository';

const STATUS_LABELS: Record<ProtagonistPlayer['relationshipStatus'], string> = {
  single: 'Soltero/a',
  dating: 'Conociéndoos',
  relationship: 'En pareja',
  married: 'Casado/a',
};

/** Progresión de pareja (GDD §4.9): conocer, citas, relación, ruptura, matrimonio. */
export default function RelationshipScreen(): JSX.Element {
  const router = useRouter();

  const save = useMemo(() => getLatestSave(), []);
  const protagonistRow = useMemo(() => (save ? getProtagonistBySave(save.id) : undefined), [save]);
  const [protagonist, setProtagonist] = useState<ProtagonistPlayer | undefined>(
    () => protagonistRow?.data
  );
  const [attemptResult, setAttemptResult] = useState<boolean | null>(null);

  if (!save || !protagonist || !protagonistRow) {
    return (
      <Screen>
        <Text variant="subtitle" style={styles.emptyText}>
          Todavía no tienes ninguna carrera
        </Text>
        <Button label="Nueva carrera" onPress={() => router.push('/create-character')} />
      </Screen>
    );
  }

  const persist = (updated: ProtagonistPlayer): void => {
    updateProtagonist(protagonistRow.id, updated);
    setProtagonist(updated);
  };

  const handleStartDating = (): void => {
    const result = startDating(protagonist, new RNG(createRandomSeed()));
    persist(result.protagonist);
    setAttemptResult(result.success);
  };

  const handleFormalize = (): void => {
    persist(formalizeRelationship(protagonist));
    setAttemptResult(null);
  };

  const handleProposeMarriage = (): void => {
    const result = proposeMarriage(protagonist, new RNG(createRandomSeed()));
    persist(result.protagonist);
    setAttemptResult(result.success);
  };

  const handleBreakUp = (): void => {
    persist(breakUp(protagonist));
    setAttemptResult(null);
  };

  return (
    <Screen style={styles.screen}>
      <View style={styles.card}>
        <Text variant="title">Relación</Text>
        <Text variant="body" style={styles.text}>
          Estado: {STATUS_LABELS[protagonist.relationshipStatus]}
        </Text>
        <Text variant="body" style={styles.text}>
          Relación con tu pareja: {protagonist.relations.partner}
        </Text>

        {attemptResult !== null && (
          <Text variant="body" color={attemptResult ? 'accent' : 'error'} style={styles.text}>
            {attemptResult ? 'Ha salido bien.' : 'No ha salido como esperabas.'}
          </Text>
        )}

        {protagonist.relationshipStatus === 'single' && (
          <Button label="Buscar pareja" onPress={handleStartDating} />
        )}
        {protagonist.relationshipStatus === 'dating' && (
          <>
            <Button label="Formalizar la relación" onPress={handleFormalize} />
            <Button label="Romper" onPress={handleBreakUp} />
          </>
        )}
        {protagonist.relationshipStatus === 'relationship' && (
          <>
            <Button label="Pedir matrimonio" onPress={handleProposeMarriage} />
            <Button label="Romper" onPress={handleBreakUp} />
          </>
        )}
        {protagonist.relationshipStatus === 'married' && (
          <Button label="Romper" onPress={handleBreakUp} />
        )}
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
  emptyText: {
    marginBottom: theme.spacing.md,
  },
});
