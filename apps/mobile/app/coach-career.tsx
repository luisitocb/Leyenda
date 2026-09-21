import { useMemo, type JSX } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen, Button, Text } from '@/components';
import { theme } from '@/theme';
import { getLatestSave } from '@/persistence/saves.repository';
import { getCoachBySave } from '@/persistence/coaches.repository';
import { generateClubsForCountry } from '@/world/generate-clubs-for-country';
import { getProtagonistBySave } from '@/persistence/protagonists.repository';

/**
 * Pantalla inicial del Modo Entrenador (GDD §6). Deliberadamente mínima
 * todavía: primera historia de Fase 4, solo establece la carrera de
 * entrenador y el club. Plantilla, tácticas, entrenamiento y directiva son
 * las siguientes historias.
 */
export default function CoachCareerScreen(): JSX.Element {
  const router = useRouter();

  const save = useMemo(() => getLatestSave(), []);
  const coach = useMemo(() => (save ? getCoachBySave(save.id)?.data : undefined), [save]);
  const protagonist = useMemo(
    () => (save ? getProtagonistBySave(save.id)?.data : undefined),
    [save]
  );

  const club = useMemo(() => {
    if (!save || !coach || !protagonist) return undefined;
    return generateClubsForCountry(save.seed, protagonist.nationality).find(
      (c) => c.id === coach.clubId
    );
  }, [save, coach, protagonist]);

  if (!save || !coach) {
    return (
      <Screen>
        <Text variant="subtitle" style={styles.emptyText}>
          Todavía no tienes ninguna carrera de entrenador
        </Text>
        <Button label="Volver" onPress={() => router.replace('/career')} />
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <View style={styles.content}>
        <Text variant="title">Modo Entrenador</Text>
        <Text variant="body" color="accent" style={styles.sectionLabel}>
          {club?.name ?? 'Sin club'}
        </Text>
        <Text variant="body" color="textSecondary">
          Reputación: {coach.reputation}
        </Text>

        <Text variant="subtitle" style={styles.sectionLabel}>
          Próximamente
        </Text>
        <Text variant="body" color="textSecondary">
          Plantilla, tácticas, entrenamiento y directiva llegarán en las próximas historias de Fase
          4.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  content: {
    width: '100%',
  },
  sectionLabel: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  emptyText: {
    marginBottom: theme.spacing.md,
  },
});
