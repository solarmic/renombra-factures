import { isValidYMD, type YMD } from './types';

export interface FilenameDate {
  date: YMD;
  /** `full` carries a year in the name; `day-month` borrowed the fallback year. */
  precision: 'full' | 'day-month';
}

const EXTENSION = /\.(?=[A-Za-z0-9]{1,5}$)[A-Za-z0-9]*[A-Za-z][A-Za-z0-9]*$/;

function expandYear(yy: number): number {
  return 2000 + yy;
}

function plausible(date: YMD, fallbackYear: number): boolean {
  return isValidYMD(date) && date.y >= 2000 && date.y <= fallbackYear + 1;
}

interface Match {
  index: number;
  date: YMD;
  precision: FilenameDate['precision'];
}

function firstValid(matches: Match[]): Match | undefined {
  return matches.sort((a, b) => a.index - b.index)[0];
}

function collect(
  base: string,
  pattern: RegExp,
  build: (m: RegExpExecArray) => YMD | null,
  precision: Match['precision'],
): Match[] {
  const out: Match[] = [];
  for (const m of base.matchAll(pattern)) {
    const date = build(m as RegExpExecArray);
    if (date) out.push({ index: m.index ?? 0, date, precision });
  }
  return out;
}

export function extractDateFromFilename(name: string, fallbackYear: number): FilenameDate | null {
  const base = name.replace(EXTENSION, '');

  const ok = (date: YMD) => (plausible(date, fallbackYear) ? date : null);

  // Separated forms are the most explicit, so they are tried first.
  const separated = [
    ...collect(
      base,
      /(?<!\d)(\d{4})-(\d{2})-(\d{2})(?!\d)/g,
      (m) => ok({ y: +m[1]!, m: +m[2]!, d: +m[3]! }),
      'full',
    ),
    ...collect(
      base,
      /(?<!\d)(\d{1,2})[-.](\d{1,2})[-.](\d{4})(?!\d)/g,
      (m) => ok({ y: +m[3]!, m: +m[2]!, d: +m[1]! }),
      'full',
    ),
    ...collect(
      base,
      /(?<!\d)(\d{1,2})[-.](\d{1,2})[-.](\d{2})(?!\d)/g,
      (m) => ok({ y: expandYear(+m[3]!), m: +m[2]!, d: +m[1]! }),
      'full',
    ),
  ];
  const sep = firstValid(separated);
  if (sep) return { date: sep.date, precision: sep.precision };

  const runs = [...base.matchAll(/\d+/g)].map((m) => ({ text: m[0], index: m.index ?? 0 }));

  const eight = runs
    .filter((r) => r.text.length === 8)
    .map((r): Match | null => {
      const t = r.text;
      const dmy = ok({ y: +t.slice(4), m: +t.slice(2, 4), d: +t.slice(0, 2) });
      const ymd = ok({ y: +t.slice(0, 4), m: +t.slice(4, 6), d: +t.slice(6) });
      const date = dmy ?? ymd;
      return date ? { index: r.index, date, precision: 'full' } : null;
    })
    .filter((m): m is Match => m !== null);
  const e = firstValid(eight);
  if (e) return { date: e.date, precision: 'full' };

  const six = runs
    .filter((r) => r.text.length === 6)
    .map((r): Match | null => {
      const t = r.text;
      const date = ok({ y: expandYear(+t.slice(4)), m: +t.slice(2, 4), d: +t.slice(0, 2) });
      return date ? { index: r.index, date, precision: 'full' } : null;
    })
    .filter((m): m is Match => m !== null);
  const s = firstValid(six);
  if (s) return { date: s.date, precision: 'full' };

  const four = runs
    .filter((r) => r.text.length === 4)
    .map((r): Match | null => {
      const t = r.text;
      const date = { y: fallbackYear, m: +t.slice(2), d: +t.slice(0, 2) };
      return isValidYMD(date) ? { index: r.index, date, precision: 'day-month' } : null;
    })
    .filter((m): m is Match => m !== null);
  const f = firstValid(four);
  if (f) return { date: f.date, precision: 'day-month' };

  return null;
}
