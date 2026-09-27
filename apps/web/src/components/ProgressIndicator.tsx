'use client';

import React from 'react';
import { Sparkles, Cpu } from 'lucide-react';
import { useConverterStore } from '../store/converter-store';

export const ProgressIndicator: React.FC = () => {
  const { isProcessing, progress } = useConverterStore();

  if (!isProcessing) return null;

  return (
    <div className="w-full max-w-md mx-auto my-8 p-6 bg-white/85 backdrop-blur-glass border border-white/90 rounded-3xl shadow-glass-md text-center animate-in zoom-in-95 duration-200">
      
      {/* Animated Liquid Icon */}
      <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-sky-400 p-0.5 shadow-glass-sm mb-4">
        <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-blue-600">
          <Cpu className="w-6 h-6 animate-spin" />
        </div>
      </div>

      <h4 className="font-bold text-slate-800 text-sm mb-1 capitalize">
        {progress.stage}...
      </h4>
      <p className="text-xs text-slate-500 font-medium mb-4">
        {progress.message || 'Processing in browser memory...'}
      </p>

      {/* Liquid Progress Bar */}
      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60 shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-500 rounded-full transition-all duration-300 shadow-glass-sm"
          style={{ width: `${Math.max(5, progress.percent)}%` }}
        />
      </div>

      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mt-2 px-1">
        <span>Local Worker Engine</span>
        <span>{progress.percent}%</span>
      </div>
    </div>
  );
};
