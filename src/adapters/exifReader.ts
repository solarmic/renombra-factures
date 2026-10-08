import { parseExifDateTime, type PhotoMoment } from '../domain/photoTime';
import { cachedLoader } from './cachedLoader';

export interface PhotoMeta {
  moment: PhotoMoment | null;
  gps: { lat: number; lon: number } | null;
}

export interface ExifParser {
  parse(input: Blob | Uint8Array, options?: Record<string, unknown>): Promise<Record<string, unknown> | undefined>;
}

/**
 * The lite bundle reads JPEG and HEIC (what phones and cameras produce) and is fetched on the first photo
 * only. For Blobs it reads just the leading chunks that hold the metadata, not the whole picture.
 */
export const loadExifr = cachedLoader<ExifParser>(async () => (await import('exifr/dist/lite.esm.mjs')).default);

// Raw strings (no Date revival) so the wall-clock time is not shifted by the viewer's time zone.
const OPTIONS = {
  reviveValues: false,
  tiff: true,
  exif: true,
  gps: true,
  xmp: false,
  icc: false,
  iptc: false,
  jfif: false,
  ihdr: false,
  interop: false,
  ifd1: false,
};

const EMPTY: PhotoMeta = { moment: null, gps: null };

/** Never throws: unreadable or metadata-less files simply yield empty metadata. */
export async function readPhotoMeta(source: Blob | Uint8Array, load: () => Promise<ExifParser> = loadExifr): Promise<PhotoMeta> {
  try {
    const tags = await (await load()).parse(source, OPTIONS);
    if (!tags) return EMPTY;
    const { latitude, longitude } = tags;
    const hasFix =
      typeof latitude === 'number' && typeof longitude === 'number' && Number.isFinite(latitude) && Number.isFinite(longitude) && (latitude !== 0 || longitude !== 0);
    return {
      moment: parseExifDateTime(tags.DateTimeOriginal, tags.SubSecTimeOriginal),
      gps: hasFix ? { lat: latitude, lon: longitude } : null,
    };
  } catch {
    return EMPTY;
  }
}
