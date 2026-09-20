import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { z } from 'zod';

import type {
  BrandDeal,
  DecisionEvent,
  InjuryType,
  KeyMoment,
  PurchasableAsset,
} from '@leyenda/shared';

import {
  BrandDealSchema,
  DecisionEventSchema,
  InjurySchema,
  KeyMomentSchema,
  OriginSchema,
  PurchasableAssetSchema,
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

export function loadKeyMoments(): KeyMoment[] {
  const raw = readJson(join(DATA_ROOT, 'key-moments.json'));
  return z.array(KeyMomentSchema).parse(raw) as KeyMoment[];
}

export function loadEvents(): DecisionEvent[] {
  const raw = readJson(join(DATA_ROOT, 'events.json'));
  return z.array(DecisionEventSchema).parse(raw) as DecisionEvent[];
}

export function loadInjuries(): InjuryType[] {
  const raw = readJson(join(DATA_ROOT, 'injuries.json'));
  return z.array(InjurySchema).parse(raw) as InjuryType[];
}

export function loadAssets(): PurchasableAsset[] {
  const raw = readJson(join(DATA_ROOT, 'assets.json'));
  return z.array(PurchasableAssetSchema).parse(raw) as PurchasableAsset[];
}

export function loadBrandDeals(): BrandDeal[] {
  const raw = readJson(join(DATA_ROOT, 'brand-deals.json'));
  return z.array(BrandDealSchema).parse(raw) as BrandDeal[];
}
