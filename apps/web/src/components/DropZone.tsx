'use client';

import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, FileUp, Sparkles, ShieldCheck } from 'lucide-react';
import { inspectFile, getSmartRecommendations } from '@fileconverter/file-detection';
import { useConverterStore } from '../store/converter-store';

export const DropZone: React.FC = () => {
  const { 
    setFiles, 
    setActiveFile, 
    setActiveMetadata, 
    setRecommendations,
    setProgress,
    setError 
  } = useConverterStore();

  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedFormats = [
    'PDF', 'JPG', 'PNG', 'WebP', 'AVIF', 
    'HEIC', 'TIFF', 'BMP', 'GIF', 'SVG', 'ICO'
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
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 my-2 sm:my-4">
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
        className={`relative group glass-workspace-suspended p-6 sm:p-10 text-center cursor-pointer transition-all duration-200 ${
          isDragOver
            ? 'scale-[1.01] ring-4 ring-cyan-400/50 shadow-glass-glow'
            : 'hover:scale-[1.005]'
        }`}
      >
        {/* Inner Dashed Frame */}
        <div className={`absolute inset-3 sm:inset-5 rounded-[20px] sm:rounded-[22px] border-[1.5px] border-dashed transition-all duration-200 pointer-events-none ${
          isDragOver ? 'border-cyan-400 bg-cyan-500/10' : 'border-white/20 group-hover:border-cyan-400/50'
        }`} />

        {/* Central Icon */}
        <div className="relative mx-auto w-14 h-14 sm:w-18 sm:h-18 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-cyan-400 via-sky-400 to-blue-500 p-[1.5px] shadow-glass-md mb-4 sm:mb-5 group-hover:scale-105 transition-transform duration-200">
          <div className="w-full h-full bg-slate-950/80 rounded-[14px] sm:rounded-[22px] flex items-center justify-center backdrop-blur-xl border border-white/20">
            <UploadCloud className="w-7 h-7 sm:w-9 sm:h-9 text-cyan-300" />
          </div>
        </div>

        {/* Main Title */}
        <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight mb-2 sm:mb-3">
          Drop any file here
        </h2>
        
        {/* CTA Button */}
        <div className="mb-5 sm:mb-6">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleBrowseClick();
            }}
            className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 sm:px-8 py-2.5 rounded-full bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 text-sm sm:text-base font-bold shadow-[0_4px_20px_rgba(6,182,212,0.35)] transition-all cursor-pointer"
          >
            <FileUp className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
            <span>Choose Files</span>
          </button>
        </div>

        {/* Format Tag Badges */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-lg mx-auto relative z-10">
          {supportedFormats.map((fmt) => (
            <span
              key={fmt}
              className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15 shadow-xs transition-colors backdrop-blur-md"
            >
              {fmt}
            </span>
          ))}
        </div>

        {/* Understated Privacy Note */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-center gap-1.5 text-[11px] sm:text-xs text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Processed locally when supported. Nothing permanently stored.</span>
        </div>

      </div>
    </div>
  );
};
