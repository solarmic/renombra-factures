import { buildPlaceIndex, parsePlaces, type PlaceIndex } from '../domain/places';
import { cachedLoader } from './cachedLoader';

/** The dataset is a static file of this same site, so it follows the Vite base path (e.g. GitHub Pages). */
export function placesUrl(base: string = import.meta.env.BASE_URL): string {
  return `${base.endsWith('/') ? base : `${base}/`}places/places.txt`;
}

export async function fetchPlaceIndex(fetchFn: typeof fetch = fetch, url: string = placesUrl()): Promise<PlaceIndex> {
  const response = await fetchFn(url);
  if (!response.ok) throw new Error(`Places dataset: HTTP ${response.status}`);
  return buildPlaceIndex(parsePlaces(await response.text()));
}

/** Downloaded on first use only (template with {place} or folder grouping), then kept for the session. */
export const loadPlaceIndex = cachedLoader(() => fetchPlaceIndex());
