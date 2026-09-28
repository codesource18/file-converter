'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sidebar } from '../components/Sidebar';
import { TopNav } from '../components/TopNav';
import { DropZone } from '../components/DropZone';
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
import { AlertCircle, X } from 'lucide-react';

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
      {/* Desktop Left Sidebar */}
      <div className="hidden md:block shrink-0">
        <Sidebar />
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 z-10">
        
        {/* Unified Top Navigation */}
        <TopNav />

        {/* Global Error Banner */}
        {error && (
          <div className="max-w-4xl mx-auto my-3 px-3 sm:px-4 w-full">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-red-950/80 border border-red-800/80 shadow-xs flex items-center justify-between text-red-200 text-xs font-semibold backdrop-blur-md">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className="p-1 rounded-lg hover:bg-red-900/60 text-red-400"
                aria-label="Dismiss error"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Dynamic View Router */}
        <main className={`flex-1 ${activeView === 'editor' ? 'flex flex-col min-h-0' : 'pb-12'}`}>
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
                  <div className="max-w-4xl mx-auto px-3 sm:px-4 mt-12 mb-6">
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

              {/* Dominant First-Viewport Drag & Drop Zone */}
              {!result && !isProcessing && !activeMetadata && (
                <>
                  <DropZone />
                  
                  {/* Homepage Slot 1: Primary Horizontal Ad (Between Dropzone & Popular Tools) */}
                  <div className="max-w-[970px] mx-auto px-3 sm:px-4 my-4 sm:my-6">
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

              {/* Homepage Slot 2: Between Popular Tools & Footer */}
              {!result && !activeMetadata && (
                <div className="max-w-5xl mx-auto px-3 sm:px-4 my-6">
                  <AdSlot
                    slotId="home-tools-ad"
                    format="horizontal"
                    minHeight={90}
                    className="w-full"
                  />
                </div>
              )}

              {/* Footer Ad Slot */}
              <div className="max-w-5xl mx-auto px-3 sm:px-4 mt-8 mb-4">
                <AdSlot
                  slotId="footer-ad"
                  format="horizontal"
                  minHeight={90}
                  className="w-full"
                />
              </div>

              {/* Footer */}
              <footer className="mt-8 py-8 border-t border-white/10 flex flex-col items-center justify-center gap-3 text-center px-4">
                <div className="flex items-center gap-2.5 opacity-90 hover:opacity-100 transition-opacity">
                  <Image
                    src="/brand/logo-horizontal.svg"
                    alt="File Converter"
                    width={180}
                    height={45}
                    className="h-8 sm:h-9 w-auto object-contain drop-shadow-[0_0_12px_rgba(56,189,248,0.25)]"
                  />
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <Link href="/privacy" className="hover:text-cyan-300 transition-colors">Privacy Policy</Link>
                  <span>&bull;</span>
                  <Link href="/terms" className="hover:text-cyan-300 transition-colors">Terms of Service</Link>
                  <span>&bull;</span>
                  <Link href="/about" className="hover:text-cyan-300 transition-colors">About</Link>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500">
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
          className="w-full"
        />
      </aside>

      {/* Global Modals */}
      <SearchModal />
      <RecentActivityModal />
    </div>
  );
}
