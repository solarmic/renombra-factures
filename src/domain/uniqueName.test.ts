import { describe, expect, it } from 'vitest';
import { uniqueName } from './uniqueName';

describe('uniqueName', () => {
  it('appends a counter case-insensitively and records the result', () => {
    const used = new Set<string>();
    expect(uniqueName(used, 'x', '.jpg')).toBe('x.jpg');
    expect(uniqueName(used, 'x', '.JPG')).toBe('x (2).JPG');
    expect(uniqueName(used, 'x', '.jpg')).toBe('x (3).jpg');
  });

  it('scopes by prefix', () => {
    const used = new Set<string>();
    expect(uniqueName(used, 'x', '.jpg', 'A/')).toBe('x.jpg');
    expect(uniqueName(used, 'x', '.jpg', 'B/')).toBe('x.jpg');
    expect(uniqueName(used, 'x', '.jpg', 'a/')).toBe('x (2).jpg');
  });
});
