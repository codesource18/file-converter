'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Cookie, ArrowLeft, CheckCircle2, Shield } from 'lucide-react';

export default function CookiePolicyPage() {
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
              <Cookie className="w-3.5 h-3.5" />
              <span>Cookie &amp; Tracking Disclosure</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Cookie &amp; Regional Privacy Policy
            </h1>
            <p className="text-xs text-slate-400 mt-2">
              Updated: September 2026
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              1. Essential Cookies Only by Default
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              File Converter does not use persistent tracking cookies or invasive third-party profiling. Essential local storage is used solely to maintain your active theme preference and session-level conversion recents on your device.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              2. Third-Party Advertising
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              When advertising is enabled, authorized advertising partners (such as Google AdSense) may set cookies or web beacons to deliver non-personalized or personalized ads in compliance with applicable regional privacy frameworks (GDPR/ePrivacy, CCPA/CPRA). Document contents are strictly air-gapped and never shared with advertising networks.
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
