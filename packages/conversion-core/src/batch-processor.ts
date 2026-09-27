import { ProcessedResult } from '@fileconverter/shared-types';
import JSZip from 'jszip';

export interface BatchItem {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'done' | 'error';
  progress: number;
  result?: ProcessedResult;
  error?: string;
}

export async function packageBatchToZip(
  results: ProcessedResult[],
  zipFilename: string = 'converted-files.zip'
): Promise<Blob> {
  const zip = new JSZip();

  for (let i = 0; i < results.length; i++) {
    const res = results[i];
    if (res.blob) {
      zip.file(res.filename, res.blob);
    }
  }

  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });
}
