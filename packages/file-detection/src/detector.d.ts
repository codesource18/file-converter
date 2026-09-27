import { FileFormat, FileMetadata, SmartRecommendationResult } from '@fileconverter/shared-types';
export declare function inspectFile(file: File): Promise<FileMetadata>;
export declare function detectFormatFromBytes(bytes: Uint8Array, filename: string, mimeType?: string): FileFormat;
export declare function getSmartRecommendations(metadata: FileMetadata): SmartRecommendationResult;
