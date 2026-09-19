import type { Foot, PlayerTrait, Position, ProtagonistPlayer } from '@leyenda/shared';

/** Etiquetas en español para valores de enum que no vienen de contenido data-driven. */
export const POSITION_LABELS: Record<Position, string> = {
  GK: 'Portero',
  LB: 'Lateral izquierdo',
  CB: 'Central',
  RB: 'Lateral derecho',
  DMF: 'Mediocentro defensivo',
  CMF: 'Centrocampista',
  AMF: 'Mediapunta',
  LW: 'Extremo izquierdo',
  RW: 'Extremo derecho',
  CF: 'Delantero centro',
};

export const FOOT_LABELS: Record<Foot, string> = {
  left: 'Izquierdo',
  right: 'Derecho',
  both: 'Ambidiestro',
};

export const RELATION_LABELS: Record<keyof ProtagonistPlayer['relations'], string> = {
  coach: 'Entrenador',
  squad: 'Vestuario',
  fans: 'Afición',
  board: 'Directiva',
  press: 'Prensa',
  partner: 'Pareja',
  family: 'Familia',
  agent: 'Agente',
  sponsors: 'Patrocinadores',
};

export const TRAIT_LABELS: Record<PlayerTrait, string> = {
  partyAnimal: 'Fiestero',
  exemplary: 'Ejemplar',
  controversial: 'Polémico',
  leader: 'Líder',
  discreet: 'Discreto',
  'media-friendly': 'Mediático',
  hothead: 'Cabeza caliente',
  clutch: 'Decisivo',
};
