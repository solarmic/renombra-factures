import { isValidYMD, type YMD } from './types';

export interface TextDate {
  date: YMD;
  /** 0..1, derived from keyword context around the chosen candidate. */
  confidence: number;
}

export interface ExtractOptions {
  minYear?: number;
  maxYear?: number;
}

// ---------------------------------------------------------------------------
// Month names (accent-free, lower-case). Spanish, Catalan and English.
// ---------------------------------------------------------------------------
const MONTHS: Record<string, number> = {
  enero: 1, ene: 1, gener: 1, gen: 1, january: 1, jan: 1,
  febrero: 2, feb: 2, febrer: 2, febr: 2, february: 2,
  marzo: 3, mar: 3, marc: 3, march: 3,
  abril: 4, abr: 4, april: 4, apr: 4,
  mayo: 5, may: 5, maig: 5,
  junio: 6, jun: 6, juny: 6, june: 6,
  julio: 7, jul: 7, juliol: 7, july: 7,
  agosto: 8, ago: 8, agost: 8, ag: 8, august: 8, aug: 8,
  septiembre: 9, setiembre: 9, sep: 9, sept: 9, setembre: 9, set: 9, september: 9,
  octubre: 10, oct: 10, october: 10,
  noviembre: 11, nov: 11, novembre: 11, november: 11,
  diciembre: 12, dic: 12, desembre: 12, des: 12, december: 12, dec: 12,
};

const MONTH_ALT = Object.keys(MONTHS)
  .sort((a, b) => b.length - a.length)
  .join('|');

/** Lower-cases and strips diacritics while keeping string length (1:1 per UTF-16 unit). */
function fold(text: string): string {
  let out = '';
  for (const ch of text) {
    const base = ch.normalize('NFD')[0] ?? ch;
    const lower = base.toLowerCase();
    out += lower.length === ch.length ? lower : ch;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Candidate detection (runs on folded text so month names match without accents).
// ---------------------------------------------------------------------------
interface Raw {
  index: number;
  end: number;
  date: YMD;
  /** True when dd/mm was not a valid date and the numbers were read as mm/dd instead (scored lower). */
  swapped: boolean;
}

const expandYear = (yy: number) => 2000 + yy;

function numericCandidates(text: string): Raw[] {
  const out: Raw[] = [];

  for (const m of text.matchAll(/(?<![\d.\/-])(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})(?![\d.\/])/g)) {
    out.push({
      index: m.index!,
      end: m.index! + m[0].length,
      date: { y: +m[1]!, m: +m[2]!, d: +m[3]! },
      swapped: false,
    });
  }

  for (const m of text.matchAll(/(?<![\d.\/-])(\d{1,2}) ?[-\/.] ?(\d{1,2}) ?[-\/.] ?(\d{4}|\d{2})(?![\d])(?![.\/]\d)/g)) {
    const a = +m[1]!;
    const b = +m[2]!;
    const y = m[3]!.length === 2 ? expandYear(+m[3]!) : +m[3]!;
    const index = m.index!;
    const end = index + m[0].length;
    if (isValidYMD({ y, m: b, d: a })) out.push({ index, end, date: { y, m: b, d: a }, swapped: false });
    else if (isValidYMD({ y, m: a, d: b })) out.push({ index, end, date: { y, m: a, d: b }, swapped: true });
  }
  return out;
}

function writtenCandidates(text: string): Raw[] {
  const out: Raw[] = [];
  const push = (m: RegExpMatchArray, d: string, mon: string, y: string) => {
    const month = MONTHS[mon.replace(/\.$/, '')];
    if (month === undefined) return;
    out.push({ index: m.index!, end: m.index! + m[0].length, date: { y: +y, m: month, d: +d }, swapped: false });
  };

  // 5 de enero de 2026 / 5 d'abril de 2026 / 5 Jan 2026 / 5th January, 2026
  const dayFirst = new RegExp(
    `(?<![\\d])(\\d{1,2})(?:st|nd|rd|th)?\\s*(?:de\\s+|d['’]\\s*)?(${MONTH_ALT})\\.?,?\\s*(?:de\\s+|del\\s+|d['’]\\s*)?(\\d{4})(?!\\d)`,
    'g',
  );
  for (const m of text.matchAll(dayFirst)) push(m, m[1]!, m[2]!, m[3]!);

  // January 5, 2026 / Sept 5th, 2026
  const monthFirst = new RegExp(
    `(?<![a-z])(${MONTH_ALT})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})(?!\\d)`,
    'g',
  );
  for (const m of text.matchAll(monthFirst)) push(m, m[2]!, m[1]!, m[3]!);

  return out;
}

// ---------------------------------------------------------------------------
// Keyword scoring
// ---------------------------------------------------------------------------
// Scoring model. Each candidate date starts at 0 and the highest score wins (earliest position breaks
// ties). The weights below were tuned against real invoices and relate like this:
//  - A STRONG label ("fecha de factura") outranks WEAK ("fecha") which outranks LABEL ("factura").
//  - Every penalty outweighs the biggest same-line bonus, so "fecha de vencimiento" never beats a
//    plain issue date: PENALTY_BEFORE (6) > BONUS_STRONG (5).
//  - Context taken from the label row above a bare date is weaker than context on the same line.
//  - Candidates at or below DROP_AT_OR_BELOW are discarded outright instead of being merely outranked.
const BONUS_STRONG = 5;
const BONUS_WEAK = 2;
const BONUS_LABEL = 1;
const PENALTY_BEFORE = 6; // excluded-kind keyword ("vencimiento", "pedido"...) just before the date
const PENALTY_RANGE_LEAD = 4; // "desde / hasta / from / to" directly before: part of a period, not the issue date
const PENALTY_AFTER = 3; // excluded-kind keyword right after the date
const PENALTY_SWAPPED = 1; // mm/dd reading is only a fallback for an impossible dd/mm
const ABOVE_BONUS_STRONG = 3; // label row above a bare date (tabular layouts)
const ABOVE_BONUS_WEAK = 2;
const ABOVE_PENALTY = 2;
/** Characters of same-line text before the date that count as its label. */
const CONTEXT_BEFORE_CHARS = 45;
/** Characters of same-line text after the date inspected for excluded-kind keywords. */
const CONTEXT_AFTER_CHARS = 15;
/** At most this many lines are skipped upward when looking for the label row above a date. */
const LABEL_ABOVE_MAX_LINES = 5;
/** Proportional fonts shift columns a little: the nearest label start must be within this many columns. */
const LABEL_ABOVE_MAX_COLUMN_DISTANCE = 20;

const STRONG_POSITIVE = [
  /fecha (?:de )?(?:la )?(?:factura|emision|expedicion)/,
  /data (?:de )?(?:la )?(?:factura|emissio|expedicio)/,
  /data d['’](?:emissio|expedicio)/,
  /invoice date/,
  /date of issue/,
  /issue date/,
  /factura de fecha/,
  /(?<![a-z])(?:emision|emissio)/,
];
const WEAK_POSITIVE = /(?<![a-z])(?:fecha|data|date|fec|dat)(?![a-z])/;
const LABEL_POSITIVE = /(?<![a-z])(?:factura|invoice|emitida|emesa|issued)(?![a-z])/;
const PENALTY = new RegExp(
  [
    'albaran', 'albara', 'delivery', 'entrega', 'lliurament', 'vencimiento', 'vence', 'venciment',
    '(?<![a-z])due(?![a-z])', 'pedido', 'comanda', 'order', 'periodo', 'periode', 'period',
    'operacio', 'operacion', 'pago', 'pagament', 'payment', 'cobro', 'cobrament', 'servicio', 'servei', 'service date',
  ].join('|'),
);
const RANGE_LEAD = /(?<![a-z])(?:desde|hasta|des de|fins|from|until|to|del|al)\s*$/;

interface Scored extends Raw {
  score: number;
}

function lineBefore(folded: string, index: number): string {
  const start = folded.lastIndexOf('\n', index - 1) + 1;
  return folded.slice(start, index).replace(/\s+/g, ' ');
}

/**
 * Label row context for a bare date in a tabular layout: the cell of the previous
 * non-blank line that sits above the candidate's column. Falls back to the whole
 * line when it is a single cell.
 */
function labelAbove(folded: string, index: number): string {
  const lineStart = folded.lastIndexOf('\n', index - 1) + 1;
  if (lineStart === 0) return '';
  const col = index - lineStart;
  let end = lineStart - 1;
  let prev = '';
  let guard = 0;
  while (end >= 0 && guard++ < LABEL_ABOVE_MAX_LINES) {
    const start = folded.lastIndexOf('\n', end - 1) + 1;
    prev = folded.slice(start, end);
    if (prev.trim() !== '') break;
    end = start - 1;
  }
  if (prev.trim() === '') return '';
  const cells = [...prev.matchAll(/\S+(?: \S+)*/g)].map((m) => ({
    start: m.index!,
    end: m.index! + m[0].length,
    text: m[0],
  }));
  if (cells.length === 1) return cells[0]!.text;
  // Proportional fonts shift columns slightly, so pick the label whose start is nearest.
  let chosen: (typeof cells)[number] | undefined;
  for (const cell of cells) {
    if (!chosen || Math.abs(cell.start - col) < Math.abs(chosen.start - col)) chosen = cell;
  }
  return chosen && Math.abs(chosen.start - col) <= LABEL_ABOVE_MAX_COLUMN_DISTANCE ? chosen.text : '';
}

function lineAfter(folded: string, end: number): string {
  const nl = folded.indexOf('\n', end);
  return folded.slice(end, nl === -1 ? undefined : nl).replace(/\s+/g, ' ');
}

function scoreCandidate(folded: string, raw: Raw): number {
  const before = lineBefore(folded, raw.index).slice(-CONTEXT_BEFORE_CHARS);
  const after = lineAfter(folded, raw.end).slice(0, CONTEXT_AFTER_CHARS);
  let score = 0;

  if (STRONG_POSITIVE.some((re) => re.test(before))) score += BONUS_STRONG;
  else if (WEAK_POSITIVE.test(before)) score += BONUS_WEAK;
  else if (LABEL_POSITIVE.test(before)) score += BONUS_LABEL;

  if (PENALTY.test(before)) score -= PENALTY_BEFORE;
  if (RANGE_LEAD.test(before)) score -= PENALTY_RANGE_LEAD;
  if (PENALTY.test(after)) score -= PENALTY_AFTER;

  // A bare date inherits a little context from the label row above it.
  if (score === 0) {
    const above = labelAbove(folded, raw.index);
    if (PENALTY.test(above)) score -= ABOVE_PENALTY;
    else if (STRONG_POSITIVE.some((re) => re.test(above))) score += ABOVE_BONUS_STRONG;
    else if (WEAK_POSITIVE.test(above) || LABEL_POSITIVE.test(above)) score += ABOVE_BONUS_WEAK;
  }

  if (raw.swapped) score -= PENALTY_SWAPPED;
  return score;
}

/** Candidates scoring at or below this are rejected (a strong penalty with no offsetting label). */
const DROP_AT_OR_BELOW = -3;

/** Maps the winning score to a 0..1 confidence; the thresholds mirror the bonus tiers above. */
function toConfidence(score: number): number {
  if (score >= 5) return 0.95;
  if (score >= 3) return 0.85;
  if (score >= 1) return 0.7;
  if (score === 0) return 0.45;
  return 0.25;
}

export function extractDateFromText(text: string, opts: ExtractOptions = {}): TextDate | null {
  const minYear = opts.minYear ?? 2000;
  const maxYear = opts.maxYear ?? 2100;
  const folded = fold(text);

  const scored: Scored[] = [...numericCandidates(folded), ...writtenCandidates(folded)]
    .filter((c) => isValidYMD(c.date) && c.date.y >= minYear && c.date.y <= maxYear)
    .map((c) => ({ ...c, score: scoreCandidate(folded, c) }))
    .filter((c) => c.score > DROP_AT_OR_BELOW);

  if (scored.length === 0) return null;

  // Highest score wins; earliest position breaks ties.
  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  const best = scored[0]!;
  return { date: best.date, confidence: toConfidence(best.score) };
}
