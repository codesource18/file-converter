import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { 
  mergePdfs, 
  splitPdf, 
  rotatePdf, 
  watermarkPdf, 
  addPageNumbers, 
  removePdfMetadata 
} from '@fileconverter/conversion-core';

async function createDummyPdf(pageCount: number = 2): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    const page = pdfDoc.addPage([400, 600]);
    page.drawText(`Sample Test Document - Page ${i + 1}`, { x: 50, y: 500, size: 14 });
  }
  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}

describe('PDF Processing Engine Tests', () => {
  it('merges two PDF documents cleanly', async () => {
    const doc1 = await createDummyPdf(2);
    const doc2 = await createDummyPdf(3);

    const result = await mergePdfs([
      { file: doc1, name: 'doc1.pdf' },
      { file: doc2, name: 'doc2.pdf' }
    ]);

    expect(result.success).toBe(true);
    expect(result.pages).toBe(5);
    expect(result.blob).toBeDefined();
    expect(result.outputFormat).toBe('PDF');
  });

  it('splits and extracts page from PDF', async () => {
    const doc = await createDummyPdf(4);
    const result = await splitPdf(doc, 'source.pdf', [1, 2]);

    expect(result.success).toBe(true);
    expect(result.pages).toBe(2);
    expect(result.filename).toBe('source_extracted.pdf');
  });

  it('rotates PDF pages by 90 degrees', async () => {
    const doc = await createDummyPdf(1);
    const result = await rotatePdf(doc, 'rotate_me.pdf', 90);

    expect(result.success).toBe(true);
    expect(result.filename).toBe('rotate_me_rotated.pdf');
  });

  it('stamps watermark on PDF pages', async () => {
    const doc = await createDummyPdf(2);
    const result = await watermarkPdf(doc, 'stamp.pdf', 'CONFIDENTIAL');

    expect(result.success).toBe(true);
    expect(result.filename).toBe('stamp_watermarked.pdf');
  });

  it('adds page numbers to PDF', async () => {
    const doc = await createDummyPdf(3);
    const result = await addPageNumbers(doc, 'report.pdf', 'Page {n} of {total}');

    expect(result.success).toBe(true);
    expect(result.filename).toBe('report_numbered.pdf');
  });

  it('sanitizes metadata from PDF', async () => {
    const doc = await createDummyPdf(1);
    const result = await removePdfMetadata(doc, 'sensitive.pdf');

    expect(result.success).toBe(true);
    expect(result.filename).toBe('sensitive_clean.pdf');
  });
});
