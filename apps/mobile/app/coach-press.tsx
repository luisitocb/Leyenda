import { useMemo, type JSX } from 'react';
import { StyleSheet, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { applyPressAnswer, sackCoach } from '@leyenda/engine';

import { Screen, Button, Text, OptionRow } from '@/components';
import { theme } from '@/theme';
import { pressConferences } from '@/content';
import { updateCoach } from '@/persistence/coaches.repository';
import { loadCoachContext } from '@/coach/coach-context';

function describeEffects(effects: {
  squadMorale: number;
  boardConfidence: number;
  reputation: number;
}): string {
  const parts: string[] = [];
  const signed = (n: number): string => (n > 0 ? `+${n}` : `${n}`);
  if (effects.squadMorale !== 0) parts.push(`${signed(effects.squadMorale)} moral del vestuario`);
  if (effects.boardConfidence !== 0)
    parts.push(`${signed(effects.boardConfidence)} confianza de la directiva`);
  if (effects.reputation !== 0) parts.push(`${signed(effects.reputation)} reputación`);
  return parts.join(' · ') || 'Sin efectos';
}

/** Rueda de prensa antes del partido (GDD §6.1), contenido data-driven. */
export default function CoachPressScreen(): JSX.Element {
  const router = useRouter();
  const { date, conferenceId } = useLocalSearchParams<{ date: string; conferenceId: string }>();
  const context = useMemo(() => loadCoachContext(), []);
  const conference = pressConferences.find((c) => c.id === conferenceId);

  if (!context || !conference || !date) {
    return (
      <Screen>
        <Text variant="subtitle" style={styles.emptyText}>
          No hay rueda de prensa
        </Text>
        <Button
          label="Continuar"
          onPress={() =>
            date
              ? router.replace({ pathname: '/coach-match', params: { date } })
              : router.replace('/coach-career')
          }
        />
      </Screen>
    );
  }

  const handleAnswer = (answerId: string): void => {
    const answer = conference.answers.find((a) => a.id === answerId);
    if (!answer) return;
    const { coach, verdict } = applyPressAnswer(context.coach, answer);
    if (verdict === 'sacked') {
      updateCoach(context.coachRowId, sackCoach(coach));
      Alert.alert('Despedido', 'La directiva ha perdido la confianza en ti.');
      router.replace('/coach-career');
      return;
    }
    updateCoach(context.coachRowId, coach);
    router.replace({ pathname: '/coach-match', params: { date } });
  };

  return (
    <Screen style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text variant="subtitle">Rueda de prensa</Text>
        <Text variant="body" style={styles.question}>
          {conference.question}
        </Text>
        {conference.answers.map((answer) => (
          <OptionRow
            key={answer.id}
            label={answer.label}
            sublabel={describeEffects(answer.effects)}
            onPress={() => handleAnswer(answer.id)}
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
  question: {
    marginVertical: theme.spacing.md,
  },
  emptyText: {
    marginBottom: theme.spacing.md,
  },
});
