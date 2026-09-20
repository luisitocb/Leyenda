import type { BrandDeal, ProtagonistPlayer } from '@leyenda/shared';
import { RNG } from '../rng';

import { clamp } from './math';
import { BRAND_DEAL_CHANCE_PER_WEEK } from './types';

/**
 * Decide si toca oferta de acuerdo de marca esta semana (GDD §4.10). Quien
 * llama comprueba la elegibilidad (sin acuerdo activo, sin polémicas) —
 * mismo reparto de responsabilidades que `shouldReceiveTransferOffer`.
 */
export function shouldReceiveBrandDealOffer(rng: RNG): boolean {
  return rng.chance(BRAND_DEAL_CHANCE_PER_WEEK);
}

/** Elige un acuerdo del catálogo al azar (sin ponderar por rareza, catálogo pequeño). */
export function generateBrandDealOffer(brandDeals: BrandDeal[], rng: RNG): BrandDeal {
  return rng.pick(brandDeals);
}

/** Aceptar un acuerdo: pura, sin RNG. */
export function acceptBrandDeal(
  protagonist: ProtagonistPlayer,
  deal: BrandDeal
): ProtagonistPlayer {
  return {
    ...protagonist,
    money: protagonist.money + deal.signingBonus,
    activeBrandDeal: { dealId: deal.id, weeksRemaining: deal.durationWeeks },
  };
}

/**
 * Resuelve el acuerdo de marca en curso, si lo hay (llamar cada semana,
 * no-op sin acuerdo activo). Si el protagonista es `controversial`, el
 * acuerdo se rompe con penalización (GDD: "Romper una cláusula de imagen
 * implica penalización económica"); si no, cobra y avanza una semana,
 * terminando limpio al llegar a 0.
 */
export function advanceBrandDeal(
  protagonist: ProtagonistPlayer,
  brandDeals: BrandDeal[]
): ProtagonistPlayer {
  if (!protagonist.activeBrandDeal) return protagonist;

  const deal = brandDeals.find((d) => d.id === protagonist.activeBrandDeal!.dealId);
  if (!deal) return { ...protagonist, activeBrandDeal: null };

  if (protagonist.traits.includes('controversial')) {
    return {
      ...protagonist,
      activeBrandDeal: null,
      money: protagonist.money - deal.breachPenalty,
    };
  }

  const weeksRemaining = protagonist.activeBrandDeal.weeksRemaining - 1;
  return {
    ...protagonist,
    money: protagonist.money + deal.weeklyIncome,
    relations: {
      ...protagonist.relations,
      ...Object.fromEntries(
        Object.entries(deal.weeklyRelationsDelta).map(([key, delta]) => [
          key,
          clamp(
            protagonist.relations[key as keyof ProtagonistPlayer['relations']] + delta,
            -100,
            100
          ),
        ])
      ),
    },
    activeBrandDeal: weeksRemaining > 0 ? { ...protagonist.activeBrandDeal, weeksRemaining } : null,
  };
}
