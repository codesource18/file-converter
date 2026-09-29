import { ConversionOptions, ProcessedResult } from '@fileconverter/shared-types';
export declare function convertDocxToPdf(file: File | Blob, fileName: string, options?: ConversionOptions, onProgress?: (percent: number, msg: string) => void): Promise<ProcessedResult>;
