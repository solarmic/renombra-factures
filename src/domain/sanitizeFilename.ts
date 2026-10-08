// eslint-disable-next-line no-control-regex
const FORBIDDEN = /[\\/:*?"<>|\u0000-\u001f]/g;

/** Makes a name safe for Windows, macOS and Linux. Extension handling is the caller's job. */
export function sanitizeFilename(name: string, replacement = '-'): string {
  const cleaned = name
    .replace(FORBIDDEN, replacement)
    .replace(/^ +/, '')
    .replace(/[. ]+$/, '');
  return cleaned === '' ? '_' : cleaned;
}
