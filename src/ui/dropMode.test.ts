import { describe, expect, it } from 'vitest';
import { dropModeOf } from './dropMode';

describe('dropModeOf', () => {
  it('is empty without items, reading while some are pending and loaded otherwise', () => {
    expect(dropModeOf(0, 0)).toBe('empty');
    expect(dropModeOf(7, 3)).toBe('reading');
    expect(dropModeOf(7, 0)).toBe('loaded');
    expect(dropModeOf(1, 1)).toBe('reading');
  });
});
