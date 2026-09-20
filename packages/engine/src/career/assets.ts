import type { ProtagonistPlayer, PurchasableAsset } from '@leyenda/shared';

import { clamp } from './math';

/**
 * Compra un artículo de patrimonio (GDD §4.9): convierte `money` en
 * `assets` al precio del artículo y aplica su `relationsDelta`. Pura, sin
 * RNG. No valida que haya dinero suficiente — frontera de la UI, mismo
 * criterio que `isAffordable` en `week.tsx` para las acciones semanales.
 */
export function purchaseAsset(
  protagonist: ProtagonistPlayer,
  asset: PurchasableAsset
): ProtagonistPlayer {
  return {
    ...protagonist,
    money: protagonist.money - asset.price,
    assets: protagonist.assets + asset.price,
    relations: {
      ...protagonist.relations,
      ...Object.fromEntries(
        Object.entries(asset.relationsDelta).map(([key, delta]) => [
          key,
          clamp(
            protagonist.relations[key as keyof ProtagonistPlayer['relations']] + delta,
            -100,
            100
          ),
        ])
      ),
    },
  };
}
