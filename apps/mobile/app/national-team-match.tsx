import { useMemo, useState, type JSX } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

import type { LiveOutcome, LiveSituation, Match } from '@leyenda/shared';
import {
  RNG,
  KEY_MOMENTS_PER_MATCH,
  applyNationalTeamExperience,
  computeMatchRating,
  convertLiveOutcomeToKeyMomentOutcome,
  createRandomSeed,
  pickRivalCountry,
  resolveKeyMomentChoice,
  selectKeyMoments,
  shouldTriggerLivePlay,
  simulateMatch,
  type KeyMomentOutcome,
} from '@leyenda/engine';

import { Screen, Button, Text } from '@/components';
import { theme } from '@/theme';
import { countries, keyMoments } from '@/content';
import { ChanceMinigame, LivePlayResultOverlay, PenaltyMinigame } from '@/features/live-play';
import { getLatestSave } from '@/persistence/saves.repository';
import { getProtagonistBySave, updateProtagonist } from '@/persistence/protagonists.repository';
import { generateNationalSquad } from '@/world/generate-national-squad';

/**
 * Registro de offsets de seed locales a esta pantalla (no relacionados con
 * los de `match.tsx`, es otra seed): `seed`/`seed+1` = plantillas de las
 * dos selecciones, `seed+2` = elegir país rival, `seed+3` = simular el
 * marcador, `seed` = elegir momentos clave (reutiliza el offset base, igual
 * que `match.tsx`), `seed+10` = si toca Jugada en Vivo, `seed+20` =
 * resolverla.
 */
const RIVAL_COUNTRY_SEED_OFFSET = 2;
const MATCH_SEED_OFFSET = 3;
const LIVE_PLAY_TRIGGER_SEED_OFFSET = 10;
const LIVE_PLAY_SITUATION_SEED_OFFSET = 20;

const LIVE_PLAY_PRESSURE = 70;

/** Partido con la selección nacional (GDD §4.8): convocatoria de la semana. */
export default function NationalTeamMatchScreen(): JSX.Element {
  const router = useRouter();
  const [seed] = useState(() => createRandomSeed());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [outcomes, setOutcomes] = useState<KeyMomentOutcome[]>([]);
  const [livePlayOutcome, setLivePlayOutcome] = useState<LiveOutcome | null>(null);
  const [livePlayAcknowledged, setLivePlayAcknowledged] = useState(false);

  const save = useMemo(() => getLatestSave(), []);
  const protagonistRow = useMemo(() => (save ? getProtagonistBySave(save.id) : undefined), [save]);
  const protagonist = protagonistRow?.data;

  const rivalCountry = useMemo(() => {
    if (!protagonist) return null;
    return pickRivalCountry(
      protagonist.nationality,
      countries,
      new RNG(seed + RIVAL_COUNTRY_SEED_OFFSET)
    );
  }, [protagonist, seed]);

  const internationalMatch = useMemo(() => {
    if (!protagonist || !rivalCountry) return null;
    const homeSquad = generateNationalSquad(seed, protagonist.nationality, countries);
    const awaySquad = generateNationalSquad(seed + 1, rivalCountry.code, countries);
    const match: Match = {
      id: `amistoso-${protagonist.nationality}-${rivalCountry.code}-${seed}`,
      homeTeamId: `seleccion-${protagonist.nationality}`,
      awayTeamId: `seleccion-${rivalCountry.code}`,
      competitionId: 'amistoso-internacional',
      date: save?.gameDate ?? '2026-01-01',
      result: { homeGoals: 0, awayGoals: 0 },
      events: [],
      seed: seed + MATCH_SEED_OFFSET,
      simulated: false,
    };
    return simulateMatch(match, homeSquad, awaySquad, new RNG(match.seed));
  }, [protagonist, rivalCountry, seed, save]);

  const ownCountryName = useMemo(
    () => countries.find((c) => c.code === protagonist?.nationality)?.name ?? '',
    [protagonist]
  );

  const moments = useMemo(() => {
    if (!protagonist) return [];
    return selectKeyMoments(protagonist.position, keyMoments, new RNG(seed), KEY_MOMENTS_PER_MATCH);
  }, [protagonist, seed]);

  const livePlayType = useMemo(() => {
    if (!protagonist || protagonist.position === 'GK') return null;
    const rng = new RNG(seed + LIVE_PLAY_TRIGGER_SEED_OFFSET);
    // Debut con la selección (GDD §7B.2): Jugada en Vivo garantizada, no al ~15% habitual.
    if (protagonist.nationalTeamCaps === 0) {
      return rng.pick(['penalty', 'chance'] as const);
    }
    return shouldTriggerLivePlay(protagonist.position, rng);
  }, [protagonist, seed]);

  const liveSituation = useMemo<LiveSituation | null>(() => {
    if (!livePlayType || !protagonist) return null;
    const shooting = 'shooting' in protagonist.technical ? protagonist.technical.shooting : 0;
    return {
      type: livePlayType,
      minute: 70,
      playerId: protagonist.id,
      team: 'home',
      seed: seed + LIVE_PLAY_SITUATION_SEED_OFFSET,
      pressure: LIVE_PLAY_PRESSURE,
      shooterShooting: shooting,
      shooterComposure: protagonist.mental.composure,
    };
  }, [livePlayType, protagonist, seed]);

  if (!save || !protagonist || !protagonistRow || !rivalCountry || !internationalMatch) {
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
    const updated = applyNationalTeamExperience(protagonist, finalOutcomes, rating);
    updateProtagonist(protagonistRow.id, updated);
    router.replace('/career');
  };

  return (
    <Screen style={styles.screen}>
      <Text variant="subtitle">¡Convocatoria con la selección de {ownCountryName}!</Text>
      <Text variant="body" style={styles.text}>
        {ownCountryName} {internationalMatch.result.homeGoals} -{' '}
        {internationalMatch.result.awayGoals} {rivalCountry.name}
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
  text: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
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
