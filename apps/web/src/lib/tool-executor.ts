import { ToolDefinition, FileFormat, ProcessedResult } from '@fileconverter/shared-types';
import { 
  convertImageLocally, 
  convertImageToPdf,
  mergePdfs, 
  splitPdf, 
  rotatePdf, 
  watermarkPdf, 
  addPageNumbers, 
  removePdfMetadata,
  compressPdf
} from '@fileconverter/conversion-core';

export async function executeTool(
  tool: ToolDefinition,
  file: File,
  options: any = {},
  onProgress?: (percent: number, msg: string) => void
): Promise<ProcessedResult> {
  const isBackend = tool.preferredMode === 'backend';

  // 1. BACKEND PROCESSING PATH (Fallback for Word DOCX, Repair, etc.)
  if (isBackend) {
    onProgress?.(20, 'Connecting to compatibility sandbox...');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('target_format', tool.outputFormats[0] || 'DOCX');

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiUrl}/api/convert`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Backend processing failed' }));
      throw new Error(err.detail || 'Compatibility engine error');
    }

    onProgress?.(70, 'Downloading converted document...');
    const data = await response.json();
    const downloadRes = await fetch(`${apiUrl}${data.download_url}`);
    const blob = await downloadRes.blob();

    onProgress?.(100, 'Done');
    return {
      success: true,
      blob,
      filename: data.filename,
      outputFormat: tool.outputFormats[0],
      originalSize: file.size,
      outputSize: blob.size,
      executionMode: 'backend'
    };
  }

  // 2. LOCAL BROWSER FIRST PROCESSING PATH
  switch (tool.id) {
    case 'pdf-to-jpg':
      return await convertImageLocally(file, file.name, { outputFormat: 'JPEG', ...options }, onProgress);

    case 'pdf-to-png':
      return await convertImageLocally(file, file.name, { outputFormat: 'PNG', ...options }, onProgress);

    case 'compress-pdf':
      return await compressPdf(file, file.name, options, onProgress);

    case 'rotate-pdf':
      return await rotatePdf(file, file.name, options.rotateDegrees || 90, undefined, onProgress);

    case 'split-pdf':
      return await splitPdf(file, file.name, options.pages || [0], onProgress);

    case 'merge-pdf':
      return await mergePdfs([{ file, name: file.name }], onProgress);

    case 'watermark-pdf':
      return await watermarkPdf(file, file.name, options.watermarkText || 'CONFIDENTIAL', options, onProgress);

    case 'remove-pdf-metadata':
      return await removePdfMetadata(file, file.name, onProgress);

    case 'jpg-to-png':
      return await convertImageLocally(file, file.name, { outputFormat: 'PNG', ...options }, onProgress);

    case 'jpg-to-webp':
      return await convertImageLocally(file, file.name, { outputFormat: 'WebP', ...options }, onProgress);

    case 'jpg-to-pdf':
      return await convertImageToPdf(file, file.name, options, onProgress);

    case 'png-to-jpg':
      return await convertImageLocally(file, file.name, { outputFormat: 'JPEG', backgroundColor: '#FFFFFF', ...options }, onProgress);

    case 'png-to-webp':
      return await convertImageLocally(file, file.name, { outputFormat: 'WebP', ...options }, onProgress);

    case 'png-to-pdf':
      return await convertImageToPdf(file, file.name, options, onProgress);

    case 'webp-to-jpg':
      return await convertImageLocally(file, file.name, { outputFormat: 'JPEG', ...options }, onProgress);

    case 'webp-to-png':
      return await convertImageLocally(file, file.name, { outputFormat: 'PNG', ...options }, onProgress);

    case 'webp-to-pdf':
      return await convertImageToPdf(file, file.name, options, onProgress);

    case 'heic-to-jpg':
      return await convertImageLocally(file, file.name, { outputFormat: 'JPEG', ...options }, onProgress);

    case 'heic-to-png':
      return await convertImageLocally(file, file.name, { outputFormat: 'PNG', ...options }, onProgress);

    case 'heic-to-pdf':
      return await convertImageToPdf(file, file.name, options, onProgress);

    case 'avif-to-jpg':
      return await convertImageLocally(file, file.name, { outputFormat: 'JPEG', ...options }, onProgress);

    case 'avif-to-png':
      return await convertImageLocally(file, file.name, { outputFormat: 'PNG', ...options }, onProgress);

    case 'tiff-to-jpg':
      return await convertImageLocally(file, file.name, { outputFormat: 'JPEG', ...options }, onProgress);

    case 'tiff-to-pdf':
      return await convertImageToPdf(file, file.name, options, onProgress);

    case 'gif-to-webp':
      return await convertImageLocally(file, file.name, { outputFormat: 'WebP', ...options }, onProgress);

    case 'svg-to-png':
      return await convertImageLocally(file, file.name, { outputFormat: 'PNG', ...options }, onProgress);

    case 'svg-to-pdf':
      return await convertImageToPdf(file, file.name, options, onProgress);

    case 'compress-image':
      return await convertImageLocally(file, file.name, { quality: options.quality || 75, targetSizeKb: options.targetSizeKb }, onProgress);

    case 'resize-image':
      return await convertImageLocally(file, file.name, { width: options.width || 1200, height: options.height, maintainAspectRatio: true }, onProgress);

    case 'remove-image-metadata':
      return await convertImageLocally(file, file.name, { removeMetadata: true }, onProgress);

    default:
      return await convertImageLocally(
        file,
        file.name,
        { outputFormat: tool.outputFormats[0] || 'JPEG', ...options },
        onProgress
      );
  }
}
