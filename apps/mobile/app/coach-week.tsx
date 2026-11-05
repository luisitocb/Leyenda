import { useMemo, useState, type JSX } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

import type { TrainingFocus } from '@leyenda/shared';
import { createRandomSeed } from '@leyenda/engine';

import { Screen, Button, Text, OptionRow } from '@/components';
import { theme } from '@/theme';
import { TRAINING_FOCUS_DESCRIPTIONS, TRAINING_FOCUS_LABELS } from '@/labels';
import { updateCoach } from '@/persistence/coaches.repository';
import { loadCoachContext } from '@/coach/coach-context';
import { advanceCoachWeek } from '@/coach/coach-week';

const FOCUSES: TrainingFocus[] = ['physical', 'technical', 'tactical', 'rest'];

/** Semana del entrenador (GDD §6.4): plan de entrenamiento del grupo y avanzar. */
export default function CoachWeekScreen(): JSX.Element {
  const router = useRouter();
  const [weekSeed] = useState(() => createRandomSeed());
  const context = useMemo(() => loadCoachContext(), []);
  const [focus, setFocus] = useState<TrainingFocus>(context?.coach.trainingFocus ?? 'technical');

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

  const handleAdvance = (): void => {
    const coach = { ...context.coach, trainingFocus: focus };
    updateCoach(context.coachRowId, coach);
    const route = advanceCoachWeek({ ...context, coach }, weekSeed);
    router.replace(route);
  };

  return (
    <Screen style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text variant="subtitle">Semana del {context.save.gameDate}</Text>
        <Text variant="body" color="textSecondary" style={styles.paragraph}>
          Plan de entrenamiento del grupo:
        </Text>
        {FOCUSES.map((option) => (
          <OptionRow
            key={option}
            label={TRAINING_FOCUS_LABELS[option]}
            sublabel={TRAINING_FOCUS_DESCRIPTIONS[option]}
            selected={focus === option}
            onPress={() => setFocus(option)}
          />
        ))}
        <Button label="Avanzar semana" onPress={handleAdvance} />
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
  paragraph: {
    marginVertical: theme.spacing.sm,
  },
  emptyText: {
    marginBottom: theme.spacing.md,
  },
});
