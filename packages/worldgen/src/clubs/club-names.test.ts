import { describe, expect, it } from 'vitest';

import { RNG } from '@leyenda/engine';
import { generateClubNames } from './club-names';

const POOL = {
  cityPrefixes: [
    'River',
    'Port',
    'North',
    'South',
    'East',
    'West',
    'San',
    'Green',
    'Iron',
    'Stone',
    'Gold',
    'Silver',
    'White',
    'Black',
    'Red',
    'Blue',
    'High',
    'Low',
    'New',
    'Old',
  ],
  citySuffixes: [
    'mouth',
    'field',
    'bridge',
    'ford',
    'haven',
    'wick',
    'ton',
    'burgh',
    'port',
    'gate',
    'wood',
    'vale',
    'dale',
    'moor',
    'cliff',
  ],
  clubSuffixes: [
    'United',
    'City',
    'Athletic',
    'FC',
    'Town',
    'Rovers',
    'Sporting',
    'Wanderers',
    'Albion',
    'Rangers',
  ],
};

describe('generateClubNames', () => {
  it('es determinista: mismo seed → mismos nombres', () => {
    const a = generateClubNames(new RNG(1), POOL, 20);
    const b = generateClubNames(new RNG(1), POOL, 20);
    expect(a).toEqual(b);
  });

  it('genera el número exacto de nombres pedidos', () => {
    expect(generateClubNames(new RNG(1), POOL, 26)).toHaveLength(26);
  });

  it('no repite el nombre de ciudad dentro del mismo país', () => {
    const names = generateClubNames(new RNG(2), POOL, 26);
    const cityParts = names.map((n) => n.name.split(' ').slice(0, -1).join(' '));
    expect(new Set(cityParts).size).toBe(cityParts.length);
  });

  it('los shortName son únicos', () => {
    const names = generateClubNames(new RNG(3), POOL, 26);
    const shortNames = names.map((n) => n.shortName);
    expect(new Set(shortNames).size).toBe(shortNames.length);
  });

  it('lanza si se piden más nombres de los que caben en la combinatoria', () => {
    expect(() => generateClubNames(new RNG(1), POOL, 999)).toThrow();
  });
});
