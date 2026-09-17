/**
 * Entrada de gesto para resolver una Jugada en Vivo (GDD §7B.3).
 * No es un tipo de dominio compartido: es la entrada específica de
 * `resolveLivePlay`, como `Command` en packages/engine/src/types.
 */
export interface PenaltyGestureData {
  type: 'penalty';
  /** Punto de apuntado dentro de la portería: x en [-1,1], y en [0,1] */
  aimTarget: { x: number; y: number };
  /** Posición de la barra de potencia oscilante al soltar, en [0,1] */
  barValue: number;
}

export interface SwipeGestureData {
  type: 'chance';
  /** Puntos normalizados en el campo [0,1] x [0,1] */
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  durationMs: number;
  /** Curvatura del gesto en radianes; solo afecta la animación de trayectoria, no el resultado */
  curvature: number;
}

export type GestureData = PenaltyGestureData | SwipeGestureData;

/**
 * Constantes de tuning para el penalti. Valores de arranque sin balanceo
 * previo (no existe balance-sim para Jugadas en Vivo todavía); ajustar
 * tras la prueba en dispositivo real (ADR-002).
 */
export const PENALTY_TUNING = {
  sweetCenter: 0.7,
  sweetHalfWidthAtNoPressure: 0.18,
  sweetHalfWidthReductionAtMaxPressure: 0.1,
  powerErrorFullMiss: 0.5,
  goalThreshold: 0.35,
  keeperSaveThreshold: 0.55,
  keeperReachBase: 0.5,
  keeperReachPrecisionFactor: 0.4,
  keeperReachMin: 0.05,
  keeperReachMax: 0.5,
  pressureNoiseFactor: 0.15,
  postChance: 0.3,
} as const;

/**
 * Constantes de tuning para el ataque/chance. Mismo estado provisional
 * que PENALTY_TUNING.
 */
export const CHANCE_TUNING = {
  speedReference: 0.004,
  powerGoodMin: 0.55,
  powerGoodMax: 0.9,
  maxUsefulAngle: 0.35,
  goalThreshold: 0.5,
  keeperSaveThreshold: 0.7,
  keeperReachBase: 0.6,
  keeperReachPrecisionFactor: 0.5,
  keeperReachMin: 0.05,
  keeperReachMax: 0.55,
  pressureNoiseFactor: 0.2,
  postChance: 0.25,
  outWeakPowerThreshold: 0.3,
} as const;
