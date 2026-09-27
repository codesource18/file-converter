export type FileFormat = 'PDF' | 'JPEG' | 'PNG' | 'WebP' | 'AVIF' | 'HEIC' | 'HEIF' | 'TIFF' | 'GIF' | 'BMP' | 'SVG' | 'ICO' | 'DOCX' | 'TXT' | 'RAW' | 'unknown image' | 'unsupported';
export interface FileMetadata {
    format: FileFormat;
    mimeType: string;
    extension: string;
    size: number;
    name: string;
    width?: number;
    height?: number;
    pages?: number;
    hasAlpha?: boolean;
    isAnimated?: boolean;
    isEncrypted?: boolean;
    hasExif?: boolean;
    hasGps?: boolean;
    colorSpace?: string;
    dpi?: number;
    creator?: string;
    title?: string;
    author?: string;
    creationDate?: string;
    warning?: string;
    compatibilityNote?: string;
}
export type ExecutionMode = 'local' | 'backend';
export type ToolCategory = 'convert' | 'compress' | 'edit' | 'organize' | 'ocr' | 'inspect' | 'security' | 'utility';
export interface ToolDefinition {
    id: string;
    name: string;
    description: string;
    category: ToolCategory;
    inputFormats: FileFormat[];
    outputFormats: FileFormat[];
    executionModes: ExecutionMode[];
    preferredMode: ExecutionMode;
    priority: number;
    icon: string;
    capabilities: ('single' | 'batch' | 'workflow' | 'target-size' | 'before-after')[];
    slug: string;
    seoTitle?: string;
    seoDescription?: string;
    explanation?: string;
    faq?: {
        q: string;
        a: string;
    }[];
}
export interface SmartRecommendationResult {
    file: FileMetadata;
    detectedFormat: FileFormat;
    primaryTools: ToolDefinition[];
    secondaryTools: ToolDefinition[];
    allCompatibleTools: ToolDefinition[];
    rescueModeAvailable: boolean;
    privacyMode: ExecutionMode;
    notes?: string;
}
export interface ProcessingProgress {
    stage: 'idle' | 'inspecting' | 'preparing' | 'rendering' | 'converting' | 'optimizing' | 'packaging' | 'ready' | 'error';
    percent: number;
    message: string;
}
export interface ConversionOptions {
    outputFormat?: FileFormat;
    quality?: number;
    targetSizeKb?: number;
    width?: number;
    height?: number;
    maintainAspectRatio?: boolean;
    rotateDeg?: number;
    flipHorizontal?: boolean;
    flipVertical?: boolean;
    removeMetadata?: boolean;
    removeGps?: boolean;
    password?: string;
    newPassword?: string;
    ocrLanguage?: string;
    pageRange?: string;
    watermarkText?: string;
    watermarkOpacity?: number;
    dpi?: number;
    backgroundColor?: string;
    compressionLevel?: 'low' | 'medium' | 'high' | 'target';
    annotations?: PDFAnnotation[];
}
export interface PDFAnnotation {
    id: string;
    type: 'text' | 'image' | 'signature' | 'draw' | 'highlight' | 'underline' | 'strike' | 'shape' | 'whiteout' | 'redact' | 'watermark' | 'pageNumber';
    pageNumber: number;
    x: number;
    y: number;
    width?: number;
    height?: number;
    content?: string;
    color?: string;
    fontSize?: number;
    fontFamily?: string;
    isBold?: boolean;
    isItalic?: boolean;
    backgroundColor?: string;
    strokeWidth?: number;
    opacity?: number;
    rotation?: number;
    points?: {
        x: number;
        y: number;
    }[];
    shapeType?: 'rectangle' | 'circle' | 'line' | 'arrow';
    imageData?: string;
}
export interface ProcessedResult {
    success: boolean;
    blob?: Blob;
    dataUrl?: string;
    filename: string;
    outputFormat: FileFormat;
    originalSize: number;
    outputSize: number;
    reductionPercentage?: number;
    dimensions?: {
        width: number;
        height: number;
    };
    pages?: number;
    executionMode: ExecutionMode;
    error?: string;
    warning?: string;
}
export interface RecentActivityItem {
    id: string;
    toolName: string;
    actionSummary: string;
    fromFormat: string;
    toFormat: string;
    timestamp: number;
    mode: ExecutionMode;
    savedPercentage?: number;
}
