import type { TextStyle } from 'react-native';

import { colors } from './colors';

export const typography = {
  title: { fontSize: 48, fontWeight: 'bold', color: colors.textPrimary },
  subtitle: { fontSize: 20, fontWeight: 'normal', color: colors.textSecondary },
  body: { fontSize: 16, fontWeight: 'normal', color: colors.textPrimary },
  caption: { fontSize: 14, fontWeight: 'normal', color: colors.textMuted },
} satisfies Record<
  string,
  { fontSize: number; fontWeight: TextStyle['fontWeight']; color: string }
>;

export type TextVariant = keyof typeof typography;
