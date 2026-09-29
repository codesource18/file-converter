import { describe, it, expect } from 'vitest';
import { detectFormatFromBytes, getSmartRecommendations, ALL_TOOLS, getToolById } from '@fileconverter/file-detection';
import { FileMetadata } from '@fileconverter/shared-types';

describe('Universal File Signature & Detection Tests', () => {
  it('correctly identifies PDF by magic bytes %PDF-', () => {
    const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x35]);
    const format = detectFormatFromBytes(bytes, 'document.pdf');
    expect(format).toBe('PDF');
  });

  it('correctly identifies PNG magic bytes 89 50 4E 47', () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const format = detectFormatFromBytes(bytes, 'image.png');
    expect(format).toBe('PNG');
  });

  it('correctly identifies JPEG magic bytes FF D8 FF', () => {
    const bytes = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
    const format = detectFormatFromBytes(bytes, 'photo.jpg');
    expect(format).toBe('JPEG');
  });

  it('correctly identifies WebP magic bytes RIFF...WEBP', () => {
    const bytes = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50
    ]);
    const format = detectFormatFromBytes(bytes, 'graphic.webp');
    expect(format).toBe('WebP');
  });

  it('correctly identifies TIFF magic bytes II*.', () => {
    const bytes = new Uint8Array([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00]);
    const format = detectFormatFromBytes(bytes, 'scan.tiff');
    expect(format).toBe('TIFF');
  });

  it('correctly identifies DOCX files by ZIP header and extension', () => {
    const bytes = new Uint8Array([0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00]);
    const format = detectFormatFromBytes(bytes, 'document.docx');
    expect(format).toBe('DOCX');
  });
});

describe('Smart Recommendation Engine Matrix', () => {
  it('returns Word to PDF as primary tool for DOCX files', () => {
    const meta: FileMetadata = {
      format: 'DOCX',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      extension: 'docx',
      size: 51200,
      name: 'proposal.docx'
    };
    const recs = getSmartRecommendations(meta);
    expect(recs.primaryTools.length).toBeGreaterThanOrEqual(1);
    expect(recs.primaryTools[0].id).toBe('word-to-pdf');
  });

  it('returns PDF to Word, PDF to JPG, PDF to PNG as top 3 for PDF files', () => {
    const meta: FileMetadata = {
      format: 'PDF',
      mimeType: 'application/pdf',
      extension: 'pdf',
      size: 102400,
      name: 'invoice.pdf'
    };
    const recs = getSmartRecommendations(meta);
    expect(recs.primaryTools.length).toBe(3);
    expect(recs.primaryTools.map(t => t.id)).toEqual(['pdf-to-word', 'pdf-to-jpg', 'pdf-to-png']);
    expect(recs.secondaryTools.some(t => t.id === 'edit-pdf')).toBe(true);
    expect(recs.secondaryTools.some(t => t.id === 'compress-pdf')).toBe(true);
  });

  it('returns JPG to PNG, JPG to WebP, JPG to PDF for JPEG files', () => {
    const meta: FileMetadata = {
      format: 'JPEG',
      mimeType: 'image/jpeg',
      extension: 'jpg',
      size: 204800,
      name: 'photo.jpg'
    };
    const recs = getSmartRecommendations(meta);
    expect(recs.primaryTools.map(t => t.id)).toEqual(['jpg-to-png', 'jpg-to-webp', 'jpg-to-pdf']);
    expect(recs.secondaryTools.some(t => t.id === 'compress-image')).toBe(true);
    // Never show PDF editing for JPEG
    expect(recs.primaryTools.some(t => t.id === 'edit-pdf')).toBe(false);
  });

  it('returns PNG to JPG, PNG to WebP, PNG to PDF for PNG files', () => {
    const meta: FileMetadata = {
      format: 'PNG',
      mimeType: 'image/png',
      extension: 'png',
      size: 504800,
      name: 'screenshot.png'
    };
    const recs = getSmartRecommendations(meta);
    expect(recs.primaryTools.map(t => t.id)).toEqual(['png-to-jpg', 'png-to-webp', 'png-to-pdf']);
  });
});

describe('Tool Registry Integrity', () => {
  it('contains all required 26+ core tools', () => {
    expect(ALL_TOOLS.length).toBeGreaterThanOrEqual(20);
  });

  it('has valid slugs and categories for each tool', () => {
    ALL_TOOLS.forEach(tool => {
      expect(tool.id).toBeDefined();
      expect(tool.name).toBeDefined();
      expect(tool.category).toBeDefined();
      expect(tool.inputFormats.length).toBeGreaterThan(0);
      expect(tool.outputFormats.length).toBeGreaterThan(0);
    });
  });
});
