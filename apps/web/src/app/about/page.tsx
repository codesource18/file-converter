'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, ArrowLeft, Shield, Cpu, Lock, Layers } from 'lucide-react';

export default function AboutPage() {
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
      <main className="max-w-4xl mx-auto px-6 py-12 flex-1">
        <div className="p-8 md:p-12 rounded-3xl glass-panel-major border border-white/20 shadow-glass-lg space-y-8">
          
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 text-cyan-300 text-xs font-bold mb-3 border border-cyan-800/50">
              <Sparkles className="w-3.5 h-3.5" />
              <span>About File Converter</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Privacy-First File Conversion for the Modern Web
            </h1>
            <p className="text-xs text-slate-400 mt-2">
              Reimagining document and image workflows with client-side WebAssembly.
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              Our Mission
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Traditional online file conversion websites upload your personal photos, tax documents, and confidential contracts to remote cloud servers—exposing your privacy to third-party databases, tracking, and server leaks.
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>File Converter</strong> was engineered with a strict principle: <em>Your files belong to you</em>. By leveraging modern browser capabilities like WebAssembly (WASM), Web Workers, and HTML5 Canvas, we execute conversions directly inside your web browser.
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="p-5 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-xl">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center mb-3">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-xs mb-1">Local Processing</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Zero network lag. Conversions happen at the speed of your device&apos;s CPU without upload bottlenecks.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-xl">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center mb-3">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-xs mb-1">Total Privacy</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                No accounts, no tracking cookies, no document storage, and zero document leakage to analytics.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-xl">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center mb-3">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-xs mb-1">26+ Universal Tools</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Complete suite of PDF editing, format conversion, image compression, OCR, and QR generation tools.
              </p>
            </div>
          </div>

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
