'use client';

import React from 'react';
import Image from 'next/image';
import { 
  FileText, 
  Image as ImageIcon, 
  RefreshCw, 
  Minimize2, 
  PenTool, 
  QrCode, 
  Clock, 
  Layers, 
  ShieldCheck 
} from 'lucide-react';
import { useConverterStore } from '../store/converter-store';

interface SidebarProps {
  onNavigateCategory?: (category: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNavigateCategory }) => {
  const { 
    activeView, 
    setActiveView, 
    selectedCategory, 
    setSelectedCategory, 
    setIsRecentOpen,
    reset 
  } = useConverterStore();

  const handleNav = (id: string, view: 'home' | 'editor' | 'ocr' | 'qr' = 'home') => {
    setSelectedCategory(id);
    setActiveView(view);
    if (view === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (onNavigateCategory) onNavigateCategory(id);
  };

  const navItems = [
    { id: 'all', label: 'Home', icon: Layers, view: 'home' as const },
    { id: 'pdf', label: 'PDF', icon: FileText, view: 'home' as const },
    { id: 'image', label: 'Image', icon: ImageIcon, view: 'home' as const },
    { id: 'convert', label: 'Convert', icon: RefreshCw, view: 'home' as const },
    { id: 'compress', label: 'Compress', icon: Minimize2, view: 'home' as const },
    { id: 'edit-pdf', label: 'Edit PDF', icon: PenTool, view: 'editor' as const },
    { id: 'qr', label: 'QR Generator', icon: QrCode, view: 'qr' as const },
  ];

  return (
    <aside className="w-64 h-screen sticky top-0 flex flex-col justify-between p-4 select-none z-30">
      
      {/* Floating Liquid-Glass Sidebar Panel */}
      <div className="w-full h-full glass-rail-sidebar flex flex-col p-3.5 justify-between">
        
        {/* Brand Header with Canonical File Converter Logo */}
        <div 
          onClick={() => { reset(); handleNav('all'); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              reset();
              handleNav('all');
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="File Converter home"
          className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/20 cursor-pointer shadow-glass-sm transition-all duration-180 ease-out hover:scale-[1.02] hover:-translate-y-[1px] group backdrop-blur-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
        >
          {/* Liquid Glass Document & Orbital Conversion Arrows Logo */}
          <div className="relative w-[42px] h-[42px] lg:w-[46px] lg:h-[46px] shrink-0 flex items-center justify-center">
            <Image
              src="/brand/logo-icon.svg"
              alt="File Converter"
              width={46}
              height={46}
              className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(56,189,248,0.35)] group-hover:scale-105 transition-transform duration-180 ease-out"
              priority
            />
          </div>

          <div className="overflow-hidden min-w-0 flex flex-col justify-center">
            <h1 className="font-extrabold text-white text-[16px] tracking-tight truncate leading-tight">
              File Converter
            </h1>
          </div>
        </div>

        {/* Centered Navigation Menu List */}
        <nav className="my-auto py-2 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = 
              (item.view === 'editor' && activeView === 'editor') ||
              (item.view === 'qr' && activeView === 'qr') ||
              (item.view === 'home' && activeView === 'home' && selectedCategory === item.id);

            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id, item.view)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? 'bg-cyan-500/25 border border-cyan-400/50 text-cyan-200 shadow-glass-sm backdrop-blur-xl font-bold'
                    : 'text-slate-200 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/15'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-cyan-300' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                )}
              </button>
            );
          })}

          {/* Separator */}
          <div className="py-1 px-3">
            <div className="h-px bg-white/15" />
          </div>

          {/* Recent Session Activity Item */}
          <button
            onClick={() => setIsRecentOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/10 transition-all duration-300 border border-transparent hover:border-white/15"
          >
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Recent</span>
          </button>
        </nav>

        {/* Privacy Guarantee Badge at bottom */}
        <div className="p-3 rounded-2xl bg-white/[0.08] border border-white/20 shadow-glass-sm backdrop-blur-2xl">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold text-white">100% Private</span>
          </div>
          <p className="text-[10px] text-slate-300 leading-snug">
            All transformations occur locally in your browser memory.
          </p>
        </div>

      </div>
    </aside>
  );
};
