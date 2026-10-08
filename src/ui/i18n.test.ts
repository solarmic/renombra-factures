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

describe('dropzone messages (invoices)', () => {
  it('pluralise the loaded title in every language', () => {
    expect(dictionaries.es.loadedTitle(1)).toBe('1 factura cargada');
    expect(dictionaries.es.loadedTitle(3)).toBe('3 facturas cargadas');
    expect(dictionaries.ca.loadedTitle(1)).toBe('1 factura carregada');
    expect(dictionaries.ca.loadedTitle(3)).toBe('3 factures carregades');
    expect(dictionaries.en.loadedTitle(1)).toBe('1 invoice loaded');
    expect(dictionaries.en.loadedTitle(3)).toBe('3 invoices loaded');
  });

  it('build the reading progress and the announcement with ignored files', () => {
    expect(dictionaries.es.readingProgress(3, 7)).toBe('Leyendo 3 de 7…');
    expect(dictionaries.en.loadedStatus(2, 0)).toBe('2 invoices loaded');
    expect(dictionaries.en.loadedStatus(2, 1)).toBe('2 invoices loaded. 1 file ignored.');
    expect(dictionaries.ca.loadedStatus(1, 2)).toBe('1 factura carregada. 2 arxius ignorats.');
    expect(dictionaries.es.loadedStatus(1, 1)).toBe('1 factura cargada. 1 archivo ignorado.');
  });
});
