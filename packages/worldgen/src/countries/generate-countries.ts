import { loadCountries } from '@leyenda/content';
import type { Country } from '@leyenda/shared';

/**
 * Carga los países ficticios desde el contenido de datos, ya validados
 * con Zod. No hay aleatoriedad aquí: el conjunto de países es fijo,
 * definido en packages/content/data/worldgen/countries.json.
 */
export function generateCountries(): Country[] {
  return loadCountries().map((country) => ({
    code: country.code,
    name: country.name,
    reputationBase: country.reputationBase,
  }));
}
