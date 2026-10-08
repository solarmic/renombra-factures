import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { readPhotoMeta } from './exifReader';

const fixture = (name: string) => new Uint8Array(readFileSync(new URL(`./__fixtures__/${name}`, import.meta.url)));

describe('readPhotoMeta', () => {
  it('reads capture time (with sub-seconds) and GPS from a JPEG', async () => {
    const meta = await readPhotoMeta(fixture('exif-gps.jpg'));
    expect(meta.moment).toEqual({ y: 2026, m: 7, d: 5, hh: 12, mi: 34, ss: 56, ms: 250 });
    expect(meta.gps?.lat).toBeCloseTo(40.0012, 4);
    expect(meta.gps?.lon).toBeCloseTo(3.838, 4);
  });

  it('reads capture time and GPS from a HEIC', async () => {
    const meta = await readPhotoMeta(fixture('exif-gps.heic'));
    expect(meta.moment).toMatchObject({ y: 2026, m: 7, d: 6, hh: 8, mi: 9, ss: 10 });
    expect(meta.gps?.lat).toBeCloseTo(39.8885, 4);
    expect(meta.gps?.lon).toBeCloseTo(4.2658, 4);
  });

  it('returns empty metadata for files without EXIF or in unknown formats', async () => {
    expect(await readPhotoMeta(fixture('no-exif.png'))).toEqual({ moment: null, gps: null });
    expect(await readPhotoMeta(new Uint8Array([1, 2, 3]))).toEqual({ moment: null, gps: null });
  });

  it('ignores a 0,0 GPS fix', async () => {
    const meta = await readPhotoMeta(new Uint8Array(), async () => ({
      parse: async () => ({ DateTimeOriginal: '2026:07:05 12:00:00', latitude: 0, longitude: 0 }),
    }));
    expect(meta.gps).toBeNull();
    expect(meta.moment?.hh).toBe(12);
  });
});
