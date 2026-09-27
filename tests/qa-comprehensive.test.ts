import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
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
import { detectFormatFromBytes, ALL_TOOLS, getToolBySlug, getToolById, getSmartRecommendations } from '@fileconverter/file-detection';
import { PDFAnnotation, ProcessedResult } from '@fileconverter/shared-types';

async function generateSamplePdf(pageCount: number = 2): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    const page = pdfDoc.addPage([500, 700]);
    page.drawText(`QA Test Document — Page ${i + 1}`, { x: 50, y: 650, size: 12 });
  }
  const bytes = await pdfDoc.save();
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}

describe('QA Suite 1: PDF Annotation & Font Embedding', () => {
  it('applies text annotations with Times, Helvetica, Courier and background whiteout', async () => {
    const pdfBlob = await generateSamplePdf(2);
    const annotations: PDFAnnotation[] = [
      {
        id: 'ann-1',
        type: 'text',
        pageNumber: 1,
        x: 100,
        y: 200,
        content: 'Times Roman Sample',
        fontSize: 16,
        fontFamily: 'serif',
        isBold: true,
        isItalic: false,
        color: '#000000'
      },
      {
        id: 'ann-2',
        type: 'text',
        pageNumber: 1,
        x: 100,
        y: 250,
        content: 'Courier Monospace Sample',
        fontSize: 14,
        fontFamily: 'monospace',
        isBold: false,
        isItalic: true,
        color: '#2563eb'
      },
      {
        id: 'ann-3',
        type: 'whiteout',
        pageNumber: 1,
        x: 80,
        y: 180,
        width: 200,
        height: 30,
        backgroundColor: '#ffffff'
      },
      {
        id: 'ann-4',
        type: 'shape',
        shapeType: 'rectangle',
        pageNumber: 2,
        x: 50,
        y: 50,
        width: 150,
        height: 100,
        color: '#10b981',
        strokeWidth: 2
      },
      {
        id: 'ann-5',
        type: 'draw',
        pageNumber: 2,
        points: [{ x: 10, y: 10 }, { x: 50, y: 50 }, { x: 90, y: 20 }],
        color: '#ef4444',
        strokeWidth: 3
      }
    ];

    const result = await applyAnnotationsToPdf(pdfBlob, 'annotated_doc.pdf', annotations);
    expect(result.success).toBe(true);
    expect(result.outputFormat).toBe('PDF');
    expect(result.filename).toBe('annotated_doc_edited.pdf');
    expect(result.blob).toBeDefined();
    expect(result.outputSize).toBeGreaterThan(0);
  });

  it('handles empty annotation arrays without modifying PDF structure', async () => {
    const pdfBlob = await generateSamplePdf(1);
    const result = await applyAnnotationsToPdf(pdfBlob, 'clean.pdf', []);
    expect(result.success).toBe(true);
    expect(result.outputFormat).toBe('PDF');
  });
});

describe('QA Suite 2: Batch ZIP Packaging & Multi-File Workflows', () => {
  it('packages multiple processed results into a valid ZIP archive', async () => {
    const items: ProcessedResult[] = [
      {
        success: true,
        filename: 'file1.txt',
        outputFormat: 'TXT',
        originalSize: 100,
        outputSize: 100,
        blob: new Blob(['Hello World 1'], { type: 'text/plain' })
      },
      {
        success: true,
        filename: 'file2.txt',
        outputFormat: 'TXT',
        originalSize: 200,
        outputSize: 200,
        blob: new Blob(['Hello World 2'], { type: 'text/plain' })
      }
    ];

    const zipBlob = await packageBatchToZip(items, 'bundle.zip');
    expect(zipBlob).toBeDefined();
    expect(zipBlob.size).toBeGreaterThan(0);
    expect(zipBlob.type).toBe('application/zip');
  });
});

describe('QA Suite 3: All 26+ Tool Registry & Slug Resolution', () => {
  it('verifies every tool in ALL_TOOLS has unique id, slug, and valid input/output formats', () => {
    const idSet = new Set<string>();
    const slugSet = new Set<string>();

    ALL_TOOLS.forEach(tool => {
      expect(idSet.has(tool.id)).toBe(false);
      idSet.add(tool.id);

      expect(slugSet.has(tool.slug)).toBe(false);
      slugSet.add(tool.slug);

      expect(tool.name.length).toBeGreaterThan(0);
      expect(tool.description.length).toBeGreaterThan(0);
      expect(tool.category).toBeDefined();

      const foundBySlug = getToolBySlug(tool.slug);
      expect(foundBySlug).toBeDefined();
      expect(foundBySlug?.id).toBe(tool.id);

      const foundById = getToolById(tool.id);
      expect(foundById).toBeDefined();
      expect(foundById?.slug).toBe(tool.slug);
    });
  });

  it('tests getSmartRecommendations across all main file types', () => {
    const formats: Array<{ format: any; expectedPrimary: string }> = [
      { format: 'PDF', expectedPrimary: 'pdf-to-word' },
      { format: 'JPEG', expectedPrimary: 'jpg-to-png' },
      { format: 'PNG', expectedPrimary: 'png-to-jpg' },
      { format: 'WebP', expectedPrimary: 'webp-to-jpg' },
      { format: 'HEIC', expectedPrimary: 'heic-to-jpg' }
    ];

    formats.forEach(({ format, expectedPrimary }) => {
      const recs = getSmartRecommendations({
        format,
        mimeType: 'application/octet-stream',
        extension: format.toLowerCase(),
        size: 1024,
        name: `test.${format.toLowerCase()}`
      });
      expect(recs.primaryTools[0].id).toBe(expectedPrimary);
    });
  });
});
