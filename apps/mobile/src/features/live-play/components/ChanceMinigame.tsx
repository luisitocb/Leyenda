import { useCallback, type JSX } from 'react';
import { useWindowDimensions } from 'react-native';
import { Canvas, Circle } from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';
import type { LiveOutcome, LiveSituation } from '@leyenda/shared';
import { RNG, resolveLivePlay, type SwipeGestureData } from '@leyenda/engine';

import { theme } from '@/theme';
import { DrawField } from '../drawing/field';

/** Convierte un punto en píxeles a coordenadas normalizadas [0,1]x[0,1]; y=1 es la portería. */
function toNormalized(pixelX: number, pixelY: number, width: number, height: number) {
  return { x: pixelX / width, y: 1 - pixelY / height };
}

export interface ChanceMinigameProps {
  situation: LiveSituation;
  onResult: (outcome: LiveOutcome) => void;
}

export function ChanceMinigame({ situation, onResult }: ChanceMinigameProps): JSX.Element {
  const { width } = useWindowDimensions();
  const canvasHeight = width;
  const startPixel = { x: width / 2, y: canvasHeight * 0.85 };

  const ballX = useSharedValue(startPixel.x);
  const ballY = useSharedValue(startPixel.y);
  const startTime = useSharedValue(0);

  const handleRelease = useCallback(
    (endPixelX: number, endPixelY: number, durationMs: number) => {
      const startPoint = toNormalized(startPixel.x, startPixel.y, width, canvasHeight);
      const endPoint = toNormalized(endPixelX, endPixelY, width, canvasHeight);
      const gesture: SwipeGestureData = {
        type: 'chance',
        startPoint,
        endPoint,
        durationMs: Math.max(durationMs, 1),
        curvature: 0,
      };
      const outcome = resolveLivePlay(situation, gesture, new RNG(situation.seed));
      onResult(outcome);
      ballX.value = startPixel.x;
      ballY.value = startPixel.y;
    },
    [ballX, ballY, canvasHeight, onResult, situation, startPixel.x, startPixel.y, width]
  );

  const panGesture = Gesture.Pan()
    .onBegin((event) => {
      startTime.value = Date.now();
      ballX.value = event.x;
      ballY.value = event.y;
    })
    .onUpdate((event) => {
      ballX.value = event.x;
      ballY.value = event.y;
    })
    .onEnd((event) => {
      const durationMs = Date.now() - startTime.value;
      runOnJS(handleRelease)(event.x, event.y, durationMs);
    });

  return (
    <GestureDetector gesture={panGesture}>
      <Canvas style={{ width, height: canvasHeight }}>
        <DrawField width={width} height={canvasHeight} />
        <Circle cx={ballX} cy={ballY} r={12} color={theme.colors.primary} />
      </Canvas>
    </GestureDetector>
  );
}
