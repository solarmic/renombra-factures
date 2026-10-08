import { describe, expect, it } from 'vitest';
import { isPhotoFile } from './photoKind';

describe('isPhotoFile', () => {
  it('accepts supported photo formats by extension or type', () => {
    for (const name of ['a.jpg', 'a.JPEG', 'a.png', 'a.heic', 'a.HEIF', 'a.webp', 'a.tif', 'a.tiff', 'a.gif']) {
      expect(isPhotoFile({ name, type: '' }), name).toBe(true);
    }
    expect(isPhotoFile({ name: 'noext', type: 'image/jpeg' })).toBe(true);
  });

  it('rejects everything else', () => {
    for (const name of ['a.pdf', 'a.mp4', 'a.txt', 'a.svg', 'a']) expect(isPhotoFile({ name, type: '' }), name).toBe(false);
    expect(isPhotoFile({ name: 'a.bin', type: 'video/mp4' })).toBe(false);
  });
});
