import { describe, expect, it } from 'vitest';

import type { ProtagonistPlayer } from '@leyenda/shared';

import {
  applyAgeDecline,
  calculateAge,
  calculateLegacyScore,
  isBirthdayWeek,
  shouldForceRetirement,
} from './decline';

function baseProtagonist(overrides: Partial<ProtagonistPlayer> = {}): ProtagonistPlayer {
  return {
    id: 'protagonist-1',
    firstName: 'Test',
    lastName: 'Player',
    nationality: 'XA',
    dateOfBirth: '1995-06-15',
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
    clubId: 'club-1',
    contractExpiry: '2028-08-01',
    value: 50_000,
    health: 70,
    mentalHealth: 70,
    energy: 100,
    money: 400,
    assets: 0,
    salary: 500,
    relations: {
      coach: 0,
      squad: 0,
      fans: 20,
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
    activeInjury: null,
    ...overrides,
  };
}

describe('calculateAge', () => {
  it('antes del cumpleaños de este año, no cuenta el año en curso', () => {
    expect(calculateAge('1995-06-15', '2026-06-14')).toBe(30);
  });

  it('el mismo día del cumpleaños ya cuenta el año', () => {
    expect(calculateAge('1995-06-15', '2026-06-15')).toBe(31);
  });

  it('después del cumpleaños de este año', () => {
    expect(calculateAge('1995-06-15', '2026-12-01')).toBe(31);
  });

  it('coincide con la edad usada al crear el personaje (17 años)', () => {
    expect(calculateAge('2008-08-01', '2026-01-15')).toBe(17);
  });
});

describe('isBirthdayWeek', () => {
  it('es falso lejos del cumpleaños', () => {
    expect(isBirthdayWeek('1995-06-15', '2026-01-05')).toBe(false);
  });

  it('es verdadero solo la semana exacta en que se cumplen años', () => {
    expect(isBirthdayWeek('1995-06-15', '2026-06-18')).toBe(true);
  });

  it('es falso la semana siguiente al cumpleaños', () => {
    expect(isBirthdayWeek('1995-06-15', '2026-06-25')).toBe(false);
  });
});

describe('applyAgeDecline', () => {
  it('no toca nada por debajo de la edad de declive', () => {
    const protagonist = baseProtagonist({ dateOfBirth: '2000-01-01' });
    const result = applyAgeDecline(protagonist, '2026-01-01');
    expect(result.physical).toEqual(protagonist.physical);
  });

  it('resta AGE_DECLINE_PER_YEAR a partir de la edad de declive', () => {
    const protagonist = baseProtagonist({ dateOfBirth: '1995-01-01' });
    const result = applyAgeDecline(protagonist, '2026-06-01');
    expect(result.physical.speed).toBe(48);
    expect(result.physical.stamina).toBe(48);
    expect(result.physical.strength).toBe(48);
    expect(result.physical.jumping).toBe(48);
  });

  it('nunca baja de 1', () => {
    const protagonist = baseProtagonist({
      dateOfBirth: '1980-01-01',
      physical: { speed: 2, stamina: 2, strength: 2, jumping: 2 },
    });
    const result = applyAgeDecline(protagonist, '2026-06-01');
    expect(result.physical.speed).toBe(1);
  });
});

describe('shouldForceRetirement', () => {
  it('es falso antes de la edad de retirada forzosa', () => {
    expect(
      shouldForceRetirement(baseProtagonist({ dateOfBirth: '1990-01-01' }), '2026-06-01')
    ).toBe(false);
  });

  it('es verdadero a partir de la edad de retirada forzosa', () => {
    expect(
      shouldForceRetirement(baseProtagonist({ dateOfBirth: '1988-01-01' }), '2026-06-01')
    ).toBe(true);
  });
});

describe('calculateLegacyScore', () => {
  it('es determinista', () => {
    const protagonist = baseProtagonist({ gamesPlayed: 50, goalsScored: 20, assists: 10 });
    expect(calculateLegacyScore(protagonist)).toBe(calculateLegacyScore(protagonist));
  });

  it('sube con más títulos, partidos, goles y asistencias', () => {
    const rookie = baseProtagonist();
    const veteran = baseProtagonist({
      gamesPlayed: 200,
      goalsScored: 80,
      assists: 60,
      titlesWon: ['season-liga-a-2026'],
    });
    expect(calculateLegacyScore(veteran)).toBeGreaterThan(calculateLegacyScore(rookie));
  });
});
