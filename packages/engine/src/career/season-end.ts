import type { ProtagonistPlayer } from '@leyenda/shared';

/**
 * Cierra la temporada para el protagonista: si `titleWon` no es null, se
 * añade a `titlesWon` (GDD §4.8 solo contempla el título de liga por ahora).
 * Pura, sin RNG: quién queda campeón ya lo decide la clasificación.
 */
export function applySeasonEndResult(
  protagonist: ProtagonistPlayer,
  titleWon: string | null
): ProtagonistPlayer {
  if (!titleWon || protagonist.titlesWon.includes(titleWon)) return protagonist;
  return { ...protagonist, titlesWon: [...protagonist.titlesWon, titleWon] };
}
