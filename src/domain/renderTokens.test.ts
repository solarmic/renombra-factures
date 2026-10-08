import { describe, expect, it } from 'vitest';
import { renderTokens } from './renderTokens';

const values = { n: 1, t1: 'Menorca', t2: 'Familia', place: '', hh: '09', name: 'IMG' };

describe('renderTokens', () => {
  it('renders numeric tokens with optional padding and string tokens as is', () => {
    expect(renderTokens('{n}|{n:3}|{t1}|{hh}', values)).toBe('1|001|Menorca|09');
  });

  it('leaves unknown tokens and widths on string tokens literal', () => {
    expect(renderTokens('{foo} {t1:2} {n:x}', values)).toBe('{foo} {t1:2} {n:x}');
  });

  it('collapses the separator next to an empty token', () => {
    expect(renderTokens('{n:2}_{t2}_{place}_{t1}', { ...values, t2: '' })).toBe('01_Menorca');
    expect(renderTokens('{n:2}_{place}_{t2}', values)).toBe('01_Familia');
  });

  it('keeps mixed separators of non-empty neighbours intact', () => {
    expect(renderTokens('{n:2} - {t1} - {t2}', { ...values, t1: '' })).toBe('01 - Familia');
    expect(renderTokens('{t1} - {t2}', values)).toBe('Menorca - Familia');
  });

  it('trims separators at both ends when edge tokens are empty', () => {
    expect(renderTokens('{place}_{n:2}_{t1}_{place}', values)).toBe('01_Menorca');
    expect(renderTokens('_{place}_{n}', values)).toBe('1');
  });

  it('handles several adjacent empty tokens', () => {
    expect(renderTokens('a_{place}_{place}_b', values)).toBe('a_b');
    expect(renderTokens('{place}{place}', values)).toBe('');
  });

  it('never leaves doubled separators from user-literal text untouched', () => {
    expect(renderTokens('a__b {t1}', values)).toBe('a__b Menorca');
  });

  it('strips NUL from values', () => {
    expect(renderTokens('{t1}', { ...values, t1: 'a\u0000b' })).toBe('ab');
  });
});

describe('renderTokens whitespace', () => {
  it('treats blank values as empty but does not trim non-blank ones', () => {
    expect(renderTokens('{n}_{t1}_{t2}', { ...values, t1: '   ' })).toBe('1_Familia');
    expect(renderTokens('{name}-{n}', { ...values, name: 'a ' })).toBe('a -1');
  });
});
