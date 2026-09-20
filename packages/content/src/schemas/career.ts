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

const POSITIONS = ['GK', 'LB', 'CB', 'RB', 'DMF', 'CMF', 'AMF', 'LW', 'RW', 'CF'] as const;

const ATTRIBUTE_NAMES = [
  'speed',
  'stamina',
  'strength',
  'jumping',
  'passing',
  'dribbling',
  'shooting',
  'ballControl',
  'defending',
  'heading',
  'reflexes',
  'positioning',
  'aerialAbility',
  'vision',
  'composure',
  'leadership',
  'teamwork',
] as const;

/**
 * Esquema de un momento clave (GDD §4.7): tarjeta de decisión durante un
 * partido normal. `baseSuccessChance` es el punto de partida antes de que
 * el motor sume el atributo relevante, la forma y la moral.
 */
export const KeyMomentSchema = z.object({
  id: z.string().min(1),
  situation: z.string().min(1),
  positions: z.union([z.literal('any'), z.array(z.enum(POSITIONS)).min(1)]),
  choices: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        determinedBy: z.enum(ATTRIBUTE_NAMES),
        baseSuccessChance: z.number().min(0).max(1),
        ratingDelta: z.object({ onSuccess: z.number(), onFail: z.number() }),
        fanRelationDelta: z.object({ onSuccess: z.number().int(), onFail: z.number().int() }),
        implies: z.enum(['goal', 'assist']).nullable(),
      })
    )
    .min(2),
});

// Sin `export type KeyMoment = z.infer<...>`: la forma canónica ya vive en
// @leyenda/shared (KeyMoment/KeyMomentChoice) — este esquema solo valida
// que el JSON de contenido encaje en ella, no define un tipo paralelo.

const PERSONALITY_KEYS = ['professionalism', 'charisma', 'ego', 'temperament'] as const;

/**
 * `check.determinedBy` de un evento de decisión puede apuntar a Personalidad
 * además de físico/técnico/mental (a diferencia de un momento clave de
 * partido, que solo usa atributos deportivos) — el GDD lo pide explícitamente
 * ("check: { attribute: professionalism, difficulty: 55 }").
 */
const EVENT_CHECK_ATTRIBUTE_NAMES = [...ATTRIBUTE_NAMES, ...PERSONALITY_KEYS] as const;

const PLAYER_TRAITS = [
  'partyAnimal',
  'exemplary',
  'controversial',
  'leader',
  'discreet',
  'media-friendly',
  'hothead',
  'clutch',
] as const;

const DecisionEventEffectsSchema = z.object({
  attributeGroup: z.enum(['physical', 'technical', 'mental']).nullable(),
  personalityDelta: z.record(z.enum(PERSONALITY_KEYS), z.number().int()),
  vitalStateDelta: z.object({
    health: z.number().int(),
    mentalHealth: z.number().int(),
    form: z.number().int(),
    fitness: z.number().int(),
  }),
  relationsDelta: z.record(z.enum(RELATION_KEYS), z.number().int()),
  moneyDelta: z.number().int(),
});

/**
 * Esquema de un evento de decisión (GDD §4.6): tarjeta semanal con 2-4
 * opciones. Si `check` es `null` en una opción, `effects` se aplica
 * siempre; si no, `effects` es la rama de éxito y `onFailEffects` la de
 * fallo. Sin condiciones de disparo ni consecuencias diferidas todavía —
 * fuera de alcance de este primer slice.
 */
export const DecisionEventSchema = z.object({
  id: z.string().min(1),
  category: z.string().min(1),
  text: z.string().min(1),
  weight: z.number().positive(),
  choices: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        check: z
          .object({
            determinedBy: z.enum(EVENT_CHECK_ATTRIBUTE_NAMES),
            baseSuccessChance: z.number().min(0).max(1),
          })
          .nullable(),
        effects: DecisionEventEffectsSchema,
        onFailEffects: DecisionEventEffectsSchema.nullable(),
        grantsTrait: z
          .object({ trait: z.enum(PLAYER_TRAITS), chance: z.number().min(0).max(1) })
          .nullable(),
      })
    )
    .min(2)
    .max(4),
});

// Sin `export type DecisionEvent = z.infer<...>`: mismo motivo que KeyMoment
// — la forma canónica vive en @leyenda/shared.
