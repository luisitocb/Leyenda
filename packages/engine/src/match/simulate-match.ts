import type { BasePlayer, EntityId, Match, MatchEvent } from '@leyenda/shared';
import { RNG } from '../rng';

import { clamp, pickWeighted } from './math';
import { resolveCards, resolveInjuries } from './secondary-events';
import { computeTeamStrength, selectStartingXI } from './team-strength';
import { MATCH_TUNING, type StartingXI, type TeamStrength } from './types';

function getShooting(p: BasePlayer): number {
  return 'shooting' in p.technical ? p.technical.shooting : 0;
}

function applyDayFactor(strength: TeamStrength, rng: RNG): TeamStrength {
  const factor = rng.nextFloat(1 - MATCH_TUNING.dayFormVariance, 1 + MATCH_TUNING.dayFormVariance);
  return {
    defense: strength.defense * factor,
    midfield: strength.midfield * factor,
    attack: strength.attack * factor,
    goalkeeping: strength.goalkeeping * factor,
  };
}

function attackingPool(xi: StartingXI): BasePlayer[] {
  return xi.outfield.filter(
    (p) => p.position !== 'CB' && p.position !== 'LB' && p.position !== 'RB'
  );
}

function resolveGoal(
  attackingXI: StartingXI,
  team: 'home' | 'away',
  minute: number,
  rng: RNG
): MatchEvent[] {
  const pool = attackingPool(attackingXI);
  const scorer = pickWeighted(pool, (p) => Math.max(1, getShooting(p)), rng);
  const events: MatchEvent[] = [{ minute, type: 'goal', playerId: scorer.id, team }];

  if (rng.chance(MATCH_TUNING.assistProbability)) {
    const assistCandidates = pool.filter((p) => p.id !== scorer.id);
    if (assistCandidates.length > 0) {
      const assister = pickWeighted(assistCandidates, (p) => Math.max(1, getShooting(p)), rng);
      events.push({ minute, type: 'assist', playerId: assister.id, team });
    }
  }

  return events;
}

function chunkChanceProbability(attack: number, defense: number, hasPossession: boolean): number {
  return clamp(
    MATCH_TUNING.baseChancePerChunk +
      (attack - defense) / MATCH_TUNING.chanceZoneDivisor +
      (hasPossession ? MATCH_TUNING.possessionChanceBonus : 0),
    MATCH_TUNING.chanceClampMin,
    MATCH_TUNING.chanceClampMax
  );
}

function conversionProbability(attack: number, goalkeeping: number): number {
  return clamp(
    MATCH_TUNING.baseConversion + (attack - goalkeeping) / MATCH_TUNING.conversionZoneDivisor,
    MATCH_TUNING.conversionClampMin,
    MATCH_TUNING.conversionClampMax
  );
}

/**
 * Simula un partido completo en tramos de 5 minutos (GDD §7): posesión →
 * ocasión → conversión, más eventos secundarios (tarjetas, lesiones).
 * Función pura y determinista dado el mismo (match, plantillas, rng).
 * No conoce World ni fixtures — aislada a propósito para poder
 * envolverla después con un router "completo vs. modelo barato" sin
 * tocar su firma (GDD §7, "simulación a distintos niveles de detalle").
 */
export function simulateMatch(
  match: Match,
  homeSquad: BasePlayer[],
  awaySquad: BasePlayer[],
  rng: RNG
): Match {
  const homeXI = selectStartingXI(match.homeTeamId, homeSquad);
  const awayXI = selectStartingXI(match.awayTeamId, awaySquad);

  // "El día de cada equipo": promediar 11 jugadores reduce mucho la
  // varianza de la fuerza calculada, así que sin este factor una
  // ventaja de calidad modesta se traduce en victorias casi seguras
  // partido tras partido (detectado con balance-sim: clubes ganando
  // >70% de las temporadas). Ruido multiplicativo por partido y por
  // equipo, simétrico alrededor de 1.0 así que no mueve la media de
  // goles, solo añade variabilidad entre partidos.
  const home = applyDayFactor(computeTeamStrength(homeXI, true), rng);
  const away = applyDayFactor(computeTeamStrength(awayXI, false), rng);

  const events: MatchEvent[] = [];
  const cautionedHome = new Set<string>();
  const cautionedAway = new Set<string>();
  let homeGoals = 0;
  let awayGoals = 0;

  for (let chunk = 0; chunk < MATCH_TUNING.chunksPerMatch; chunk++) {
    const chunkStartMinute = chunk * MATCH_TUNING.chunkMinutes;

    const possessionHome = clamp(
      MATCH_TUNING.basePossession +
        (home.midfield - away.midfield) / MATCH_TUNING.possessionZoneDivisor,
      MATCH_TUNING.possessionClampMin,
      MATCH_TUNING.possessionClampMax
    );
    const homeHasPossession = rng.chance(possessionHome);

    if (rng.chance(chunkChanceProbability(home.attack, away.defense, homeHasPossession))) {
      if (rng.chance(conversionProbability(home.attack, away.goalkeeping))) {
        homeGoals++;
        events.push(...resolveGoal(homeXI, 'home', chunkStartMinute + rng.nextInt(1, 5), rng));
      }
    }

    if (rng.chance(chunkChanceProbability(away.attack, home.defense, !homeHasPossession))) {
      if (rng.chance(conversionProbability(away.attack, home.goalkeeping))) {
        awayGoals++;
        events.push(...resolveGoal(awayXI, 'away', chunkStartMinute + rng.nextInt(1, 5), rng));
      }
    }

    const homeTitulars = [homeXI.goalkeeper, ...homeXI.outfield];
    const awayTitulars = [awayXI.goalkeeper, ...awayXI.outfield];
    events.push(...resolveCards(homeTitulars, 'home', chunkStartMinute + 2, rng, cautionedHome));
    events.push(...resolveCards(awayTitulars, 'away', chunkStartMinute + 2, rng, cautionedAway));
    events.push(...resolveInjuries(homeTitulars, 'home', chunkStartMinute + 3, rng));
    events.push(...resolveInjuries(awayTitulars, 'away', chunkStartMinute + 3, rng));
  }

  events.sort((a, b) => a.minute - b.minute);

  return {
    ...match,
    result: { homeGoals, awayGoals },
    events,
    simulated: true,
  };
}

/**
 * Resuelve todos los partidos de una jornada (una ronda, en todas las
 * competiciones a la vez es el caso real de "simular una semana" del
 * mundo — regla 9 de CLAUDE.md: <500ms). El llamador debe pre-indexar
 * `playersByClub` una sola vez antes de simular la jornada; no lo hace
 * esta función para no repetir el filtrado sobre plantillas grandes en
 * cada llamada.
 */
export function simulateMatchday(
  matches: Match[],
  playersByClub: Map<EntityId, BasePlayer[]>
): Match[] {
  return matches.map((match) => {
    const homeSquad = playersByClub.get(match.homeTeamId) ?? [];
    const awaySquad = playersByClub.get(match.awayTeamId) ?? [];
    return simulateMatch(match, homeSquad, awaySquad, new RNG(match.seed));
  });
}
