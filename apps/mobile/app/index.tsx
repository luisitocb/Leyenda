import type { JSX } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { RNG } from '@leyenda/engine';

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
    <View style={styles.container}>
      <Text style={styles.title}>Leyenda</Text>
      <Text style={styles.subtitle}>De Crack a Míster</Text>

      <View style={styles.info}>
        <Text style={styles.infoText}>✅ Monorepo configurado</Text>
        <Text style={styles.infoText}>✅ TypeScript estricto</Text>
        <Text style={styles.infoText}>✅ Engine funcionando</Text>
        <Text style={styles.infoText}>✅ Expo + Router</Text>
      </View>

      <Pressable style={styles.button} onPress={testRNG}>
        <Text style={styles.buttonText}>Probar RNG</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={testCreateSave}>
        <Text style={styles.buttonText}>Crear guardado de prueba</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={testListSaves}>
        <Text style={styles.buttonText}>Ver guardados</Text>
      </Pressable>

      <Text style={styles.phase}>Fase 0: Fundamentos</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    color: '#888',
    marginBottom: 40,
  },
  info: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
    marginBottom: 32,
    width: '100%',
  },
  infoText: {
    color: '#4ade80',
    fontSize: 16,
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 32,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  phase: {
    color: '#666',
    fontSize: 14,
  },
});
