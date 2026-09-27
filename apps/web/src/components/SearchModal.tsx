'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, FileText, Image as ImageIcon, Sparkles, PenTool, Layers, Minimize2 } from 'lucide-react';
import { ALL_TOOLS } from '@fileconverter/file-detection';
import { ToolDefinition } from '@fileconverter/shared-types';
import { useConverterStore } from '../store/converter-store';

export const SearchModal: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen, setActiveTool, setActiveView } = useConverterStore();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isSearchOpen]);

  if (!isSearchOpen) return null;

  const filteredTools = ALL_TOOLS.filter((tool) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      tool.name.toLowerCase().includes(q) ||
      tool.description.toLowerCase().includes(q) ||
      tool.inputFormats.some((f) => f.toLowerCase().includes(q)) ||
      tool.outputFormats.some((f) => f.toLowerCase().includes(q)) ||
      tool.category.toLowerCase().includes(q)
    );
  });

  const handleSelectTool = (tool: ToolDefinition) => {
    setActiveTool(tool);
    setIsSearchOpen(false);
    if (tool.id === 'edit-pdf') {
      setActiveView('editor');
    } else if (tool.id === 'ocr-pdf') {
      setActiveView('ocr');
    } else {
      setActiveView('home');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-white/85 dark:bg-slate-900/90 backdrop-blur-heavy border border-white/90 dark:border-white/15 rounded-3xl shadow-glass-lg overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200/60 dark:border-slate-800/60">
          <Search className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools, e.g. merge PDF, resize image, heic, word..."
            className="flex-1 bg-transparent text-slate-800 dark:text-slate-100 text-base placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
          />
          <button
            onClick={() => setIsSearchOpen(false)}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
          {filteredTools.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
              No matching tools found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filteredTools.map((tool) => (
              <div
                key={tool.id}
                onClick={() => handleSelectTool(tool)}
                className="group flex items-center justify-between p-3.5 rounded-2xl hover:bg-white/90 dark:hover:bg-slate-800/90 border border-transparent hover:border-blue-100/80 dark:hover:border-blue-500/30 cursor-pointer transition-all hover:shadow-glass-sm"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50/80 dark:bg-blue-950/60 border border-blue-100/50 dark:border-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                      {tool.name}
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        {tool.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {tool.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    Open <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Search Footer */}
        <div className="px-5 py-3 bg-slate-50/70 dark:bg-slate-900/70 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
          <span>Tip: Press ESC to close</span>
          <span>{filteredTools.length} tools available</span>
        </div>
      </div>
    </div>
  );
};
