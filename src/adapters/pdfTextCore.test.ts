import { describe, expect, it } from 'vitest';
import { extractTextFromPdf, type PdfJsLike } from './pdfTextCore';

/** Builds a minimal valid single-page PDF with the given text lines. */
function tinyPdf(lines: { text: string; x: number; y: number }[]): Uint8Array {
  const stream = lines
    .map((l) => `BT /F1 12 Tf ${l.x} ${l.y} Td (${l.text}) Tj ET`)
    .join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const o of offsets) pdf += `${String(o).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

describe('extractTextFromPdf', () => {
  it('extracts text lines with column spacing from a generated PDF', async () => {
    const lib = (await import('pdfjs-dist/legacy/build/pdf.mjs')) as unknown as PdfJsLike;
    const data = tinyPdf([
      { text: 'FECHA', x: 50, y: 700 },
      { text: '14-06-2026', x: 300, y: 700 },
      { text: 'Total 10,00', x: 50, y: 650 },
    ]);
    const text = await extractTextFromPdf(lib, data);
    const [first, second] = text.split('\n');
    expect(first).toMatch(/^FECHA {2,}14-06-2026$/);
    expect(second).toBe('Total 10,00');
  });
});
