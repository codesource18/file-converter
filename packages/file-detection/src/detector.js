"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inspectFile = inspectFile;
exports.detectFormatFromBytes = detectFormatFromBytes;
exports.getSmartRecommendations = getSmartRecommendations;
const registry_js_1 = require("./registry.js");
async function inspectFile(file) {
    const buffer = await file.slice(0, 8192).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const detectedFormat = detectFormatFromBytes(bytes, file.name, file.type);
    const metadata = {
        format: detectedFormat,
        mimeType: file.type || getFallbackMime(detectedFormat),
        extension: getExtension(file.name),
        size: file.size,
        name: file.name
    };
    // Inspect additional properties
    if (detectedFormat === 'PDF') {
        inspectPdfHeaders(bytes, metadata);
    }
    else if (['JPEG', 'PNG', 'WebP', 'GIF', 'BMP', 'TIFF', 'AVIF', 'HEIC', 'SVG'].includes(detectedFormat)) {
        await inspectImageHeaders(file, bytes, detectedFormat, metadata);
    }
    return metadata;
}
function detectFormatFromBytes(bytes, filename, mimeType) {
    if (bytes.length >= 4) {
        // PDF: %PDF- (0x25 0x50 0x44 0x46)
        if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
            return 'PDF';
        }
        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if (bytes.length >= 8 &&
            bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47 &&
            bytes[4] === 0x0D && bytes[5] === 0x0A && bytes[6] === 0x1A && bytes[7] === 0x0A) {
            return 'PNG';
        }
        // JPEG: FF D8 FF
        if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
            return 'JPEG';
        }
        // WebP: RIFF .... WEBP
        if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
            bytes.length >= 12 &&
            bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
            return 'WebP';
        }
        // GIF: GIF87a or GIF89a
        if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
            return 'GIF';
        }
        // BMP: BM (0x42 0x4D)
        if (bytes[0] === 0x42 && bytes[1] === 0x4D) {
            return 'BMP';
        }
        // TIFF: II*. or MM.*
        if ((bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2A && bytes[3] === 0x00) ||
            (bytes[0] === 0x4D && bytes[1] === 0x4D && bytes[2] === 0x00 && bytes[3] === 0x2A)) {
            return 'TIFF';
        }
        // ICO: 00 00 01 00
        if (bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0x01 && bytes[3] === 0x00) {
            return 'ICO';
        }
        // ZIP / DOCX: PK.. (0x50 0x4B 0x03 0x04)
        if (bytes[0] === 0x50 && bytes[1] === 0x4B && (bytes[2] === 0x03 || bytes[2] === 0x05 || bytes[2] === 0x07)) {
            const ext = getExtension(filename).toLowerCase();
            if (ext === 'docx' || ext === 'doc' || ext === 'docm' || ext === 'dotx') {
                return 'DOCX';
            }
        }
        // HEIC/HEIF/AVIF: ftyp container (bytes 4..7 is 'ftyp')
        if (bytes.length >= 12 &&
            bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
            const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]).toLowerCase();
            if (brand.includes('avif') || brand.includes('avis')) {
                return 'AVIF';
            }
            if (brand.includes('heic') || brand.includes('heix') || brand.includes('mif1') || brand.includes('msf1') || brand.includes('hevc')) {
                return 'HEIC';
            }
        }
    }
    // Text / SVG inspect
    const headerStr = new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(0, 500)).trim();
    if (headerStr.includes('<svg') || (headerStr.includes('<?xml') && headerStr.includes('<svg'))) {
        return 'SVG';
    }
    // Fallback to extension detection
    const ext = getExtension(filename).toLowerCase();
    switch (ext) {
        case 'pdf': return 'PDF';
        case 'jpg':
        case 'jpeg': return 'JPEG';
        case 'png': return 'PNG';
        case 'webp': return 'WebP';
        case 'avif': return 'AVIF';
        case 'heic': return 'HEIC';
        case 'heif': return 'HEIF';
        case 'tiff':
        case 'tif': return 'TIFF';
        case 'gif': return 'GIF';
        case 'bmp': return 'BMP';
        case 'svg': return 'SVG';
        case 'ico': return 'ICO';
        case 'docx':
        case 'doc':
        case 'docm':
        case 'dotx': return 'DOCX';
        case 'txt': return 'TXT';
    }
    // Fallback to MIME
    if (mimeType) {
        if (mimeType.includes('pdf'))
            return 'PDF';
        if (mimeType.includes('jpeg'))
            return 'JPEG';
        if (mimeType.includes('png'))
            return 'PNG';
        if (mimeType.includes('webp'))
            return 'WebP';
        if (mimeType.includes('avif'))
            return 'AVIF';
        if (mimeType.includes('heic'))
            return 'HEIC';
        if (mimeType.includes('tiff'))
            return 'TIFF';
        if (mimeType.includes('gif'))
            return 'GIF';
        if (mimeType.includes('bmp'))
            return 'BMP';
        if (mimeType.includes('svg'))
            return 'SVG';
        if (mimeType.includes('image/'))
            return 'unknown image';
    }
    return 'unsupported';
}
function inspectPdfHeaders(bytes, metadata) {
    const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    if (text.includes('/Encrypt')) {
        metadata.isEncrypted = true;
        metadata.warning = 'Encrypted PDF detected. Password required.';
    }
}
async function inspectImageHeaders(file, bytes, format, metadata) {
    // EXIF search (FF E1 in JPEG, or 'Exif' marker)
    if (format === 'JPEG') {
        for (let i = 0; i < bytes.length - 4; i++) {
            if (bytes[i] === 0xFF && bytes[i + 1] === 0xE1) {
                metadata.hasExif = true;
                // Check for GPS in exif
                const sliceStr = new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(i, i + 500));
                if (sliceStr.includes('GPS') || sliceStr.includes('GPSInfo')) {
                    metadata.hasGps = true;
                    metadata.warning = 'GPS geolocation metadata detected. Privacy cleaning recommended.';
                }
                break;
            }
        }
    }
    // Try to read image dimensions if in browser environment
    if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
        try {
            if (!['HEIC', 'HEIF', 'TIFF'].includes(format)) {
                const url = URL.createObjectURL(file);
                const img = new Image();
                await new Promise((resolve, reject) => {
                    img.onload = () => {
                        metadata.width = img.naturalWidth;
                        metadata.height = img.naturalHeight;
                        URL.revokeObjectURL(url);
                        resolve();
                    };
                    img.onerror = () => {
                        URL.revokeObjectURL(url);
                        resolve();
                    };
                    img.src = url;
                });
            }
        }
        catch {
            // Dimension inspection non-blocking
        }
    }
}
function getExtension(filename) {
    const idx = filename.lastIndexOf('.');
    return idx !== -1 ? filename.slice(idx + 1).toLowerCase() : '';
}
function getFallbackMime(format) {
    switch (format) {
        case 'PDF': return 'application/pdf';
        case 'JPEG': return 'image/jpeg';
        case 'PNG': return 'image/png';
        case 'WebP': return 'image/webp';
        case 'AVIF': return 'image/avif';
        case 'HEIC': return 'image/heic';
        case 'HEIF': return 'image/heif';
        case 'TIFF': return 'image/tiff';
        case 'GIF': return 'image/gif';
        case 'BMP': return 'image/bmp';
        case 'SVG': return 'image/svg+xml';
        case 'ICO': return 'image/x-icon';
        case 'DOCX': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        case 'TXT': return 'text/plain';
        default: return 'application/octet-stream';
    }
}
// ----------------------------------------------------
// SMART RECOMMENDATION MATRIX IMPLEMENTATION
// ----------------------------------------------------
function getSmartRecommendations(metadata) {
    const format = metadata.format;
    const primaryToolIds = [];
    const secondaryToolIds = [];
    switch (format) {
        case 'PDF':
            primaryToolIds.push('pdf-to-word', 'pdf-to-jpg', 'pdf-to-png');
            secondaryToolIds.push('edit-pdf', 'compress-pdf', 'merge-pdf', 'split-pdf', 'ocr-pdf', 'rotate-pdf', 'watermark-pdf', 'protect-pdf', 'unlock-pdf', 'remove-pdf-metadata');
            break;
        case 'JPEG':
            primaryToolIds.push('jpg-to-png', 'jpg-to-webp', 'jpg-to-pdf');
            secondaryToolIds.push('compress-image', 'resize-image', 'crop-image', 'remove-image-metadata');
            break;
        case 'PNG':
            primaryToolIds.push('png-to-jpg', 'png-to-webp', 'png-to-pdf');
            secondaryToolIds.push('compress-image', 'resize-image', 'crop-image', 'remove-image-metadata');
            break;
        case 'WebP':
        case 'WEBP':
            primaryToolIds.push('webp-to-jpg', 'webp-to-png', 'webp-to-pdf');
            secondaryToolIds.push('compress-image', 'resize-image', 'crop-image', 'remove-image-metadata');
            break;
        case 'HEIC':
        case 'HEIF':
        case 'heic':
        case 'heif':
            primaryToolIds.push('heic-to-jpg', 'heic-to-png', 'heic-to-pdf');
            secondaryToolIds.push('resize-image', 'compress-image', 'remove-image-metadata');
            break;
        case 'AVIF':
            primaryToolIds.push('avif-to-jpg', 'avif-to-png');
            secondaryToolIds.push('compress-image', 'resize-image', 'remove-image-metadata');
            break;
        case 'TIFF':
            primaryToolIds.push('tiff-to-jpg', 'tiff-to-pdf');
            secondaryToolIds.push('compress-image', 'resize-image', 'ocr-pdf');
            break;
        case 'GIF':
            primaryToolIds.push('gif-to-webp');
            secondaryToolIds.push('resize-image');
            break;
        case 'SVG':
            primaryToolIds.push('svg-to-png', 'svg-to-pdf');
            secondaryToolIds.push('resize-image');
            break;
        case 'BMP':
            primaryToolIds.push('png-to-jpg', 'png-to-webp');
            secondaryToolIds.push('compress-image', 'resize-image');
            break;
        case 'DOCX':
            primaryToolIds.push('word-to-pdf');
            secondaryToolIds.push('compress-pdf', 'ocr-pdf', 'edit-pdf', 'protect-pdf');
            break;
        case 'TXT':
            primaryToolIds.push('word-to-pdf');
            secondaryToolIds.push('ocr-pdf');
            break;
        default:
            // Fallback options
            if (format === 'unknown image') {
                primaryToolIds.push('jpg-to-png', 'jpg-to-webp', 'jpg-to-pdf');
                secondaryToolIds.push('compress-image', 'resize-image');
            }
    }
    const primaryTools = primaryToolIds
        .map(id => registry_js_1.ALL_TOOLS.find(t => t.id === id))
        .filter((t) => !!t);
    const secondaryTools = secondaryToolIds
        .map(id => registry_js_1.ALL_TOOLS.find(t => t.id === id))
        .filter((t) => !!t);
    // All compatible tools that accept this format
    const allCompatibleTools = registry_js_1.ALL_TOOLS.filter(t => t.inputFormats.includes(format));
    // Determine overall privacy mode
    const hasOnlyLocal = primaryTools.length > 0 && primaryTools.every(t => t.preferredMode === 'local');
    const privacyMode = hasOnlyLocal ? 'local' : 'backend';
    return {
        file: metadata,
        detectedFormat: format,
        primaryTools,
        secondaryTools,
        allCompatibleTools,
        rescueModeAvailable: format === 'TIFF' || format === 'HEIC' || format === 'unsupported',
        privacyMode
    };
}
