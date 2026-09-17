import type { JSX } from 'react';
import { Rect, Line, vec } from '@shopify/react-native-skia';

export interface FieldDimensions {
  width: number;
  height: number;
}

/**
 * Área de la portería dentro del lienzo, en píxeles.
 * Ocupa el 60% horizontal centrado y el 30% superior del lienzo.
 */
export function getGoalBounds({ width, height }: FieldDimensions): {
  left: number;
  right: number;
  top: number;
  bottom: number;
} {
  const left = width * 0.2;
  const right = width * 0.8;
  const top = height * 0.1;
  const bottom = height * 0.4;
  return { left, right, top, bottom };
}

/** Dibuja el campo (césped) y la portería (dos postes + larguero). */
export function DrawField({ width, height }: FieldDimensions): JSX.Element {
  const goal = getGoalBounds({ width, height });

  return (
    <>
      <Rect x={0} y={0} width={width} height={height} color="#1a5c2e" />
      <Line
        p1={vec(goal.left, goal.top)}
        p2={vec(goal.left, goal.bottom)}
        color="white"
        strokeWidth={4}
      />
      <Line
        p1={vec(goal.right, goal.top)}
        p2={vec(goal.right, goal.bottom)}
        color="white"
        strokeWidth={4}
      />
      <Line
        p1={vec(goal.left, goal.top)}
        p2={vec(goal.right, goal.top)}
        color="white"
        strokeWidth={4}
      />
    </>
  );
}
