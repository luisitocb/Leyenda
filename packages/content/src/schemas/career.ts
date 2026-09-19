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
