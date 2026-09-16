import type { JSX, ReactNode } from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { theme } from '@/theme';

export interface ScreenProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Screen({ children, style }: ScreenProps): JSX.Element {
  return <View style={[styles.container, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
  },
});
