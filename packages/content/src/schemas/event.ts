import { z } from 'zod';

/**
 * Esquema de un efecto de un evento
 */
export const EffectSchema = z.object({
  target: z.string(), // e.g., "relation.squad", "state.form", "personality.professionalism"
  value: z.number(), // Puede ser positivo o negativo
});

/**
 * Esquema de una condición
 */
export const ConditionSchema = z.object({
  field: z.string(), // e.g., "phase", "nextMatch.isDerby", "stat.energy"
  operator: z.enum(['eq', 'neq', 'gt', 'gte', 'lt', 'lte']).optional(),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

/**
 * Esquema de un chequeo de atributo
 */
export const AttributeCheckSchema = z.object({
  attribute: z.string(), // e.g., "professionalism", "charisma"
  difficulty: z.number().min(0).max(100),
});

/**
 * Esquema de un evento diferido
 */
export const DelayedEventSchema = z.object({
  weeks: z.number().int().positive(),
  chance: z.object({
    base: z.number().min(0).max(1),
    modifier: z.string().optional(), // e.g., "-trait.discreet*0.15"
  }),
  trigger: z.string(), // ID del evento a disparar
});

/**
 * Esquema de una opción de evento
 */
export const EventChoiceSchema = z.object({
  id: z.string(),
  text: z.string(), // Clave i18n
  effects: z.array(EffectSchema).optional(),
  check: AttributeCheckSchema.optional(),
  onSuccess: z.array(EffectSchema).optional(),
  onFail: z.array(EffectSchema).optional(),
  delayed: z.array(DelayedEventSchema).optional(),
});

/**
 * Esquema completo de un evento
 */
export const GameEventSchema = z.object({
  id: z.string(),
  category: z.enum(['social', 'professional', 'family', 'financial', 'health', 'media']),
  weight: z.number().int().min(1).max(10), // Probabilidad relativa
  cooldownWeeks: z.number().int().nonnegative(),
  conditions: z.array(ConditionSchema),
  text: z.string(), // Clave i18n
  choices: z.array(EventChoiceSchema).min(2).max(4),
});

export type GameEvent = z.infer<typeof GameEventSchema>;
export type EventChoice = z.infer<typeof EventChoiceSchema>;
export type Effect = z.infer<typeof EffectSchema>;
export type Condition = z.infer<typeof ConditionSchema>;
export type AttributeCheck = z.infer<typeof AttributeCheckSchema>;
export type DelayedEvent = z.infer<typeof DelayedEventSchema>;
