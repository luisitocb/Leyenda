import type { JSX } from 'react';
import { View, StyleSheet } from 'react-native';
import type { LiveOutcome } from '@leyenda/shared';

import { Text } from '@/components';
import { theme } from '@/theme';

const LABELS: Record<LiveOutcome['type'], string> = {
  goal: '¡GOL!',
  save: 'Parada',
  miss: 'Fallo',
  post: 'Poste',
  foul: 'Falta',
  out: 'Fuera',
};

export interface LivePlayResultOverlayProps {
  outcome: LiveOutcome;
}

export function LivePlayResultOverlay({ outcome }: LivePlayResultOverlayProps): JSX.Element {
  return (
    <View style={styles.container}>
      <Text variant="title" color={outcome.type === 'goal' ? 'accent' : 'textPrimary'}>
        {LABELS[outcome.type]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
    alignItems: 'center',
  },
});
