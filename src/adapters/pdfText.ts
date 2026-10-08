import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { cachedLoader } from './cachedLoader';
import { extractTextFromPdf, type PdfJsLike } from './pdfTextCore';

/** pdf.js is loaded lazily; its worker ships inside the site bundle (no CDN, works offline). */
const loadLib = cachedLoader(() =>
  import('pdfjs-dist').then((lib) => {
    lib.GlobalWorkerOptions.workerSrc = workerUrl;
    return lib as unknown as PdfJsLike;
  }),
);

/** Text of the first pages of a PDF, with rough visual layout. Empty for image-only PDFs. */
export async function extractPdfText(data: ArrayBuffer | Uint8Array, maxPages = 2): Promise<string> {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  return extractTextFromPdf(await loadLib(), bytes, maxPages);
}
