export type FileKind = 'pdf' | 'image' | 'unsupported';

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'heic', 'heif', 'webp', 'gif', 'tif', 'tiff', 'bmp', 'avif']);

export function classifyFile(file: { name: string; type: string }): FileKind {
  const ext = /\.([A-Za-z0-9]+)$/.exec(file.name)?.[1]?.toLowerCase() ?? '';
  const type = file.type.toLowerCase();
  if (type === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (type.startsWith('image/') || IMAGE_EXTENSIONS.has(ext)) return 'image';
  return 'unsupported';
}
