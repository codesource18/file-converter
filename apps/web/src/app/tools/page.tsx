'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ALL_TOOLS } from '@fileconverter/file-detection';
import { 
  FileText, 
  Image as ImageIcon, 
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
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Search
} from 'lucide-react';
import { AdSlot } from '../../components/AdSlot';

export default function ToolsDirectoryPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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

  const categories = [
    { id: 'all', label: 'All Tools' },
    { id: 'pdf', label: 'PDF Suite' },
    { id: 'image', label: 'Image Tools' },
    { id: 'convert', label: 'Convert' },
    { id: 'compress', label: 'Compress' },
    { id: 'security', label: 'Security' },
  ];

  const filteredTools = ALL_TOOLS.filter((tool) => {
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    const matchesSearch = tool.name.toLowerCase().includes(search.toLowerCase()) ||
                          tool.description.toLowerCase().includes(search.toLowerCase()) ||
                          tool.inputFormats.some(f => f.toLowerCase().includes(search.toLowerCase())) ||
                          tool.outputFormats.some(f => f.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen text-slate-100 bg-transparent flex flex-col justify-between select-none">
      {/* Header */}
      <header className="py-4 px-6 md:px-12 flex items-center justify-between border-b border-white/10 backdrop-blur-xl bg-black/40 sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/brand/logo-icon.svg"
            alt="File Converter"
            width={36}
            height={36}
            className="w-9 h-9 object-contain drop-shadow-[0_0_10px_rgba(56,189,248,0.35)]"
          />
          <span className="font-extrabold text-white text-base tracking-tight">File Converter</span>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-xs font-bold text-slate-200 border border-white/20 transition backdrop-blur-xl"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12 flex-1 w-full">
        
        {/* Title and Search */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-4">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            Universal Tools Directory
          </h1>
          <p className="text-xs md:text-sm text-slate-300">
            Explore all 26+ fast, private in-browser document, image, and PDF conversion utilities.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-md mx-auto pt-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 mt-1" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tools, formats (e.g. PDF, PNG, WebP)..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/[0.08] backdrop-blur-2xl border border-white/20 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-cyan-400 shadow-glass-sm"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  selectedCategory === c.id
                    ? 'bg-cyan-500 text-black shadow-glass-sm'
                    : 'bg-white/[0.08] text-slate-300 hover:bg-white/[0.14] border border-white/10'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTools.map((tool) => {
            const Icon = getToolIcon(tool.icon);
            return (
              <Link
                key={tool.id}
                href={`/${tool.slug}`}
                className="group p-5 rounded-3xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/20 hover:border-cyan-400/50 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between shadow-glass-sm hover:shadow-glass-md"
              >
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 mb-3 group-hover:scale-105 group-hover:bg-cyan-500 group-hover:text-black transition-all">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white text-base group-hover:text-cyan-300 transition-colors">
                    {tool.name}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                    {tool.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 mt-3 border-t border-white/10 text-xs font-semibold text-cyan-400 group-hover:text-cyan-300">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                    {tool.inputFormats.join(', ')} &rarr; {tool.outputFormats.join(', ')}
                  </span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Directory Footer Ad Slot */}
        <div className="mt-12 mb-4">
          <AdSlot
            slotId="tools-directory-footer-ad"
            format="horizontal"
            minHeight={90}
            className="w-full"
          />
        </div>

      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-white/10 text-center">
        <p className="text-xs text-slate-400">
          &copy; 2026 File Converter &bull; Your Files. Your Browser. Nothing Stored. &bull; Developed by Rynex
        </p>
      </footer>
    </div>
  );
}
