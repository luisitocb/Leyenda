import type { JSX } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';

import { theme } from '@/theme';

export interface ButtonProps {
  label: string;
  onPress: () => void;
}

export function Button({ label, onPress }: ButtonProps): JSX.Element {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.sm,
    marginBottom: theme.spacing.lg,
  },
  label: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
});
