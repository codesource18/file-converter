'use client';

import React, { useEffect } from 'react';
import { DropZone } from './DropZone';
import { PostDropView } from './PostDropView';
import { ProgressIndicator } from './ProgressIndicator';
import { DownloadResultCard } from './DownloadResultCard';
import { PdfEditor } from './PdfEditor';
import { OcrView } from './OcrView';
import { AdSlot } from './AdSlot';
import { useConverterStore } from '../store/converter-store';
import { executeTool } from '../lib/tool-executor';
import { ToolDefinition } from '@fileconverter/shared-types';
import { AlertCircle, X } from 'lucide-react';

interface ToolClientViewProps {
  tool: ToolDefinition;
}

export const ToolClientView: React.FC<ToolClientViewProps> = ({ tool }) => {
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
    setActiveView,
    setActiveTool
  } = useConverterStore();

  useEffect(() => {
    setActiveTool(tool);
    if (tool.id === 'edit-pdf') {
      setActiveView('editor');
    } else if (tool.id === 'ocr-pdf') {
      setActiveView('ocr');
    }
  }, [tool, setActiveTool, setActiveView]);

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

  if (activeView === 'editor' || tool.id === 'edit-pdf') {
    return (
      <div className="w-full flex-1 flex flex-col min-h-0">
        <PdfEditor />
      </div>
    );
  }

  if (activeView === 'ocr' || tool.id === 'ocr-pdf') {
    return (
      <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-6">
        <OcrView />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Error Alert */}
      {error && (
        <div className="max-w-4xl mx-auto my-3 px-3 sm:px-4 w-full">
          <div className="p-3.5 rounded-2xl bg-red-950/80 border border-red-800/80 shadow-xs flex items-center justify-between text-red-200 text-xs font-semibold backdrop-blur-md">
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

      {/* Conversion States */}
      {isProcessing && <ProgressIndicator />}

      {result && !isProcessing && (
        <div className="w-full">
          <DownloadResultCard />
          <div className="max-w-4xl mx-auto px-3 sm:px-4 mt-12 mb-6">
            <AdSlot
              slotId="tool-result-ad"
              format="horizontal"
              minHeight={90}
              className="w-full"
            />
          </div>
        </div>
      )}

      {!result && !isProcessing && activeMetadata && (
        <PostDropView onExecuteTool={handleExecuteTool} />
      )}

      {!result && !isProcessing && !activeMetadata && (
        <DropZone />
      )}
    </div>
  );
};
