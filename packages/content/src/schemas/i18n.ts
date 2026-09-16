import { z } from 'zod';

/**
 * Esquema de las traducciones
 *
 * Todas las claves de texto deben estar en español e inglés
 */
export const I18nSchema = z.record(z.string(), z.string());

export type I18nDictionary = z.infer<typeof I18nSchema>;
