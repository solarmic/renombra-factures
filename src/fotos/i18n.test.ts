import { describe, expect, it } from 'vitest';
import { fotosDictionaries } from './i18n';

describe('photos dictionaries', () => {
  it('have identical keys in every language', () => {
    const keys = (l: keyof typeof fotosDictionaries) => Object.keys(fotosDictionaries[l]).sort();
    expect(keys('ca')).toEqual(keys('es'));
    expect(keys('en')).toEqual(keys('es'));
  });

  it('use the agreed hero titles, split over two lines', () => {
    const full = (l: keyof typeof fotosDictionaries) => `${fotosDictionaries[l].heroLine1} ${fotosDictionaries[l].heroLine2}`;
    expect(full('es')).toBe('Ordena y renombra tus fotos');
    expect(full('ca')).toBe('Ordena i reanomena les teves fotos');
    expect(full('en')).toBe('Sort and rename your photos');
  });

  it('render the parameterised messages', () => {
    for (const d of Object.values(fotosDictionaries)) {
      expect(d.readyCount(1)).not.toBe(d.readyCount(3));
      expect(d.noDateBody(1)).not.toBe(d.noDateBody(4));
      expect(d.noGpsBody(4)).toContain('4');
    }
  });
});
