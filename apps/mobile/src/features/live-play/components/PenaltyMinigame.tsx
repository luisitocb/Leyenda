import { useCallback, useEffect, type JSX } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Canvas, Circle } from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { LiveOutcome, LiveSituation } from '@leyenda/shared';
import { RNG, resolveLivePlay, type PenaltyGestureData } from '@leyenda/engine';

import { theme } from '@/theme';
import { DrawField, getGoalBounds } from '../drawing/field';

const POWER_BAR_HALF_PERIOD_MS = 900;

export interface PenaltyMinigameProps {
  situation: LiveSituation;
  onResult: (outcome: LiveOutcome) => void;
}

export function PenaltyMinigame({ situation, onResult }: PenaltyMinigameProps): JSX.Element {
  const { width } = useWindowDimensions();
  const canvasHeight = width; // lienzo cuadrado
  const goal = getGoalBounds({ width, height: canvasHeight });
  const goalCenterX = (goal.left + goal.right) / 2;
  const goalCenterY = (goal.top + goal.bottom) / 2;

  const aimX = useSharedValue(goalCenterX);
  const aimY = useSharedValue(goalCenterY);
  const barValue = useSharedValue(0);

  useEffect(() => {
    barValue.value = withRepeat(
      withSequence(
        withTiming(1, { duration: POWER_BAR_HALF_PERIOD_MS, easing: Easing.linear }),
        withTiming(0, { duration: POWER_BAR_HALF_PERIOD_MS, easing: Easing.linear })
      ),
      -1,
      false
    );
  }, [barValue]);

  const handleRelease = useCallback(
    (pixelX: number, pixelY: number, power: number) => {
      const aimTarget = {
        x: (pixelX - goalCenterX) / ((goal.right - goal.left) / 2),
        y: (goal.bottom - pixelY) / (goal.bottom - goal.top),
      };
      const gesture: PenaltyGestureData = { type: 'penalty', aimTarget, barValue: power };
      const outcome = resolveLivePlay(situation, gesture, new RNG(situation.seed));
      onResult(outcome);
    },
    [goal, goalCenterX, onResult, situation]
  );

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      aimX.value = Math.min(Math.max(event.x, goal.left), goal.right);
      aimY.value = Math.min(Math.max(event.y, goal.top), goal.bottom);
    })
    .onEnd(() => {
      runOnJS(handleRelease)(aimX.value, aimY.value, barValue.value);
    });

  const barIndicatorStyle = useAnimatedStyle(() => ({
    left: `${barValue.value * 100}%`,
  }));

  return (
    <View>
      <GestureDetector gesture={panGesture}>
        <Canvas style={{ width, height: canvasHeight }}>
          <DrawField width={width} height={canvasHeight} />
          <Circle cx={goalCenterX} cy={goalCenterY} r={16} color={theme.colors.textPrimary} />
          <Circle cx={aimX} cy={aimY} r={10} color={theme.colors.primary} />
        </Canvas>
      </GestureDetector>
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barIndicator, barIndicatorStyle]} />
        <View style={styles.barSweetZone} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barTrack: {
    height: 24,
    marginTop: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.sm,
    overflow: 'hidden',
  },
  barSweetZone: {
    position: 'absolute',
    left: '52%',
    width: '36%',
    height: '100%',
    backgroundColor: theme.colors.accent,
    opacity: 0.3,
  },
  barIndicator: {
    position: 'absolute',
    width: 4,
    height: '100%',
    backgroundColor: theme.colors.textPrimary,
  },
});
