import type { Club, ContractOffer, ISODate, ProtagonistPlayer } from '@leyenda/shared';
import { RNG } from '../rng';

import { pickWeighted } from '../match/math';
import { addYears } from '../world/date-utils';
import { clamp } from './math';
import {
  SALARY_PER_ABILITY,
  SUCCESS_CHANCE_MAX,
  SUCCESS_CHANCE_MIN,
  TRANSFER_OFFER_CHANCE_PER_WEEK,
} from './types';

/** Prima de renovación/fichaje como fracción del sueldo ofrecido. */
const SIGNING_BONUS_FACTOR = 0.5;

/** Subida de sueldo al ganar la ronda de negociación. */
const NEGOTIATION_SUCCESS_RAISE = 0.15;

/**
 * Genera la oferta de renovación del club actual (GDD §4.8), disparada
 * cuando el contrato entra en la ventana de expiración próxima
 * (`isContractRenewalWeek`). El sueldo parte del mismo cálculo que al crear
 * el personaje (`currentAbility * SALARY_PER_ABILITY`) ajustado por lo bien
 * que te lleves con la directiva.
 */
export function generateRenewalOffer(protagonist: ProtagonistPlayer, rng: RNG): ContractOffer {
  if (!protagonist.clubId) {
    throw new Error('No se puede renovar sin un club actual');
  }
  const baseSalary = protagonist.currentAbility * SALARY_PER_ABILITY;
  const boardFactor = 1 + protagonist.relations.board / 500;
  const salary = Math.round(baseSalary * boardFactor);
  return {
    clubId: protagonist.clubId,
    salary,
    durationYears: rng.nextInt(1, 3),
    signingBonus: Math.round(salary * SIGNING_BONUS_FACTOR),
  };
}

export interface NegotiationResult {
  offer: ContractOffer;
  success: boolean;
}

/**
 * Una única ronda de "pedir mejora" (GDD §4.8: "negociación por turnos con
 * el club y tu agente") — no es un ida-y-vuelta multi-turno todavía, solo
 * un intento con la misma fórmula de probabilidad que el resto de checks
 * del juego (agente + carisma).
 */
export function negotiateOffer(
  offer: ContractOffer,
  protagonist: ProtagonistPlayer,
  rng: RNG
): NegotiationResult {
  const successProbability = clamp(
    0.4 + protagonist.relations.agent / 300 + (protagonist.personality.charisma - 50) / 300,
    SUCCESS_CHANCE_MIN,
    SUCCESS_CHANCE_MAX
  );
  const success = rng.chance(successProbability);
  if (!success) return { offer, success };
  return {
    offer: { ...offer, salary: Math.round(offer.salary * (1 + NEGOTIATION_SUCCESS_RAISE)) },
    success,
  };
}

/**
 * Aplica una oferta aceptada (renovación o fichaje, misma estructura): pura,
 * sin RNG. Quien llama decide qué otros efectos tiene aceptar (p. ej. un
 * fichaje resetea relaciones ligadas al club anterior).
 */
export function acceptContractOffer(
  protagonist: ProtagonistPlayer,
  offer: ContractOffer,
  currentDate: ISODate
): ProtagonistPlayer {
  return {
    ...protagonist,
    clubId: offer.clubId,
    salary: offer.salary,
    contractExpiry: addYears(currentDate, offer.durationYears),
    money: protagonist.money + offer.signingBonus,
  };
}

/**
 * Decide si toca oferta de fichaje esta semana (GDD §4.8). Separado de
 * `generateTransferOffer` a propósito, mismo patrón que
 * `shouldTriggerLivePlay`/`convertLiveOutcomeToKeyMomentOutcome`: quien
 * llama solo necesita esto para decidir a qué pantalla navegar, sin tener
 * que descartar ya una oferta generada.
 */
export function shouldReceiveTransferOffer(rng: RNG): boolean {
  return rng.chance(TRANSFER_OFFER_CHANCE_PER_WEEK);
}

/**
 * Genera una oferta de otro club (GDD §4.8: "ofertas según tu nivel,
 * visibilidad de la liga y fama"). Asume que ya se decidió que toca oferta
 * esta semana (`shouldReceiveTransferOffer`) — no vuelve a tirar esa
 * probabilidad. El club se elige ponderado por reputación (proxy de
 * "visibilidad de la liga" mientras no exista un campo de fama separado) y
 * el sueldo ofrecido es siempre algo mayor que el actual, para que la
 * oferta resulte tentadora.
 */
export function generateTransferOffer(
  protagonist: ProtagonistPlayer,
  divisionClubs: Club[],
  rng: RNG
): ContractOffer {
  const rivalClubs = divisionClubs.filter((c) => c.id !== protagonist.clubId);
  if (rivalClubs.length === 0) {
    throw new Error('No hay clubes rivales de los que recibir una oferta de fichaje');
  }
  const club = pickWeighted(rivalClubs, (c) => c.reputation, rng);
  const salary = Math.round(protagonist.salary * rng.nextFloat(1.05, 1.3));
  return {
    clubId: club.id,
    salary,
    durationYears: rng.nextInt(1, 3),
    signingBonus: Math.round(salary * SIGNING_BONUS_FACTOR),
  };
}

/**
 * Aceptar un fichaje, a diferencia de una renovación, deja atrás al club
 * anterior: las relaciones que dependían de él (entrenador, vestuario,
 * afición) vuelven a 0 en el club nuevo.
 */
export function acceptTransferOffer(
  protagonist: ProtagonistPlayer,
  offer: ContractOffer,
  currentDate: ISODate
): ProtagonistPlayer {
  const updated = acceptContractOffer(protagonist, offer, currentDate);
  return {
    ...updated,
    relations: { ...updated.relations, coach: 0, squad: 0, fans: 0 },
  };
}
