const EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'heic', 'heif', 'webp', 'tif', 'tiff', 'gif']);
const TYPES = new Set(['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp', 'image/tiff', 'image/gif']);

export function isPhotoFile(file: { name: string; type: string }): boolean {
  const ext = /\.([A-Za-z0-9]+)$/.exec(file.name)?.[1]?.toLowerCase() ?? '';
  return EXTENSIONS.has(ext) || TYPES.has(file.type.toLowerCase());
}
