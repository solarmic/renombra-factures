// eslint-disable-next-line no-control-regex
const FORBIDDEN = /[\\/:*?"<>|\u0000-\u001f]/;
const FORBIDDEN_ALL = new RegExp(FORBIDDEN.source, 'g');

export const DEFAULT_REPLACEMENT = '-';

/** A usable replacement is non-empty and contains no character that is itself forbidden. */
export function isValidReplacement(replacement: string): boolean {
  return replacement !== '' && !FORBIDDEN.test(replacement);
}

/**
 * Makes a name safe for Windows, macOS and Linux. Extension handling is the caller's job.
 * An invalid replacement (empty or forbidden) falls back to a dash so forbidden characters never come back.
 */
export function sanitizeFilename(name: string, replacement = DEFAULT_REPLACEMENT): string {
  const safe = isValidReplacement(replacement) ? replacement : DEFAULT_REPLACEMENT;
  const cleaned = name
    .replace(FORBIDDEN_ALL, safe)
    .replace(/^ +/, '')
    .replace(/[. ]+$/, '');
  return cleaned === '' ? '_' : cleaned;
}
