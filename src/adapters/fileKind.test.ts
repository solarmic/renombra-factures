import { describe, expect, it } from 'vitest';
import { classifyFile } from './fileKind';

describe('classifyFile', () => {
  it.each([
    ['a.pdf', 'application/pdf', 'pdf'],
    ['A.PDF', '', 'pdf'],
    ['a.bin', 'application/pdf', 'pdf'],
    ['a.jpg', 'image/jpeg', 'image'],
    ['a.JPEG', '', 'image'],
    ['a.png', 'image/png', 'image'],
    ['a.heic', '', 'image'],
    ['a.heif', 'image/heif', 'image'],
    ['a.webp', 'image/webp', 'image'],
    ['a.gif', 'image/gif', 'image'],
    ['a.tif', '', 'image'],
    ['a.tiff', 'image/tiff', 'image'],
    ['a.bmp', '', 'image'],
    ['a.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'unsupported'],
    ['a.docx', '', 'unsupported'],
    ['noextension', '', 'unsupported'],
  ])('%s (%s) -> %s', (name, type, expected) => {
    expect(classifyFile({ name, type })).toBe(expected);
  });
});
