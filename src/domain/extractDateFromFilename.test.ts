import { describe, expect, it } from 'vitest';
import { extractDateFromFilename } from './extractDateFromFilename';

const Y = 2026;

describe('extractDateFromFilename', () => {
  it('reads DDMMYYYY embedded in the name', () => {
    expect(extractDateFromFilename('Gener 05012026 Orange.pdf', Y)?.date).toEqual({ y: 2026, m: 1, d: 5 });
  });

  it('reads DDMMYY', () => {
    expect(extractDateFromFilename('Febrer 050226.pdf', Y)?.date).toEqual({ y: 2026, m: 2, d: 5 });
  });

  it('reads DDMM using the fallback year', () => {
    expect(extractDateFromFilename('Factura 0501.jpg', 2025)).toEqual({
      date: { y: 2025, m: 1, d: 5 },
      precision: 'day-month',
    });
  });

  it('reads ISO dates', () => {
    expect(extractDateFromFilename('2026-01-05 Factura.jpg', Y)?.date).toEqual({ y: 2026, m: 1, d: 5 });
  });

  it('reads DD-MM-YYYY and DD.MM.YYYY', () => {
    expect(extractDateFromFilename('Factura 05-01-2026.pdf', Y)?.date).toEqual({ y: 2026, m: 1, d: 5 });
    expect(extractDateFromFilename('Factura 05.01.2026.pdf', Y)?.date).toEqual({ y: 2026, m: 1, d: 5 });
  });

  it('reads compact YYYYMMDD', () => {
    expect(extractDateFromFilename('scan_20260105.pdf', Y)?.date).toEqual({ y: 2026, m: 1, d: 5 });
  });

  it('prefers a full date over a DDMM run', () => {
    expect(extractDateFromFilename('0102 Factura 05012026.pdf', Y)?.date).toEqual({ y: 2026, m: 1, d: 5 });
  });

  it('ignores digit runs that are not valid dates', () => {
    expect(extractDateFromFilename('SALTOKI 224814.pdf', Y)).toBeNull();
    expect(extractDateFromFilename('Factura 9999.pdf', Y)).toBeNull();
    expect(extractDateFromFilename('Factura 3102.pdf', Y)).toBeNull();
  });

  it('rejects implausible two-digit years that are likely document numbers', () => {
    expect(extractDateFromFilename('CALDES 271143.pdf', Y)).toBeNull();
  });

  it('ignores digit runs of other lengths', () => {
    expect(extractDateFromFilename('1:26V:07 Factura 12345.pdf', Y)).toBeNull();
  });

  it('returns null when there is no date', () => {
    expect(extractDateFromFilename('Factura.jpg', Y)).toBeNull();
  });

  it('keeps the first occurrence among same-precision matches', () => {
    expect(extractDateFromFilename('0501 y 0602.pdf', Y)?.date).toEqual({ y: 2026, m: 1, d: 5 });
  });
});
