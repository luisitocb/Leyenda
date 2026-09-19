import { useMemo, useState, type JSX } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  RNG,
  createRandomSeed,
  resolveEventChoice,
  type EventChoiceOutcome,
} from '@leyenda/engine';

import { Screen, Button, Text } from '@/components';
import { theme } from '@/theme';
import { events } from '@/content';
import { getLatestSave } from '@/persistence/saves.repository';
import { getProtagonistBySave, updateProtagonist } from '@/persistence/protagonists.repository';

/** Evento de decisión semanal (GDD §4.6): tarjeta de texto + 2-4 opciones. */
export default function EventScreen(): JSX.Element {
  const router = useRouter();
  const { eventId, nextPath, date } = useLocalSearchParams<{
    eventId: string;
    nextPath: string;
    date?: string;
  }>();
  const [outcome, setOutcome] = useState<EventChoiceOutcome | null>(null);

  const save = useMemo(() => getLatestSave(), []);
  const protagonistRow = useMemo(() => (save ? getProtagonistBySave(save.id) : undefined), [save]);
  const protagonist = protagonistRow?.data;
  const event = useMemo(() => events.find((e) => e.id === eventId), [eventId]);

  if (!save || !protagonist || !protagonistRow || !event) {
    return (
      <Screen>
        <Text variant="subtitle" style={styles.emptyText}>
          No hay ninguna decisión que mostrar
        </Text>
        <Button label="Volver" onPress={() => router.replace('/career')} />
      </Screen>
    );
  }

  const handleChoose = (choiceId: string): void => {
    setOutcome(resolveEventChoice(protagonist, event, choiceId, new RNG(createRandomSeed())));
  };

  const handleContinue = (): void => {
    if (!outcome) return;
    updateProtagonist(protagonistRow.id, outcome.protagonist);
    if (nextPath === '/match') {
      router.replace({ pathname: '/match', params: { date } });
    } else {
      router.replace('/career');
    }
  };

  return (
    <Screen style={styles.screen}>
      {!outcome && (
        <View style={styles.card}>
          <Text variant="body" style={styles.text}>
            {event.text}
          </Text>
          {event.choices.map((choice) => (
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

      {outcome && (
        <View style={styles.card}>
          {outcome.success !== null && (
            <Text variant="body" color={outcome.success ? 'accent' : 'error'}>
              {outcome.success ? 'Te ha salido bien.' : 'No ha salido como querías.'}
            </Text>
          )}
          {outcome.grantedTrait && (
            <Text variant="body" color="accent">
              Has ganado un rasgo nuevo.
            </Text>
          )}
          <Button label="Continuar" onPress={handleContinue} />
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
  text: {
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
