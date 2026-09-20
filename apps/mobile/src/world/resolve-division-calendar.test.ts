import type { ProtagonistPlayer } from '@leyenda/shared';
import { addDays } from '@leyenda/engine';
import { SEASON_ONE_START_DATE } from '@leyenda/worldgen/src/constants';

import { countries } from '@/content';
import { isSeasonJustEnded, resolveDivisionCalendar } from './resolve-division-calendar';

const SEED = 42;

function makeProtagonist(overrides: Partial<ProtagonistPlayer> = {}): ProtagonistPlayer {
  return {
    id: 'protagonist-1',
    firstName: 'Test',
    lastName: 'Player',
    nationality: 'XA',
    dateOfBirth: '2008-08-01',
    position: 'CF',
    foot: 'right',
    physical: { speed: 50, stamina: 50, strength: 50, jumping: 50 },
    technical: {
      passing: 50,
      dribbling: 50,
      shooting: 50,
      ballControl: 50,
      defending: 50,
      heading: 50,
    },
    mental: { vision: 50, composure: 50, leadership: 50, teamwork: 50 },
    personality: { professionalism: 50, charisma: 50, ego: 50, temperament: 50 },
    potential: 60,
    currentAbility: 50,
    form: 70,
    morale: 70,
    fitness: 70,
    clubId: 'club-XA-2-1',
    contractExpiry: '2028-08-01',
    value: 50_000,
    health: 70,
    mentalHealth: 70,
    energy: 100,
    money: 400,
    assets: 0,
    relations: {
      coach: 0,
      squad: 0,
      fans: 0,
      board: 0,
      press: 0,
      partner: 0,
      family: 0,
      agent: 0,
      sponsors: 0,
    },
    traits: [],
    gamesPlayed: 0,
    goalsScored: 0,
    assists: 0,
    titlesWon: [],
    ...overrides,
  };
}

describe('isSeasonJustEnded', () => {
  it('es false durante la temporada, incluida la fecha del último partido', () => {
    const resolved = resolveDivisionCalendar(SEED, makeProtagonist(), countries);
    expect(resolved).not.toBeNull();
    expect(isSeasonJustEnded(resolved!.calendar, SEASON_ONE_START_DATE)).toBe(false);
    expect(isSeasonJustEnded(resolved!.calendar, resolved!.calendar.season.endDate)).toBe(false);
  });

  it('es true exactamente la semana siguiente al último partido', () => {
    const resolved = resolveDivisionCalendar(SEED, makeProtagonist(), countries);
    expect(resolved).not.toBeNull();
    const weekAfterEnd = addDays(resolved!.calendar.season.endDate, 7);
    expect(isSeasonJustEnded(resolved!.calendar, weekAfterEnd)).toBe(true);
  });

  it('es false varias semanas después de terminada la temporada', () => {
    const resolved = resolveDivisionCalendar(SEED, makeProtagonist(), countries);
    expect(resolved).not.toBeNull();
    const monthsAfterEnd = addDays(resolved!.calendar.season.endDate, 28);
    expect(isSeasonJustEnded(resolved!.calendar, monthsAfterEnd)).toBe(false);
  });
});
