import type { JSX } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { RNG } from '@leyenda/engine';

import { Screen, Button, Text } from '@/components';
import { theme } from '@/theme';
import { createSave, listSaves } from '@/persistence/saves.repository';

/**
 * Pantalla inicial - Demo básico del RNG
 */
export default function HomeScreen(): JSX.Element {
  const testRNG = (): void => {
    const rng = new RNG(Date.now());
    const randomValue = rng.next();
    const randomInt = rng.nextInt(1, 100);

    alert(`RNG Test:\n\nFloat: ${randomValue.toFixed(4)}\nInt (1-100): ${randomInt}`);
  };

  const testCreateSave = (): void => {
    try {
      const save = createSave({ seed: Date.now(), gameDate: '2026-08-01', currentMode: 'player' });
      Alert.alert('Guardado creado', `id: ${save.id}\nseed: ${save.seed}`);
    } catch (error) {
      Alert.alert('Error al crear guardado', String(error));
    }
  };

  const testListSaves = (): void => {
    try {
      const all = listSaves();
      Alert.alert(
        `Guardados: ${all.length}`,
        all.map((save) => `${save.id} · seed ${save.seed}`).join('\n') || '(vacío)'
      );
    } catch (error) {
      Alert.alert('Error al leer guardados', String(error));
    }
  };

  return (
    <Screen>
      <Text variant="title" style={styles.title}>
        Leyenda
      </Text>
      <Text variant="subtitle" style={styles.subtitle}>
        De Crack a Míster
      </Text>

      <View style={styles.info}>
        <Text variant="body" color="accent" style={styles.infoText}>
          ✅ Monorepo configurado
        </Text>
        <Text variant="body" color="accent" style={styles.infoText}>
          ✅ TypeScript estricto
        </Text>
        <Text variant="body" color="accent" style={styles.infoText}>
          ✅ Engine funcionando
        </Text>
        <Text variant="body" color="accent" style={styles.infoText}>
          ✅ Expo + Router
        </Text>
      </View>

      <Button label="Probar RNG" onPress={testRNG} />
      <Button label="Crear guardado de prueba" onPress={testCreateSave} />
      <Button label="Ver guardados" onPress={testListSaves} />

      <Text variant="caption">Fase 0: Fundamentos</Text>
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
  info: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    marginBottom: theme.spacing.lg,
    width: '100%',
  },
  infoText: {
    marginBottom: theme.spacing.xs,
  },
});
