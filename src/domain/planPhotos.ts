import { splitExtension } from './fileName';
import { comparePhotoKeys, type PhotoKey } from './photoSortKey';
import { renderTokens } from './renderTokens';
import { sanitizeFilename } from './sanitizeFilename';
import { uniqueName } from './uniqueName';

export interface PhotoPlanItem {
  name: string;
  key: PhotoKey;
  /** Resolved place name, or null when unknown (no GPS or nothing close). */
  place: string | null;
  included: boolean;
}

export interface PhotoPlanOptions {
  template: string;
  t1: string;
  t2: string;
  start: number;
  replacement: string;
  groupByPlace: boolean;
  /** Folder for photos without a place when grouping (already translated). */
  noPlaceFolder: string;
}

export interface PlannedPhoto<T extends PhotoPlanItem> {
  item: T;
  n: number;
  newName: string;
  /** Folder inside the ZIP, or null when not grouping. */
  folder: string | null;
  /** `folder/newName` or just `newName`. */
  path: string;
}

export interface PhotoPlan<T extends PhotoPlanItem> {
  planned: PlannedPhoto<T>[];
  skipped: T[];
}

const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });
const pad2 = (v: number) => String(v).padStart(2, '0');

/** Renders one name from a template (also used for the live preview). */
export function renderPhotoName(item: PhotoPlanItem, n: number, o: PhotoPlanOptions): string {
  const { base, ext } = splitExtension(item.name);
  const m = item.key.moment;
  const rendered = renderTokens(o.template, {
    n,
    t1: o.t1.trim(),
    t2: o.t2.trim(),
    yyyy: String(m.y).padStart(4, '0'),
    yy: pad2(m.y % 100),
    mm: pad2(m.m),
    dd: pad2(m.d),
    hh: pad2(m.hh),
    min: pad2(m.mi),
    place: item.place ?? '',
    name: base,
  });
  // An all-empty template keeps the photo recognisable instead of producing "_".
  return sanitizeFilename(rendered === '' ? base : rendered, o.replacement) + ext;
}

/**
 * Orders included photos by capture key (ties: original name, natural, case-insensitive), numbers them in
 * that single global sequence and names them. With `groupByPlace`, each gets a folder named after its place.
 */
export function planPhotos<T extends PhotoPlanItem>(items: readonly T[], options: PhotoPlanOptions): PhotoPlan<T> {
  const skipped = items.filter((i) => !i.included);
  const candidates = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.included)
    .sort(
      (a, b) =>
        comparePhotoKeys(a.item.key, b.item.key) || collator.compare(a.item.name, b.item.name) || a.index - b.index,
    );

  const used = new Set<string>();
  const folders = new Map<string, string>(); // lower-case → first spelling seen
  const folderFor = (place: string | null): string => {
    const name = sanitizeFilename(place?.trim() || options.noPlaceFolder, options.replacement);
    return folders.get(name.toLowerCase()) ?? (folders.set(name.toLowerCase(), name), name);
  };

  const planned = candidates.map(({ item }, position): PlannedPhoto<T> => {
    const n = options.start + position;
    const folder = options.groupByPlace ? folderFor(item.place) : null;
    const { base, ext } = splitExtension(renderPhotoName(item, n, options));
    const newName = uniqueName(used, base, ext, folder === null ? '' : `${folder}/`);
    return { item, n, newName, folder, path: folder === null ? newName : `${folder}/${newName}` };
  });

  return { planned, skipped };
}
