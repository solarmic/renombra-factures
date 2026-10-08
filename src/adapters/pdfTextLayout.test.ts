import { describe, expect, it } from 'vitest';
import { itemsToText, type TextItem } from './pdfTextLayout';

const item = (str: string, x: number, y: number, width = str.length * 5, h = 10): TextItem => ({
  str,
  width,
  height: h,
  transform: [h, 0, 0, h, x, y],
});

describe('itemsToText', () => {
  it('groups items on the same baseline and orders lines top to bottom', () => {
    const text = itemsToText([item('second', 0, 100), item('first', 0, 200)]);
    expect(text).toBe('first\nsecond');
  });

  it('keeps adjacent glyph runs together', () => {
    expect(itemsToText([item('Fec', 0, 0), item('ha', 15, 0)])).toBe('Fecha');
  });

  it('separates columns with several spaces', () => {
    const text = itemsToText([item('FECHA', 0, 0), item('14-06-2026', 200, 0)]);
    expect(text).toMatch(/^FECHA {2,}14-06-2026$/);
  });

  it('tolerates tiny baseline jitter', () => {
    expect(itemsToText([item('a', 0, 100), item('b', 10, 101.5)])).toMatch(/^a\s+b$/);
  });

  it('skips empty items', () => {
    expect(itemsToText([item('', 0, 0), item('x', 0, 0)])).toBe('x');
  });
});
