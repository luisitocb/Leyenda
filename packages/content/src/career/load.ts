import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { z } from 'zod';

import {
  OriginSchema,
  WeeklyActionSchema,
  type Origin,
  type WeeklyAction,
} from '../schemas/career';

const DATA_ROOT = join(__dirname, '../../data/career');

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf-8')) as unknown;
}

export function loadOrigins(): Origin[] {
  const raw = readJson(join(DATA_ROOT, 'origins.json'));
  return z.array(OriginSchema).parse(raw);
}

export function loadWeeklyActions(): WeeklyAction[] {
  const raw = readJson(join(DATA_ROOT, 'weekly-actions.json'));
  return z.array(WeeklyActionSchema).parse(raw);
}
