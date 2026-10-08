import { describe, expect, it } from 'vitest';
import { splitExtension } from './fileName';

describe('splitExtension', () => {
  it('splits a regular extension', () => {
    expect(splitExtension('Factura 0501.pdf')).toEqual({ base: 'Factura 0501', ext: '.pdf' });
    expect(splitExtension('a.b.JPEG')).toEqual({ base: 'a.b', ext: '.JPEG' });
  });

  it('does not treat digit-only or overlong tails as an extension', () => {
    expect(splitExtension('Factura 05.01.2026')).toEqual({ base: 'Factura 05.01.2026', ext: '' });
    expect(splitExtension('file.abcdefg')).toEqual({ base: 'file.abcdefg', ext: '' });
  });

  it('keeps a name that is only an extension whole', () => {
    expect(splitExtension('.pdf')).toEqual({ base: '.pdf', ext: '' });
    expect(splitExtension('noext')).toEqual({ base: 'noext', ext: '' });
  });
});
