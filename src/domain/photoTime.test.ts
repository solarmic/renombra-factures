import { describe, expect, it } from 'vitest';
import { momentFromDate, momentToMs, parseExifDateTime } from './photoTime';

describe('parseExifDateTime', () => {
  it('parses the EXIF format and sub-seconds', () => {
    expect(parseExifDateTime('2026:07:05 12:34:56')).toEqual({ y: 2026, m: 7, d: 5, hh: 12, mi: 34, ss: 56, ms: 0 });
    expect(parseExifDateTime('2026:07:05 12:34:56', '12')?.ms).toBe(120);
    expect(parseExifDateTime('2026:07:05 12:34:56', 5)?.ms).toBe(500);
    expect(parseExifDateTime('2026:07:05 12:34:56', '1234')?.ms).toBe(123);
  });

  it('rejects empty, zeroed and impossible values', () => {
    for (const bad of ['', '0000:00:00 00:00:00', '2026:13:05 12:00:00', '2026:02:30 12:00:00', '2026:07:05 25:00:00', 'junk', undefined, null, 5]) {
      expect(parseExifDateTime(bad as never)).toBeNull();
    }
  });

  it('ignores a malformed sub-second', () => {
    expect(parseExifDateTime('2026:07:05 12:34:56', 'x')?.ms).toBe(0);
  });
});

describe('moments', () => {
  it('orders by wall-clock through momentToMs', () => {
    const a = parseExifDateTime('2026:07:05 12:34:56', '1')!;
    const b = parseExifDateTime('2026:07:05 12:34:56', '2')!;
    expect(momentToMs(a)).toBeLessThan(momentToMs(b));
  });

  it('reads local components from a Date', () => {
    expect(momentFromDate(new Date(2026, 6, 5, 9, 8, 7, 6))).toEqual({ y: 2026, m: 7, d: 5, hh: 9, mi: 8, ss: 7, ms: 6 });
  });
});
