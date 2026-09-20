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

/**
 * Esquema de un club real autorado a mano (ADR-004): a diferencia de los
 * clubes ficticios, el nombre y la reputación no se generan, se deciden a
 * mano — los clubes reales de una misma división no son igual de fuertes.
 */
export const RealClubSchema = z.object({
  name: z.string().min(1),
  shortName: z.string().min(1),
  reputation: z.number().min(1).max(20),
});

/**
 * Plantilla real de un país (ADR-004): claves = nivel de división como
 * string ("1", "2"), valores = lista de clubes de esa división.
 */
export const RealClubRosterSchema = z.record(
  z.string().regex(/^\d+$/),
  z.array(RealClubSchema).min(1)
);

export type RealClub = z.infer<typeof RealClubSchema>;
export type RealClubRoster = z.infer<typeof RealClubRosterSchema>;
