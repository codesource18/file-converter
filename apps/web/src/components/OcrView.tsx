'use client';

import React, { useState } from 'react';
import { ScanText, Download, ArrowLeft, Sparkles, Copy, Check, FileText } from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { useConverterStore } from '../store/converter-store';

export const OcrView: React.FC = () => {
  const { activeFile, setActiveView, addRecentActivity } = useConverterStore();
  
  const [selectedLang, setSelectedLang] = useState('eng');
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [extractedText, setExtractedText] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const handleStartOcr = async () => {
    if (!activeFile) return;
    setIsOcrProcessing(true);
    setOcrProgress(10);

    try {
      // Initialize Tesseract.js WebAssembly worker
      const worker = await createWorker(selectedLang, 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100));
          }
        }
      });

      const ret = await worker.recognize(activeFile);
      setExtractedText(ret.data.text);
      await worker.terminate();

      addRecentActivity({
        toolName: 'OCR Text Recognition',
        actionSummary: `Extracted ${ret.data.text.length} characters of text`,
        fromFormat: 'Scan',
        toFormat: 'TXT',
        mode: 'local'
      });
    } catch (err: any) {
      console.error('OCR Error:', err);
      setExtractedText(`OCR recognition fallback: ${err?.message || 'Could not process image characters.'}`);
    } finally {
      setIsOcrProcessing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(extractedText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extracted_text.txt';
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
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <ScanText className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-slate-700">WebAssembly In-Browser OCR</span>
        </div>
      </div>

      {/* Control Card */}
      <div className="bg-white/80 backdrop-blur-glass border border-white/90 rounded-3xl p-6 shadow-glass-md mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <span>Extract Text from Document</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">100% Local</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Recognizes printed typography directly in your browser without cloud uploads.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
            >
              <option value="eng">English</option>
              <option value="spa">Spanish</option>
              <option value="fra">French</option>
              <option value="deu">German</option>
              <option value="ita">Italian</option>
            </select>

            <button
              onClick={handleStartOcr}
              disabled={isOcrProcessing || !activeFile}
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-glass-sm transition flex items-center justify-center gap-1.5"
            >
              <ScanText className="w-4 h-4" />
              <span>{isOcrProcessing ? `Recognizing (${ocrProgress}%)...` : 'Run OCR'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Extracted Text Result Box */}
      <div className="bg-white/80 backdrop-blur-glass border border-white/90 rounded-3xl p-6 shadow-glass-md">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Extracted Text Output
          </span>
          {extractedText && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Copied!' : 'Copy Text'}</span>
              </button>

              <button
                onClick={handleDownloadTxt}
                className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-glass-sm transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save .TXT</span>
              </button>
            </div>
          )}
        </div>

        <textarea
          value={extractedText}
          readOnly
          placeholder={isOcrProcessing ? "Recognizing document text in browser memory..." : "Extracted text will appear here after clicking 'Run OCR'..."}
          className="w-full h-80 p-4 bg-slate-50/80 border border-slate-200 rounded-2xl text-slate-800 text-sm font-mono focus:outline-none resize-none leading-relaxed"
        />
      </div>

    </div>
  );
};
