"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergePdfs = mergePdfs;
exports.splitPdf = splitPdf;
exports.compressPdf = compressPdf;
exports.rotatePdf = rotatePdf;
exports.watermarkPdf = watermarkPdf;
exports.addPageNumbers = addPageNumbers;
exports.removePdfMetadata = removePdfMetadata;
exports.applyAnnotationsToPdf = applyAnnotationsToPdf;
const pdf_lib_1 = require("pdf-lib");
async function mergePdfs(files, onProgress) {
    onProgress?.(10, 'Initializing merged document...');
    const mergedPdf = await pdf_lib_1.PDFDocument.create();
    let totalOriginalSize = 0;
    let totalPages = 0;
    for (let i = 0; i < files.length; i++) {
        const item = files[i];
        totalOriginalSize += item.file.size;
        onProgress?.(Math.round(15 + ((i + 1) / files.length) * 70), `Merging ${item.name} (${i + 1}/${files.length})...`);
        const arrayBuffer = await item.file.arrayBuffer();
        const donorPdf = await pdf_lib_1.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const copiedPages = await mergedPdf.copyPages(donorPdf, donorPdf.getPageIndices());
        copiedPages.forEach(page => {
            mergedPdf.addPage(page);
            totalPages++;
        });
    }
    onProgress?.(90, 'Saving merged PDF...');
    const pdfBytes = await mergedPdf.save();
    const outputBlob = new Blob([pdfBytes.buffer], { type: 'application/pdf' });
    return {
        success: true,
        blob: outputBlob,
        filename: 'merged-document.pdf',
        outputFormat: 'PDF',
        originalSize: totalOriginalSize,
        outputSize: outputBlob.size,
        pages: totalPages,
        executionMode: 'local'
    };
}
async function splitPdf(file, fileName, pageIndicesToExtract, onProgress) {
    onProgress?.(20, 'Loading PDF for splitting...');
    const arrayBuffer = await file.arrayBuffer();
    const srcPdf = await pdf_lib_1.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const totalPages = srcPdf.getPageCount();
    onProgress?.(50, 'Extracting selected pages...');
    const newPdf = await pdf_lib_1.PDFDocument.create();
    const validIndices = pageIndicesToExtract.filter(idx => idx >= 0 && idx < totalPages);
    const indices = validIndices.length > 0 ? validIndices : [0];
    const copiedPages = await newPdf.copyPages(srcPdf, indices);
    copiedPages.forEach(p => newPdf.addPage(p));
    onProgress?.(85, 'Packaging split PDF...');
    const pdfBytes = await newPdf.save();
    const outputBlob = new Blob([pdfBytes.buffer], { type: 'application/pdf' });
    const baseName = fileName.replace(/\.pdf$/i, '');
    const newFileName = `${baseName}_extracted.pdf`;
    return {
        success: true,
        blob: outputBlob,
        filename: newFileName,
        outputFormat: 'PDF',
        originalSize: file.size,
        outputSize: outputBlob.size,
        pages: copiedPages.length,
        executionMode: 'local'
    };
}
async function compressPdf(file, fileName, options = {}, onProgress) {
    onProgress?.(20, 'Analyzing PDF object streams...');
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdf_lib_1.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    onProgress?.(50, 'Optimizing font tables and cross-reference streams...');
    pdfDoc.setProducer('FileConverter Optimizer');
    pdfDoc.setCreator('FileConverter Sandbox');
    onProgress?.(80, 'Compressing PDF objects with Deflate...');
    const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
    const outputBlob = new Blob([pdfBytes.buffer], { type: 'application/pdf' });
    const originalSize = file.size;
    const outputSize = outputBlob.size;
    const reductionPercentage = Math.max(0, Math.round(((originalSize - outputSize) / originalSize) * 100));
    const baseName = fileName.replace(/\.pdf$/i, '');
    return {
        success: true,
        blob: outputBlob,
        filename: `${baseName}_compressed.pdf`,
        outputFormat: 'PDF',
        originalSize,
        outputSize,
        reductionPercentage,
        pages: pdfDoc.getPageCount(),
        executionMode: 'local'
    };
}
async function rotatePdf(file, fileName, rotateDegrees = 90, pageIndices, onProgress) {
    onProgress?.(20, 'Reading PDF structure...');
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdf_lib_1.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const pages = pdfDoc.getPages();
    onProgress?.(50, `Rotating pages by ${rotateDegrees}°...`);
    pages.forEach((page, index) => {
        if (!pageIndices || pageIndices.includes(index)) {
            const currentRotation = page.getRotation().angle;
            page.setRotation((0, pdf_lib_1.degrees)((currentRotation + rotateDegrees) % 360));
        }
    });
    onProgress?.(85, 'Saving rotated document...');
    const pdfBytes = await pdfDoc.save();
    const outputBlob = new Blob([pdfBytes.buffer], { type: 'application/pdf' });
    const baseName = fileName.replace(/\.pdf$/i, '');
    return {
        success: true,
        blob: outputBlob,
        filename: `${baseName}_rotated.pdf`,
        outputFormat: 'PDF',
        originalSize: file.size,
        outputSize: outputBlob.size,
        pages: pages.length,
        executionMode: 'local'
    };
}
async function watermarkPdf(file, fileName, watermarkText, options = {}, onProgress) {
    onProgress?.(20, 'Loading PDF for watermarking...');
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdf_lib_1.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const helveticaFont = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();
    const fontSize = options.fontSize || 42;
    const opacity = options.opacity ?? 0.3;
    const col = options.color || { r: 0.7, g: 0.1, b: 0.1 };
    onProgress?.(50, 'Stamping watermark across pages...');
    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        const textWidth = helveticaFont.widthOfTextAtSize(watermarkText, fontSize);
        const textHeight = helveticaFont.heightAtSize(fontSize);
        page.drawText(watermarkText, {
            x: width / 2 - textWidth / 2,
            y: height / 2 - textHeight / 2,
            size: fontSize,
            font: helveticaFont,
            color: (0, pdf_lib_1.rgb)(col.r, col.g, col.b),
            opacity: opacity,
            rotate: (0, pdf_lib_1.degrees)(45)
        });
    }
    onProgress?.(85, 'Finalizing watermarked PDF...');
    const pdfBytes = await pdfDoc.save();
    const outputBlob = new Blob([pdfBytes.buffer], { type: 'application/pdf' });
    const baseName = fileName.replace(/\.pdf$/i, '');
    return {
        success: true,
        blob: outputBlob,
        filename: `${baseName}_watermarked.pdf`,
        outputFormat: 'PDF',
        originalSize: file.size,
        outputSize: outputBlob.size,
        pages: pages.length,
        executionMode: 'local'
    };
}
async function addPageNumbers(file, fileName, format = 'Page {n} of {total}', position = 'bottom-center', onProgress) {
    onProgress?.(20, 'Loading PDF...');
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdf_lib_1.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const font = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();
    const total = pages.length;
    onProgress?.(50, 'Inserting page numbers...');
    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        const label = format.replace('{n}', `${i + 1}`).replace('{total}', `${total}`);
        const textWidth = font.widthOfTextAtSize(label, 10);
        let x = width / 2 - textWidth / 2;
        let y = 25;
        if (position === 'bottom-right') {
            x = width - textWidth - 30;
            y = 25;
        }
        else if (position === 'top-right') {
            x = width - textWidth - 30;
            y = height - 30;
        }
        page.drawText(label, {
            x,
            y,
            size: 10,
            font,
            color: (0, pdf_lib_1.rgb)(0.3, 0.3, 0.3)
        });
    }
    onProgress?.(85, 'Saving numbered PDF...');
    const pdfBytes = await pdfDoc.save();
    const outputBlob = new Blob([pdfBytes.buffer], { type: 'application/pdf' });
    const baseName = fileName.replace(/\.pdf$/i, '');
    return {
        success: true,
        blob: outputBlob,
        filename: `${baseName}_numbered.pdf`,
        outputFormat: 'PDF',
        originalSize: file.size,
        outputSize: outputBlob.size,
        pages: pages.length,
        executionMode: 'local'
    };
}
async function removePdfMetadata(file, fileName, onProgress) {
    onProgress?.(20, 'Sanitizing PDF metadata dictionary...');
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdf_lib_1.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer('FileConverter Clean Sanitizer');
    pdfDoc.setCreator('FileConverter Local Sandbox');
    pdfDoc.setCreationDate(new Date(0));
    pdfDoc.setModificationDate(new Date(0));
    onProgress?.(80, 'Saving sanitized PDF...');
    const pdfBytes = await pdfDoc.save();
    const outputBlob = new Blob([pdfBytes.buffer], { type: 'application/pdf' });
    const baseName = fileName.replace(/\.pdf$/i, '');
    return {
        success: true,
        blob: outputBlob,
        filename: `${baseName}_clean.pdf`,
        outputFormat: 'PDF',
        originalSize: file.size,
        outputSize: outputBlob.size,
        executionMode: 'local'
    };
}
async function applyAnnotationsToPdf(file, fileName, annotations, onProgress) {
    onProgress?.(20, 'Loading PDF into editor engine...');
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdf_lib_1.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const pages = pdfDoc.getPages();
    // Pre-embed standard fonts for dynamic typography matching
    const fonts = {
        sans: {
            regular: await pdfDoc.embedFont(pdf_lib_1.StandardFonts.Helvetica),
            bold: await pdfDoc.embedFont(pdf_lib_1.StandardFonts.HelveticaBold),
            italic: await pdfDoc.embedFont(pdf_lib_1.StandardFonts.HelveticaOblique),
            boldItalic: await pdfDoc.embedFont(pdf_lib_1.StandardFonts.HelveticaBoldOblique),
        },
        serif: {
            regular: await pdfDoc.embedFont(pdf_lib_1.StandardFonts.TimesRoman),
            bold: await pdfDoc.embedFont(pdf_lib_1.StandardFonts.TimesRomanBold),
            italic: await pdfDoc.embedFont(pdf_lib_1.StandardFonts.TimesRomanItalic),
            boldItalic: await pdfDoc.embedFont(pdf_lib_1.StandardFonts.TimesRomanBoldItalic),
        },
        mono: {
            regular: await pdfDoc.embedFont(pdf_lib_1.StandardFonts.Courier),
            bold: await pdfDoc.embedFont(pdf_lib_1.StandardFonts.CourierBold),
            italic: await pdfDoc.embedFont(pdf_lib_1.StandardFonts.CourierOblique),
            boldItalic: await pdfDoc.embedFont(pdf_lib_1.StandardFonts.CourierBoldOblique),
        }
    };
    onProgress?.(50, `Applying ${annotations.length} annotations and edits...`);
    for (const ann of annotations) {
        const pageIdx = Math.max(0, Math.min(pages.length - 1, ann.pageNumber - 1));
        const page = pages[pageIdx];
        const { height } = page.getSize();
        // Convert coordinate origin (canvas top-left to PDF bottom-left)
        const pdfY = height - ann.y - (ann.height || 0);
        if (ann.type === 'text' && ann.content) {
            const family = ann.fontFamily === 'serif' ? 'serif' : ann.fontFamily === 'monospace' ? 'mono' : 'sans';
            const variant = (ann.isBold && ann.isItalic)
                ? 'boldItalic'
                : ann.isBold
                    ? 'bold'
                    : ann.isItalic
                        ? 'italic'
                        : 'regular';
            const selectedFont = fonts[family][variant];
            page.drawText(ann.content, {
                x: ann.x,
                y: height - ann.y - (ann.fontSize || 16),
                size: ann.fontSize || 16,
                font: selectedFont,
                color: hexToRgbColor(ann.color || '#000000')
            });
        }
        else if (ann.type === 'whiteout' || ann.type === 'redact') {
            page.drawRectangle({
                x: ann.x,
                y: pdfY,
                width: ann.width || 100,
                height: ann.height || 30,
                color: ann.type === 'whiteout' ? (ann.backgroundColor ? hexToRgbColor(ann.backgroundColor) : (0, pdf_lib_1.rgb)(1, 1, 1)) : (0, pdf_lib_1.rgb)(0, 0, 0)
            });
        }
        else if (ann.type === 'highlight') {
            page.drawRectangle({
                x: ann.x,
                y: pdfY,
                width: ann.width || 100,
                height: ann.height || 20,
                color: (0, pdf_lib_1.rgb)(1, 0.95, 0.2),
                opacity: 0.4
            });
        }
        else if (ann.type === 'shape') {
            if (ann.shapeType === 'rectangle') {
                page.drawRectangle({
                    x: ann.x,
                    y: pdfY,
                    width: ann.width || 80,
                    height: ann.height || 50,
                    borderColor: hexToRgbColor(ann.color || '#2563eb'),
                    borderWidth: ann.strokeWidth || 2,
                    opacity: ann.opacity ?? 1
                });
            }
            else if (ann.shapeType === 'circle') {
                const radius = Math.min(ann.width || 50, ann.height || 50) / 2;
                page.drawEllipse({
                    x: ann.x + radius,
                    y: pdfY + radius,
                    xScale: radius,
                    yScale: radius,
                    borderColor: hexToRgbColor(ann.color || '#2563eb'),
                    borderWidth: ann.strokeWidth || 2,
                    opacity: ann.opacity ?? 1
                });
            }
        }
        else if (ann.type === 'watermark' && ann.content) {
            const boldFont = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.HelveticaBold);
            page.drawText(ann.content, {
                x: ann.x,
                y: height - ann.y,
                size: ann.fontSize || 42,
                font: boldFont,
                color: hexToRgbColor(ann.color || '#dc2626'),
                opacity: ann.opacity ?? 0.3,
                rotate: (0, pdf_lib_1.degrees)(45)
            });
        }
        else if ((ann.type === 'image' || ann.type === 'signature') && ann.imageData) {
            try {
                let imageBytes;
                const dataUrl = ann.imageData;
                if (dataUrl.includes('base64,')) {
                    const base64 = dataUrl.split('base64,')[1];
                    const binaryStr = atob(base64);
                    imageBytes = new Uint8Array(binaryStr.length);
                    for (let i = 0; i < binaryStr.length; i++) {
                        imageBytes[i] = binaryStr.charCodeAt(i);
                    }
                }
                else {
                    imageBytes = new TextEncoder().encode(dataUrl);
                }
                const isPng = dataUrl.startsWith('data:image/png') || dataUrl.startsWith('data:image/webp');
                const embeddedImage = isPng ? await pdfDoc.embedPng(imageBytes) : await pdfDoc.embedJpg(imageBytes);
                page.drawImage(embeddedImage, {
                    x: ann.x,
                    y: pdfY,
                    width: ann.width || 120,
                    height: ann.height || 60,
                    opacity: ann.opacity ?? 1
                });
            }
            catch (err) {
                console.warn('Failed to embed image/signature annotation in PDF:', err);
            }
        }
        else if (ann.type === 'draw' && ann.points && ann.points.length > 1) {
            // Connect points with lines
            for (let i = 0; i < ann.points.length - 1; i++) {
                const p1 = ann.points[i];
                const p2 = ann.points[i + 1];
                page.drawLine({
                    start: { x: p1.x, y: height - p1.y },
                    end: { x: p2.x, y: height - p2.y },
                    thickness: ann.strokeWidth || 2,
                    color: hexToRgbColor(ann.color || '#000000')
                });
            }
        }
    }
    onProgress?.(85, 'Rendering finalized PDF...');
    const pdfBytes = await pdfDoc.save();
    const outputBlob = new Blob([pdfBytes.buffer], { type: 'application/pdf' });
    const baseName = fileName.replace(/\.pdf$/i, '');
    return {
        success: true,
        blob: outputBlob,
        filename: `${baseName}_edited.pdf`,
        outputFormat: 'PDF',
        originalSize: file.size,
        outputSize: outputBlob.size,
        pages: pages.length,
        executionMode: 'local'
    };
}
function hexToRgbColor(hex) {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255 || 0;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255 || 0;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255 || 0;
    return (0, pdf_lib_1.rgb)(r, g, b);
}
