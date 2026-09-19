import { useMemo, useState, type JSX } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import type { LiveOutcome, LiveSituation } from '@leyenda/shared';
import {
  RNG,
  KEY_MOMENTS_PER_MATCH,
  applyMatchExperience,
  computeMatchRating,
  convertLiveOutcomeToKeyMomentOutcome,
  createRandomSeed,
  resolveKeyMomentChoice,
  selectKeyMoments,
  shouldTriggerLivePlay,
  type KeyMomentOutcome,
} from '@leyenda/engine';

import { Screen, Button, Text } from '@/components';
import { theme } from '@/theme';
import { countries, keyMoments } from '@/content';
import { ChanceMinigame, LivePlayResultOverlay, PenaltyMinigame } from '@/features/live-play';
import { getLatestSave } from '@/persistence/saves.repository';
import { getProtagonistBySave, updateProtagonist } from '@/persistence/protagonists.repository';
import { resolveWeekMatch } from '@/world/resolve-week-match';

/**
 * Registro de offsets de seed locales a esta pantalla (no relacionados con
 * los de `create-character.tsx`/`resolve-division-calendar.ts`, son otra
 * seed): `seed` = elegir momentos clave, `seed+0..2` = resolver cada
 * elección, `seed+10` = si toca Jugada en Vivo, `seed+20` = resolverla.
 */
const LIVE_PLAY_TRIGGER_SEED_OFFSET = 10;
const LIVE_PLAY_SITUATION_SEED_OFFSET = 20;

/** Presión fija y moderada: no existe todavía detección real de "partido importante" (GDD §7B.2). */
const LIVE_PLAY_PRESSURE = 50;

/** Partido de la semana: Jugada en Vivo (rara, GDD §7B) + momentos clave (GDD §4.7), luego resumen. */
export default function MatchScreen(): JSX.Element {
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date: string }>();
  const [seed] = useState(() => createRandomSeed());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [outcomes, setOutcomes] = useState<KeyMomentOutcome[]>([]);
  const [livePlayOutcome, setLivePlayOutcome] = useState<LiveOutcome | null>(null);
  const [livePlayAcknowledged, setLivePlayAcknowledged] = useState(false);

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

  const livePlayType = useMemo(() => {
    if (!protagonist) return null;
    return shouldTriggerLivePlay(
      protagonist.position,
      new RNG(seed + LIVE_PLAY_TRIGGER_SEED_OFFSET)
    );
  }, [protagonist, seed]);

  const liveSituation = useMemo<LiveSituation | null>(() => {
    if (!livePlayType || !protagonist || !teamMatch) return null;
    const shooting = 'shooting' in protagonist.technical ? protagonist.technical.shooting : 0;
    return {
      type: livePlayType,
      minute: 70,
      playerId: protagonist.id,
      team: teamMatch.isHome ? 'home' : 'away',
      seed: seed + LIVE_PLAY_SITUATION_SEED_OFFSET,
      pressure: LIVE_PLAY_PRESSURE,
      shooterShooting: shooting,
      shooterComposure: protagonist.mental.composure,
    };
  }, [livePlayType, protagonist, teamMatch, seed]);

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

  const livePlayPending = livePlayType !== null && !livePlayAcknowledged;
  const currentMoment = moments[currentIndex];
  const currentOutcome = outcomes[currentIndex];
  const allResolved = currentIndex >= moments.length;
  const finalOutcomes = livePlayOutcome
    ? [convertLiveOutcomeToKeyMomentOutcome(livePlayOutcome), ...outcomes]
    : outcomes;

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
    const rating = computeMatchRating(finalOutcomes);
    const updated = applyMatchExperience(protagonist, finalOutcomes, rating);
    updateProtagonist(protagonistRow.id, updated);
    router.replace('/career');
  };

  return (
    <Screen style={styles.screen}>
      <Text variant="subtitle">
        {teamMatch.homeClub.name} {teamMatch.result.homeGoals} - {teamMatch.result.awayGoals}{' '}
        {teamMatch.awayClub.name}
      </Text>

      {livePlayPending &&
        liveSituation &&
        !livePlayOutcome &&
        (livePlayType === 'penalty' ? (
          <PenaltyMinigame situation={liveSituation} onResult={setLivePlayOutcome} />
        ) : (
          <ChanceMinigame situation={liveSituation} onResult={setLivePlayOutcome} />
        ))}

      {livePlayPending && livePlayOutcome && (
        <View style={styles.card}>
          <LivePlayResultOverlay outcome={livePlayOutcome} />
          <Button label="Continuar" onPress={() => setLivePlayAcknowledged(true)} />
        </View>
      )}

      {!livePlayPending && !allResolved && currentMoment && !currentOutcome && (
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

      {!livePlayPending && !allResolved && currentMoment && currentOutcome && (
        <View style={styles.card}>
          <Text variant="body" color={currentOutcome.success ? 'accent' : 'error'}>
            {currentOutcome.success ? 'Te ha salido bien.' : 'No ha salido como querías.'}
          </Text>
          <Button label="Siguiente" onPress={handleContinue} />
        </View>
      )}

      {!livePlayPending && allResolved && (
        <View style={styles.card}>
          <Text variant="subtitle">Nota del partido: {computeMatchRating(finalOutcomes)}</Text>
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
