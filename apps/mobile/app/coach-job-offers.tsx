import { useMemo, type JSX } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { randomUUID } from 'expo-crypto';

import type { Club } from '@leyenda/shared';
import {
  RNG,
  calculateInitialCoachReputation,
  calculateLegacyScore,
  createCoachCareer,
  generateJobOffers,
} from '@leyenda/engine';

import { Screen, Button, Text } from '@/components';
import { theme } from '@/theme';
import { getLatestSave, updateSave } from '@/persistence/saves.repository';
import { getProtagonistBySave } from '@/persistence/protagonists.repository';
import { createCoach } from '@/persistence/coaches.repository';
import { generateClubsForCountry } from '@/world/generate-clubs-for-country';

/**
 * Offset de seed reservado sobre la seed del save (mismo registro que
 * `create-character.tsx`/`resolve-division-calendar.ts`): el siguiente
 * offset libre pasa a ser 5.
 */
const JOB_OFFERS_SEED_OFFSET = 4;

interface OfferRowProps {
  club: Club;
  onSign: () => void;
}

function OfferRow({ club, onSign }: OfferRowProps): JSX.Element {
  return (
    <Pressable style={styles.row} onPress={onSign} accessibilityRole="button">
      <Text variant="body">{club.name}</Text>
      <Text variant="caption" color="textSecondary">
        División {club.divisionLevel} · Reputación {club.reputation}
      </Text>
    </Pressable>
  );
}

/** Primeras ofertas de trabajo como entrenador (GDD §5, §6.1), tras la retirada como jugador. */
export default function CoachJobOffersScreen(): JSX.Element {
  const router = useRouter();

  const save = useMemo(() => getLatestSave(), []);
  const protagonist = useMemo(
    () => (save ? getProtagonistBySave(save.id)?.data : undefined),
    [save]
  );

  const offers = useMemo(() => {
    if (!save || !protagonist) return [];
    const clubs = generateClubsForCountry(save.seed, protagonist.nationality);
    const reputation = calculateInitialCoachReputation(calculateLegacyScore(protagonist));
    return generateJobOffers(clubs, reputation, new RNG(save.seed + JOB_OFFERS_SEED_OFFSET));
  }, [save, protagonist]);

  if (!save || !protagonist) {
    return (
      <Screen>
        <Text variant="subtitle" style={styles.emptyText}>
          No hay ninguna carrera desde la que empezar como entrenador
        </Text>
        <Button label="Volver" onPress={() => router.replace('/career')} />
      </Screen>
    );
  }

  const handleSign = (club: Club): void => {
    const legacyScore = calculateLegacyScore(protagonist);
    const coach = createCoachCareer({ id: randomUUID(), clubId: club.id, legacyScore });
    createCoach({ saveId: save.id, data: coach });
    updateSave(save.id, { currentMode: 'coach' });
    router.replace('/coach-career');
  };

  return (
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <Text variant="title">Ofertas de trabajo</Text>
        <Text variant="body" color="textSecondary">
          Estos clubes te ofrecen dirigirlos como entrenador.
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {offers.map((club) => (
          <OfferRow key={club.id} club={club} onSign={() => handleSign(club)} />
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
  header: {
    marginBottom: theme.spacing.md,
  },
  scroll: {
    width: '100%',
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  row: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  emptyText: {
    marginBottom: theme.spacing.md,
  },
});
