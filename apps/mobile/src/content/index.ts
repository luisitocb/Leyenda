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
import type { ClubNamePool, Origin, PersonNamePool, WeeklyAction } from '@leyenda/content';
import type { Country, CountryCode, DecisionEvent, InjuryType, KeyMoment } from '@leyenda/shared';

import countriesData from '@leyenda/content/data/worldgen/countries.json';
import clubNamePoolData from '@leyenda/content/data/worldgen/club-names.json';
import originsData from '@leyenda/content/data/career/origins.json';
import weeklyActionsData from '@leyenda/content/data/career/weekly-actions.json';
import keyMomentsData from '@leyenda/content/data/career/key-moments.json';
import eventsData from '@leyenda/content/data/career/events.json';
import injuriesData from '@leyenda/content/data/career/injuries.json';
import namesXA from '@leyenda/content/data/worldgen/person-names/XA.json';
import namesXB from '@leyenda/content/data/worldgen/person-names/XB.json';
import namesXC from '@leyenda/content/data/worldgen/person-names/XC.json';
import namesXD from '@leyenda/content/data/worldgen/person-names/XD.json';
import namesXE from '@leyenda/content/data/worldgen/person-names/XE.json';
import namesXF from '@leyenda/content/data/worldgen/person-names/XF.json';
import namesXG from '@leyenda/content/data/worldgen/person-names/XG.json';
import namesXH from '@leyenda/content/data/worldgen/person-names/XH.json';
import namesXI from '@leyenda/content/data/worldgen/person-names/XI.json';
import namesXJ from '@leyenda/content/data/worldgen/person-names/XJ.json';

export const countries = countriesData as Country[];
export const clubNamePool = clubNamePoolData as ClubNamePool;
export const origins = originsData as Origin[];
export const weeklyActions = weeklyActionsData as WeeklyAction[];
export const keyMoments = keyMomentsData as KeyMoment[];
export const events = eventsData as DecisionEvent[];
export const injuries = injuriesData as InjuryType[];

/** Necesario porque `generateSquad` (worldgen) puede elegir nacionalidad extranjera para un jugador. */
export const namePools: Record<CountryCode, PersonNamePool> = {
  XA: namesXA as PersonNamePool,
  XB: namesXB as PersonNamePool,
  XC: namesXC as PersonNamePool,
  XD: namesXD as PersonNamePool,
  XE: namesXE as PersonNamePool,
  XF: namesXF as PersonNamePool,
  XG: namesXG as PersonNamePool,
  XH: namesXH as PersonNamePool,
  XI: namesXI as PersonNamePool,
  XJ: namesXJ as PersonNamePool,
};
