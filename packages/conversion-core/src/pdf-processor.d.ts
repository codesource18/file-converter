import { PDFAnnotation, ProcessedResult } from '@fileconverter/shared-types';
export declare function mergePdfs(files: {
    file: File | Blob;
    name: string;
}[], onProgress?: (percent: number, msg: string) => void): Promise<ProcessedResult>;
export declare function splitPdf(file: File | Blob, fileName: string, pageIndicesToExtract: number[], onProgress?: (percent: number, msg: string) => void): Promise<ProcessedResult>;
export declare function compressPdf(file: File | Blob, fileName: string, options?: {
    targetSizeKb?: number;
    quality?: number;
}, onProgress?: (percent: number, msg: string) => void): Promise<ProcessedResult>;
export declare function rotatePdf(file: File | Blob, fileName: string, rotateDegrees?: number, pageIndices?: number[], onProgress?: (percent: number, msg: string) => void): Promise<ProcessedResult>;
export declare function watermarkPdf(file: File | Blob, fileName: string, watermarkText: string, options?: {
    opacity?: number;
    color?: {
        r: number;
        g: number;
        b: number;
    };
    fontSize?: number;
}, onProgress?: (percent: number, msg: string) => void): Promise<ProcessedResult>;
export declare function addPageNumbers(file: File | Blob, fileName: string, format?: string, position?: 'bottom-center' | 'bottom-right' | 'top-right', onProgress?: (percent: number, msg: string) => void): Promise<ProcessedResult>;
export declare function removePdfMetadata(file: File | Blob, fileName: string, onProgress?: (percent: number, msg: string) => void): Promise<ProcessedResult>;
export declare function applyAnnotationsToPdf(file: File | Blob, fileName: string, annotations: PDFAnnotation[], onProgress?: (percent: number, msg: string) => void): Promise<ProcessedResult>;
