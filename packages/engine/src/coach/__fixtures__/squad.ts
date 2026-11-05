import type { Club, Position, SquadPlayer } from '@leyenda/shared';

let counter = 0;

/** Jugador de plantilla de prueba con todos los atributos iguales a `ability`. */
export function makeSquadPlayer(
  position: Position,
  ability: number,
  overrides: Partial<SquadPlayer> = {}
): SquadPlayer {
  counter++;
  return {
    id: `p-${counter}`,
    firstName: 'Test',
    lastName: `Player${counter}`,
    nationality: 'XA',
    dateOfBirth: '2000-01-01',
    position,
    foot: 'right',
    physical: { speed: ability, stamina: ability, strength: ability, jumping: ability },
    technical:
      position === 'GK'
        ? { reflexes: ability, positioning: ability, aerialAbility: ability }
        : {
            passing: ability,
            dribbling: ability,
            shooting: ability,
            ballControl: ability,
            defending: ability,
            heading: ability,
          },
    mental: { vision: ability, composure: ability, leadership: ability, teamwork: ability },
    personality: { professionalism: 50, charisma: 50, ego: 50, temperament: 50 },
    potential: ability,
    currentAbility: ability,
    form: 65,
    morale: 70,
    fitness: 80,
    clubId: 'club-1',
    contractExpiry: null,
    value: 0,
    injuryWeeks: 0,
    seasonAppearances: 0,
    seasonGoals: 0,
    ...overrides,
  };
}

/** Plantilla completa de 22 jugadores (dos por puesto del 4-4-2 y algún extra). */
export function makeSquad(ability: number): SquadPlayer[] {
  const positions: Position[] = [
    'GK',
    'GK',
    'CB',
    'CB',
    'CB',
    'CB',
    'LB',
    'LB',
    'RB',
    'RB',
    'DMF',
    'DMF',
    'CMF',
    'CMF',
    'AMF',
    'AMF',
    'LW',
    'LW',
    'RW',
    'RW',
    'CF',
    'CF',
  ];
  return positions.map((p) => makeSquadPlayer(p, ability));
}

export function makeClub(overrides: Partial<Club> = {}): Club {
  return {
    id: 'club-1',
    name: 'Club de Prueba',
    shortName: 'CDP',
    countryCode: 'XA',
    reputation: 10,
    divisionLevel: 1,
    money: 1_000_000,
    ...overrides,
  };
}
