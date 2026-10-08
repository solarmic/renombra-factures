import { readPhotoMeta, type PhotoMeta } from '../adapters/exifReader';
import { isPhotoFile } from '../adapters/photoKind';
import { loadPlaceIndex } from '../adapters/placesLoader';
import type { ZipEntry } from '../adapters/zipExport';
import { buildZip } from '../adapters/zipExport';
import { PHOTO_DEFAULTS, PHOTOS_ZIP_FILE_NAME } from '../config';
import { planPhotos, renderPhotoName, type PhotoPlanItem, type PhotoPlanOptions, type PlannedPhoto } from '../domain/planPhotos';
import { nearestPlace, type PlaceIndex } from '../domain/places';
import { photoSortKey, type PhotoKey } from '../domain/photoSortKey';
import { parseExifDateTime, type PhotoMoment } from '../domain/photoTime';
import { isValidReplacement } from '../domain/sanitizeFilename';
import { langState } from '../ui/lang.svelte';
import { fotosDictionaries } from './i18n';

export interface PhotoEntry {
  id: number;
  file: File;
  status: 'reading' | 'done';
  moment: PhotoMoment | null;
  gps: { lat: number; lon: number } | null;
  included: boolean;
  thumb: string | null;
}

export interface PhotoRow {
  entry: PhotoEntry;
  key: PhotoKey;
  place: string | null;
  newName: string | null;
  folder: string | null;
}

export interface PhotoDeps {
  readMeta: (file: Blob) => Promise<PhotoMeta>;
  loadPlaces: () => Promise<PlaceIndex>;
  makeThumb: (file: File) => string | null;
  revokeThumb: (url: string) => void;
}

const defaultDeps: PhotoDeps = {
  readMeta: readPhotoMeta,
  loadPlaces: loadPlaceIndex,
  makeThumb: (file) => (typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : null),
  revokeThumb: (url) => URL.revokeObjectURL(url),
};

const READ_CONCURRENCY = 4;
let nextId = 1;

interface PlanItem extends PhotoPlanItem {
  entry: PhotoEntry;
}

export class PhotoState {
  template = $state<string>(PHOTO_DEFAULTS.template);
  t1 = $state('');
  t2 = $state('');
  start = $state<number>(PHOTO_DEFAULTS.start);
  replacement = $state<string>(PHOTO_DEFAULTS.replacement);
  groupByPlace = $state(false);
  entries = $state<PhotoEntry[]>([]);
  ignored = $state<string[]>([]);
  exporting = $state(false);
  exportFailed = $state(false);
  placesStatus = $state<'idle' | 'loading' | 'ready' | 'error'>('idle');
  placeIndex = $state.raw<PlaceIndex | null>(null);

  private readonly deps: PhotoDeps;

  constructor(deps: PhotoDeps = defaultDeps) {
    this.deps = deps;
  }

  t = $derived(fotosDictionaries[langState.lang]);
  replacementValid = $derived(isValidReplacement(this.replacement));
  safeStart = $derived(Number.isFinite(this.start) ? Math.max(0, Math.trunc(this.start)) : PHOTO_DEFAULTS.start);

  /** The dataset is only needed to fill {place} or to name folders. */
  needsPlaces = $derived(this.groupByPlace || this.template.includes('{place}'));

  private options = $derived<PhotoPlanOptions>({
    template: this.template,
    t1: this.t1,
    t2: this.t2,
    start: this.safeStart,
    replacement: this.replacement,
    groupByPlace: this.groupByPlace,
    noPlaceFolder: this.t.noPlaceFolder,
  });

  private placeOf(entry: PhotoEntry): string | null {
    if (!this.needsPlaces || !this.placeIndex || !entry.gps) return null;
    return nearestPlace(this.placeIndex, entry.gps.lat, entry.gps.lon)?.name ?? null;
  }

  plan = $derived.by(() =>
    planPhotos<PlanItem>(
      this.entries.map((entry) => ({
        entry,
        name: entry.file.name,
        key: photoSortKey({ name: entry.file.name, exifMoment: entry.moment, lastModified: entry.file.lastModified }),
        place: this.placeOf(entry),
        included: entry.included,
      })),
      this.options,
    ),
  );

  /** Included photos in output order, then excluded ones. */
  rows = $derived.by((): PhotoRow[] => {
    const planned = this.plan.planned.map(
      (p: PlannedPhoto<PlanItem>): PhotoRow => ({ entry: p.item.entry, key: p.item.key, place: p.item.place, newName: p.newName, folder: p.folder }),
    );
    const skipped = this.plan.skipped.map(
      (item): PhotoRow => ({ entry: item.entry, key: item.key, place: item.place, newName: null, folder: null }),
    );
    return [...planned, ...skipped];
  });

  readyCount = $derived(this.plan.planned.length);
  reading = $derived(this.entries.some((e) => e.status === 'reading'));
  canExport = $derived(this.readyCount > 0 && !this.reading && !this.exporting);

  /** Photos ordered by name counter or file date because they carry no capture moment. */
  undatedCount = $derived(this.rows.filter((r) => r.entry.status === 'done' && r.key.tier !== 0).length);
  noGpsCount = $derived(this.entries.filter((e) => e.status === 'done' && !e.gps).length);

  preview = $derived.by(() => {
    const first = this.plan.planned[0];
    const item: PhotoPlanItem = first
      ? first.item
      : {
          name: this.t.sampleName,
          key: photoSortKey({
            name: this.t.sampleName,
            exifMoment: parseExifDateTime('2026:07:05 09:30:00'),
            lastModified: 0,
          }),
          place: this.t.samplePlace,
          included: true,
        };
    const n = first ? first.n : this.safeStart;
    return renderPhotoName(item, n, this.options);
  });

  async addFiles(files: Iterable<File>): Promise<void> {
    const added: PhotoEntry[] = [];
    const ignored: string[] = [];
    for (const file of files) {
      if (!isPhotoFile(file)) {
        ignored.push(file.name);
        continue;
      }
      added.push({
        id: nextId++,
        file,
        status: 'reading',
        moment: null,
        gps: null,
        included: true,
        thumb: this.deps.makeThumb(file),
      });
    }
    this.ignored = [...this.ignored, ...ignored];
    this.entries.push(...added);

    // Go through the reactive proxies (see AppState.addFiles for why).
    const tracked = this.entries.slice(this.entries.length - added.length);
    let cursor = 0;
    const worker = async () => {
      while (cursor < tracked.length) await this.readMeta(tracked[cursor++]!);
    };
    await Promise.all(Array.from({ length: Math.min(READ_CONCURRENCY, tracked.length) }, worker));
    await this.syncPlaces();
  }

  private async readMeta(entry: PhotoEntry): Promise<void> {
    const meta = await this.deps.readMeta(entry.file);
    entry.moment = meta.moment;
    entry.gps = meta.gps;
    entry.status = 'done';
  }

  /** Fetches the places dataset the first time it is both needed and useful. Never retries by itself. */
  async syncPlaces(): Promise<void> {
    if (this.placesStatus !== 'idle' || !this.needsPlaces || !this.entries.some((e) => e.gps)) return;
    await this.loadPlaces();
  }

  async retryPlaces(): Promise<void> {
    if (this.placesStatus === 'error') await this.loadPlaces();
  }

  private async loadPlaces(): Promise<void> {
    this.placesStatus = 'loading';
    try {
      this.placeIndex = await this.deps.loadPlaces();
      this.placesStatus = 'ready';
    } catch (error) {
      console.error('Could not load the places dataset', error);
      this.placesStatus = 'error';
    }
  }

  remove(entry: PhotoEntry): void {
    if (entry.thumb) this.deps.revokeThumb(entry.thumb);
    this.entries = this.entries.filter((e) => e.id !== entry.id);
  }

  clear(): void {
    for (const e of this.entries) if (e.thumb) this.deps.revokeThumb(e.thumb);
    this.entries = [];
    this.ignored = [];
  }

  dismissIgnored(): void {
    this.ignored = [];
  }

  dismissExportError(): void {
    this.exportFailed = false;
  }

  /** The ZIP content: each photo's original bytes under its new name (and folder when grouping). */
  async exportEntries(): Promise<ZipEntry[]> {
    return Promise.all(
      this.plan.planned.map(async (p) => ({
        name: p.newName,
        folder: p.folder,
        data: await p.item.entry.file.arrayBuffer(),
      })),
    );
  }

  async exportZip(): Promise<void> {
    if (!this.canExport) return;
    this.exporting = true;
    this.exportFailed = false;
    try {
      const blob = await buildZip(await this.exportEntries());
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = PHOTOS_ZIP_FILE_NAME;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      this.exportFailed = true;
    } finally {
      this.exporting = false;
    }
  }
}

export const photos = new PhotoState();
