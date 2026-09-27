'use client';

import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, FileUp, Sparkles, AlertCircle } from 'lucide-react';
import { inspectFile, getSmartRecommendations } from '@fileconverter/file-detection';
import { useConverterStore } from '../store/converter-store';

export const DropZone: React.FC = () => {
  const { 
    setFiles, 
    setActiveFile, 
    setActiveMetadata, 
    setRecommendations,
    setIsProcessing,
    setProgress,
    setError 
  } = useConverterStore();

  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedFormats = [
    'PDF', 'JPG', 'JPEG', 'PNG', 'WebP', 'AVIF', 
    'HEIC', 'HEIF', 'TIFF', 'BMP', 'GIF', 'SVG', 'ICO'
  ];

  const handleFiles = useCallback(async (selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles);
    if (fileArray.length === 0) return;

    setError(null);
    setFiles(fileArray);

    const primaryFile = fileArray[0];
    setActiveFile(primaryFile);

    try {
      setProgress({ stage: 'inspecting', percent: 20, message: 'Inspecting file signature & magic bytes...' });
      const metadata = await inspectFile(primaryFile);
      setActiveMetadata(metadata);

      const recs = getSmartRecommendations(metadata);
      setRecommendations(recs);
      setProgress({ stage: 'ready', percent: 100, message: 'File inspected' });
    } catch (err: any) {
      console.error('File inspection error:', err);
      setError(err?.message || 'Failed to inspect file format.');
    }
  }, [setFiles, setActiveFile, setActiveMetadata, setRecommendations, setProgress, setError]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 my-4">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleInputChange}
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.webp,.avif,.heic,.heif,.tiff,.tif,.bmp,.gif,.svg,.ico"
      />

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleBrowseClick}
        className={`relative group glass-workspace-suspended p-8 md:p-12 text-center cursor-pointer transition-all duration-300 ${
          isDragOver
            ? 'scale-[1.01] ring-4 ring-cyan-400/40 shadow-glass-glow'
            : 'hover:scale-[1.005]'
        }`}
      >
        {/* Inner Dashed Frame */}
        <div className={`absolute inset-4 md:inset-5 rounded-[22px] border-[1.5px] border-dashed transition-all duration-300 pointer-events-none ${
          isDragOver ? 'border-cyan-400 bg-cyan-500/10' : 'border-white/20 group-hover:border-cyan-400/50'
        }`} />

        {/* Central Icon */}
        <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-400 via-sky-400 to-blue-500 p-[1.5px] shadow-glass-md mb-6 group-hover:scale-110 transition-transform duration-300">
          <div className="w-full h-full bg-white/10 rounded-[22px] flex items-center justify-center backdrop-blur-xl border border-white/20">
            <UploadCloud className="w-10 h-10 text-cyan-300 animate-bounce" />
          </div>
        </div>

        {/* Main Title & Subtitle */}
        <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2">
          Drop any file here
        </h2>
        <p className="text-sm md:text-base text-slate-200 font-medium mb-6">
          or <span className="text-cyan-400 font-bold underline underline-offset-4 decoration-cyan-400/60 group-hover:decoration-cyan-400">Choose Files</span> from your device
        </p>

        {/* Format Tag Badges */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-xl mx-auto pt-2 relative z-10">
          {supportedFormats.map((fmt) => (
            <span
              key={fmt}
              className="px-2.5 py-1 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/20 shadow-glass-sm group-hover:border-cyan-400/50 transition-colors backdrop-blur-xl"
            >
              {fmt}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
