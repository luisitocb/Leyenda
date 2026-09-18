import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { z } from 'zod';

import {
  ClubNamePoolSchema,
  CountrySchema,
  PersonNamePoolSchema,
  type ClubNamePool,
  type CountryData,
  type PersonNamePool,
} from '../schemas/worldgen';

const DATA_ROOT = join(__dirname, '../../data/worldgen');

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf-8')) as unknown;
}

export function loadCountries(): CountryData[] {
  const raw = readJson(join(DATA_ROOT, 'countries.json'));
  return z.array(CountrySchema).parse(raw);
}

export function loadClubNamePool(): ClubNamePool {
  const raw = readJson(join(DATA_ROOT, 'club-names.json'));
  return ClubNamePoolSchema.parse(raw);
}

export function loadPersonNamePool(countryCode: string): PersonNamePool {
  const raw = readJson(join(DATA_ROOT, 'person-names', `${countryCode}.json`));
  return PersonNamePoolSchema.parse(raw);
}
