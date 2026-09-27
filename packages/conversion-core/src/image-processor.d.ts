import { ConversionOptions, ProcessedResult } from '@fileconverter/shared-types';
export declare function convertImageLocally(file: File | Blob, fileName: string, options?: ConversionOptions, onProgress?: (percent: number, msg: string) => void): Promise<ProcessedResult>;
export declare function convertImageToPdf(file: File | Blob, fileName: string, options?: ConversionOptions, onProgress?: (percent: number, msg: string) => void): Promise<ProcessedResult>;
export declare function imagesToSinglePdf(files: {
    file: File;
    name: string;
}[], onProgress?: (percent: number, msg: string) => void): Promise<ProcessedResult>;
