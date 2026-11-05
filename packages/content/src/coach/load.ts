import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { z } from 'zod';

import type { PressConference } from '@leyenda/shared';

import { PressConferenceSchema } from '../schemas/coach';

const DATA_ROOT = join(__dirname, '../../data/coach');

export function loadPressConferences(): PressConference[] {
  const raw = JSON.parse(
    readFileSync(join(DATA_ROOT, 'press-conferences.json'), 'utf-8')
  ) as unknown;
  const parsed = z.array(PressConferenceSchema).parse(raw);
  const ids = new Set<string>();
  for (const conference of parsed) {
    if (ids.has(conference.id)) {
      throw new Error(`Rueda de prensa duplicada: ${conference.id}`);
    }
    ids.add(conference.id);
  }
  return parsed;
}
