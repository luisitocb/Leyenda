import type { Country, CountryCode, ProtagonistPlayer } from '@leyenda/shared';
import { RNG } from '../rng';

import { clamp } from './math';
import {
  MATCH_RATING_FORM_BOOST_THRESHOLD,
  MATCH_RATING_FORM_DELTA,
  MATCH_RATING_FORM_PENALTY_THRESHOLD,
  NATIONAL_TEAM_CALLUP_CHANCE_PER_WEEK,
  NATIONAL_TEAM_MIN_ABILITY,
  type KeyMomentOutcome,
} from './types';

/**
 * Decide si toca convocatoria con la selección esta semana (GDD §4.8). Por
 * debajo de `NATIONAL_TEAM_MIN_ABILITY` ni siquiera se tira: una
 * convocatoria debe sentirse ganada, no un premio aleatorio.
 */
export function shouldReceiveCallUp(protagonist: ProtagonistPlayer, rng: RNG): boolean {
  if (protagonist.currentAbility < NATIONAL_TEAM_MIN_ABILITY) return false;
  return rng.chance(NATIONAL_TEAM_CALLUP_CHANCE_PER_WEEK);
}

/** Elige un país rival distinto al del protagonista. */
export function pickRivalCountry(
  protagonistCountryCode: CountryCode,
  countries: Country[],
  rng: RNG
): Country {
  const rivals = countries.filter((c) => c.code !== protagonistCountryCode);
  return rng.pick(rivals);
}

/**
 * Aplica los efectos de un partido con la selección (mismo cálculo que
 * `applyMatchExperience`, pero sobre el namespace de estadísticas de
 * selección — `gamesPlayed`/`goalsScored`/`assists` de club no se tocan).
 */
export function applyNationalTeamExperience(
  protagonist: ProtagonistPlayer,
  outcomes: KeyMomentOutcome[],
  rating: number
): ProtagonistPlayer {
  const fanRelationDelta = outcomes.reduce((sum, o) => sum + o.fanRelationDelta, 0);
  const formDelta =
    rating >= MATCH_RATING_FORM_BOOST_THRESHOLD
      ? MATCH_RATING_FORM_DELTA
      : rating <= MATCH_RATING_FORM_PENALTY_THRESHOLD
        ? -MATCH_RATING_FORM_DELTA
        : 0;
  const goals = outcomes.filter((o) => o.implies === 'goal').length;
  const assists = outcomes.filter((o) => o.implies === 'assist').length;

  return {
    ...protagonist,
    form: clamp(protagonist.form + formDelta, 0, 99),
    relations: {
      ...protagonist.relations,
      fans: clamp(protagonist.relations.fans + fanRelationDelta, -100, 100),
    },
    nationalTeamCaps: protagonist.nationalTeamCaps + 1,
    nationalTeamGoals: protagonist.nationalTeamGoals + goals,
    nationalTeamAssists: protagonist.nationalTeamAssists + assists,
  };
}
