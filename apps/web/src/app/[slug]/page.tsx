'use client';

import React from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { getToolBySlug, ALL_TOOLS } from '@fileconverter/file-detection';
import { Sidebar } from '../../components/Sidebar';
import { TopNav } from '../../components/TopNav';
import { DropZone } from '../../components/DropZone';
import { PostDropView } from '../../components/PostDropView';
import { ProgressIndicator } from '../../components/ProgressIndicator';
import { DownloadResultCard } from '../../components/DownloadResultCard';
import { PdfEditor } from '../../components/PdfEditor';
import { OcrView } from '../../components/OcrView';
import { SearchModal } from '../../components/SearchModal';
import { RecentActivityModal } from '../../components/RecentActivityModal';
import { AdSlot } from '../../components/AdSlot';
import { useConverterStore } from '../../store/converter-store';
import { executeTool } from '../../lib/tool-executor';
import { ToolDefinition } from '@fileconverter/shared-types';
import { Sparkles, ShieldCheck, HelpCircle, ArrowRight } from 'lucide-react';

export default function ToolSeoPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const tool = getToolBySlug(slug) || ALL_TOOLS[0];

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

  const handleExecuteTool = async (t: ToolDefinition) => {
    if (!activeFile) return;

    if (t.id === 'edit-pdf') {
      setActiveView('editor');
      return;
    }
    if (t.id === 'ocr-pdf') {
      setActiveView('ocr');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress({ stage: 'preparing', percent: 15, message: `Starting ${t.name}...` });

    try {
      const res = await executeTool(t, activeFile, {}, (percent, msg) => {
        setProgress({ stage: 'converting', percent, message: msg });
      });

      setResult(res);
      addRecentActivity({
        toolName: t.name,
        actionSummary: `Processed ${t.name}`,
        fromFormat: activeMetadata?.format || 'File',
        toFormat: t.outputFormats[0] || 'Converted',
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

  const relatedTools = ALL_TOOLS.filter(
    (t) => t.id !== tool.id && (t.category === tool.category || t.inputFormats.some(f => tool.inputFormats.includes(f)))
  ).slice(0, 4);

  return (
    <div className="relative min-h-screen flex text-slate-100 selection:bg-blue-600/30 selection:text-white">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0 z-10">
        <TopNav />

        <main className={`flex-1 ${activeView === 'editor' || tool.id === 'edit-pdf' ? 'flex flex-col min-h-0' : 'pb-16'}`}>
          {activeView === 'editor' || tool.id === 'edit-pdf' ? (
            <PdfEditor />
          ) : activeView === 'ocr' || tool.id === 'ocr-pdf' ? (
            <OcrView />
          ) : (
            <>
              {/* Tool SEO Header */}
              <div className="text-center pt-8 pb-4 px-4 max-w-4xl mx-auto select-none">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 text-blue-300 text-xs font-bold mb-3 border border-blue-800/50">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Free In-Browser Tool • 100% Private</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-extrabold text-slate-100 tracking-tight mb-3">
                  {tool.name}
                </h1>
                <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto">
                  {tool.description}
                </p>
              </div>

              {/* Functional Drop Zone & Conversion UI */}
              {isProcessing && <ProgressIndicator />}
              {result && !isProcessing && (
                <>
                  <DownloadResultCard />
                  {/* Tool Result Ad Slot (Min 48px whitespace from action buttons) */}
                  <div className="max-w-4xl mx-auto px-4 mt-12 mb-8">
                    <AdSlot
                      slotId="tool-result-ad"
                      format="horizontal"
                      minHeight={90}
                      className="w-full"
                    />
                  </div>
                </>
              )}
              {!result && !isProcessing && activeMetadata && (
                <PostDropView onExecuteTool={handleExecuteTool} />
              )}
              {!result && !isProcessing && !activeMetadata && <DropZone />}

              {/* Tool Details & FAQ Section */}
              <div className="max-w-4xl mx-auto px-4 mt-12 space-y-8 select-none">
                {/* Explanation Card */}
                {tool.explanation && (
                  <div className="p-6 rounded-3xl bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-glass-sm">
                    <h3 className="text-base font-bold text-slate-100 mb-2">
                      About {tool.name}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {tool.explanation}
                    </p>
                  </div>
                )}

                {/* Related Tools */}
                {relatedTools.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
                      Related Tools
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      {relatedTools.map((rel) => (
                        <div
                          key={rel.id}
                          onClick={() => router.push(`/${rel.slug}`)}
                          className="p-4 rounded-2xl bg-slate-900/40 hover:bg-slate-900/80 border border-white/10 hover:border-cyan-400/40 shadow-glass-sm hover:shadow-glass-md transition cursor-pointer group backdrop-blur-xl"
                        >
                          <div className="font-bold text-xs text-slate-100 group-hover:text-cyan-400 transition">
                            {rel.name}
                          </div>
                          <div className="text-[10px] text-slate-400 line-clamp-1 mt-1">
                            {rel.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* FAQ */}
                {tool.faq && tool.faq.length > 0 && (
                  <div className="p-6 rounded-3xl bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-glass-sm">
                    <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-cyan-400" />
                      <span>Frequently Asked Questions</span>
                    </h3>
                    <div className="space-y-4">
                      {tool.faq.map((item, idx) => (
                        <div key={idx} className="border-b border-white/10 pb-3 last:border-0 last:pb-0">
                          <h4 className="text-xs font-bold text-slate-100 mb-1">{item.q}</h4>
                          <p className="text-xs text-slate-400 leading-relaxed">{item.a}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Tool Page Footer Ad Slot */}
              <div className="max-w-4xl mx-auto px-4 mt-12 mb-6">
                <AdSlot
                  slotId="tool-footer-ad"
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

      {/* Global Modals */}
      <SearchModal />
      <RecentActivityModal />
    </div>
  );
}
