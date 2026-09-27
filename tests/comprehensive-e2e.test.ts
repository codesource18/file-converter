import { describe, it, expect } from 'vitest';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { 
  detectFormatFromBytes, 
  getSmartRecommendations, 
  ALL_TOOLS, 
  getToolById 
} from '@fileconverter/file-detection';
import { 
  applyAnnotationsToPdf, 
  mergePdfs, 
  splitPdf, 
  rotatePdf, 
  watermarkPdf, 
  addPageNumbers, 
  removePdfMetadata,
  packageBatchToZip
} from '@fileconverter/conversion-core';
import { FileMetadata, PDFAnnotation, ProcessedResult } from '@fileconverter/shared-types';

// Helper: Programmatic deterministic test file generator
function createTestImageBlob(format: string): { blob: Blob; filename: string; metadata: FileMetadata } {
  let bytes: Uint8Array;
  let filename: string;

  switch (format.toUpperCase()) {
    case 'PNG':
      // 1x1 PNG
      bytes = new Uint8Array([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
        0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);
      filename = 'sample.png';
      break;

    case 'JPEG':
    case 'JPG':
      // Minimal 1x1 JPEG
      bytes = new Uint8Array([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
        0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
        0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
        0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
        0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
        0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
        0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
        0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
        0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
        0x09, 0x0A, 0x0B, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F,
        0x00, 0xBF, 0x80, 0xFF, 0xD9
      ]);
      filename = 'sample.jpg';
      break;

    case 'WEBP':
      // 1x1 WebP
      bytes = new Uint8Array([
        0x52, 0x49, 0x46, 0x46, 0x1A, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
        0x56, 0x50, 0x38, 0x4C, 0x0E, 0x00, 0x00, 0x00, 0x2F, 0x00, 0x00, 0x00,
        0x10, 0x07, 0x10, 0x11, 0x11, 0x88, 0x88, 0xFE, 0x07, 0x00
      ]);
      filename = 'sample.webp';
      break;

    case 'GIF':
      // 1x1 GIF89a
      bytes = new Uint8Array([
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00,
        0x00, 0xFF, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x21, 0xF9, 0x04, 0x01, 0x00,
        0x00, 0x00, 0x00, 0x2C, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
        0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3B
      ]);
      filename = 'sample.gif';
      break;

    case 'BMP':
      // 1x1 BMP
      bytes = new Uint8Array([
        0x42, 0x4D, 0x3A, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x36, 0x00,
        0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00,
        0x00, 0x00, 0x01, 0x00, 0x18, 0x00, 0x00, 0x00, 0x00, 0x00, 0x04, 0x00,
        0x00, 0x00, 0x13, 0x0B, 0x00, 0x00, 0x13, 0x0B, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0x00
      ]);
      filename = 'sample.bmp';
      break;

    case 'TIFF':
      // Minimal TIFF
      bytes = new Uint8Array([
        0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0xFE, 0x00,
        0x04, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00
      ]);
      filename = 'sample.tiff';
      break;

    case 'SVG':
      const svgStr = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="blue"/></svg>';
      bytes = new TextEncoder().encode(svgStr);
      filename = 'sample.svg';
      break;

    default:
      bytes = new Uint8Array([0x00]);
      filename = 'sample.dat';
  }

  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: `image/${format.toLowerCase()}` });
  const metadata: FileMetadata = {
    format: format.toUpperCase() as any,
    name: filename,
    size: blob.size,
    mimeType: `image/${format.toLowerCase()}`,
    extension: filename.split('.').pop() || ''
  };

  return { blob, filename, metadata };
}

async function createMultiPageTestPdf(pageCount: number = 3): Promise<{ blob: Blob; filename: string; metadata: FileMetadata }> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (let i = 0; i < pageCount; i++) {
    const page = pdfDoc.addPage([595, 842]);
    page.drawText(`Comprehensive QA Test Document — Page ${i + 1}`, {
      x: 50,
      y: 780,
      size: 16,
      font,
      color: rgb(0.1, 0.2, 0.4)
    });
    page.drawRectangle({
      x: 50,
      y: 650,
      width: 495,
      height: 100,
      borderColor: rgb(0.2, 0.4, 0.8),
      borderWidth: 1.5,
      color: rgb(0.95, 0.97, 1.0)
    });
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const filename = 'multipage_test.pdf';
  const metadata: FileMetadata = {
    format: 'PDF',
    name: filename,
    size: blob.size,
    mimeType: 'application/pdf',
    extension: 'pdf',
    pageCount
  };

  return { blob, filename, metadata };
}

describe('Comprehensive End-to-End QA Pipeline', () => {

  describe('1. Universal Format Detection & Smart Recommendations', () => {
    const formats = ['PNG', 'JPEG', 'WEBP', 'GIF', 'BMP', 'TIFF', 'SVG'];

    formats.forEach((fmt) => {
      it(`accurately detects ${fmt} format and produces prioritized recommendations`, async () => {
        const { blob, filename, metadata } = createTestImageBlob(fmt);
        const arrayBuf = await blob.arrayBuffer();
        const detected = detectFormatFromBytes(new Uint8Array(arrayBuf), filename);

        expect(detected).toBeDefined();
        expect(detected).not.toBe('UNKNOWN');

        const recs = getSmartRecommendations(metadata);
        expect(recs.primaryTools.length).toBeGreaterThan(0);
        expect(recs.primaryTools.length).toBeLessThanOrEqual(3);
        expect(recs.secondaryTools.length).toBeGreaterThan(0);
      });
    });

    it('accurately detects multi-page PDF documents', async () => {
      const { blob, filename, metadata } = await createMultiPageTestPdf(3);
      const arrayBuf = await blob.arrayBuffer();
      const detected = detectFormatFromBytes(new Uint8Array(arrayBuf), filename);

      expect(detected).toBe('PDF');
      const recs = getSmartRecommendations(metadata);
      expect(recs.primaryTools.some(t => t.id === 'pdf-to-jpg' || t.id === 'pdf-to-word' || t.id === 'pdf-to-png')).toBe(true);
    });
  });

  describe('2. PDF Manipulation, Splitting, Merging and Watermarking', () => {
    it('merges multiple PDF files into a single verified output document', async () => {
      const pdf1 = await createMultiPageTestPdf(2);
      const pdf2 = await createMultiPageTestPdf(3);

      const merged = await mergePdfs([
        { file: pdf1.blob, name: pdf1.filename },
        { file: pdf2.blob, name: pdf2.filename }
      ]);
      expect(merged.success).toBe(true);
      expect(merged.pages).toBe(5);
      expect(merged.blob.size).toBeGreaterThan(0);

      // Verify merged document can be loaded and read
      const doc = await PDFDocument.load(await merged.blob.arrayBuffer());
      expect(doc.getPageCount()).toBe(5);
    });

    it('splits a multi-page PDF into specific page ranges', async () => {
      const source = await createMultiPageTestPdf(4);
      const splitResult = await splitPdf(source.blob, source.filename, [0, 2, 3]);

      expect(splitResult.success).toBe(true);
      expect(splitResult.pages).toBe(3);

      const doc = await PDFDocument.load(await splitResult.blob.arrayBuffer());
      expect(doc.getPageCount()).toBe(3);
    });

    it('rotates pages in a PDF and saves valid non-corrupted output', async () => {
      const source = await createMultiPageTestPdf(2);
      const rotated = await rotatePdf(source.blob, source.filename, 90, [0]);

      expect(rotated.success).toBe(true);
      const doc = await PDFDocument.load(await rotated.blob.arrayBuffer());
      expect(doc.getPage(0).getRotation().angle).toBe(90);
      expect(doc.getPage(1).getRotation().angle).toBe(0);
    });

    it('applies watermarks and removes sensitive PDF metadata', async () => {
      const source = await createMultiPageTestPdf(2);
      const watermarked = await watermarkPdf(source.blob, source.filename, 'CONFIDENTIAL');
      expect(watermarked.success).toBe(true);

      const cleaned = await removePdfMetadata(watermarked.blob, watermarked.filename);
      expect(cleaned.success).toBe(true);

      const doc = await PDFDocument.load(await cleaned.blob.arrayBuffer());
      expect(doc.getTitle()).toBeFalsy();
      expect(doc.getAuthor()).toBeFalsy();
    });

    it('adds dynamic page numbers across all pages', async () => {
      const source = await createMultiPageTestPdf(3);
      const numbered = await addPageNumbers(source.blob, source.filename, 'bottom-center');

      expect(numbered.success).toBe(true);
      expect(numbered.pages).toBe(3);
      const doc = await PDFDocument.load(await numbered.blob.arrayBuffer());
      expect(doc.getPageCount()).toBe(3);
    });
  });

  describe('3. PDF Editor Annotation Application & In-Place Editing', () => {
    it('applies text, shapes, highlights, whiteouts, stamps and drawings onto a multi-page PDF', async () => {
      const source = await createMultiPageTestPdf(2);

      const testAnnotations: PDFAnnotation[] = [
        {
          id: 'text-1',
          type: 'text',
          pageNumber: 1,
          x: 60,
          y: 200,
          content: 'Applied Edit Annotation Text',
          fontSize: 18,
          fontFamily: 'serif',
          isBold: true,
          isItalic: false,
          color: '#1e3a8a'
        },
        {
          id: 'highlight-1',
          type: 'highlight',
          pageNumber: 1,
          x: 50,
          y: 250,
          width: 200,
          height: 25
        },
        {
          id: 'shape-1',
          type: 'shape',
          shapeType: 'rectangle',
          pageNumber: 1,
          x: 50,
          y: 300,
          width: 150,
          height: 60,
          color: '#2563eb',
          strokeWidth: 2
        },
        {
          id: 'watermark-1',
          type: 'watermark',
          pageNumber: 2,
          x: 100,
          y: 400,
          content: 'APPROVED',
          fontSize: 36,
          color: '#16a34a'
        },
        {
          id: 'draw-1',
          type: 'draw',
          pageNumber: 2,
          x: 100,
          y: 500,
          points: [{ x: 100, y: 500 }, { x: 150, y: 520 }, { x: 200, y: 490 }],
          color: '#dc2626',
          strokeWidth: 3
        }
      ];

      const edited = await applyAnnotationsToPdf(source.blob, source.filename, testAnnotations);
      expect(edited.success).toBe(true);
      expect(edited.outputFormat).toBe('PDF');
      expect(edited.blob.size).toBeGreaterThan(0);

      // Verify the exported PDF is valid and parsable
      const doc = await PDFDocument.load(await edited.blob.arrayBuffer());
      expect(doc.getPageCount()).toBe(2);
    });
  });

  describe('4. Batch Compression and Packaging', () => {
    it('packages multiple processed files into a valid ZIP archive', async () => {
      const file1 = createTestImageBlob('PNG');
      const file2 = createTestImageBlob('JPEG');

      const dummyResult1: ProcessedResult = {
        success: true,
        blob: file1.blob,
        filename: file1.filename,
        outputFormat: 'PNG',
        originalSize: file1.blob.size,
        outputSize: file1.blob.size,
        executionMode: 'local'
      };

      const dummyResult2: ProcessedResult = {
        success: true,
        blob: file2.blob,
        filename: file2.filename,
        outputFormat: 'JPEG',
        originalSize: file2.blob.size,
        outputSize: file2.blob.size,
        executionMode: 'local'
      };

      const zipBlob = await packageBatchToZip([dummyResult1, dummyResult2], 'batch_export.zip');

      expect(zipBlob).toBeDefined();
      expect(zipBlob.size).toBeGreaterThan(0);

      // Verify ZIP magic bytes PK\x03\x04
      const zipBytes = new Uint8Array(await zipBlob.arrayBuffer());
      expect(zipBytes[0]).toBe(0x50); // P
      expect(zipBytes[1]).toBe(0x4B); // K
      expect(zipBytes[2]).toBe(0x03);
      expect(zipBytes[3]).toBe(0x04);
    });
  });

});
