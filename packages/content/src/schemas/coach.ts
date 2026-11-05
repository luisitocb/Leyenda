import { z } from 'zod';

/**
 * Esquema de una rueda de prensa del Modo Entrenador (GDD §6.1): pregunta
 * de un periodista y 2-4 respuestas con efectos sobre la moral del
 * vestuario, la confianza de la directiva y la reputación del entrenador.
 */
export const PressConferenceSchema = z.object({
  id: z.string().min(1),
  context: z.enum(['pre_match', 'after_win', 'after_loss']),
  question: z.string().min(1),
  weight: z.number().int().min(1),
  answers: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        effects: z.object({
          squadMorale: z.number().int().min(-15).max(15),
          boardConfidence: z.number().int().min(-15).max(15),
          reputation: z.number().int().min(-1).max(1),
        }),
      })
    )
    .min(2)
    .max(4),
});

// Sin `export type PressConference = z.infer<...>`: la forma canónica vive
// en @leyenda/shared, igual que DecisionEvent.
