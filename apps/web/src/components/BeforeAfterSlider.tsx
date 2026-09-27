'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeftRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface BeforeAfterSliderProps {
  originalUrl: string;
  compressedUrl: string;
  originalSize: number;
  compressedSize: number;
  format: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  originalUrl,
  compressedUrl,
  originalSize,
  compressedSize,
  format
}) => {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const formatSize = (b: number) => {
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(2)} MB`;
  };

  const reduction = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100));

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    setSliderPos((x / rect.width) * 100);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) handleMove(e.touches[0].clientX);
  };

  return (
    <div className="w-full bg-white/70 backdrop-blur-glass border border-white/80 rounded-3xl p-6 shadow-glass-md select-none my-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <h3 className="font-bold text-slate-800 text-sm">Visual Before &amp; After Comparison</h3>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
            {reduction}% smaller
          </span>
        </div>
      </div>

      {/* Comparison Split Area */}
      <div
        ref={containerRef}
        onMouseMove={(e) => isDragging && handleMove(e.clientX)}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onTouchMove={handleTouchMove}
        className="relative w-full aspect-[16/10] max-h-[420px] rounded-2xl overflow-hidden border border-slate-200 cursor-ew-resize bg-slate-900"
      >
        {/* Compressed / Optimized Image (Right Background) */}
        <img
          src={compressedUrl}
          alt="Optimized"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />

        {/* Original Image (Left Clipped Overlay) */}
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ width: `${sliderPos}%` }}
        >
          <img
            src={originalUrl}
            alt="Original"
            className="absolute inset-0 w-full h-full object-contain max-w-none"
            style={{ width: containerRef.current?.offsetWidth }}
          />
        </div>

        {/* Draggable Divider Bar */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10 pointer-events-none"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-glass-md flex items-center justify-center text-blue-600 border border-slate-200">
            <ArrowLeftRight className="w-4 h-4" />
          </div>
        </div>

        {/* Labels */}
        <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold pointer-events-none">
          Original: {formatSize(originalSize)}
        </div>
        <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-blue-600/80 backdrop-blur-md text-white text-[11px] font-semibold pointer-events-none">
          Optimized: {formatSize(compressedSize)}
        </div>
      </div>
    </div>
  );
};
