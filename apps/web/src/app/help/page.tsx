'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { HelpCircle, ArrowLeft, ChevronRight, ShieldCheck, Zap, Layers, RefreshCw } from 'lucide-react';

export default function HelpFaqPage() {
  const faqs = [
    {
      q: "How does 100% in-browser conversion work?",
      a: "Our engine uses compiled WebAssembly (WASM) and HTML5 Canvas running directly inside your browser's V8/JavaScript engine. Files are decoded in your computer's RAM, transformed locally, and downloaded immediately without uploading bytes over the internet."
    },
    {
      q: "Are my files private and safe?",
      a: "Yes. Because conversion occurs locally on your machine, your confidential contracts, medical records, and photos are never uploaded or stored on any server. In the rare event a complex file needs server compatibility processing, it is isolated in an ephemeral sandbox and automatically destroyed within 15 minutes."
    },
    {
      q: "What is the maximum file size supported?",
      a: "For local in-browser conversions, file sizes are limited only by your device's available browser memory (typically 500 MB - 1 GB+ on modern desktops and phones). For temporary server compatibility conversions, the maximum file size is 500 MB."
    },
    {
      q: "Can I convert multiple files in batch?",
      a: "Yes! Use our Batch Processing mode to drop dozens of images or documents at once, convert them simultaneously with multi-threaded Web Workers, and download the entire bundle as a structured ZIP archive."
    },
    {
      q: "How do I edit or annotate a PDF?",
      a: "Click 'Edit PDF' in the sidebar or upload a PDF document. You can click existing text to edit it in place, add new vector text with custom typography, highlight sections, draw shapes, redact sensitive data, and stamp watermarks before saving."
    }
  ];

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
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Help Center &amp; FAQ</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Frequently Asked Questions &amp; Support
            </h1>
            <p className="text-xs text-slate-400 mt-2">
              Everything you need to know about using File Converter.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((item, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-xl">
                <h3 className="font-bold text-white text-sm mb-2">{item.q}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>

          {/* Quick links to tools */}
          <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
            <span className="text-xs text-slate-400">Looking for a specific conversion tool?</span>
            <Link
              href="/tools"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-extrabold shadow-glass-sm transition"
            >
              <span>Explore All 26+ Tools</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
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
