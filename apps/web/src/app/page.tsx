'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Sidebar } from '../components/Sidebar';
import { TopNav } from '../components/TopNav';
import { DropZone } from '../components/DropZone';
import { Hero } from '../components/Hero';
import { PopularTools } from '../components/PopularTools';
import { PostDropView } from '../components/PostDropView';
import { ProgressIndicator } from '../components/ProgressIndicator';
import { DownloadResultCard } from '../components/DownloadResultCard';
import { PdfEditor } from '../components/PdfEditor';
import { BatchProcessingView } from '../components/BatchProcessingView';
import { WorkflowView } from '../components/WorkflowView';
import { OcrView } from '../components/OcrView';
import { QrGeneratorView } from '../components/QrGeneratorView';
import { SearchModal } from '../components/SearchModal';
import { RecentActivityModal } from '../components/RecentActivityModal';
import { AdSlot } from '../components/AdSlot';
import { useConverterStore } from '../store/converter-store';
import { executeTool } from '../lib/tool-executor';
import { ToolDefinition } from '@fileconverter/shared-types';
import { AlertCircle, X, Shield } from 'lucide-react';

export default function HomePage() {
  const {
    activeView,
    activeFile,
    activeMetadata,
    isProcessing,
    result,
    error,
    setError,
    setIsProcessing,
    setProgress,
    setResult,
    addRecentActivity,
    setActiveView
  } = useConverterStore();

  const handleExecuteTool = async (tool: ToolDefinition) => {
    if (!activeFile) return;

    if (tool.id === 'edit-pdf') {
      setActiveView('editor');
      return;
    }

    if (tool.id === 'ocr-pdf') {
      setActiveView('ocr');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress({ stage: 'preparing', percent: 10, message: `Starting ${tool.name}...` });

    try {
      const res = await executeTool(tool, activeFile, {}, (percent, msg) => {
        setProgress({ stage: 'converting', percent, message: msg });
      });

      setResult(res);
      addRecentActivity({
        toolName: tool.name,
        actionSummary: `Processed ${tool.name}`,
        fromFormat: activeMetadata?.format || 'File',
        toFormat: tool.outputFormats[0] || 'Converted',
        mode: res.executionMode,
        savedPercentage: res.reductionPercentage
      });
    } catch (err: any) {
      console.error('Execution error:', err);
      setError(err?.message || 'An error occurred during file processing.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative min-h-screen flex text-slate-100 selection:bg-blue-600/30 selection:text-white">
      {/* Left Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 z-10">
        
        {/* Top Navigation */}
        <TopNav />

        {/* Global Error Banner */}
        {error && (
          <div className="max-w-4xl mx-auto my-4 px-4 w-full">
            <div className="p-4 rounded-2xl bg-red-50/90 dark:bg-red-950/80 border border-red-200 dark:border-red-800 shadow-glass-sm flex items-center justify-between text-red-800 dark:text-red-200 text-xs font-semibold backdrop-blur-md">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Dynamic View Router */}
        <main className={`flex-1 ${activeView === 'editor' ? 'flex flex-col min-h-0' : 'pb-16'}`}>
          {activeView === 'editor' ? (
            <PdfEditor />
          ) : activeView === 'batch' ? (
            <BatchProcessingView />
          ) : activeView === 'workflow' ? (
            <WorkflowView />
          ) : activeView === 'ocr' ? (
            <OcrView />
          ) : activeView === 'qr' ? (
            <QrGeneratorView />
          ) : (
            <>
              {/* Converted Download Result */}
              {result && !isProcessing && (
                <>
                  <DownloadResultCard />
                  {/* Result Page Ad Slot (Min 48px whitespace from primary action buttons) */}
                  <div className="max-w-4xl mx-auto px-4 mt-12 mb-8">
                    <AdSlot
                      slotId="conversion-result-ad"
                      format="horizontal"
                      minHeight={90}
                      className="w-full"
                    />
                  </div>
                </>
              )}

              {/* Progress Bar / Spinner */}
              {isProcessing && <ProgressIndicator />}

              {/* Post-Drop Interactive Smart Matrix */}
              {!result && !isProcessing && activeMetadata && (
                <PostDropView onExecuteTool={handleExecuteTool} />
              )}

              {/* Dominant Center Drag & Drop Zone */}
              {!result && !isProcessing && !activeMetadata && (
                <>
                  <DropZone />
                  <Hero />
                  
                  {/* Homepage Slot 1: Primary Horizontal Ad (Between Privacy Cards & Popular Tools) */}
                  <div className="max-w-[970px] mx-auto px-4 mt-7 mb-8.5">
                    <AdSlot
                      slotId="home-primary-ad"
                      format="horizontal"
                      minHeight={90}
                      maxWidth={970}
                      className="w-full"
                    />
                  </div>
                </>
              )}

              {/* Popular Tools Grid */}
              {!result && !activeMetadata && <PopularTools />}

              {/* Homepage Slot 2: Between Popular Tools and Informative Content */}
              {!result && !activeMetadata && (
                <div className="max-w-5xl mx-auto px-4 my-8">
                  <AdSlot
                    slotId="home-tools-ad"
                    format="horizontal"
                    minHeight={90}
                    className="w-full"
                  />
                </div>
              )}

              {/* Privacy Guide & FAQ Anchor Section */}
              <section id="privacy-guide" className="max-w-5xl mx-auto px-4 mt-12 text-center select-none">
                <div className="p-8 rounded-3xl glass-panel-major">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 text-blue-300 text-xs font-bold mb-3 border border-blue-800/50">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Privacy-First Architecture</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-100 mb-2">
                    How We Protect Your Sensitive Documents
                  </h3>
                  <p className="text-xs text-slate-400 max-w-2xl mx-auto leading-relaxed mb-6">
                    Unlike traditional file converter websites that upload your personal contracts, photos, and scans to remote cloud servers, our engine operates directly inside your local web browser using WebAssembly and HTML5 Canvas.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                    <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/10 shadow-glass-sm backdrop-blur-xl">
                      <div className="font-bold text-xs text-slate-100 mb-1">Local Memory Sandbox</div>
                      <div className="text-[11px] text-slate-400">PDF and Image bytes are decoded into browser RAM and garbage collected immediately after download.</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/10 shadow-glass-sm backdrop-blur-xl">
                      <div className="font-bold text-xs text-slate-100 mb-1">Zero Accounts or Tracking</div>
                      <div className="text-[11px] text-slate-400">No passwords, no logins, no persistent databases storing document filenames or file content.</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/10 shadow-glass-sm backdrop-blur-xl">
                      <div className="font-bold text-xs text-slate-100 mb-1">Compatibility Fallback</div>
                      <div className="text-[11px] text-slate-400">When advanced conversion requires temporary backend processing, isolated sandboxes delete files immediately after delivery.</div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Footer Ad Slot */}
              <div className="max-w-5xl mx-auto px-4 mt-12 mb-4">
                <AdSlot
                  slotId="footer-ad"
                  format="horizontal"
                  minHeight={90}
                  className="w-full"
                />
              </div>

              {/* Footer */}
              <footer className="mt-8 py-8 border-t border-white/10 flex flex-col items-center justify-center gap-3 text-center">
                <div className="flex items-center gap-2.5 opacity-90 hover:opacity-100 transition-opacity">
                  <Image
                    src="/brand/logo-horizontal.svg"
                    alt="File Converter"
                    width={200}
                    height={50}
                    className="h-9 w-auto object-contain drop-shadow-[0_0_12px_rgba(56,189,248,0.25)]"
                  />
                </div>
                <p className="text-xs text-slate-400">
                  &copy; 2026 File Converter &bull; Your Files. Your Browser. Nothing Stored. &bull; Developed by Rynex
                </p>
              </footer>
            </>
          )}
        </main>
      </div>

      {/* Ultra-Wide Desktop Right Rail (Only on monitors >= 1700px, 0 impact on laptop/tablet/mobile) */}
      <aside className="hidden min-[1700px]:flex flex-col w-[320px] p-4 shrink-0 sticky top-20 h-fit z-20">
        <AdSlot
          slotId="desktop-right-rail-ad"
          format="vertical"
          minHeight={600}
          maxWidth={300}
          className="w-full"
          label="Advertisement"
        />
      </aside>

      {/* Global Modals */}
      <SearchModal />
      <RecentActivityModal />
    </div>
  );
}
