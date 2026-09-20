import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { z } from 'zod';

import {
  ClubNamePoolSchema,
  CountrySchema,
  PersonNamePoolSchema,
  RealClubRosterSchema,
  type ClubNamePool,
  type CountryData,
  type PersonNamePool,
  type RealClubRoster,
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

/**
 * Plantilla real de un país (ADR-004), si existe — `null` si el país sigue
 * siendo ficticio/procedural (no todos los países tienen plantilla real
 * todavía).
 */
export function loadRealClubRoster(countryCode: string): RealClubRoster | null {
  const path = join(DATA_ROOT, 'real-clubs', `${countryCode}.json`);
  if (!existsSync(path)) return null;
  const raw = readJson(path);
  return RealClubRosterSchema.parse(raw);
}
