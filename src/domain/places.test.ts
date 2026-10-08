import { describe, expect, it } from 'vitest';
import { buildPlaceIndex, encodePlaces, nearestPlace, parsePlaces, PlacesFormatError, type Place } from './places';

const PLACES: Place[] = [
  { name: 'Ciutadella', lat: 40.001, lon: 3.838 },
  { name: 'Maó', lat: 39.889, lon: 4.266 },
  { name: 'Sydney', lat: -33.869, lon: 151.209 },
  { name: 'Suva', lat: -18.142, lon: 178.442 },
  { name: 'Apia', lat: -13.833, lon: -171.75 },
];
const index = buildPlaceIndex(PLACES);

describe('encodePlaces / parsePlaces', () => {
  it('round-trips names and coordinates within the encoded precision', () => {
    const decoded = parsePlaces(encodePlaces(PLACES));
    expect(decoded.map((p) => p.name).sort()).toEqual(PLACES.map((p) => p.name).sort());
    for (const p of PLACES) {
      const d = decoded.find((x) => x.name === p.name)!;
      expect(d.lat).toBeCloseTo(p.lat, 1);
      expect(d.lon).toBeCloseTo(p.lon, 1);
      expect(Math.abs(d.lat - p.lat)).toBeLessThanOrEqual(0.005 + 1e-9);
    }
  });

  it('is compact: a header and one delta-coded line per place', () => {
    const lines = encodePlaces(PLACES).trimEnd().split('\n');
    expect(lines[0]).toBe(`#places v1 scale=100 count=${PLACES.length}`);
    expect(lines).toHaveLength(PLACES.length + 1);
  });

  it('removes tabs and newlines from names and skips empty ones', () => {
    const decoded = parsePlaces(encodePlaces([{ name: 'A\tB\nC', lat: 1, lon: 2 }, { name: '  ', lat: 3, lon: 4 }]));
    expect(decoded.map((p) => p.name)).toEqual(['A B C']);
  });

  it('decodes delta-coded lines, tolerating CRLF and a trailing newline', () => {
    expect(parsePlaces('#places v1 scale=100 count=2\nA\t150\t-225\nC\t5\t6\r\n')).toEqual([
      { name: 'A', lat: 1.5, lon: -2.25 },
      { name: 'C', lat: 1.55, lon: -2.19 },
    ]);
  });

  it('rejects the whole dataset on any malformed line, since later deltas would shift', () => {
    const header = '#places v1 scale=100 count=3';
    for (const body of ['A\t150\t-225\nbad\nC\t5\t6', 'A\t150\t-225\nB\tx\t2\nC\t5\t6', 'A\t150\t-225\n\nC\t5\t6', 'A\t150\t-225\nB\t1.5\t2\nC\t5\t6']) {
      expect(() => parsePlaces(`${header}\n${body}\n`), body).toThrow(PlacesFormatError);
    }
  });

  it('rejects a count mismatch (truncated or padded data), an unknown header and empty input', () => {
    expect(() => parsePlaces('#places v1 scale=100 count=3\nA\t1\t2\nB\t1\t1\n')).toThrow(PlacesFormatError);
    expect(() => parsePlaces('#places v1 scale=100 count=1\nA\t1\t2\nB\t1\t1\n')).toThrow(PlacesFormatError);
    expect(() => parsePlaces('#places v9 scale=1 count=1\nA\t1\t2')).toThrow(PlacesFormatError);
    expect(() => parsePlaces('#places v1 scale=100\nA\t1\t2')).toThrow(PlacesFormatError);
    expect(() => parsePlaces('')).toThrow(PlacesFormatError);
  });

  it('accepts an empty dataset with count=0', () => {
    expect(parsePlaces('#places v1 scale=100 count=0\n')).toEqual([]);
  });
});

describe('nearestPlace', () => {
  it('finds Ciutadella near its coordinates', () => {
    const p = nearestPlace(index, 40.0012, 3.838);
    expect(p?.name).toBe('Ciutadella');
    expect(p?.distanceKm).toBeLessThan(1);
  });

  it('picks the closest of two candidates', () => {
    expect(nearestPlace(index, 39.9, 4.2)?.name).toBe('Maó');
    expect(nearestPlace(index, 39.97, 3.95)?.name).toBe('Ciutadella');
  });

  it('returns null beyond maxKm', () => {
    expect(nearestPlace(index, 40.5, 3.838)).toBeNull();
    expect(nearestPlace(index, 40.5, 3.838, 100)?.name).toBe('Ciutadella');
  });

  it('works in the southern and western hemispheres', () => {
    expect(nearestPlace(index, -33.9, 151.2)?.name).toBe('Sydney');
    expect(nearestPlace(index, -13.8, -171.7)?.name).toBe('Apia');
  });

  it('matches across the antimeridian in both directions', () => {
    const west = buildPlaceIndex([{ name: 'Westside', lat: -16.8, lon: 179.95 }]);
    const east = buildPlaceIndex([{ name: 'Eastside', lat: -16.8, lon: -179.95 }]);
    expect(nearestPlace(west, -16.8, -179.99)?.name).toBe('Westside');
    expect(nearestPlace(east, -16.8, 179.99)?.name).toBe('Eastside');
  });

  it('does not crash on poles, empty index or invalid input', () => {
    expect(nearestPlace(index, 90, 0)).toBeNull();
    expect(nearestPlace(index, -90, 180)).toBeNull();
    expect(nearestPlace(buildPlaceIndex([]), 40, 3)).toBeNull();
    for (const bad of [Number.NaN, Infinity, 91]) expect(nearestPlace(index, bad, 3)).toBeNull();
    expect(nearestPlace(index, 40, Number.NaN)).toBeNull();
  });
});
