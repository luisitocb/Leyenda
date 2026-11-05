import type { JSX } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { theme } from '@/theme';
import { Text } from './Text';

export interface OptionRowProps {
  label: string;
  sublabel?: string;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

/** Fila pulsable para elegir una opción de una lista (tácticas, ofertas, respuestas...). */
export function OptionRow({
  label,
  sublabel,
  selected = false,
  disabled = false,
  onPress,
}: OptionRowProps): JSX.Element {
  return (
    <Pressable
      style={[styles.row, selected && styles.selected, disabled && styles.disabled]}
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
    >
      <Text variant="body" color={selected ? 'accent' : 'textPrimary'}>
        {label}
      </Text>
      {sublabel ? (
        <Text variant="caption" color="textSecondary">
          {sublabel}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selected: {
    borderColor: theme.colors.accent,
  },
  disabled: {
    opacity: 0.4,
  },
});
