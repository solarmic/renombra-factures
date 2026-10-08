import { describe, expect, it } from 'vitest';
import { comparePhotoKeys, photoSortKey } from './photoSortKey';
import { parseExifDateTime } from './photoTime';

const lm = (y: number, m: number, d: number) => new Date(y, m - 1, d, 10).getTime();
const key = (name: string, exif: string | null, lastModified = lm(2026, 1, 1)) =>
  photoSortKey({ name, exifMoment: exif ? parseExifDateTime(exif) : null, lastModified });
const order = (keys: { name: string; k: ReturnType<typeof key> }[]) =>
  [...keys].sort((a, b) => comparePhotoKeys(a.k, b.k) || a.name.localeCompare(b.name)).map((x) => x.name);

describe('photoSortKey', () => {
  it('prefers EXIF over name and file date', () => {
    const k = key('IMG_0423.jpg', '2026:07:05 12:34:56');
    expect(k.source).toBe('exif');
    expect(k.moment.hh).toBe(12);
  });

  it('uses a datetime in the name as source name', () => {
    const k = key('PXL_20260705_123456789.jpg', null);
    expect(k.source).toBe('name');
    expect(k.moment.mi).toBe(34);
  });

  it('uses a counter as source name and falls back to the file date for tokens', () => {
    const k = key('IMG_0423.jpg', null, lm(2025, 3, 4));
    expect(k.source).toBe('name');
    expect(k.moment).toMatchObject({ y: 2025, m: 3, d: 4 });
  });

  it('falls back to the file date', () => {
    const k = key('holiday.jpg', null, lm(2025, 3, 4));
    expect(k.source).toBe('file');
    expect(k.moment).toMatchObject({ y: 2025, m: 3, d: 4 });
  });
});

describe('comparePhotoKeys', () => {
  it('mixes phone and camera files by capture time', () => {
    const items = [
      { name: 'cam.jpg', k: key('DSC01234.jpg', '2026:07:05 18:00:00') },
      { name: 'phone.jpg', k: key('IMG_0001.jpg', '2026:07:05 09:00:00') },
      { name: 'pxl.jpg', k: key('PXL_20260705_120000000.jpg', null) },
    ];
    expect(order(items)).toEqual(['phone.jpg', 'pxl.jpg', 'cam.jpg']);
  });

  it('orders exact moments, then counter-only, then file-date-only', () => {
    const items = [
      { name: 'file', k: key('holiday.jpg', null, lm(2020, 1, 1)) },
      { name: 'counter', k: key('IMG_0100.jpg', null, lm(2030, 1, 1)) },
      { name: 'exif', k: key('x.jpg', '2026:07:05 09:00:00') },
    ];
    expect(order(items)).toEqual(['exif', 'counter', 'file']);
  });

  it('orders counter-only files by counter and file-only by date', () => {
    const c = [
      { name: 'b', k: key('IMG_0200.jpg', null) },
      { name: 'a', k: key('DSC00300.jpg', null) },
      { name: 'z', k: key('IMG_0100.jpg', null) },
    ];
    expect(order(c)).toEqual(['z', 'b', 'a']);
    const f = [
      { name: 'late', k: key('a.jpg', null, lm(2026, 2, 1)) },
      { name: 'early', k: key('b.jpg', null, lm(2026, 1, 1)) },
    ];
    expect(order(f)).toEqual(['early', 'late']);
  });

  it('uses the sub-second and the WhatsApp counter to break ties', () => {
    const items = [
      { name: 'b', k: key('x.jpg', '2026:07:05 09:00:00') },
      { name: 'a', k: photoSortKey({ name: 'x.jpg', exifMoment: parseExifDateTime('2026:07:05 09:00:00', '5'), lastModified: 0 }) },
    ];
    expect(order(items)).toEqual(['b', 'a']);
    const wa = [
      { name: '2', k: key('IMG-20260705-WA0010.jpg', null) },
      { name: '1', k: key('IMG-20260705-WA0002.jpg', null) },
    ];
    expect(order(wa)).toEqual(['1', '2']);
  });
});
