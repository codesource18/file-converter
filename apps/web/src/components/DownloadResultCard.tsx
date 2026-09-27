'use client';

import React, { useEffect } from 'react';
import { Download, RotateCcw, Sparkles, CheckCircle2, ShieldCheck, ArrowRight, Layers, FileCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useConverterStore } from '../store/converter-store';

export const DownloadResultCard: React.FC = () => {
  const { result, reset, setActiveView } = useConverterStore();

  useEffect(() => {
    if (result && result.success) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch {}
    }
  }, [result]);

  if (!result || !result.success) return null;

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDownload = () => {
    if (!result.blob) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-8 p-6 sm:p-8 bg-white/[0.08] backdrop-blur-2xl border border-white/20 rounded-3xl shadow-glass-lg text-center animate-in zoom-in-95 duration-300 select-none">
      
      {/* Success Badge */}
      <div className="mx-auto w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-bounce">
        <CheckCircle2 className="w-9 h-9" />
      </div>

      <h2 className="text-2xl font-extrabold text-white tracking-tight mb-1">
        Conversion Successful!
      </h2>
      <p className="text-xs text-slate-300 font-medium mb-6">
        Ready for instant download. 100% private in-browser transformation.
      </p>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-900/60 border border-white/10 mb-6 text-left backdrop-blur-md">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 block">Original Size</span>
          <span className="text-xs font-bold text-slate-200">{formatSize(result.originalSize)}</span>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-slate-400 block">Output Size</span>
          <span className="text-xs font-bold text-emerald-400">{formatSize(result.outputSize)}</span>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-slate-400 block">Output Format</span>
          <span className="text-xs font-bold text-cyan-300">{result.outputFormat}</span>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-slate-400 block">Mode</span>
          <span className="text-xs font-bold text-cyan-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            <span>Local</span>
          </span>
        </div>
      </div>

      {/* Primary Download Button */}
      <button
        onClick={handleDownload}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-base shadow-[0_0_25px_rgba(56,189,248,0.4)] transition-all duration-300 flex items-center justify-center gap-2 mb-3"
      >
        <Download className="w-5 h-5" />
        <span>Download {result.filename}</span>
      </button>

      {/* Secondary Actions */}
      <div className="flex items-center justify-center gap-4 text-xs font-bold text-slate-300 pt-2">
        <button
          onClick={reset}
          className="flex items-center gap-1.5 hover:text-cyan-300 transition text-slate-300"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Convert Another File</span>
        </button>

        <span className="text-slate-500">•</span>

        <button
          onClick={() => { reset(); setActiveView('workflow'); }}
          className="flex items-center gap-1.5 hover:text-cyan-300 transition text-slate-300"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Multi-Step Workflow</span>
        </button>
      </div>
    </div>
  );
};
