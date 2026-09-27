import { ConversionOptions, FileFormat, ProcessedResult } from '@fileconverter/shared-types';
import { PDFDocument } from 'pdf-lib';

export async function convertImageLocally(
  file: File | Blob,
  fileName: string,
  options: ConversionOptions = {},
  onProgress?: (percent: number, msg: string) => void
): Promise<ProcessedResult> {
  onProgress?.(10, 'Loading image into memory...');

  const outputFormat = options.outputFormat || 'JPEG';
  const quality = (options.quality ?? 85) / 100;
  
  if (outputFormat === 'PDF') {
    return convertImageToPdf(file, fileName, options, onProgress);
  }

  // Load image into HTMLImageElement or ImageBitmap
  const imgBitmap = await createImageBitmapSafe(file);
  onProgress?.(30, 'Preparing canvas...');

  let targetWidth = options.width || imgBitmap.width;
  let targetHeight = options.height || imgBitmap.height;

  if (options.maintainAspectRatio && options.width && !options.height) {
    targetHeight = Math.round((options.width / imgBitmap.width) * imgBitmap.height);
  } else if (options.maintainAspectRatio && options.height && !options.width) {
    targetWidth = Math.round((options.height / imgBitmap.height) * imgBitmap.width);
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context creation failed.');
  }

  // Handle background color for transparency flattening (e.g. PNG to JPG)
  if (outputFormat === 'JPEG') {
    ctx.fillStyle = options.backgroundColor || '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  // Handle rotation & flipping
  if (options.rotateDeg || options.flipHorizontal || options.flipVertical) {
    ctx.save();
    ctx.translate(targetWidth / 2, targetHeight / 2);
    if (options.rotateDeg) {
      ctx.rotate((options.rotateDeg * Math.PI) / 180);
    }
    const scaleX = options.flipHorizontal ? -1 : 1;
    const scaleY = options.flipVertical ? -1 : 1;
    ctx.scale(scaleX, scaleY);
    ctx.drawImage(imgBitmap, -targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight);
    ctx.restore();
  } else {
    ctx.drawImage(imgBitmap, 0, 0, targetWidth, targetHeight);
  }

  onProgress?.(60, 'Encoding output pixels...');

  const mimeType = getMimeForFormat(outputFormat);
  
  // Target file size iterative optimization
  let outputBlob: Blob;
  if (options.targetSizeKb && options.targetSizeKb > 0 && (outputFormat === 'JPEG' || outputFormat === 'WebP')) {
    outputBlob = await optimizeToTargetSize(canvas, mimeType, options.targetSizeKb, onProgress);
  } else {
    outputBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        blob => (blob ? resolve(blob) : reject(new Error('Canvas blob generation failed'))),
        mimeType,
        quality
      );
    });
  }

  onProgress?.(90, 'Finalizing output file...');

  const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
  const newFileName = `${baseName}.${getExtensionForFormat(outputFormat)}`;
  const originalSize = file.size;
  const outputSize = outputBlob.size;
  const reductionPercentage = Math.max(0, Math.round(((originalSize - outputSize) / originalSize) * 100));

  onProgress?.(100, 'Conversion complete');

  return {
    success: true,
    blob: outputBlob,
    filename: newFileName,
    outputFormat,
    originalSize,
    outputSize,
    reductionPercentage,
    dimensions: { width: targetWidth, height: targetHeight },
    executionMode: 'local'
  };
}

export async function convertImageToPdf(
  file: File | Blob,
  fileName: string,
  options: ConversionOptions = {},
  onProgress?: (percent: number, msg: string) => void
): Promise<ProcessedResult> {
  onProgress?.(20, 'Creating PDF container...');
  const pdfDoc = await PDFDocument.create();

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  onProgress?.(50, 'Embedding image into PDF...');
  let embeddedImage;

  // Try JPEG or PNG embed, or fallback to canvas re-encoding
  try {
    if (file.type.includes('png') || bytes[0] === 0x89) {
      embeddedImage = await pdfDoc.embedPng(arrayBuffer);
    } else {
      embeddedImage = await pdfDoc.embedJpg(arrayBuffer);
    }
  } catch {
    // Re-render via canvas to ensure valid standard PNG/JPG bytes
    const imgBitmap = await createImageBitmapSafe(file);
    const canvas = document.createElement('canvas');
    canvas.width = imgBitmap.width;
    canvas.height = imgBitmap.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(imgBitmap, 0, 0);
    const pngBlob = await new Promise<Blob>(res => canvas.toBlob(b => res(b!), 'image/png'));
    const pngBuffer = await pngBlob.arrayBuffer();
    embeddedImage = await pdfDoc.embedPng(pngBuffer);
  }

  const { width, height } = embeddedImage.scale(1);
  const page = pdfDoc.addPage([width, height]);
  page.drawImage(embeddedImage, {
    x: 0,
    y: 0,
    width,
    height
  });

  onProgress?.(80, 'Saving PDF document...');
  const pdfBytes = await pdfDoc.save();
  const outputBlob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });

  const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
  const newFileName = `${baseName}.pdf`;

  onProgress?.(100, 'Ready');

  return {
    success: true,
    blob: outputBlob,
    filename: newFileName,
    outputFormat: 'PDF',
    originalSize: file.size,
    outputSize: outputBlob.size,
    pages: 1,
    dimensions: { width: Math.round(width), height: Math.round(height) },
    executionMode: 'local'
  };
}

export async function imagesToSinglePdf(
  files: { file: File; name: string }[],
  onProgress?: (percent: number, msg: string) => void
): Promise<ProcessedResult> {
  const pdfDoc = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    const item = files[i];
    onProgress?.(
      Math.round(((i + 1) / files.length) * 80),
      `Processing image ${i + 1} of ${files.length}...`
    );

    const imgBitmap = await createImageBitmapSafe(item.file);
    const canvas = document.createElement('canvas');
    canvas.width = imgBitmap.width;
    canvas.height = imgBitmap.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(imgBitmap, 0, 0);
    const pngBlob = await new Promise<Blob>(res => canvas.toBlob(b => res(b!), 'image/png'));
    const pngBuffer = await pngBlob.arrayBuffer();
    const embeddedImage = await pdfDoc.embedPng(pngBuffer);

    const { width, height } = embeddedImage.scale(1);
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width,
      height
    });
  }

  onProgress?.(90, 'Packaging PDF document...');
  const pdfBytes = await pdfDoc.save();
  const outputBlob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });

  const totalOriginalSize = files.reduce((acc, f) => acc + f.file.size, 0);

  return {
    success: true,
    blob: outputBlob,
    filename: 'combined-images.pdf',
    outputFormat: 'PDF',
    originalSize: totalOriginalSize,
    outputSize: outputBlob.size,
    pages: files.length,
    executionMode: 'local'
  };
}

async function optimizeToTargetSize(
  canvas: HTMLCanvasElement,
  mimeType: string,
  targetSizeKb: number,
  onProgress?: (percent: number, msg: string) => void
): Promise<Blob> {
  const targetBytes = targetSizeKb * 1024;
  let minQuality = 0.05;
  let maxQuality = 0.95;
  let bestBlob: Blob | null = null;

  // Binary search for optimal quality
  for (let iter = 0; iter < 6; iter++) {
    const currentQuality = (minQuality + maxQuality) / 2;
    onProgress?.(60 + iter * 5, `Target size iteration ${iter + 1}: adjusting compression...`);

    const blob = await new Promise<Blob>(res => {
      canvas.toBlob(b => res(b!), mimeType, currentQuality);
    });

    if (!blob) break;
    bestBlob = blob;

    if (blob.size > targetBytes) {
      maxQuality = currentQuality;
    } else {
      minQuality = currentQuality;
      // If we are within 5% of target, stop
      if (blob.size >= targetBytes * 0.9) {
        break;
      }
    }
  }

  // If even at minimum quality it's still larger than target, downscale dimensions
  if (bestBlob && bestBlob.size > targetBytes && canvas.width > 200 && canvas.height > 200) {
    onProgress?.(85, 'Downscaling dimensions to achieve target size...');
    const scaleFactor = Math.sqrt(targetBytes / bestBlob.size);
    const scaledCanvas = document.createElement('canvas');
    scaledCanvas.width = Math.max(100, Math.round(canvas.width * scaleFactor * 0.95));
    scaledCanvas.height = Math.max(100, Math.round(canvas.height * scaleFactor * 0.95));
    const sCtx = scaledCanvas.getContext('2d')!;
    sCtx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);

    bestBlob = await new Promise<Blob>(res => {
      scaledCanvas.toBlob(b => res(b!), mimeType, 0.75);
    });
  }

  return bestBlob || new Blob([], { type: mimeType });
}

async function createImageBitmapSafe(file: File | Blob): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap !== 'undefined') {
    try {
      return await createImageBitmap(file);
    } catch {
      // fallback to Image
    }
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to decode image data.'));
    };
    img.src = url;
  });
}

function getMimeForFormat(format: FileFormat): string {
  switch (format) {
    case 'PNG': return 'image/png';
    case 'WebP': return 'image/webp';
    case 'JPEG': return 'image/jpeg';
    case 'BMP': return 'image/bmp';
    default: return 'image/jpeg';
  }
}

function getExtensionForFormat(format: FileFormat): string {
  switch (format) {
    case 'JPEG': return 'jpg';
    case 'PNG': return 'png';
    case 'WebP': return 'webp';
    case 'PDF': return 'pdf';
    case 'BMP': return 'bmp';
    case 'GIF': return 'gif';
    case 'SVG': return 'svg';
    default: return 'bin';
  }
}
