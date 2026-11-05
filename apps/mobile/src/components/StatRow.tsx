import type { JSX } from 'react';
import { View, StyleSheet } from 'react-native';

import { theme } from '@/theme';
import { Text } from './Text';

export interface StatRowProps {
  label: string;
  value: string | number;
  valueColor?: 'accent' | 'error' | 'textSecondary';
}

/** Fila "etiqueta ······ valor" para pantallas de estadísticas. */
export function StatRow({ label, value, valueColor }: StatRowProps): JSX.Element {
  return (
    <View style={styles.row}>
      <Text variant="body" color="textSecondary">
        {label}
      </Text>
      <Text variant="body" color={valueColor}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
});
