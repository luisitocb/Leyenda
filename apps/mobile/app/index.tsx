import { useCallback, useState, type JSX } from 'react';
import { View, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { Screen, Button, Text } from '@/components';
import { theme } from '@/theme';
import { getLatestSave } from '@/persistence/saves.repository';
import { getProtagonistBySave } from '@/persistence/protagonists.repository';
import type { Save } from '@/persistence/schema';

interface ContinueInfo {
  path: '/career' | '/coach-career';
  label: string;
}

function continueInfo(save: Save | undefined): ContinueInfo | null {
  if (!save) return null;
  const protagonist = getProtagonistBySave(save.id)?.data;
  if (!protagonist) return null;
  const name = `${protagonist.firstName} ${protagonist.lastName}`;
  if (save.currentMode === 'player') return { path: '/career', label: `${name} · jugador` };
  if (save.currentMode === 'coach') return { path: '/coach-career', label: `${name} · entrenador` };
  return null;
}

/** Menú principal (GDD §3, §9): continuar la partida, empezar otra o ver el Salón de la Fama. */
export default function HomeScreen(): JSX.Element {
  const router = useRouter();
  const [info, setInfo] = useState<ContinueInfo | null>(() => continueInfo(getLatestSave()));

  useFocusEffect(
    useCallback(() => {
      setInfo(continueInfo(getLatestSave()));
    }, [])
  );

  return (
    <Screen>
      <Text variant="title" style={styles.title}>
        Leyenda
      </Text>
      <Text variant="subtitle" style={styles.subtitle}>
        De Crack a Míster
      </Text>

      {info && (
        <View style={styles.continueBlock}>
          <Button label="Continuar" onPress={() => router.push(info.path)} />
          <Text variant="caption" style={styles.caption}>
            {info.label}
          </Text>
        </View>
      )}
      <Button label="Nueva carrera" onPress={() => router.push('/create-character')} />
      <Button label="Salón de la Fama" onPress={() => router.push('/hall-of-fame')} />
      <Button label="Campo de entrenamiento" onPress={() => router.push('/live-play-demo')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    marginBottom: theme.spacing.xl,
  },
  continueBlock: {
    alignItems: 'center',
  },
  caption: {
    marginTop: -theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
});
