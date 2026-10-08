import { describe, expect, it, vi } from 'vitest';

vi.mock('../adapters/pdfText', () => ({
  extractPdfText: vi.fn().mockRejectedValue(new TypeError('Load failed')),
}));

const { AppState } = await import('./state.svelte');

describe('AppState PDF read errors', () => {
  it('marks the entry as failed and keeps the reason so it can be shown', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const app = new AppState();
    await app.addFiles([new File([new Uint8Array([1])], 'Factura.pdf', { type: 'application/pdf' })]);
    expect(app.entries[0]?.status).toBe('error');
    expect(app.entries[0]?.errorDetail).toBe('TypeError: Load failed');
    expect(errors).toHaveBeenCalled();
    errors.mockRestore();
  });
});
