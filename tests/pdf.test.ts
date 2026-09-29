import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { 
  mergePdfs, 
  splitPdf, 
  rotatePdf, 
  watermarkPdf, 
  addPageNumbers, 
  removePdfMetadata,
  convertDocxToPdf
} from '@fileconverter/conversion-core';
import JSZip from 'jszip';

async function createDummyPdf(pageCount: number = 2): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    const page = pdfDoc.addPage([400, 600]);
    page.drawText(`Sample Test Document - Page ${i + 1}`, { x: 50, y: 500, size: 14 });
  }
  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}

async function createDummyDocx(): Promise<Blob> {
  const zip = new JSZip();
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:pStyle w:val="Title"/></w:pPr>
      <w:r><w:t>Project Specification &amp; Overview</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
      <w:r><w:t>1. Executive Summary</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>This is a test Word document converted directly to a PDF with formatting.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/><w:color w:val="0088CC"/></w:rPr><w:t>Bold colored highlight section</w:t></w:r>
    </w:p>
    <w:tbl>
      <w:tr>
        <w:tc><w:tcPr><w:tcW w:w="3000"/><w:shd w:fill="E2E8F0"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Feature</w:t></w:r></w:p></w:tc>
        <w:tc><w:tcPr><w:tcW w:w="5000"/><w:shd w:fill="E2E8F0"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Status</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:tcPr><w:tcW w:w="3000"/></w:tcPr><w:p><w:r><w:t>Word to PDF</w:t></w:r></w:p></w:tc>
        <w:tc><w:tcPr><w:tcW w:w="5000"/></w:tcPr><w:p><w:r><w:t>Active &amp; Tested</w:t></w:r></w:p></w:tc>
      </w:tr>
    </w:tbl>
  </w:body>
</w:document>`;
  zip.file('word/document.xml', documentXml);
  const blob = await zip.generateAsync({ type: 'blob' });
  return blob;
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

  it('converts Word (.docx) document to PDF with tables and formatted headings', async () => {
    const docxBlob = await createDummyDocx();
    const result = await convertDocxToPdf(docxBlob, 'my_report.docx');

    expect(result.success).toBe(true);
    expect(result.filename).toBe('my_report.pdf');
    expect(result.outputFormat).toBe('PDF');
    expect(result.blob).toBeDefined();
    expect(result.pages).toBeGreaterThanOrEqual(1);
    expect(result.executionMode).toBe('local');
  });
});
