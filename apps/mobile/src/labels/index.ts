import type {
  BoardObjectiveKind,
  Foot,
  FormationId,
  InterviewAmbition,
  Mentality,
  PlayerTrait,
  Position,
  ProtagonistPlayer,
  TrainingFocus,
} from '@leyenda/shared';

/** Etiquetas en español para valores de enum que no vienen de contenido data-driven. */
export const POSITION_SHORT_LABELS: Record<Position, string> = {
  GK: 'POR',
  LB: 'LI',
  CB: 'DFC',
  RB: 'LD',
  DMF: 'MCD',
  CMF: 'MC',
  AMF: 'MP',
  LW: 'EI',
  RW: 'ED',
  CF: 'DC',
};

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

export const FORMATION_LABELS: Record<FormationId, string> = {
  '4-4-2': '4-4-2 (clásico)',
  '4-3-3': '4-3-3 (ofensivo por bandas)',
  '4-2-3-1': '4-2-3-1 (control del medio)',
  '5-3-2': '5-3-2 (cerrojo)',
  '3-5-2': '3-5-2 (dominio del centro)',
};

export const MENTALITY_LABELS: Record<Mentality, string> = {
  defensive: 'Defensiva',
  balanced: 'Equilibrada',
  attacking: 'Ofensiva',
};

export const MENTALITY_DESCRIPTIONS: Record<Mentality, string> = {
  defensive: 'Menos ocasiones en las dos porterías. Útil si eres el equipo débil.',
  balanced: 'Sin sesgo.',
  attacking: 'Más ocasiones a favor, pero también en contra.',
};

export const TRAINING_FOCUS_LABELS: Record<TrainingFocus, string> = {
  physical: 'Físico',
  technical: 'Técnico',
  tactical: 'Táctico',
  rest: 'Descanso activo',
};

export const TRAINING_FOCUS_DESCRIPTIONS: Record<TrainingFocus, string> = {
  physical: 'Los jóvenes mejoran; más riesgo de lesión y menos recuperación.',
  technical: 'La mejor opción para el desarrollo de los jóvenes.',
  tactical: 'Sube la forma del grupo; los jóvenes mejoran poco.',
  rest: 'Máxima recuperación física; casi no hay mejora.',
};

export const OBJECTIVE_LABELS: Record<BoardObjectiveKind, string> = {
  title: 'Ganar la liga',
  promotion: 'Ascender',
  top_positions: 'Terminar en puestos altos',
  top_half: 'Terminar en la mitad alta',
  mid_table: 'Asentarse en mitad de tabla',
  avoid_relegation: 'Evitar el descenso',
};

export const AMBITION_LABELS: Record<InterviewAmbition, string> = {
  ambitious: 'Prometer ambición',
  realistic: 'Ser realista',
  cautious: 'Ser prudente',
};

export const AMBITION_DESCRIPTIONS: Record<InterviewAmbition, string> = {
  ambitious: 'La directiva te recibe con más confianza, pero el objetivo será más exigente.',
  realistic: 'Objetivo acorde a la plantilla.',
  cautious: 'Objetivo más asequible, pero empiezas con menos confianza.',
};
