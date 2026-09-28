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
  Film
} from 'lucide-react';
import { useConverterStore } from '../store/converter-store';
import { ALL_TOOLS } from '@fileconverter/file-detection';
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
      case 'pdf': return 'Merge, split, edit, compress, and convert PDF documents';
      case 'image': return 'Convert, resize, crop, compress, and strip metadata';
      case 'convert': return 'Instant transformations between all supported file formats';
      case 'compress': return 'Reduce file sizes with target byte limits';
      default: return 'Quick access to top browser converters';
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
    { id: 'all', label: 'All' },
    { id: 'pdf', label: 'PDF' },
    { id: 'image', label: 'Image' },
    { id: 'convert', label: 'Convert' },
    { id: 'compress', label: 'Compress' },
  ];

  return (
    <section className="max-w-5xl mx-auto px-3 sm:px-4 my-6 sm:my-10 select-none">
      
      {/* Category Header & Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5 pb-3 border-b border-white/10">
        <div>
          <h2 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>{getCategoryTitle()}</span>
            <span className="text-xs bg-cyan-500/20 text-cyan-300 font-bold px-2 py-0.5 rounded-full border border-cyan-400/30">
              {filteredTools.length}
            </span>
          </h2>
          <p className="text-xs text-slate-300 font-normal mt-0.5">
            {getCategorySubtitle()}
          </p>
        </div>

        {/* Scrollable Filter Pills on Mobile */}
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-white/[0.08] backdrop-blur-xl border border-white/15 shadow-xs overflow-x-auto no-scrollbar shrink-0 max-w-full">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === c.id
                  ? 'bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Responsive Grid: 1 col on <390px, 2 col on 390px-640px, 3 col on tablet, 4 col on desktop */}
      <div className="grid grid-cols-1 min-[390px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {filteredTools.map((tool) => {
          const Icon = getToolIcon(tool.icon);
          return (
            <div
              key={tool.id}
              onClick={() => handleOpenTool(tool)}
              className="group glass-card-tool rounded-2xl sm:rounded-3xl p-3.5 sm:p-4.5 cursor-pointer flex flex-col justify-between min-h-[110px] sm:min-h-[130px]"
            >
              <div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 p-[1.5px] shadow-xs mb-2.5 group-hover:scale-105 transition-transform">
                  <div className="w-full h-full bg-slate-950/90 rounded-[10px] flex items-center justify-center text-cyan-300 group-hover:bg-cyan-500 group-hover:text-black transition-colors">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>

                <h3 className="font-bold text-white text-xs sm:text-sm group-hover:text-cyan-300 transition-colors leading-tight">
                  {tool.name}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-300 mt-1 line-clamp-2 leading-snug font-normal">
                  {tool.description}
                </p>
              </div>

              <div className="pt-2.5 mt-2 border-t border-white/10 flex items-center justify-between text-[11px] sm:text-xs font-semibold text-cyan-400 group-hover:text-cyan-300">
                <span>Launch</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

    </section>
  );
};
