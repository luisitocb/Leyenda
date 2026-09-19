import { z } from 'zod';

/**
 * Esquema de un origen del personaje (GDD §4.1): modifica el reparto de
 * puntos por grupo, el dinero inicial y, opcionalmente, la edad y las
 * relaciones de partida.
 */
export const OriginSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  attributeGroupBonus: z.object({
    physical: z.number().int(),
    technical: z.number().int(),
    mental: z.number().int(),
  }),
  startingAgeOverride: z.number().int().min(16).max(25).nullable(),
  startingMoney: z.number().int().min(0),
  agentRelationBonus: z.number().int(),
});

export type Origin = z.infer<typeof OriginSchema>;

const RELATION_KEYS = [
  'coach',
  'squad',
  'fans',
  'board',
  'press',
  'partner',
  'family',
  'agent',
  'sponsors',
] as const;

/**
 * Esquema de una acción semanal (GDD §4.5): gasta (o recupera, si es
 * negativo) Energía y aplica un efecto sobre el protagonista.
 */
export const WeeklyActionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  energyCost: z.number().int(),
  effects: z.object({
    attributeGroup: z.enum(['physical', 'technical', 'mental']).nullable(),
    vitalStateDelta: z.object({
      health: z.number().int(),
      mentalHealth: z.number().int(),
      form: z.number().int(),
      fitness: z.number().int(),
    }),
    relationsDelta: z.record(z.enum(RELATION_KEYS), z.number().int()),
    moneyDelta: z.number().int(),
  }),
});

export type WeeklyAction = z.infer<typeof WeeklyActionSchema>;
