'use client';

import React, { useState } from 'react';
import { Layers, Download, CheckCircle2, AlertCircle, ArrowLeft, RefreshCw, FileText, Image as ImageIcon, Archive } from 'lucide-react';
import { packageBatchToZip, convertImageLocally, imagesToSinglePdf } from '@fileconverter/conversion-core';
import { ProcessedResult, FileFormat } from '@fileconverter/shared-types';
import { useConverterStore } from '../store/converter-store';

export const BatchProcessingView: React.FC = () => {
  const { files, setActiveView, addRecentActivity } = useConverterStore();
  
  const [outputFormat, setOutputFormat] = useState<FileFormat>('WebP');
  const [batchMode, setBatchMode] = useState<'individual' | 'combine-pdf'>('individual');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{ name: string; result?: ProcessedResult; error?: string }[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);

  const startBatchConversion = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setOverallProgress(0);

    if (batchMode === 'combine-pdf') {
      try {
        const fileList = files.map(f => ({ file: f, name: f.name }));
        const res = await imagesToSinglePdf(fileList, (percent) => setOverallProgress(percent));
        setResults([{ name: 'combined-images.pdf', result: res }]);
        addRecentActivity({
          toolName: 'Batch Images to PDF',
          actionSummary: `Combined ${files.length} images into 1 PDF`,
          fromFormat: 'Images',
          toFormat: 'PDF',
          mode: 'local'
        });
      } catch (err: any) {
        setResults([{ name: 'combined-images.pdf', error: err?.message || 'Failed' }]);
      }
      setIsProcessing(false);
      return;
    }

    const itemResults: { name: string; result?: ProcessedResult; error?: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setOverallProgress(Math.round(((i + 1) / files.length) * 100));

      try {
        const res = await convertImageLocally(file, file.name, { outputFormat });
        itemResults.push({ name: file.name, result: res });
      } catch (err: any) {
        itemResults.push({ name: file.name, error: err?.message || 'Conversion failed' });
      }
    }

    setResults(itemResults);
    setIsProcessing(false);
    addRecentActivity({
      toolName: 'Batch Image Convert',
      actionSummary: `Batch converted ${files.length} files to ${outputFormat}`,
      fromFormat: 'Batch',
      toFormat: outputFormat,
      mode: 'local'
    });
  };

  const handleDownloadZip = async () => {
    const validResults = results.map(r => r.result).filter((r): r is ProcessedResult => !!r);
    if (validResults.length === 0) return;
    const zipBlob = await packageBatchToZip(validResults, 'converted-batch.zip');
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted-batch.zip';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSingle = (res: ProcessedResult) => {
    if (!res.blob) return;
    const url = URL.createObjectURL(res.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = res.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 my-6 select-none animate-in fade-in duration-200">
      
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setActiveView('home')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/70 hover:bg-white text-slate-700 text-xs font-bold shadow-glass-sm border border-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Drop Zone</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-700">
            Batch Mode ({files.length} Files)
          </span>
        </div>
      </div>

      {/* Control Card */}
      <div className="bg-white/80 backdrop-blur-glass border border-white/90 rounded-3xl p-6 shadow-glass-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">Select Target Format:</label>
            <div className="flex flex-wrap gap-2">
              {(['WebP', 'JPEG', 'PNG', 'PDF'] as FileFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setOutputFormat(fmt)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
                    outputFormat === fmt
                      ? 'bg-blue-600 text-white border-blue-600 shadow-glass-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-blue-200'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">Packaging Mode:</label>
            <div className="flex gap-2">
              <button
                onClick={() => setBatchMode('individual')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition border ${
                  batchMode === 'individual'
                    ? 'bg-blue-50 border-blue-400 text-blue-700'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                Individual Files
              </button>
              <button
                onClick={() => setBatchMode('combine-pdf')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition border ${
                  batchMode === 'combine-pdf'
                    ? 'bg-blue-50 border-blue-400 text-blue-700'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                Combine into 1 PDF
              </button>
            </div>
          </div>
        </div>

        {/* Start Batch Button */}
        <button
          onClick={startBatchConversion}
          disabled={isProcessing}
          className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm shadow-glass-sm flex items-center justify-center gap-2 transition"
        >
          <Layers className="w-4 h-4" />
          <span>{isProcessing ? `Processing (${overallProgress}%)...` : `Start Batch Conversion (${files.length} files)`}</span>
        </button>
      </div>

      {/* Results & File List */}
      <div className="bg-white/70 backdrop-blur-glass border border-white/80 rounded-3xl p-6 shadow-glass-md">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Files in Queue
          </span>
          {results.some(r => !!r.result) && (
            <button
              onClick={handleDownloadZip}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-glass-sm transition"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Download All (ZIP)</span>
            </button>
          )}
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {files.map((f, idx) => {
            const resItem = results.find(r => r.name === f.name);
            return (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-2xl bg-white/80 border border-slate-100 shadow-glass-sm"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-slate-800 truncate max-w-xs">{f.name}</div>
                    <div className="text-[10px] text-slate-400">{(f.size / 1024).toFixed(1)} KB</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {resItem?.result ? (
                    <button
                      onClick={() => handleDownloadSingle(resItem.result!)}
                      className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                  ) : resItem?.error ? (
                    <span className="text-xs text-red-500 font-semibold">{resItem.error}</span>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">Pending</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
