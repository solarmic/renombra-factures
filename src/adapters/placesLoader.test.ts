import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { nearestPlace } from '../domain/places';
import { fetchPlaceIndex, placesUrl } from './placesLoader';

const dataset = readFileSync(new URL('../../public/places/places.txt', import.meta.url), 'utf8');
const okFetch = (async () => new Response(dataset)) as typeof fetch;

describe('placesUrl', () => {
  it('is relative to the Vite base path', () => {
    expect(placesUrl('/')).toBe('/places/places.txt');
    expect(placesUrl('/renombra-factures/')).toBe('/renombra-factures/places/places.txt');
    expect(placesUrl('/sub')).toBe('/sub/places/places.txt');
  });
});

describe('fetchPlaceIndex', () => {
  it('fetches the given same-origin URL once and builds a searchable index', async () => {
    const urls: string[] = [];
    const index = await fetchPlaceIndex(async (url) => (urls.push(String(url)), okFetch(url)), '/places/places.txt');
    expect(urls).toEqual(['/places/places.txt']);
    expect(index.size).toBeGreaterThan(100_000);
  });

  it('rejects on HTTP errors so the loader can retry', async () => {
    await expect(fetchPlaceIndex((async () => new Response('', { status: 404 })) as typeof fetch, '/x')).rejects.toThrow('404');
  });

  it('acceptance: resolves the bundled dataset for Menorca', async () => {
    const index = await fetchPlaceIndex(okFetch, '/places/places.txt');
    expect(nearestPlace(index, 40.0012, 3.838)?.name).toBe('Ciutadella');
    expect(nearestPlace(index, 39.8885, 4.2658)?.name).toBe('Maó');
    expect(nearestPlace(index, 0, -30)).toBeNull(); // mid-Atlantic
  });
});
