/** Wall-clock capture time, as shown on the camera (no time zone). */
export interface PhotoMoment {
  y: number;
  m: number;
  d: number;
  hh: number;
  mi: number;
  ss: number;
  ms: number;
}

/** Wall-clock components as if they were UTC: a total order that ignores time zones and DST. */
export function momentToMs(t: PhotoMoment): number {
  return Date.UTC(t.y, t.m - 1, t.d, t.hh, t.mi, t.ss, t.ms);
}

export function isValidMoment(t: PhotoMoment): boolean {
  if (t.y < 1900 || t.m < 1 || t.m > 12 || t.d < 1 || t.hh > 23 || t.mi > 59 || t.ss > 59) return false;
  return t.d <= new Date(Date.UTC(t.y, t.m, 0)).getUTCDate();
}

/** Local-time components of a Date (used for File.lastModified). */
export function momentFromDate(date: Date): PhotoMoment {
  return {
    y: date.getFullYear(),
    m: date.getMonth() + 1,
    d: date.getDate(),
    hh: date.getHours(),
    mi: date.getMinutes(),
    ss: date.getSeconds(),
    ms: date.getMilliseconds(),
  };
}

const EXIF_DATE = /^\s*(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/;

/** Parses `YYYY:MM:DD HH:MM:SS` plus an optional SubSecTime value ("12" means .12 s). Invalid input gives null. */
export function parseExifDateTime(raw: unknown, subSec?: unknown): PhotoMoment | null {
  if (typeof raw !== 'string') return null;
  const match = EXIF_DATE.exec(raw);
  if (!match) return null;
  const [y, m, d, hh, mi, ss] = match.slice(1).map(Number) as [number, number, number, number, number, number];
  const digits = /^\d+$/.test(String(subSec ?? '').trim()) ? String(subSec).trim() : '';
  const ms = digits === '' ? 0 : Number(digits.slice(0, 3).padEnd(3, '0'));
  const moment = { y, m, d, hh, mi, ss, ms };
  return isValidMoment(moment) ? moment : null;
}
