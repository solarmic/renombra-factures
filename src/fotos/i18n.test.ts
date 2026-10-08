import { describe, expect, it } from 'vitest';
import { fotosDictionaries } from './i18n';

describe('photos dictionaries', () => {
  it('have identical keys in every language', () => {
    const keys = (l: keyof typeof fotosDictionaries) => Object.keys(fotosDictionaries[l]).sort();
    expect(keys('ca')).toEqual(keys('es'));
    expect(keys('en')).toEqual(keys('es'));
  });

  it('use the agreed hero titles, split into line, possessive and noun', () => {
    const full = (l: keyof typeof fotosDictionaries) => `${fotosDictionaries[l].heroLine1} ${fotosDictionaries[l].heroPossessive} ${fotosDictionaries[l].heroNoun}`;
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

describe('dropzone messages (photos)', () => {
  it('pluralise the loaded title in every language', () => {
    expect(fotosDictionaries.es.loadedTitle(1)).toBe('1 foto cargada');
    expect(fotosDictionaries.es.loadedTitle(3)).toBe('3 fotos cargadas');
    expect(fotosDictionaries.ca.loadedTitle(1)).toBe('1 foto carregada');
    expect(fotosDictionaries.ca.loadedTitle(3)).toBe('3 fotos carregades');
    expect(fotosDictionaries.en.loadedTitle(1)).toBe('1 photo loaded');
    expect(fotosDictionaries.en.loadedTitle(3)).toBe('3 photos loaded');
  });

  it('build the reading progress and the announcement with ignored files', () => {
    expect(fotosDictionaries.ca.readingProgress(3, 7)).toBe('Llegint 3 de 7…');
    expect(fotosDictionaries.en.loadedStatus(2, 2)).toBe('2 photos loaded. 2 files ignored.');
  });
});
