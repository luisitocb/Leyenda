import type { AttributeValue, CountryCode, EntityId, Foot, ISODate, Position } from './common';
import type { ActiveBrandDeal, PlayerInjury } from './career';

/**
 * Atributos físicos de un jugador
 */
export interface PhysicalAttributes {
  speed: AttributeValue;
  stamina: AttributeValue;
  strength: AttributeValue;
  jumping: AttributeValue;
}

/**
 * Atributos técnicos de un jugador de campo
 */
export interface TechnicalAttributes {
  passing: AttributeValue;
  dribbling: AttributeValue;
  shooting: AttributeValue;
  ballControl: AttributeValue;
  defending: AttributeValue;
  heading: AttributeValue;
}

/**
 * Atributos técnicos de un portero
 */
export interface GoalkeeperAttributes {
  reflexes: AttributeValue;
  positioning: AttributeValue;
  aerialAbility: AttributeValue;
}

/**
 * Atributos mentales de un jugador
 */
export interface MentalAttributes {
  vision: AttributeValue;
  composure: AttributeValue;
  leadership: AttributeValue;
  teamwork: AttributeValue;
}

/**
 * Atributos de personalidad
 */
export interface PersonalityAttributes {
  professionalism: AttributeValue;
  charisma: AttributeValue;
  ego: AttributeValue;
  temperament: AttributeValue;
}

/**
 * Jugador base (estructura común)
 */
export interface BasePlayer {
  id: EntityId;
  firstName: string;
  lastName: string;
  nationality: CountryCode;
  dateOfBirth: ISODate;
  position: Position;
  foot: Foot;

  // Atributos
  physical: PhysicalAttributes;
  technical: TechnicalAttributes | GoalkeeperAttributes;
  mental: MentalAttributes;
  personality: PersonalityAttributes;

  // Potencial y desarrollo
  potential: AttributeValue; // Oculto
  currentAbility: AttributeValue; // Media global calculada

  // Estado actual
  form: AttributeValue; // 0-99
  morale: AttributeValue; // 0-99
  fitness: AttributeValue; // 0-100

  // Contrato
  clubId: EntityId | null;
  contractExpiry: ISODate | null;
  value: number; // Valor de mercado en dinero
}

/**
 * Rasgos adquiridos por el jugador
 */
export type PlayerTrait =
  | 'partyAnimal'
  | 'exemplary'
  | 'controversial'
  | 'leader'
  | 'discreet'
  | 'media-friendly'
  | 'hothead'
  | 'clutch';

/**
 * Jugador protagonista (Modo Jugador)
 */
export interface ProtagonistPlayer extends BasePlayer {
  // Estados vitales
  health: AttributeValue; // Salud física
  mentalHealth: AttributeValue; // Salud mental
  energy: number; // Energía semanal (0-100)
  money: number;
  assets: number; // Patrimonio total
  salary: number; // Sueldo semanal del contrato actual

  // Relaciones
  relations: {
    coach: number;
    squad: number;
    fans: number;
    board: number;
    press: number;
    partner: number;
    family: number;
    agent: number;
    sponsors: number;
  };

  // Vida personal
  relationshipStatus: 'single' | 'dating' | 'relationship' | 'married';

  // Rasgos adquiridos
  traits: PlayerTrait[];

  // Carrera
  gamesPlayed: number;
  goalsScored: number;
  assists: number;
  titlesWon: string[]; // IDs de títulos

  // Selección nacional (namespace propio, distinto del de club)
  nationalTeamCaps: number;
  nationalTeamGoals: number;
  nationalTeamAssists: number;

  // Lesión activa, si la hay
  activeInjury: PlayerInjury | null;

  // Acuerdo de marca en curso, si lo hay
  activeBrandDeal: ActiveBrandDeal | null;
}
