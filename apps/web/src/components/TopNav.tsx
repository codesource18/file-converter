'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Search, 
  Menu, 
  X, 
  FileText, 
  Image as ImageIcon, 
  RefreshCw, 
  Minimize2, 
  PenTool, 
  QrCode, 
  Clock, 
  Layers, 
  ShieldCheck, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useConverterStore } from '../store/converter-store';

export const TopNav: React.FC = () => {
  const { 
    setIsSearchOpen, 
    activeView, 
    setActiveView, 
    selectedCategory,
    setSelectedCategory, 
    setIsRecentOpen,
    reset 
  } = useConverterStore();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNav = (target: 'home' | 'tools' | 'editor' | 'qr', category?: string) => {
    setIsMobileMenuOpen(false);
    if (target === 'home') {
      reset();
      setActiveView('home');
      setSelectedCategory(category || 'all');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (target === 'tools') {
      setIsSearchOpen(true);
    } else if (target === 'editor') {
      setActiveView('editor');
    } else if (target === 'qr') {
      setActiveView('qr');
    }
  };

  const mobileNavItems = [
    { label: 'All Tools / Home', icon: Layers, action: () => handleNav('home', 'all'), active: activeView === 'home' && selectedCategory === 'all' },
    { label: 'PDF Suite', icon: FileText, action: () => handleNav('home', 'pdf'), active: activeView === 'home' && selectedCategory === 'pdf' },
    { label: 'Image Tools', icon: ImageIcon, action: () => handleNav('home', 'image'), active: activeView === 'home' && selectedCategory === 'image' },
    { label: 'Format Converters', icon: RefreshCw, action: () => handleNav('home', 'convert'), active: activeView === 'home' && selectedCategory === 'convert' },
    { label: 'Smart Compression', icon: Minimize2, action: () => handleNav('home', 'compress'), active: activeView === 'home' && selectedCategory === 'compress' },
    { label: 'Edit PDF', icon: PenTool, action: () => handleNav('editor'), active: activeView === 'editor' },
    { label: 'QR Generator', icon: QrCode, action: () => handleNav('qr'), active: activeView === 'qr' },
    { label: 'Recent Activity', icon: Clock, action: () => { setIsMobileMenuOpen(false); setIsRecentOpen(true); }, active: false },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full px-3 sm:px-6 py-2.5 sm:py-3 select-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 px-3 sm:px-5 py-2 rounded-2xl sm:rounded-full bg-[rgba(10,20,32,0.88)] backdrop-blur-[18px] border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
          
          {/* Brand Logo & Name */}
          <div 
            onClick={() => handleNav('home', 'all')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleNav('home', 'all');
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="File Converter Home"
            className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0 group focus:outline-none"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0">
              <Image
                src="/brand/logo-icon.svg"
                alt="File Converter"
                width={36}
                height={36}
                className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(56,189,248,0.35)] group-hover:scale-105 transition-transform"
                priority
              />
            </div>
            <span className="font-extrabold text-white text-sm sm:text-base tracking-tight truncate">
              File Converter
            </span>
          </div>

          {/* Unified Center Navigation Items */}
          <nav className="flex items-center gap-1 sm:gap-2">
            
            {/* Home Button */}
            <button
              onClick={() => handleNav('home', 'all')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                activeView === 'home' && selectedCategory === 'all'
                  ? 'text-cyan-300 bg-white/10 shadow-xs border border-cyan-400/40 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-white/10 border border-transparent'
              }`}
            >
              {activeView === 'home' && selectedCategory === 'all' && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              )}
              <span>Home</span>
            </button>

            {/* Tools Button */}
            <button
              onClick={() => handleNav('tools')}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/10 border border-transparent transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tools</span>
            </button>

          </nav>

          {/* Right Action Area */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Desktop Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 hover:border-cyan-400/40 text-slate-300 hover:text-white text-xs font-medium transition-all group backdrop-blur-xl"
              aria-label="Search tools"
            >
              <Search className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>Search...</span>
              <kbd className="text-[10px] font-bold bg-white/15 text-slate-200 px-1.5 py-0.5 rounded border border-white/15">
                ⌘K
              </kbd>
            </button>

            {/* Mobile Search Icon Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="sm:hidden w-9 h-9 rounded-xl flex items-center justify-center bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-cyan-300 transition-colors"
              aria-label="Search tools"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-slate-200 hover:text-white transition-colors"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4 text-cyan-400" /> : <Menu className="w-4 h-4" />}
            </button>

          </div>

        </div>
      </header>

      {/* Mobile Slide-Over Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-[300px] ml-auto h-full bg-[rgba(12,22,34,0.96)] backdrop-blur-2xl border-l border-white/15 shadow-2xl p-5 flex flex-col justify-between overflow-y-auto">
            
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Image
                    src="/brand/logo-icon.svg"
                    alt="File Converter"
                    width={28}
                    height={28}
                    className="w-7 h-7 object-contain"
                  />
                  <span className="font-extrabold text-white text-sm">File Converter</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/10 text-slate-300 hover:text-white"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Items */}
              <div className="py-4 space-y-1">
                {mobileNavItems.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={item.action}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        item.active
                          ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 font-bold'
                          : 'text-slate-300 hover:text-white hover:bg-white/10 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${item.active ? 'text-cyan-400' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drawer Footer with Links */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 px-2">
                <Link 
                  href="/privacy" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:text-cyan-300 transition-colors"
                >
                  Privacy Policy
                </Link>
                <Link 
                  href="/terms" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:text-cyan-300 transition-colors"
                >
                  Terms
                </Link>
                <Link 
                  href="/about" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:text-cyan-300 transition-colors"
                >
                  About
                </Link>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.06] border border-white/10 text-[11px] text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>100% Private in browser memory</span>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
