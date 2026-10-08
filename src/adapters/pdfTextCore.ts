import { itemsToText, type TextItem } from './pdfTextLayout';

/** The slice of the pdf.js API we use; lets tests inject the Node-compatible build. */
export interface PdfJsLike {
  getDocument(src: { data: Uint8Array; [key: string]: unknown }): {
    promise: Promise<{
      numPages: number;
      getPage(n: number): Promise<{ getTextContent(): Promise<{ items: unknown[] }>; cleanup(): void }>;
    }>;
    destroy(): Promise<void>;
  };
}

function isTextItem(value: unknown): value is TextItem {
  return typeof value === 'object' && value !== null && 'str' in value && 'transform' in value;
}

export async function extractTextFromPdf(lib: PdfJsLike, data: Uint8Array, maxPages = 2): Promise<string> {
  const task = lib.getDocument({ data, isEvalSupported: false });
  try {
    const doc = await task.promise;
    const pages: string[] = [];
    for (let n = 1; n <= Math.min(doc.numPages, maxPages); n++) {
      const page = await doc.getPage(n);
      const content = await page.getTextContent();
      pages.push(itemsToText(content.items.filter(isTextItem)));
      page.cleanup();
    }
    return pages.join('\n\n');
  } finally {
    await task.destroy();
  }
}
