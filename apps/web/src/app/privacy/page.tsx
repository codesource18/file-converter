'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Shield, ArrowLeft, Lock, HardDrive, EyeOff, Server, Mail } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen text-slate-100 bg-transparent flex flex-col justify-between select-none">
      {/* Top Header Navigation */}
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

      {/* Main Privacy Document Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 flex-1">
        <div className="p-8 md:p-12 rounded-3xl glass-panel-major border border-white/20 shadow-glass-lg space-y-8">
          
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 text-cyan-300 text-xs font-bold mb-3 border border-cyan-800/50">
              <Shield className="w-3.5 h-3.5" />
              <span>Official Privacy Policy</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Privacy &amp; Data Protection Policy
            </h1>
            <p className="text-xs text-slate-400 mt-2">
              Last Updated: September 2026 &bull; Version 1.0
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              1. 100% In-Browser Execution First
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              File Converter is architected around a <strong>privacy-first, client-side paradigm</strong>. Over 95% of all supported file operations—including PDF editing, text annotations, PDF merges, splits, watermarking, page rotations, and common image conversions (PNG, JPEG, WebP, SVG, BMP, GIF)—run directly inside your web browser using WebAssembly (WASM), HTML5 Canvas, and modern web APIs.
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              When processing locally, your document bytes <strong>never leave your computer or phone</strong> and are never transmitted across any network.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              2. Temporary Server Compatibility Fallback
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Certain specialized conversions (e.g., proprietary RAW image codecs or complex desktop DOCX conversions) may utilize an isolated, temporary backend sandbox.
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-5">
              <li><strong>Unpredictable Sandboxes:</strong> Every job receives a random UUID v4 directory in ephemeral storage (<code className="text-cyan-300">/tmp/fileconverter_jobs</code>).</li>
              <li><strong>Instant Deletion:</strong> Source files are deleted immediately after conversion execution.</li>
              <li><strong>Automated TTL Purge:</strong> All converted job artifacts are purged automatically by our background cleanup worker within 15 minutes.</li>
              <li><strong>Zero Databases or Backups:</strong> No database exists to store user documents, filenames, or content.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-cyan-400" />
              3. Analytics &amp; Advertising Data Isolation
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              We strictly isolate all document data from analytics and advertising providers:
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-5">
              <li>We <strong>never</strong> log or transmit uploaded filenames, file buffers, OCR text, document contents, or metadata to any analytics or advertising service.</li>
              <li>Analytics events are limited to high-level lifecycle events (e.g., <code className="text-cyan-300">conversion_started</code>, <code className="text-cyan-300">download_clicked</code>).</li>
              <li>Non-intrusive advertisements (Google AdSense) are loaded without passing document contexts or user file parameters.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-cyan-400" />
              4. Local Session &amp; Recent Activity
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Recent tool activity history shown in the HUD is stored exclusively inside your browser&apos;s local memory / <code className="text-cyan-300">sessionStorage</code> and can be cleared by you at any time with a single click.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Mail className="w-4 h-4 text-cyan-400" />
              5. Contact &amp; Questions
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              If you have any questions or data protection inquiries, please contact our team at <a href="mailto:privacy@fileconverter.app" className="text-cyan-400 hover:underline">privacy@fileconverter.app</a>.
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
