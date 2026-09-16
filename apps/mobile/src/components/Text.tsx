import type { JSX, ReactNode } from 'react';
import { Text as RNText, type StyleProp, type TextStyle } from 'react-native';

import { colors, typography, type TextVariant } from '@/theme';

export interface TextProps {
  children: ReactNode;
  variant?: TextVariant;
  color?: keyof typeof colors;
  style?: StyleProp<TextStyle>;
}

export function Text({ children, variant = 'body', color, style }: TextProps): JSX.Element {
  const variantStyle = typography[variant];

  return (
    <RNText
      style={[
        { fontSize: variantStyle.fontSize, fontWeight: variantStyle.fontWeight },
        { color: color ? colors[color] : variantStyle.color },
        style,
      ]}
    >
      {children}
    </RNText>
  );
}
