'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Search, Sparkles, ShieldCheck, Layers, ArrowRight } from 'lucide-react';
import { useConverterStore } from '../store/converter-store';

export const TopNav: React.FC = () => {
  const { 
    setIsSearchOpen, 
    activeView, 
    setActiveView, 
    setSelectedCategory, 
    theme,
    toggleTheme,
    reset 
  } = useConverterStore();

  const [activeTab, setActiveTab] = useState<'home' | 'tools' | 'privacy'>('home');

  const scrollToSection = (sectionId: string) => {
    if (activeView !== 'home') {
      setActiveView('home');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleNav = (target: 'home' | 'tools' | 'privacy') => {
    setActiveTab(target);
    if (target === 'home') {
      reset();
      setActiveView('home');
      setSelectedCategory('all');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (target === 'tools') {
      setIsSearchOpen(true);
    } else if (target === 'privacy') {
      scrollToSection('privacy-guide');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full py-3 px-4 md:px-8 flex items-center justify-between select-none">
      
      {/* Left spacer / Mobile brand icon */}
      <div className="flex items-center gap-3">
        <div 
          onClick={() => handleNav('home')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleNav('home');
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="File Converter home"
          className="md:hidden flex items-center gap-2 cursor-pointer p-1.5 pr-3 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] backdrop-blur-2xl border border-white/20 shadow-glass-sm transition-all duration-180 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0">
            <Image
              src="/brand/logo-icon.svg"
              alt="File Converter"
              width={32}
              height={32}
              className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(56,189,248,0.35)]"
              priority
            />
          </div>
          <span className="font-extrabold text-white text-xs tracking-tight">
            File Converter
          </span>
        </div>
      </div>

      {/* CENTER: Floating Liquid-Glass Curved Navigation Island */}
      <div className="relative mx-auto">
        {/* Liquid Glass Background Glow & Refraction */}
        <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-cyan-400/25 via-blue-500/25 to-indigo-400/25 blur-md pointer-events-none opacity-90" />

        <nav className="relative flex items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 glass-capsule-nav hover:shadow-glass-lg transition-all duration-300">
          
          {/* Home Button */}
          <button
            onClick={() => handleNav('home')}
            className={`relative px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
              activeTab === 'home' && activeView === 'home'
                ? 'text-cyan-200 bg-white/[0.14] shadow-glass-sm border border-cyan-400/40 font-bold'
                : 'text-slate-200 hover:text-white hover:bg-white/10'
            }`}
          >
            {activeTab === 'home' && activeView === 'home' && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            )}
            <span>Home</span>
          </button>

          {/* Tools with Liquid Badge */}
          <button
            onClick={() => handleNav('tools')}
            className={`group relative px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
              activeTab === 'tools'
                ? 'text-cyan-200 bg-white/[0.14] shadow-glass-sm border border-cyan-400/40 font-bold'
                : 'text-slate-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>Tools</span>
            <span className="text-[10px] bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold px-2 py-0.5 rounded-full shadow-xs group-hover:scale-105 transition-transform">
              All 26+
            </span>
          </button>

          {/* Privacy & Security */}
          <button
            onClick={() => handleNav('privacy')}
            className={`px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
              activeTab === 'privacy'
                ? 'text-cyan-200 bg-white/[0.14] shadow-glass-sm border border-cyan-400/40 font-bold'
                : 'text-slate-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Privacy &amp; Security</span>
          </button>

        </nav>
      </div>

      {/* Right: Quick Search Pill */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsSearchOpen(true)}
          className="hidden sm:flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/20 hover:border-cyan-400/50 text-slate-200 hover:text-white text-xs font-semibold shadow-glass-sm hover:shadow-glass-md transition-all group backdrop-blur-2xl"
        >
          <Search className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
          <span className="font-normal text-slate-300 group-hover:text-white">Search tools...</span>
          <kbd className="text-[10px] font-bold bg-white/15 text-white px-1.5 py-0.5 rounded-md border border-white/20 shadow-inner">
            ⌘K
          </kbd>
        </button>
      </div>

    </header>
  );
};
