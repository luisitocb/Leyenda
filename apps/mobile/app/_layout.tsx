import type { JSX } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { theme } from '@/theme';
import { useDatabaseMigrations } from '@/persistence/migrate';

/**
 * Root layout de la aplicación. Bloquea el render hasta que las
 * migraciones de la base de datos terminan; sin texto (i18n aún no
 * está montado) para cumplir la regla 4 de CLAUDE.md.
 */
export default function RootLayout(): JSX.Element {
  const { success, error } = useDatabaseMigrations();

  if (error) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <View style={styles.errorScreen} />
      </GestureHandlerRootView>
    );
  }

  if (!success) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <View style={styles.loadingScreen}>
          <ActivityIndicator size="large" color={theme.colors.textPrimary} />
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
          headerTintColor: theme.colors.textPrimary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'Leyenda',
          }}
        />
        <Stack.Screen
          name="live-play-demo"
          options={{
            title: 'Jugadas en Vivo',
          }}
        />
        <Stack.Screen
          name="create-character"
          options={{
            title: 'Crear personaje',
          }}
        />
        <Stack.Screen
          name="career"
          options={{
            title: 'Mi carrera',
          }}
        />
        <Stack.Screen
          name="week"
          options={{
            title: 'Semana',
          }}
        />
        <Stack.Screen
          name="match"
          options={{
            title: 'Partido',
          }}
        />
        <Stack.Screen
          name="event"
          options={{
            title: 'Decisión',
          }}
        />
        <Stack.Screen
          name="standings"
          options={{
            title: 'Clasificación',
          }}
        />
        <Stack.Screen
          name="season-end"
          options={{
            title: 'Fin de temporada',
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorScreen: {
    flex: 1,
    backgroundColor: theme.colors.error,
  },
});
