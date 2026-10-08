import { parsePhotoName } from './photoNameKey';
import { momentFromDate, momentToMs, type PhotoMoment } from './photoTime';

export type PhotoSource = 'exif' | 'name' | 'file';

export interface PhotoKey {
  source: PhotoSource;
  /** Time used for date/time tokens: EXIF, name datetime, or (counter-only/unknown) the file date. */
  moment: PhotoMoment;
  /** 0 = exact capture moment (EXIF or datetime in name), 1 = counter only, 2 = file date only. */
  tier: 0 | 1 | 2;
  /** Tier 0/2: wall-clock ms; tier 1: the counter. */
  value: number;
  /** Secondary order inside equal values (WhatsApp counter). */
  tie: number;
}

export interface PhotoKeyInput {
  name: string;
  exifMoment: PhotoMoment | null;
  lastModified: number;
}

/**
 * Ordering rule for mixed sources (see comparePhotoKeys): photos with an exact capture moment (EXIF, or a
 * datetime encoded in the name such as PXL_20260705_123456789) come first in time order; photos known only
 * by a camera counter follow, ordered by counter; photos with nothing but the file date come last.
 * Capture time is wall-clock: the EXIF offset is ignored so cameras without time zone mix with phones.
 */
export function photoSortKey({ name, exifMoment, lastModified }: PhotoKeyInput): PhotoKey {
  const fileMoment = momentFromDate(new Date(lastModified));
  const fromName = parsePhotoName(name);

  if (exifMoment) return { source: 'exif', moment: exifMoment, tier: 0, value: momentToMs(exifMoment), tie: fromName.counter ?? 0 };
  if (fromName.moment) {
    return { source: 'name', moment: fromName.moment, tier: 0, value: momentToMs(fromName.moment), tie: fromName.counter ?? 0 };
  }
  if (fromName.counter !== null) return { source: 'name', moment: fileMoment, tier: 1, value: fromName.counter, tie: 0 };
  return { source: 'file', moment: fileMoment, tier: 2, value: momentToMs(fileMoment), tie: 0 };
}

export function comparePhotoKeys(a: PhotoKey, b: PhotoKey): number {
  return a.tier - b.tier || a.value - b.value || a.tie - b.tie;
}
