'use client';

import React from 'react';
import { ShieldCheck, HardDrive, Cpu } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section className="text-center pt-2 pb-4 px-4 max-w-4xl mx-auto select-none">
      {/* Trust Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.08] backdrop-blur-2xl border border-white/20 shadow-glass-sm text-left transition-all hover:bg-white/[0.12] hover:border-white/30">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">100% Private</div>
            <div className="text-[11px] text-slate-300 line-clamp-1">Your files stay on your device</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.08] backdrop-blur-2xl border border-white/20 shadow-glass-sm text-left transition-all hover:bg-white/[0.12] hover:border-white/30">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">No File Storage</div>
            <div className="text-[11px] text-slate-300 line-clamp-1">Nothing is permanently stored</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.08] backdrop-blur-2xl border border-white/20 shadow-glass-sm text-left transition-all hover:bg-white/[0.12] hover:border-white/30">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Works on Any File</div>
            <div className="text-[11px] text-slate-300 line-clamp-1">Smart format detection</div>
          </div>
        </div>
      </div>
    </section>
  );
};
