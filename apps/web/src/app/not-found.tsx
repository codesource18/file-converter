'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Home, Sparkles } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen text-slate-100 bg-transparent flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="p-8 md:p-12 rounded-3xl glass-panel-major border border-white/20 shadow-glass-lg max-w-md w-full space-y-6 animate-in zoom-in-95 duration-300">
        <div className="w-16 h-16 rounded-3xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center mx-auto shadow-glass-sm">
          <Image
            src="/brand/logo-icon.svg"
            alt="File Converter"
            width={40}
            height={40}
            className="w-10 h-10 object-contain drop-shadow-[0_0_12px_rgba(56,189,248,0.4)]"
          />
        </div>

        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">404</h1>
          <h2 className="text-lg font-bold text-slate-200 mt-1">Page Not Found</h2>
          <p className="text-xs text-slate-400 mt-2">
            The conversion tool or page you requested could not be found.
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Link
            href="/"
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white text-xs font-bold shadow-glass-sm transition flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Return to File Converter</span>
          </Link>
          <Link
            href="/tools"
            className="w-full py-3 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] text-slate-200 text-xs font-bold border border-white/10 transition flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Explore All 26+ Tools</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
