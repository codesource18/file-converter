'use client';

import React, { useState } from 'react';
import { Minimize2, Sparkles, ArrowRight, Gauge, CheckCircle2 } from 'lucide-react';
import { convertImageLocally } from '@fileconverter/conversion-core';
import { ProcessedResult } from '@fileconverter/shared-types';
import { useConverterStore } from '../store/converter-store';

export const TargetSizeCompressor: React.FC = () => {
  const { activeFile, setResult, setIsProcessing, setProgress, addRecentActivity } = useConverterStore();
  const [selectedTargetKb, setSelectedTargetKb] = useState<number>(500);
  const [customKb, setCustomKb] = useState<string>('');

  if (!activeFile) return null;

  const presets = [
    { label: '100 KB', value: 100 },
    { label: '200 KB', value: 200 },
    { label: '500 KB', value: 500 },
    { label: '1 MB', value: 1024 },
    { label: '2 MB', value: 2048 },
    { label: '5 MB', value: 5120 },
  ];

  const handleRunCompression = async () => {
    const targetKb = customKb ? parseInt(customKb) : selectedTargetKb;
    if (!targetKb || targetKb <= 0) return;

    setIsProcessing(true);
    setProgress({ stage: 'optimizing', percent: 20, message: `Targeting size under ${targetKb} KB...` });

    try {
      const res = await convertImageLocally(
        activeFile,
        activeFile.name,
        {
          outputFormat: 'JPEG',
          targetSizeKb: targetKb
        },
        (percent, msg) => setProgress({ stage: 'optimizing', percent, message: msg })
      );

      setResult(res);
      addRecentActivity({
        toolName: 'Target Size Compressor',
        actionSummary: `Compressed to ${(res.outputSize / 1024).toFixed(1)} KB (Target: ${targetKb} KB)`,
        fromFormat: 'Image',
        toFormat: 'JPEG',
        mode: 'local',
        savedPercentage: res.reductionPercentage
      });
    } catch (err: any) {
      console.error('Target compression error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const originalKb = Math.round(activeFile.size / 1024);

  return (
    <div className="w-full max-w-xl mx-auto bg-white/80 backdrop-blur-glass border border-white/90 rounded-3xl p-6 shadow-glass-md my-6 select-none">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
          <Gauge className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-base">Smart Target File Size</h3>
          <p className="text-xs text-slate-500">Automatically adjust quality to fit under exact byte limit</p>
        </div>
      </div>

      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 mb-5 flex items-center justify-between">
        <span className="text-xs text-slate-500 font-medium">Original File Size:</span>
        <span className="text-xs font-bold text-slate-800">{originalKb > 1024 ? `${(originalKb / 1024).toFixed(2)} MB` : `${originalKb} KB`}</span>
      </div>

      {/* Target Size Presets */}
      <div className="mb-4">
        <label className="text-xs font-bold text-slate-700 block mb-2">Select Target Size:</label>
        <div className="grid grid-cols-3 gap-2">
          {presets.map((p) => (
            <button
              key={p.value}
              onClick={() => { setSelectedTargetKb(p.value); setCustomKb(''); }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition border ${
                selectedTargetKb === p.value && !customKb
                  ? 'bg-blue-600 text-white border-blue-600 shadow-glass-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Size Input */}
      <div className="mb-6">
        <label className="text-xs font-bold text-slate-700 block mb-1.5">Or Custom Target (KB):</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={customKb}
            onChange={(e) => setCustomKb(e.target.value)}
            placeholder="e.g. 750"
            className="flex-1 px-4 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-blue-500 text-xs font-bold text-slate-800"
          />
          <span className="text-xs font-semibold text-slate-400">KB</span>
        </div>
      </div>

      {/* Execute Button */}
      <button
        onClick={handleRunCompression}
        className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-glass-sm hover:shadow-glass-md transition flex items-center justify-center gap-2"
      >
        <Minimize2 className="w-4 h-4" />
        <span>Compress to Target Size</span>
      </button>
    </div>
  );
};
