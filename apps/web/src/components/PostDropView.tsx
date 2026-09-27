'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  Trash2, 
  ShieldCheck, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  PenTool, 
  Minimize2, 
  Layers, 
  Scissors, 
  ScanText, 
  RotateCw, 
  Lock, 
  Stamp, 
  Maximize2, 
  Crop, 
  Film,
  Layers as LayersIcon
} from 'lucide-react';
import { ToolDefinition } from '@fileconverter/shared-types';
import { useConverterStore } from '../store/converter-store';

interface PostDropViewProps {
  onExecuteTool: (tool: ToolDefinition) => void;
}

export const PostDropView: React.FC<PostDropViewProps> = ({ onExecuteTool }) => {
  const { 
    activeFile, 
    activeMetadata, 
    recommendations, 
    reset, 
    files, 
    setActiveView 
  } = useConverterStore();

  const [showAllOptions, setShowAllOptions] = useState(false);

  if (!activeFile || !activeMetadata || !recommendations) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getToolIcon = (iconName: string) => {
    switch (iconName) {
      case 'FileText': return FileText;
      case 'Image': return ImageIcon;
      case 'PenTool': return PenTool;
      case 'Minimize2': return Minimize2;
      case 'Layers': return Layers;
      case 'Scissors': return Scissors;
      case 'ScanText': return ScanText;
      case 'RotateCw': return RotateCw;
      case 'Lock': return Lock;
      case 'Stamp': return Stamp;
      case 'Maximize2': return Maximize2;
      case 'Crop': return Crop;
      case 'Film': return Film;
      default: return Sparkles;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 my-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT PANEL: File Metadata & Inspection Card */}
        <div className="lg:col-span-4 bg-white/[0.08] backdrop-blur-2xl border border-white/20 rounded-3xl p-6 shadow-glass-md sticky top-24">
          <div className="flex items-center justify-between pb-4 border-b border-white/15 mb-5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                File Inspected
              </span>
            </div>
            <button
              onClick={reset}
              className="p-1.5 rounded-xl hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition-colors"
              title="Remove file"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Large Format Icon */}
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-400 via-sky-400 to-blue-600 p-[1.5px] shadow-glass-sm shrink-0">
              <div className="w-full h-full bg-slate-900/80 rounded-[14px] flex items-center justify-center backdrop-blur-md">
                {activeMetadata.format === 'PDF' ? (
                  <FileText className="w-7 h-7 text-cyan-300" />
                ) : (
                  <ImageIcon className="w-7 h-7 text-cyan-300" />
                )}
              </div>
            </div>

            <div className="overflow-hidden">
              <h3 className="font-bold text-white text-sm truncate" title={activeFile.name}>
                {activeFile.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  {activeMetadata.format}
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  {formatFileSize(activeMetadata.size)}
                </span>
              </div>
            </div>
          </div>

          {/* Metadata Details */}
          <div className="space-y-2 py-3 border-t border-b border-white/15 mb-5 text-xs text-slate-300">
            {activeMetadata.width && activeMetadata.height && (
              <div className="flex justify-between">
                <span className="text-slate-400">Dimensions:</span>
                <span className="font-semibold text-white">{activeMetadata.width} × {activeMetadata.height} px</span>
              </div>
            )}
            {activeMetadata.pages && (
              <div className="flex justify-between">
                <span className="text-slate-400">Pages:</span>
                <span className="font-semibold text-white">{activeMetadata.pages} pages</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">MIME Type:</span>
              <span className="font-mono text-[11px] truncate max-w-[150px] text-slate-200">{activeMetadata.mimeType}</span>
            </div>
            {activeMetadata.hasGps && (
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-200 text-[11px] font-medium flex items-center gap-1.5 mt-2 border border-amber-400/30">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>GPS Location Tag detected</span>
              </div>
            )}
            {activeMetadata.isEncrypted && (
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-200 text-[11px] font-medium flex items-center gap-1.5 mt-2 border border-purple-400/30">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>Password Protected Document</span>
              </div>
            )}
          </div>

          {/* Multi-file batch notification */}
          {files.length > 1 && (
            <div className="mb-5 p-3 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-between">
              <span className="text-xs font-semibold text-cyan-200">
                {files.length} files queued
              </span>
              <button
                onClick={() => setActiveView('batch')}
                className="text-xs font-bold text-cyan-300 hover:text-white underline"
              >
                Open Batch View
              </button>
            </div>
          )}

          {/* Privacy Indicator Badge */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-400/30">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-200">
                Processed Locally
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              This operation executes entirely in your browser memory. Your file never leaves your device.
            </p>
          </div>
        </div>

        {/* RIGHT PANEL: Smart Actions & 3 Major Recommendations */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Header Message */}
          <div className="bg-white/[0.08] backdrop-blur-2xl border border-white/20 rounded-3xl p-6 shadow-glass-sm">
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>{activeMetadata.format} detected</span>
              <span className="text-slate-300 font-normal text-base">— choose what you want to do</span>
            </h2>
          </div>

          {/* TOP THREE LARGE GLASS CONVERSION CARDS */}
          <div>
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 px-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Recommended Conversions</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendations.primaryTools.map((tool) => {
                const Icon = getToolIcon(tool.icon);
                return (
                  <div
                    key={tool.id}
                    onClick={() => onExecuteTool(tool)}
                    className="group relative bg-white/[0.08] hover:bg-white/[0.14] backdrop-blur-2xl border border-white/20 hover:border-cyan-400/50 rounded-3xl p-5 shadow-glass-sm hover:shadow-glass-md cursor-pointer transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
                  >
                    <div className="mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-400 to-blue-600 p-[1.5px] shadow-glass-sm mb-3 group-hover:scale-105 transition-transform">
                        <div className="w-full h-full bg-slate-900/80 rounded-[14px] flex items-center justify-center text-cyan-300 group-hover:bg-cyan-500 group-hover:text-black transition-colors backdrop-blur-md">
                          <Icon className="w-6 h-6" />
                        </div>
                      </div>
                      <h4 className="font-bold text-white text-base group-hover:text-cyan-300 transition-colors">
                        {tool.name}
                      </h4>
                      <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                        {tool.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs font-semibold text-cyan-400 group-hover:text-cyan-300">
                      <span>Start Convert</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECONDARY SMART ACTIONS */}
          {recommendations.secondaryTools.length > 0 && (
            <div>
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 px-1">
                Smart options for this {activeMetadata.format}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {recommendations.secondaryTools.slice(0, 6).map((tool) => {
                  const Icon = getToolIcon(tool.icon);
                  return (
                    <button
                      key={tool.id}
                      onClick={() => onExecuteTool(tool)}
                      className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/20 hover:border-cyan-400/40 text-left shadow-glass-sm hover:shadow-glass-md transition-all group backdrop-blur-2xl"
                    >
                      <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 group-hover:bg-cyan-500 group-hover:text-black transition-colors shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-semibold text-white text-xs truncate group-hover:text-cyan-300 transition-colors">
                          {tool.name}
                        </div>
                        <div className="text-[10px] text-slate-400 capitalize">
                          {tool.category}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* "See all compatible options" EXPANDER */}
          <div className="pt-2">
            <button
              onClick={() => setShowAllOptions(!showAllOptions)}
              className="w-full py-3 px-4 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/20 text-white text-xs font-bold shadow-glass-sm transition-all text-center hover:text-cyan-300 backdrop-blur-2xl"
            >
              {showAllOptions ? 'Hide compatible options' : 'See all compatible options'}
            </button>

            {showAllOptions && (
              <div className="mt-4 p-4 rounded-3xl bg-white/[0.08] backdrop-blur-2xl border border-white/20 grid grid-cols-2 sm:grid-cols-3 gap-2.5 animate-in fade-in duration-200">
                {recommendations.allCompatibleTools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => onExecuteTool(tool)}
                    className="p-3 rounded-xl bg-white/[0.06] hover:bg-cyan-500/20 text-left border border-white/10 hover:border-cyan-400/40 transition text-xs font-medium text-slate-200 hover:text-white"
                  >
                    {tool.name}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
