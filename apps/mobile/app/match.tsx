import { useMemo, useState, type JSX } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  RNG,
  KEY_MOMENTS_PER_MATCH,
  applyMatchExperience,
  computeMatchRating,
  createRandomSeed,
  resolveKeyMomentChoice,
  selectKeyMoments,
  type KeyMomentOutcome,
} from '@leyenda/engine';

import { Screen, Button, Text } from '@/components';
import { theme } from '@/theme';
import { countries, keyMoments } from '@/content';
import { getLatestSave } from '@/persistence/saves.repository';
import { getProtagonistBySave, updateProtagonist } from '@/persistence/protagonists.repository';
import { resolveWeekMatch } from '@/world/resolve-week-match';

/** Momentos clave del partido de la semana (GDD §4.7): 3 tarjetas de decisión, luego resumen. */
export default function MatchScreen(): JSX.Element {
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date: string }>();
  const [seed] = useState(() => createRandomSeed());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [outcomes, setOutcomes] = useState<KeyMomentOutcome[]>([]);

  const save = useMemo(() => getLatestSave(), []);
  const protagonistRow = useMemo(() => (save ? getProtagonistBySave(save.id) : undefined), [save]);
  const protagonist = protagonistRow?.data;

  const teamMatch = useMemo(() => {
    if (!save || !protagonist || !date) return null;
    return resolveWeekMatch(save.seed, protagonist, date, countries);
  }, [save, protagonist, date]);

  const moments = useMemo(() => {
    if (!protagonist) return [];
    return selectKeyMoments(protagonist.position, keyMoments, new RNG(seed), KEY_MOMENTS_PER_MATCH);
  }, [protagonist, seed]);

  if (!save || !protagonist || !protagonistRow || !teamMatch) {
    return (
      <Screen>
        <Text variant="subtitle" style={styles.emptyText}>
          No hay partido que mostrar
        </Text>
        <Button label="Volver" onPress={() => router.replace('/career')} />
      </Screen>
    );
  }

  const currentMoment = moments[currentIndex];
  const currentOutcome = outcomes[currentIndex];
  const allResolved = currentIndex >= moments.length;

  const handleChoose = (choiceId: string): void => {
    if (!currentMoment) return;
    const outcome = resolveKeyMomentChoice(
      protagonist,
      currentMoment,
      choiceId,
      new RNG(seed + currentIndex)
    );
    setOutcomes((current) => [...current, outcome]);
  };

  const handleContinue = (): void => {
    setCurrentIndex((current) => current + 1);
  };

  const handleFinish = (): void => {
    const rating = computeMatchRating(outcomes);
    const updated = applyMatchExperience(protagonist, outcomes, rating);
    updateProtagonist(protagonistRow.id, updated);
    router.replace('/career');
  };

  return (
    <Screen style={styles.screen}>
      <Text variant="subtitle">
        {teamMatch.homeClub.name} {teamMatch.result.homeGoals} - {teamMatch.result.awayGoals}{' '}
        {teamMatch.awayClub.name}
      </Text>

      {!allResolved && currentMoment && !currentOutcome && (
        <View style={styles.card}>
          <Text variant="body" style={styles.situation}>
            {currentMoment.situation}
          </Text>
          {currentMoment.choices.map((choice) => (
            <Pressable
              key={choice.id}
              style={styles.choiceRow}
              onPress={() => handleChoose(choice.id)}
              accessibilityRole="button"
            >
              <Text variant="body">{choice.label}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {!allResolved && currentMoment && currentOutcome && (
        <View style={styles.card}>
          <Text variant="body" color={currentOutcome.success ? 'accent' : 'error'}>
            {currentOutcome.success ? 'Te ha salido bien.' : 'No ha salido como querías.'}
          </Text>
          <Button label="Siguiente" onPress={handleContinue} />
        </View>
      )}

      {allResolved && (
        <View style={styles.card}>
          <Text variant="subtitle">Nota del partido: {computeMatchRating(outcomes)}</Text>
          <Button label="Continuar" onPress={handleFinish} />
        </View>
      )}
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
  situation: {
    marginBottom: theme.spacing.md,
  },
  choiceRow: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  emptyText: {
    marginBottom: theme.spacing.md,
  },
});
