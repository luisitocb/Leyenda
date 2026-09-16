import type { JSX } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useDatabaseMigrations } from '@/persistence/migrate';

/**
 * Root layout de la aplicación. Bloquea el render hasta que las
 * migraciones de la base de datos terminan; sin texto (i18n aún no
 * está montado) para cumplir la regla 4 de CLAUDE.md.
 */
export default function RootLayout(): JSX.Element {
  const { success, error } = useDatabaseMigrations();

  if (error) {
    return <View style={styles.errorScreen} />;
  }

  if (!success) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1a1a1a',
          },
          headerTintColor: '#fff',
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
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorScreen: {
    flex: 1,
    backgroundColor: '#3a0a0a',
  },
});
