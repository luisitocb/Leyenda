import { z } from 'zod';

/**
 * Esquema de un país ficticio de worldgen
 */
export const CountrySchema = z.object({
  code: z.string().regex(/^[A-Z]{2}$/),
  name: z.string().min(1),
  reputationBase: z.number().min(1).max(20),
});

/**
 * Esquema del pool generativo de nombres de club (composicional, no lista plana)
 */
export const ClubNamePoolSchema = z.object({
  cityPrefixes: z.array(z.string().min(1)).min(20),
  citySuffixes: z.array(z.string().min(1)).min(15),
  clubSuffixes: z.array(z.string().min(1)).min(10),
});

/**
 * Esquema de un pool de nombres de persona (uno por país)
 */
export const PersonNamePoolSchema = z.object({
  firstNames: z.array(z.string().min(1)).min(40),
  lastNames: z.array(z.string().min(1)).min(40),
});

export type CountryData = z.infer<typeof CountrySchema>;
export type ClubNamePool = z.infer<typeof ClubNamePoolSchema>;
export type PersonNamePool = z.infer<typeof PersonNamePoolSchema>;
