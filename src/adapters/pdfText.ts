// Legacy build: bundles polyfills (Map.getOrInsertComputed, iterator helpers...) that Safari lacks.
// Streams `for await` support is not among them, so the page and our worker entry install it.
import './streamAsyncIterator';
import { cachedLoader } from './cachedLoader';
import { extractTextFromPdf, type PdfJsLike } from './pdfTextCore';

/** pdf.js is loaded lazily; its worker ships inside the site bundle (no CDN, works offline). */
const loadLib = cachedLoader(() =>
  import('pdfjs-dist/legacy/build/pdf.mjs').then((lib) => {
    lib.GlobalWorkerOptions.workerPort = new Worker(new URL('./pdfWorker.ts', import.meta.url), { type: 'module' });
    return lib as unknown as PdfJsLike;
  }),
);

/** Text of the first pages of a PDF, with rough visual layout. Empty for image-only PDFs. */
export async function extractPdfText(data: ArrayBuffer | Uint8Array, maxPages = 2): Promise<string> {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  return extractTextFromPdf(await loadLib(), bytes, maxPages);
}
