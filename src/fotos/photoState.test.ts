import JSZip from 'jszip';
import { describe, expect, it, vi } from 'vitest';
import { ExifLoadError, type PhotoMeta } from '../adapters/exifReader';
import { buildPlaceIndex } from '../domain/places';
import { parseExifDateTime } from '../domain/photoTime';
import { langState } from '../ui/lang.svelte';
import { PhotoState, type PhotoDeps } from './photoState.svelte';

const file = (name: string, type = 'image/jpeg', lastModified = 0) =>
  new File([new Uint8Array([name.length])], name, { type, lastModified });

const metaOf: Record<string, PhotoMeta> = {
  'ciu.jpg': { moment: parseExifDateTime('2026:07:05 10:00:00'), gps: { lat: 40.0012, lon: 3.838 } },
  'mao.jpg': { moment: parseExifDateTime('2026:07:05 09:00:00'), gps: { lat: 39.8885, lon: 4.2658 } },
  'nogps.jpg': { moment: parseExifDateTime('2026:07:05 11:00:00'), gps: null },
};

langState.setLang('en');

function setup(overrides: Partial<PhotoDeps> = {}) {
  const deps: PhotoDeps = {
    readMeta: async (f) => metaOf[(f as File).name] ?? { moment: null, gps: null },
    loadPlaces: vi.fn(async () =>
      buildPlaceIndex([
        { name: 'Ciutadella', lat: 40.001, lon: 3.838 },
        { name: 'Maó', lat: 39.889, lon: 4.266 },
      ]),
    ),
    makeThumb: (f) => `blob:${f.name}`,
    revokeThumb: vi.fn(),
    ...overrides,
  };
  return { state: new PhotoState(deps), deps };
}

describe('PhotoState', () => {
  it('ignores non-photos and reports them', async () => {
    const { state } = setup();
    await state.addFiles([file('a.pdf', 'application/pdf'), file('ciu.jpg')]);
    expect(state.ignored).toEqual(['a.pdf']);
    expect(state.entries).toHaveLength(1);
  });

  it('orders by capture time and applies the default template with the titles', async () => {
    const { state } = setup();
    state.t1 = 'Menorca';
    state.t2 = 'Familia';
    await state.addFiles([file('ciu.jpg'), file('mao.jpg')]);
    expect(state.rows.map((r) => r.newName)).toEqual(['01_Menorca_Familia.jpg', '02_Menorca_Familia.jpg']);
    expect(state.rows.map((r) => r.entry.file.name)).toEqual(['mao.jpg', 'ciu.jpg']);
    expect(state.canExport).toBe(true);
  });

  it('does not load the places dataset unless {place} or folders are used', async () => {
    const { state, deps } = setup();
    await state.addFiles([file('ciu.jpg')]);
    await state.syncPlaces();
    expect(deps.loadPlaces).not.toHaveBeenCalled();
    expect(state.rows[0]?.place).toBeNull();
  });

  it('loads the dataset once when {place} is used and resolves places', async () => {
    const { state, deps } = setup();
    state.template = '{n:2}_{place}';
    await state.addFiles([file('ciu.jpg'), file('mao.jpg')]);
    await state.syncPlaces();
    await state.syncPlaces();
    expect(deps.loadPlaces).toHaveBeenCalledTimes(1);
    expect(state.rows.map((r) => r.newName)).toEqual(['01_Maó.jpg', '02_Ciutadella.jpg']);
  });

  it('blocks export while the places dataset is still loading', async () => {
    let finish: (index: ReturnType<typeof buildPlaceIndex>) => void = () => {};
    const { state } = setup({ loadPlaces: () => new Promise((resolve) => (finish = resolve)) });
    state.template = '{n:2}_{place}';
    const adding = state.addFiles([file('ciu.jpg')]);
    await vi.waitFor(() => expect(state.placesStatus).toBe('loading'));
    expect(state.canExport).toBe(false);
    finish(buildPlaceIndex([{ name: 'Ciutadella', lat: 40.001, lon: 3.838 }]));
    await adding;
    expect(state.canExport).toBe(true);
    expect(state.rows[0]?.newName).toBe('01_Ciutadella.jpg');
  });

  it('does not fetch when no photo has GPS', async () => {
    const { state, deps } = setup();
    state.groupByPlace = true;
    await state.addFiles([file('nogps.jpg')]);
    await state.syncPlaces();
    expect(deps.loadPlaces).not.toHaveBeenCalled();
  });

  it('groups into folders and builds ZIP entries with the original bytes', async () => {
    const { state } = setup();
    state.t1 = '';
    state.t2 = '';
    state.groupByPlace = true;
    await state.addFiles([file('ciu.jpg'), file('nogps.jpg')]);
    await state.syncPlaces();
    const entries = await state.exportEntries();
    expect(entries.map((e) => [e.folder, e.name])).toEqual([
      ['Ciutadella', '01.jpg'],
      ['No location', '02.jpg'],
    ]);
    expect(new Uint8Array(entries[0]!.data as ArrayBuffer)[0]).toBe('ciu.jpg'.length);
    expect(JSZip).toBeDefined();
  });

  it('counts photos without a capture date and without GPS', async () => {
    const { state } = setup();
    await state.addFiles([file('ciu.jpg'), file('holiday.jpg'), file('IMG_0100.jpg'), file('nogps.jpg')]);
    expect(state.undatedCount).toBe(2);
    expect(state.noGpsCount).toBe(3);
  });

  it('survives a failed dataset load and can retry', async () => {
    let calls = 0;
    const { state } = setup({
      loadPlaces: async () => {
        if (++calls === 1) throw new Error('offline');
        return buildPlaceIndex([{ name: 'Ciutadella', lat: 40.001, lon: 3.838 }]);
      },
    });
    state.template = '{place}';
    await state.addFiles([file('ciu.jpg')]);
    await state.syncPlaces();
    expect(state.placesStatus).toBe('error');
    await state.syncPlaces();
    expect(state.placesStatus).toBe('error'); // no automatic retry loop
    await state.retryPlaces();
    expect(state.placesStatus).toBe('ready');
    expect(state.rows[0]?.newName).toBe('Ciutadella.jpg');
  });

  it('revokes thumbnails on remove and clear', async () => {
    const { state, deps } = setup();
    await state.addFiles([file('ciu.jpg'), file('mao.jpg')]);
    state.remove(state.entries[0]!);
    expect(deps.revokeThumb).toHaveBeenCalledTimes(1);
    state.clear();
    expect(deps.revokeThumb).toHaveBeenCalledTimes(2);
    expect(state.entries).toHaveLength(0);
  });

  it('previews with a sample while empty and with the first photo otherwise', async () => {
    const { state } = setup();
    state.t1 = 'Menorca';
    state.t2 = '';
    expect(state.preview).toBe('01_Menorca.jpg');
    await state.addFiles([file('ciu.jpg')]);
    expect(state.preview).toBe('01_Menorca.jpg');
  });

  it('rejects a forbidden replacement', () => {
    const { state } = setup();
    state.replacement = '/';
    expect(state.replacementValid).toBe(false);
  });

  it('derives the dropzone mode, pending count and finished batches', async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const { state } = setup({ readMeta: async () => (await gate, { moment: null, gps: null }) });
    expect(state.dropMode).toBe('empty');
    const adding = state.addFiles([file('a.jpg'), file('b.jpg')]);
    expect(state.dropMode).toBe('reading');
    expect(state.pendingCount).toBe(2);
    release();
    await adding;
    expect(state.dropMode).toBe('loaded');
    expect(state.batchDone).toBe(1);
    state.clear();
    expect(state.dropMode).toBe('empty');
  });

  it('flags a date-reader library failure once and falls back to name and file date', async () => {
    const { state } = setup({
      readMeta: async () => {
        throw new ExifLoadError(new Error('chunk failed'));
      },
    });
    expect(state.exifFailed).toBe(false);
    await state.addFiles([file('a.jpg'), file('IMG_0100.jpg')]);
    expect(state.exifFailed).toBe(true);
    expect(state.entries.every((e) => e.status === 'done')).toBe(true);
    expect(state.rows).toHaveLength(2);
  });

  it('ignores other metadata errors per file without flagging the library', async () => {
    const { state } = setup({
      readMeta: async () => {
        throw new Error('weird file');
      },
    });
    await state.addFiles([file('a.jpg')]);
    expect(state.exifFailed).toBe(false);
    expect(state.entries[0]?.status).toBe('done');
  });
});
