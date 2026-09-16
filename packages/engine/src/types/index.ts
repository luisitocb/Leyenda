import type { Seed } from '@leyenda/shared';

/**
 * Estado del juego (guardado)
 */
export interface GameState {
  version: string;
  seed: Seed;
  currentDate: string;
  // ... se expandirá
}

/**
 * Comando ejecutado por el jugador
 */
export interface Command {
  type: string;
  payload: Record<string, unknown>;
}

/**
 * Evento generado por el motor
 */
export interface GameEvent {
  type: string;
  data: Record<string, unknown>;
}

/**
 * Resultado de aplicar un comando
 */
export interface CommandResult {
  newState: GameState;
  events: GameEvent[];
}
