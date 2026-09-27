'use client';

import React from 'react';
import { X, Clock, Trash2, ShieldCheck, ArrowRight } from 'lucide-react';
import { useConverterStore } from '../store/converter-store';

export const RecentActivityModal: React.FC = () => {
  const { isRecentOpen, setIsRecentOpen, recentActivity, clearRecentActivity } = useConverterStore();

  if (!isRecentOpen) return null;

  const formatTimeAgo = (timestamp: number) => {
    const secs = Math.floor((Date.now() - timestamp) / 1000);
    if (secs < 60) return 'Just now';
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ago`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-heavy border border-white/90 dark:border-white/15 rounded-3xl p-6 shadow-glass-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Session Activity</h3>
          </div>
          <button
            onClick={() => setIsRecentOpen(false)}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Box */}
        <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/60 border border-blue-200/50 dark:border-blue-800/50 mb-4 flex items-center gap-2 text-xs text-blue-900 dark:text-blue-200">
          <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>Zero Document Storage: Only session tool names are logged during active browser tab.</span>
        </div>

        {/* Activity List */}
        <div className="space-y-2 max-h-72 overflow-y-auto mb-5 pr-1 custom-scrollbar">
          {recentActivity.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
              No conversion activity recorded in this session yet.
            </div>
          ) : (
            recentActivity.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-100">{item.toolName}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.actionSummary}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block">{formatTimeAgo(item.timestamp)}</span>
                  {item.savedPercentage && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Saved {item.savedPercentage}%</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={clearRecentActivity}
            disabled={recentActivity.length === 0}
            className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-30 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Session Log</span>
          </button>

          <button
            onClick={() => setIsRecentOpen(false)}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
