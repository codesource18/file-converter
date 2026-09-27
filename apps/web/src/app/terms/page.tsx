'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FileText, ArrowLeft, CheckCircle2, AlertTriangle, Scale, ShieldAlert } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen text-slate-100 bg-transparent flex flex-col justify-between select-none">
      {/* Top Header */}
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

      {/* Main Terms Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 flex-1">
        <div className="p-8 md:p-12 rounded-3xl glass-panel-major border border-white/20 shadow-glass-lg space-y-8">
          
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 text-blue-300 text-xs font-bold mb-3 border border-blue-800/50">
              <Scale className="w-3.5 h-3.5" />
              <span>Terms of Service</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Terms &amp; Conditions of Use
            </h1>
            <p className="text-xs text-slate-400 mt-2">
              Effective Date: September 2026 &bull; Version 1.0
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              1. Acceptance &amp; Permitted Use
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              By accessing and using File Converter, you agree to these Terms. File Converter provides free, fast, browser-based and server-assisted document and image conversion utilities for personal and commercial productivity.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              2. User Content &amp; Responsibility
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              You retain 100% intellectual property ownership of all files you upload and convert. You represent and warrant that you hold all necessary rights, licenses, and permissions to convert the content you upload and that your files do not contain malware, malicious scripts, or unlawful material.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-cyan-400" />
              3. Service Warranty &amp; Disclaimers
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              The conversion service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. While we strive for 100% structural fidelity and pixel-perfect document rendering, we do not warrant that all complex third-party proprietary layouts, macros, or fonts will convert without variance.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              4. Prohibited Uses
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              You agree not to exploit the platform for denial-of-service attacks, automated spam scraping, decompression bomb uploads, or unauthorized reverse-engineering of backend sandboxes.
            </p>
          </section>

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
