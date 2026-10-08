import { describe, expect, it } from 'vitest';
import { renderTemplate } from './renderTemplate';

const ctx = { n: 7, date: { y: 2026, m: 1, d: 5 }, name: 'Orange' };

describe('renderTemplate', () => {
  it('renders every token', () => {
    expect(renderTemplate('{n}|{n:3}|{yy}|{yyyy}|{mm}|{dd}|{name}', ctx)).toBe('7|007|26|2026|01|05|Orange');
  });

  it('does not truncate a sequence wider than the padding', () => {
    expect(renderTemplate('{n:2}', { ...ctx, n: 123 })).toBe('123');
  });

  it('keeps literal text, slashes included', () => {
    expect(renderTemplate('1/{yy}V/{n:2} {name}', ctx)).toBe('1/26V/07 Orange');
  });

  it('leaves unknown tokens literal', () => {
    expect(renderTemplate('{foo} {n:x} {yy:2}', ctx)).toBe('{foo} {n:x} {yy:2}');
  });

  it('renders repeated tokens', () => {
    expect(renderTemplate('{n}-{n}', ctx)).toBe('7-7');
  });
});
