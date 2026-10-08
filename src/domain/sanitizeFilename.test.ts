import { describe, expect, it } from 'vitest';
import { sanitizeFilename } from './sanitizeFilename';

describe('sanitizeFilename', () => {
  it('replaces forbidden characters with the default dash', () => {
    expect(sanitizeFilename('1/26V:07 a\\b*c?d"e<f>g|h')).toBe('1-26V-07 a-b-c-d-e-f-g-h');
  });

  it('uses a custom replacement, including an empty one', () => {
    expect(sanitizeFilename('a/b', '_')).toBe('a_b');
    expect(sanitizeFilename('a/b', '')).toBe('ab');
  });

  it('replaces control characters', () => {
    expect(sanitizeFilename('a\u0000b\u001fc')).toBe('a-b-c');
  });

  it('trims trailing dots and spaces and leading spaces', () => {
    expect(sanitizeFilename('  name. . ')).toBe('name');
  });

  it('never returns an empty string', () => {
    expect(sanitizeFilename('...')).toBe('_');
    expect(sanitizeFilename('')).toBe('_');
  });
});
