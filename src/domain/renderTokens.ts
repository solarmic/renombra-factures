export type TokenValues = Readonly<Record<string, string | number>>;

const EMPTY = '\u0000';
const SEP = '[ _.\\-]*';
// An empty token plus the separators around it (and any further empty tokens chained through separators).
const EMPTY_RUN = new RegExp(`(${SEP})${EMPTY}(?:(${SEP})${EMPTY})*(${SEP})`, 'g');
const TOKEN = /\{([a-z0-9]+)(?::(\d+))?\}/g;

/**
 * Shared template engine. Only tokens present in `values` are substituted; anything else stays literal so
 * typos are visible in the preview. `n` (a number) accepts a zero-pad width; string tokens do not.
 *
 * A string token that is empty (blank) disappears together with the separators (`_ - . space`)
 * around it, so `{n:2}_{t1}_{t2}` with an empty `t1` gives `01_Familia`, not `01__Familia`. Separators next
 * to non-empty content and literal text typed by the user are never altered.
 */
export function renderTokens(template: string, values: TokenValues): string {
  const rendered = template.replace(TOKEN, (whole, token: string, width?: string) => {
    const value = values[token];
    if (value === undefined) return whole;
    if (typeof value === 'number') return String(value).padStart(width === undefined ? 0 : Number(width), '0');
    if (width !== undefined) return whole;
    const text = value.replaceAll(EMPTY, '');
    return text.trim() === '' ? EMPTY : text;
  });
  if (!rendered.includes(EMPTY)) return rendered;

  return rendered.replace(EMPTY_RUN, (group: string, pre: string, _mid: unknown, post: string, offset: number, all: string) => {
    if (offset === 0 || offset + group.length === all.length) return '';
    // Keep one separator run: the one before the empties, else after, else the first one between them.
    return pre || post || group.match(/[ _.\-]+/)?.[0] || '';
  });
}
