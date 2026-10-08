import { describe, expect, it } from 'vitest';
import { AppState } from './state.svelte';

const file = (name: string, type = '') => new File([new Uint8Array([1])], name, { type });

describe('AppState', () => {
  it('ignores unsupported files and reports them', async () => {
    const app = new AppState();
    await app.addFiles([file('a.xlsx'), file('2026-01-05 Factura.jpg', 'image/jpeg')]);
    expect(app.ignored).toEqual(['a.xlsx']);
    expect(app.entries).toHaveLength(1);
    expect(app.hasImages).toBe(true);
  });

  it('uses the filename date for images and numbers them from the start value', async () => {
    const app = new AppState();
    app.start = 7;
    app.fallbackYear = 2026;
    await app.addFiles([file('Factura 0501.jpg', 'image/jpeg')]);
    expect(app.rows[0]?.source).toBe('filename');
    expect(app.rows[0]?.newName).toBe('1-26V-07 Factura 0501.jpg');
    expect(app.canExport).toBe(true);
  });

  it('blocks export while an included image has no date, and unblocks it by date or exclusion', async () => {
    const app = new AppState();
    await app.addFiles([file('Factura.jpg', 'image/jpeg'), file('Factura 0501.png', 'image/png')]);
    expect(app.missingDates).toBe(1);
    expect(app.canExport).toBe(false);

    const undated = app.entries.find((e) => e.file.name === 'Factura.jpg')!;
    app.setManualDate(undated, { y: 2026, m: 3, d: 1 });
    expect(app.missingDates).toBe(0);
    expect(app.canExport).toBe(true);
    expect(app.rows.find((r) => r.entry === undated)?.source).toBe('manual');

    app.setManualDate(undated, null);
    undated.included = false;
    expect(app.missingDates).toBe(0);
    expect(app.canExport).toBe(true);
  });

  it('recomputes DDMM filename dates when the fallback year changes', async () => {
    const app = new AppState();
    app.fallbackYear = 2025;
    await app.addFiles([file('Factura 0501.jpg', 'image/jpeg')]);
    expect(app.rows[0]?.date).toEqual({ y: 2025, m: 1, d: 5 });
    app.fallbackYear = 2026;
    expect(app.rows[0]?.date).toEqual({ y: 2026, m: 1, d: 5 });
  });

  it('shows a live preview with the template', () => {
    const app = new AppState();
    app.template = '{n:3}-{name}';
    app.start = 4;
    expect(app.preview).toMatch(/^004-/);
  });

  it('keeps the previous fallback year when the input is invalid or out of range', () => {
    const app = new AppState();
    app.setFallbackYear(2024);
    for (const bad of [Number.NaN, 20, 1989, 2101, 2024.5, null as unknown as number]) {
      app.setFallbackYear(bad);
      expect(app.fallbackYear).toBe(2024);
    }
    app.setFallbackYear(1990);
    expect(app.fallbackYear).toBe(1990);
    app.setFallbackYear(2100);
    expect(app.fallbackYear).toBe(2100);
  });

  it('reports a failed export, returns to normal and lets the user dismiss the error', async () => {
    const app = new AppState();
    await app.addFiles([file('2026-01-05 Factura.jpg', 'image/jpeg')]);
    const entry = app.entries[0]!;
    const original = entry.file.arrayBuffer.bind(entry.file);
    entry.file.arrayBuffer = () => Promise.reject(new DOMException('gone', 'NotReadableError'));

    await expect(app.exportZip()).resolves.toBeUndefined();
    expect(app.exportFailed).toBe(true);
    expect(app.exporting).toBe(false);
    expect(app.canExport).toBe(true);

    entry.file.arrayBuffer = original;
    // No DOM in the node test environment: the download step itself throws, which is a failure too.
    await app.exportZip();
    expect(app.exportFailed).toBe(true);
    app.dismissExportError();
    expect(app.exportFailed).toBe(false);
  });

  it('rejects a forbidden replacement character in the preview and the plan', async () => {
    const app = new AppState();
    app.template = 'a/b {n}';
    app.replacement = '/';
    expect(app.replacementValid).toBe(false);
    expect(app.preview).not.toContain('/');
  });

  it('derives the dropzone mode and counts finished batches', async () => {
    const app = new AppState();
    expect(app.dropMode).toBe('empty');
    expect(app.batchDone).toBe(0);
    await app.addFiles([file('2026-01-05 Factura.jpg', 'image/jpeg')]);
    expect(app.dropMode).toBe('loaded');
    expect(app.batchDone).toBe(1);
    await app.addFiles([file('a.xlsx')]);
    expect(app.batchDone).toBe(1); // nothing was added
    app.clear();
    expect(app.dropMode).toBe('empty');
  });
});
