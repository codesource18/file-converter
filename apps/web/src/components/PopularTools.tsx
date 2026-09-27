'use client';

import React from 'react';
import { 
  PenTool, 
  Layers, 
  Scissors, 
  Minimize2, 
  Image as ImageIcon, 
  Maximize2, 
  Crop, 
  ScanText, 
  ArrowRight, 
  Sparkles,
  FileText,
  ShieldCheck,
  RotateCw,
  Stamp,
  Lock,
  FileUp,
  RefreshCw,
  Film
} from 'lucide-react';
import { useConverterStore } from '../store/converter-store';
import { ALL_TOOLS, getToolById } from '@fileconverter/file-detection';
import { ToolDefinition } from '@fileconverter/shared-types';

export const PopularTools: React.FC = () => {
  const { 
    setActiveTool, 
    setActiveView, 
    selectedCategory, 
    setSelectedCategory 
  } = useConverterStore();

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
      case 'FileUp': return FileUp;
      case 'ShieldCheck': return ShieldCheck;
      default: return Sparkles;
    }
  };

  const getCategoryTitle = () => {
    switch (selectedCategory) {
      case 'pdf': return 'PDF Tools';
      case 'image': return 'Image Tools';
      case 'convert': return 'Format Converters';
      case 'compress': return 'Compression Tools';
      default: return 'Popular Tools';
    }
  };

  const getCategorySubtitle = () => {
    switch (selectedCategory) {
      case 'pdf': return 'Merge, split, edit, compress, watermark, and convert PDF documents';
      case 'image': return 'Convert, resize, crop, compress, and strip metadata from images';
      case 'convert': return 'Fast, lossless transformations between all supported file formats';
      case 'compress': return 'Reduce file sizes with target byte limits and smart optimization';
      default: return 'Quick access to the most frequently used browser converters';
    }
  };

  // Filter tools based on selected category
  const filteredTools: ToolDefinition[] = React.useMemo(() => {
    if (selectedCategory === 'pdf') {
      return ALL_TOOLS.filter(t => t.inputFormats.includes('PDF') || t.outputFormats.includes('PDF'));
    }
    if (selectedCategory === 'image') {
      const imageFormats = ['JPEG', 'PNG', 'WebP', 'AVIF', 'HEIC', 'HEIF', 'TIFF', 'BMP', 'GIF', 'SVG', 'ICO'];
      return ALL_TOOLS.filter(t => t.inputFormats.some(f => imageFormats.includes(f)));
    }
    if (selectedCategory === 'convert') {
      return ALL_TOOLS.filter(t => t.category === 'convert');
    }
    if (selectedCategory === 'compress') {
      return ALL_TOOLS.filter(t => t.category === 'compress' || t.capabilities.includes('target-size'));
    }
    // Default popular highlight subset
    const popularIds = [
      'edit-pdf', 'merge-pdf', 'split-pdf', 'compress-pdf',
      'compress-image', 'resize-image', 'crop-image', 'ocr-pdf',
      'pdf-to-word', 'pdf-to-jpg', 'jpg-to-png', 'heic-to-jpg'
    ];
    return ALL_TOOLS.filter(t => popularIds.includes(t.id));
  }, [selectedCategory]);

  const handleOpenTool = (tool: ToolDefinition) => {
    setActiveTool(tool);
    if (tool.id === 'edit-pdf') {
      setActiveView('editor');
    } else if (tool.id === 'ocr-pdf') {
      setActiveView('ocr');
    } else {
      // Scroll to drop zone
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const categories = [
    { id: 'all', label: 'All Tools' },
    { id: 'pdf', label: 'PDF' },
    { id: 'image', label: 'Image' },
    { id: 'convert', label: 'Convert' },
    { id: 'compress', label: 'Compress' },
  ];

  return (
    <section className="max-w-5xl mx-auto px-4 my-12 select-none">
      
      {/* Category Header & Liquid Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-4 border-b border-white/15">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>{getCategoryTitle()}</span>
            <span className="text-xs bg-cyan-500/20 text-cyan-300 font-bold px-2.5 py-0.5 rounded-full border border-cyan-400/30">
              {filteredTools.length}
            </span>
          </h2>
          <p className="text-xs text-slate-300 font-medium mt-1">
            {getCategorySubtitle()}
          </p>
        </div>

        {/* Liquid Glass Filter Pills */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-white/[0.08] backdrop-blur-2xl border border-white/20 shadow-glass-sm shrink-0">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
                selectedCategory === c.id
                  ? 'bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 shadow-xs font-bold'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Centered Liquid-Glass Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTools.map((tool) => {
          const Icon = getToolIcon(tool.icon);
          return (
            <div
              key={tool.id}
              onClick={() => handleOpenTool(tool)}
              className="group glass-card-tool rounded-3xl p-5 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-400 to-blue-600 p-[1.5px] shadow-glass-sm mb-3.5 group-hover:scale-105 transition-transform">
                  <div className="w-full h-full bg-slate-900/80 rounded-[14px] flex items-center justify-center text-cyan-300 group-hover:bg-cyan-500 group-hover:text-black transition-colors backdrop-blur-md">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                <h3 className="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors">
                  {tool.name}
                </h3>
                <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed font-normal">
                  {tool.description}
                </p>
              </div>

              <div className="pt-3.5 mt-3 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-cyan-400 group-hover:text-cyan-300">
                <span>Launch Tool</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

    </section>
  );
};
