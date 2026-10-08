import { describe, expect, it } from 'vitest';
import { fotosDictionaries } from './i18n';

describe('photos dictionaries', () => {
  it('have identical keys in every language', () => {
    const keys = (l: keyof typeof fotosDictionaries) => Object.keys(fotosDictionaries[l]).sort();
    expect(keys('ca')).toEqual(keys('es'));
    expect(keys('en')).toEqual(keys('es'));
  });

  it('use the agreed hero titles', () => {
    expect(fotosDictionaries.es.heroTitle).toBe('Ordena y renombra tus fotos');
    expect(fotosDictionaries.ca.heroTitle).toBe('Ordena i reanomena les teves fotos');
    expect(fotosDictionaries.en.heroTitle).toBe('Sort and rename your photos');
  });

  it('render the parameterised messages', () => {
    for (const d of Object.values(fotosDictionaries)) {
      expect(d.readyCount(1)).not.toBe(d.readyCount(3));
      expect(d.noDateBody(1)).not.toBe(d.noDateBody(4));
      expect(d.noGpsBody(4)).toContain('4');
    }
  });
});
