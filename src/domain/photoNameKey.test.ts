import { describe, expect, it } from 'vitest';
import { parsePhotoName } from './photoNameKey';

describe('parsePhotoName', () => {
  it('reads full datetimes from phone names', () => {
    expect(parsePhotoName('PXL_20260705_123456789.jpg').moment).toEqual({ y: 2026, m: 7, d: 5, hh: 12, mi: 34, ss: 56, ms: 789 });
    expect(parsePhotoName('20260705_123456.jpg').moment).toEqual({ y: 2026, m: 7, d: 5, hh: 12, mi: 34, ss: 56, ms: 0 });
    expect(parsePhotoName('IMG_20260705_123456.jpg').moment?.hh).toBe(12);
    expect(parsePhotoName('2026-07-05 12.34.56.jpg').moment?.mi).toBe(34);
  });

  it('reads the day and counter from WhatsApp names', () => {
    const r = parsePhotoName('IMG-20260705-WA0012.jpg');
    expect(r.moment).toEqual({ y: 2026, m: 7, d: 5, hh: 0, mi: 0, ss: 0, ms: 0 });
    expect(r.counter).toBe(12);
  });

  it('reads camera counters', () => {
    for (const [name, counter] of [
      ['IMG_0423.jpg', 423],
      ['IMG_E0423.JPG', 423],
      ['DSC01234.ARW', 1234],
      ['DSCF1234.jpg', 1234],
      ['_DSC1234.jpg', 1234],
      ['DSC_1234.jpg', 1234],
      ['P1010123.jpg', 1010123],
      ['IMG_0423 (1).jpg', 423],
    ] as const) {
      const r = parsePhotoName(name);
      expect(r.counter, name).toBe(counter);
      expect(r.moment, name).toBeNull();
    }
  });

  it('returns nothing for names without a pattern or with impossible dates', () => {
    for (const name of ['vacaciones.jpg', 'foto 1.jpg', '20261399_123456.jpg', 'a.jpg']) {
      expect(parsePhotoName(name)).toEqual({ moment: null, counter: null });
    }
  });
});
