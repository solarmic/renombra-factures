import { describe, expect, it } from 'vitest';
import { isValidReplacement, sanitizeFilename } from './sanitizeFilename';

describe('sanitizeFilename', () => {
  it('replaces forbidden characters with the default dash', () => {
    expect(sanitizeFilename('1/26V:07 a\\b*c?d"e<f>g|h')).toBe('1-26V-07 a-b-c-d-e-f-g-h');
  });

  it('uses a custom replacement', () => {
    expect(sanitizeFilename('a/b', '_')).toBe('a_b');
    expect(sanitizeFilename('a/b', '_x')).toBe('a_xb');
  });

  it('falls back to a dash when the replacement is empty or itself forbidden', () => {
    for (const bad of ['', '/', '\\', ':', '*', '?', '"', '<', '>', '|', 'a/', '\u0007']) {
      expect(sanitizeFilename('a/b', bad)).toBe('a-b');
      expect(isValidReplacement(bad)).toBe(false);
    }
    expect(isValidReplacement('_')).toBe(true);
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
