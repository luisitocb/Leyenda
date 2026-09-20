import { describe, expect, it } from 'vitest';

import type { ProtagonistPlayer } from '@leyenda/shared';
import { addDays } from '../world/date-utils';

import { isContractExpiringSoon, isContractRenewalWeek, paySalary } from './contract';

function baseProtagonist(overrides: Partial<ProtagonistPlayer> = {}): ProtagonistPlayer {
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
    activeInjury: null,
    relationshipStatus: 'single',
    activeBrandDeal: null,
    nationalTeamCaps: 0,
    nationalTeamGoals: 0,
    nationalTeamAssists: 0,
    ...overrides,
  };
}

describe('paySalary', () => {
  it('suma exactamente el sueldo semanal al dinero', () => {
    const protagonist = baseProtagonist({ money: 1000, salary: 500 });
    const result = paySalary(protagonist);
    expect(result.money).toBe(1500);
  });
});

describe('isContractExpiringSoon', () => {
  it('es falso sin fecha de contrato', () => {
    expect(isContractExpiringSoon(null, '2026-01-01')).toBe(false);
  });

  it('es falso mucho antes de la ventana de aviso', () => {
    expect(isContractExpiringSoon('2028-08-01', '2028-01-01')).toBe(false);
  });

  it('es verdadero dentro de las 8 semanas previas a la expiración', () => {
    expect(isContractExpiringSoon('2028-08-01', '2028-06-10')).toBe(true);
  });

  it('es verdadero justo en la fecha de expiración', () => {
    expect(isContractExpiringSoon('2028-08-01', '2028-08-01')).toBe(true);
  });

  it('sigue siendo verdadero después de expirar', () => {
    expect(isContractExpiringSoon('2028-08-01', '2028-09-01')).toBe(true);
  });
});

describe('isContractRenewalWeek', () => {
  const contractExpiry = '2028-08-01';
  const boundary = addDays(contractExpiry, -8 * 7);

  it('es falso sin fecha de contrato', () => {
    expect(isContractRenewalWeek(null, '2026-01-01')).toBe(false);
  });

  it('es falso muchas semanas antes de la ventana', () => {
    expect(isContractRenewalWeek(contractExpiry, addDays(boundary, -21))).toBe(false);
  });

  it('es verdadero exactamente en la semana en que empieza la ventana', () => {
    expect(isContractRenewalWeek(contractExpiry, boundary)).toBe(true);
  });

  it('es falso la semana siguiente (ya se avisó la semana anterior)', () => {
    expect(isContractRenewalWeek(contractExpiry, addDays(boundary, 7))).toBe(false);
  });
});
