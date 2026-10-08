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
});
