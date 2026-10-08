export interface Place {
  name: string;
  lat: number;
  lon: number;
}

export interface NearestPlace extends Place {
  distanceKm: number;
}

/** Grid bucket index: places keyed by 0.5-degree cell. */
export interface PlaceIndex {
  cells: Map<number, Place[]>;
  size: number;
}

const CELL_DEG = 0.5;
const LAT_CELLS = 180 / CELL_DEG;
const LON_CELLS = 360 / CELL_DEG;
const EARTH_RADIUS_KM = 6371.0088;
const KM_PER_DEG = (Math.PI * EARTH_RADIUS_KM) / 180;

const HEADER_PREFIX = '#places v1 scale=100 count=';
const SCALE = 100;

/** The bundled dataset is corrupt or truncated. */
export class PlacesFormatError extends Error {
  constructor(message: string) {
    super(`Places dataset: ${message}`);
    this.name = 'PlacesFormatError';
  }
}

const cleanName = (name: string) => name.replace(/[\t\r\n]+/g, ' ').trim();

/**
 * Compact text format of the bundled dataset: a header with the number of places, then one
 * `name<TAB>dLat<TAB>dLon` per place, sorted by latitude, with coordinates in hundredths of a degree
 * (about 1 km) stored as deltas from the previous line. Used by the build script; the browser only needs
 * `parsePlaces`.
 */
export function encodePlaces(places: readonly Place[]): string {
  const rows = places
    .map((p) => ({ name: cleanName(p.name), lat: Math.round(p.lat * SCALE), lon: Math.round(p.lon * SCALE) }))
    .filter((r) => r.name !== '')
    .sort((a, b) => a.lat - b.lat || a.lon - b.lon);
  let lat = 0;
  let lon = 0;
  const lines = rows.map((r) => {
    const line = `${r.name}\t${r.lat - lat}\t${r.lon - lon}`;
    lat = r.lat;
    lon = r.lon;
    return line;
  });
  return `${HEADER_PREFIX}${rows.length}\n${lines.length ? `${lines.join('\n')}\n` : ''}`;
}

const INTEGER = /^-?\d+$/;

/**
 * Inverse of `encodePlaces`. Lines are delta-coded, so skipping a bad line would silently shift every later
 * place: any malformed line, unknown header or count mismatch rejects the whole dataset instead.
 */
export function parsePlaces(text: string): Place[] {
  const lines = text.split('\n').map((l) => l.replace(/\r$/, ''));
  if (lines[lines.length - 1] === '') lines.pop(); // trailing newline
  const header = lines.shift() ?? '';
  if (!header.startsWith(HEADER_PREFIX)) throw new PlacesFormatError('unknown header');
  const count = header.slice(HEADER_PREFIX.length);
  if (!INTEGER.test(count) || Number(count) !== lines.length) {
    throw new PlacesFormatError(`expected ${count} places, found ${lines.length}`);
  }

  const places: Place[] = [];
  let lat = 0;
  let lon = 0;
  lines.forEach((line, i) => {
    const parts = line.split('\t');
    const [name, dLat, dLon] = parts;
    if (parts.length !== 3 || !name || !INTEGER.test(dLat!) || !INTEGER.test(dLon!)) {
      throw new PlacesFormatError(`malformed line ${i + 2}`);
    }
    lat += Number(dLat);
    lon += Number(dLon);
    places.push({ name, lat: lat / SCALE, lon: lon / SCALE });
  });
  return places;
}

const latCell = (lat: number) => Math.min(LAT_CELLS - 1, Math.floor((lat + 90) / CELL_DEG));
const lonCell = (lon: number) => ((Math.floor((lon + 180) / CELL_DEG) % LON_CELLS) + LON_CELLS) % LON_CELLS;
const key = (row: number, col: number) => row * LON_CELLS + col;

export function buildPlaceIndex(places: readonly Place[]): PlaceIndex {
  const cells = new Map<number, Place[]>();
  for (const place of places) {
    const k = key(latCell(place.lat), lonCell(place.lon));
    const bucket = cells.get(k);
    if (bucket) bucket.push(place);
    else cells.set(k, [place]);
  }
  return { cells, size: places.length };
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * The closest place within `maxKm` (default 30), or null. Only the grid cells that can contain such a place
 * are visited; longitude wraps around the antimeridian. Invalid coordinates give null.
 */
export function nearestPlace(index: PlaceIndex, lat: number, lon: number, maxKm = 30): NearestPlace | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || !(maxKm > 0) || index.size === 0) return null;

  const latSpan = maxKm / KM_PER_DEG;
  const rowFrom = latCell(Math.max(-90, lat - latSpan));
  const rowTo = latCell(Math.min(90, lat + latSpan));
  // Longitude degrees shrink with latitude; near the poles every column is a candidate.
  const widest = Math.max(Math.abs(lat - latSpan), Math.abs(lat + latSpan));
  const lonSpan = widest >= 89.5 ? 180 : Math.min(180, maxKm / (KM_PER_DEG * Math.cos((widest * Math.PI) / 180)));
  const colCount = Math.min(LON_CELLS, Math.floor((2 * lonSpan) / CELL_DEG) + 2);
  const colStart = Math.floor((lon - lonSpan + 180) / CELL_DEG);

  let best: NearestPlace | null = null;
  for (let row = rowFrom; row <= rowTo; row++) {
    for (let i = 0; i < colCount; i++) {
      const col = (((colStart + i) % LON_CELLS) + LON_CELLS) % LON_CELLS;
      for (const place of index.cells.get(key(row, col)) ?? []) {
        const distanceKm = haversineKm(lat, lon, place.lat, place.lon);
        if (distanceKm <= maxKm && (best === null || distanceKm < best.distanceKm)) best = { ...place, distanceKm };
      }
    }
  }
  return best;
}
