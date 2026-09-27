import { ProcessedResult } from '@fileconverter/shared-types';
export interface BatchItem {
    id: string;
    file: File;
    status: 'pending' | 'processing' | 'done' | 'error';
    progress: number;
    result?: ProcessedResult;
    error?: string;
}
export declare function packageBatchToZip(results: ProcessedResult[], zipFilename?: string): Promise<Blob>;
