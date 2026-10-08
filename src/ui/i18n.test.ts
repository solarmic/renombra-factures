import { describe, expect, it } from 'vitest';
import { detectLanguage, dictionaries } from './i18n';

describe('detectLanguage', () => {
  it('maps browser tags to supported languages', () => {
    expect(detectLanguage('ca-ES')).toBe('ca');
    expect(detectLanguage('en-US')).toBe('en');
    expect(detectLanguage('es-MX')).toBe('es');
  });

  it('uses the first supported entry of a preference list', () => {
    expect(detectLanguage(['fr-FR', 'ca', 'en'])).toBe('ca');
  });

  it('defaults to Spanish', () => {
    expect(detectLanguage('de-DE')).toBe('es');
    expect(detectLanguage(undefined)).toBe('es');
    expect(detectLanguage([])).toBe('es');
  });
});

describe('dictionaries', () => {
  it('have identical keys in every language', () => {
    const keys = (l: keyof typeof dictionaries) => Object.keys(dictionaries[l]).sort();
    expect(keys('ca')).toEqual(keys('es'));
    expect(keys('en')).toEqual(keys('es'));
  });

  it('render the parameterised messages', () => {
    for (const d of Object.values(dictionaries)) {
      expect(d.missing(1)).not.toBe(d.missing(3));
      expect(d.missing(3)).toContain('3');
      expect(d.credit(2026)).toBe('© 2026 miguelcirc');
    }
  });
});
