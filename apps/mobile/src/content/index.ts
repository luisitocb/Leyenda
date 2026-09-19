/**
 * Puente entre @leyenda/content y la app móvil.
 *
 * @leyenda/content carga sus datos con `node:fs` (packages/content/src/worldgen/load.ts,
 * career/load.ts): eso funciona en Node (tests, CLIs, `content:validate`) pero no en el
 * runtime de Expo/Hermes, que no tiene sistema de ficheros. Por eso aquí se importan los
 * mismos ficheros JSON de forma estática (Metro los empaqueta como cualquier otro módulo,
 * sin `fs`) en vez de llamar a `loadCountries`/`loadOrigins`/`loadClubNamePool`. El
 * contenido ya está validado en CI vía `pnpm content:validate`, así que no hace falta
 * revalidar con Zod en cada dispositivo.
 */
import type { ClubNamePool, Origin, WeeklyAction } from '@leyenda/content';
import type { Country } from '@leyenda/shared';

import countriesData from '@leyenda/content/data/worldgen/countries.json';
import clubNamePoolData from '@leyenda/content/data/worldgen/club-names.json';
import originsData from '@leyenda/content/data/career/origins.json';
import weeklyActionsData from '@leyenda/content/data/career/weekly-actions.json';

export const countries = countriesData as Country[];
export const clubNamePool = clubNamePoolData as ClubNamePool;
export const origins = originsData as Origin[];
export const weeklyActions = weeklyActionsData as WeeklyAction[];
