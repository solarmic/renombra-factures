import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { buildZip } from './zipExport';

describe('buildZip', () => {
  it('stores each entry under its new name with the original bytes', async () => {
    const blob = await buildZip([
      { name: '1-26V-07 a.pdf', data: new Uint8Array([1, 2, 3]) },
      { name: '1-26V-08 b.jpg', data: new Uint8Array([9]) },
    ]);
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    expect(Object.keys(zip.files).sort()).toEqual(['1-26V-07 a.pdf', '1-26V-08 b.jpg']);
    expect([...(await zip.file('1-26V-07 a.pdf')!.async('uint8array'))]).toEqual([1, 2, 3]);
  });

  it('returns a zip blob', async () => {
    const blob = await buildZip([]);
    expect(blob.type).toBe('application/zip');
  });
});
