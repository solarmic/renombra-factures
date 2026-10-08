import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { extractTextFromPdf, type PdfJsLike } from './pdfTextCore';

let libPromise: Promise<PdfJsLike> | undefined;

/** pdf.js is loaded lazily; its worker ships inside the site bundle (no CDN, works offline). */
function loadLib(): Promise<PdfJsLike> {
  libPromise ??= import('pdfjs-dist').then((lib) => {
    lib.GlobalWorkerOptions.workerSrc = workerUrl;
    return lib as unknown as PdfJsLike;
  });
  return libPromise;
}

/** Text of the first pages of a PDF, with rough visual layout. Empty for image-only PDFs. */
export async function extractPdfText(data: ArrayBuffer | Uint8Array, maxPages = 2): Promise<string> {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  return extractTextFromPdf(await loadLib(), bytes, maxPages);
}
