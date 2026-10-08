import { splitExtension } from './fileName';
import { isValidYMD, type YMD } from './types';

export interface FilenameDate {
  date: YMD;
  /** `full` carries a year in the name; `day-month` borrowed the fallback year. */
  precision: 'full' | 'day-month';
}

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

/** The match that appears earliest in the name (the list is already filtered to valid dates). */
function earliest(matches: Match[]): Match | undefined {
  return matches.reduce<Match | undefined>((best, m) => (!best || m.index < best.index ? m : best), undefined);
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

/** Digit runs of exactly `length` characters, turned into matches by `build` (null = not a date). */
function fromRuns(
  runs: { text: string; index: number }[],
  length: number,
  build: (digits: string) => YMD | null,
  precision: Match['precision'],
): Match[] {
  const out: Match[] = [];
  for (const run of runs) {
    if (run.text.length !== length) continue;
    const date = build(run.text);
    if (date) out.push({ index: run.index, date, precision });
  }
  return out;
}

export function extractDateFromFilename(name: string, fallbackYear: number): FilenameDate | null {
  const { base } = splitExtension(name);

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
  const sep = earliest(separated);
  if (sep) return { date: sep.date, precision: sep.precision };

  const runs = [...base.matchAll(/\d+/g)].map((m) => ({ text: m[0], index: m.index ?? 0 }));

  // Unseparated digit runs, from the most to the least specific length.
  const eight = earliest(
    fromRuns(
      runs,
      8,
      (t) =>
        ok({ y: +t.slice(4), m: +t.slice(2, 4), d: +t.slice(0, 2) }) ?? // DDMMYYYY
        ok({ y: +t.slice(0, 4), m: +t.slice(4, 6), d: +t.slice(6) }), //   YYYYMMDD
      'full',
    ),
  );
  if (eight) return { date: eight.date, precision: eight.precision };

  const six = earliest(
    fromRuns(runs, 6, (t) => ok({ y: expandYear(+t.slice(4)), m: +t.slice(2, 4), d: +t.slice(0, 2) }), 'full'), // DDMMYY
  );
  if (six) return { date: six.date, precision: six.precision };

  const four = earliest(
    fromRuns(
      runs,
      4,
      (t) => {
        const date = { y: fallbackYear, m: +t.slice(2), d: +t.slice(0, 2) }; // DDMM, year borrowed
        return isValidYMD(date) ? date : null;
      },
      'day-month',
    ),
  );
  if (four) return { date: four.date, precision: four.precision };

  return null;
}
