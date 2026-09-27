'use client';

import React, { useState } from 'react';
import { ArrowRight, Sparkles, ArrowLeft, Download, Play, CheckCircle2, RotateCw, Maximize2, Minimize2, ShieldCheck, FileText } from 'lucide-react';
import { convertImageLocally } from '@fileconverter/conversion-core';
import { ProcessedResult, FileFormat } from '@fileconverter/shared-types';
import { useConverterStore } from '../store/converter-store';

export const WorkflowView: React.FC = () => {
  const { activeFile, setActiveView, setResult, addRecentActivity } = useConverterStore();

  const [resizeWidth, setResizeWidth] = useState<number>(1200);
  const [outputFormat, setOutputFormat] = useState<FileFormat>('WebP');
  const [targetSizeKb, setTargetSizeKb] = useState<number>(300);
  const [stripMetadata, setStripMetadata] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState<number>(0);

  if (!activeFile) return null;

  const steps = [
    { num: 1, name: 'Resize to Width', desc: `${resizeWidth}px (Auto Aspect Ratio)` },
    { num: 2, name: 'Convert Format', desc: `Convert to ${outputFormat}` },
    { num: 3, name: 'Target Compress', desc: `Under ${targetSizeKb} KB` },
    { num: 4, name: 'Sanitize Metadata', desc: stripMetadata ? 'Strip EXIF & GPS' : 'Keep original' }
  ];

  const handleExecuteWorkflow = async () => {
    setIsProcessing(true);
    setProgressStep(1);

    try {
      // Step 1: Resize & Step 2: Convert & Step 3: Compress with target size
      setProgressStep(2);
      const res = await convertImageLocally(
        activeFile,
        activeFile.name,
        {
          width: resizeWidth,
          maintainAspectRatio: true,
          outputFormat,
          targetSizeKb: targetSizeKb > 0 ? targetSizeKb : undefined,
          removeMetadata: stripMetadata
        },
        (percent) => {
          if (percent > 60) setProgressStep(3);
          if (percent > 85) setProgressStep(4);
        }
      );

      setResult(res);
      addRecentActivity({
        toolName: 'Multi-Step Workflow',
        actionSummary: `Chained 4 optimizations (${outputFormat}, ${resizeWidth}px, <${targetSizeKb}KB)`,
        fromFormat: 'Raw',
        toFormat: outputFormat,
        mode: 'local',
        savedPercentage: res.reductionPercentage
      });
      setActiveView('home');
    } catch (err) {
      console.error('Workflow error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 my-6 select-none animate-in fade-in duration-200">
      
      {/* Top Back */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setActiveView('home')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/70 hover:bg-white text-slate-700 text-xs font-bold shadow-glass-sm border border-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-slate-700">Multi-Step Pipeline Workflow</span>
        </div>
      </div>

      {/* Main Workflow Builder */}
      <div className="bg-white/80 backdrop-blur-glass border border-white/90 rounded-3xl p-6 shadow-glass-md mb-6">
        <h3 className="text-lg font-bold text-slate-800 mb-1">Chain Multiple Operations</h3>
        <p className="text-xs text-slate-500 mb-6">Process everything sequentially in memory without uploading files again.</p>

        {/* Visual Pipeline Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-8 relative">
          {steps.map((st, i) => (
            <div
              key={st.num}
              className={`p-3.5 rounded-2xl border text-center transition-all ${
                progressStep >= st.num
                  ? 'bg-blue-50/90 border-blue-400 text-blue-900 shadow-glass-sm'
                  : 'bg-white/70 border-slate-200 text-slate-700'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold mx-auto mb-1.5 flex items-center justify-center">
                {st.num}
              </div>
              <div className="font-bold text-xs">{st.name}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{st.desc}</div>
            </div>
          ))}
        </div>

        {/* Pipeline Configuration Inputs */}
        <div className="space-y-4 border-t border-slate-100 pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Step 1: Target Width (px)</label>
              <input
                type="number"
                value={resizeWidth}
                onChange={(e) => setResizeWidth(parseInt(e.target.value) || 800)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Step 2: Output Format</label>
              <select
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value as FileFormat)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
              >
                <option value="WebP">WebP (Optimized Web)</option>
                <option value="JPEG">JPEG (Universal)</option>
                <option value="PNG">PNG (Lossless)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Step 3: Max File Size (KB)</label>
              <input
                type="number"
                value={targetSizeKb}
                onChange={(e) => setTargetSizeKb(parseInt(e.target.value) || 500)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Step 4: Privacy Clean</label>
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stripMetadata}
                  onChange={(e) => setStripMetadata(e.target.checked)}
                  className="rounded text-blue-600 accent-blue-600 w-4 h-4"
                />
                <span className="text-xs text-slate-600 font-medium">Strip EXIF &amp; GPS coordinates</span>
              </label>
            </div>
          </div>
        </div>

        {/* Execute Pipeline */}
        <button
          onClick={handleExecuteWorkflow}
          disabled={isProcessing}
          className="w-full mt-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm shadow-glass-sm flex items-center justify-center gap-2 transition"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>{isProcessing ? 'Executing Pipeline...' : 'Run 4-Step Workflow'}</span>
        </button>
      </div>

    </div>
  );
};
