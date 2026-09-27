'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, ArrowLeft, Send, CheckCircle2, MessageSquare } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) return;
    setSubmitted(true);
  };

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
      <main className="max-w-2xl mx-auto px-6 py-12 flex-1 w-full">
        <div className="p-8 md:p-12 rounded-3xl glass-panel-major border border-white/20 shadow-glass-lg space-y-6">
          
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 text-blue-300 text-xs font-bold mb-3 border border-blue-800/50">
              <Mail className="w-3.5 h-3.5" />
              <span>Contact Us</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Get in Touch with Our Team
            </h1>
            <p className="text-xs text-slate-400 mt-2">
              Have feedback, tool requests, or partnership inquiries? We&apos;d love to hear from you.
            </p>
          </div>

          {submitted ? (
            <div className="p-6 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Message Sent Successfully!</h3>
              <p className="text-xs text-slate-300">
                Thank you for reaching out. We will review your message and reply promptly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Your Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-2xl bg-white/[0.08] border border-white/20 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Message or Feedback</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your request, issue, or feedback..."
                  className="w-full px-4 py-3 rounded-2xl bg-white/[0.08] border border-white/20 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-xs resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold text-xs shadow-glass-md transition flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Send Message</span>
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-white/10 text-center text-xs text-slate-400">
            Direct email: <a href="mailto:support@fileconverter.app" className="text-cyan-400 hover:underline">support@fileconverter.app</a>
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
