'use client';

import React, { useEffect, useRef, useState } from 'react';

export interface AdSlotProps {
  /** Unique identifier for the advertisement placement */
  slotId: string;
  /** Format of the ad unit */
  format?: 'auto' | 'horizontal' | 'rectangle' | 'vertical' | 'responsive';
  /** Additional CSS class names */
  className?: string;
  /** Minimum height in pixels or CSS string to reserve layout space and eliminate Cumulative Layout Shift (CLS) */
  minHeight?: number | string;
  /** Maximum width in pixels or CSS string */
  maxWidth?: number | string;
  /** Label text displayed above the ad unit (default: 'Advertisement') */
  label?: string;
  /** Whether to show the advertisement disclaimer label */
  showLabel?: boolean;
  /** Whether the unit is responsive */
  responsive?: boolean;
  /** AdSense full-width responsive flag */
  fullWidthResponsive?: boolean;
  /** Custom inline style overrides */
  style?: React.CSSProperties;
  /** Whether to lazy-load the ad when approaching the viewport */
  lazy?: boolean;
}

/**
 * AdSlot — Production-grade, Google AdSense compatible, CLS-stabilized ad container.
 *
 * Privacy & Security Guarantees:
 * - Completely isolated from file processing engines, WebAssembly buffers, and user documents.
 * - Zero access to filenames, metadata, OCR text, or conversion buffers.
 * - Controlled by environment flags:
 *     NEXT_PUBLIC_ADS_ENABLED=true/false (defaults to false)
 *     NEXT_PUBLIC_SHOW_AD_PLACEHOLDERS=true/false (renders dashed layout testing card)
 *     NEXT_PUBLIC_ADSENSE_CLIENT_ID (e.g. ca-pub-XXXXXXXXXXXXXXXX)
 */
export const AdSlot: React.FC<AdSlotProps> = ({
  slotId,
  format = 'responsive',
  className = '',
  minHeight,
  maxWidth,
  label = 'Advertisement',
  showLabel = true,
  responsive = true,
  fullWidthResponsive = true,
  style = {},
  lazy = true,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const adInsRef = useRef<HTMLModElement | null>(null);
  const [isVisible, setIsVisible] = useState(!lazy || typeof window === 'undefined');
  const [adLoaded, setAdLoaded] = useState(false);

  const isAdsEnabled = process.env.NEXT_PUBLIC_ADS_ENABLED === 'true';
  const showPlaceholders = process.env.NEXT_PUBLIC_SHOW_AD_PLACEHOLDERS === 'true';
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || '';

  // Default standard heights to eliminate CLS based on format
  const resolvedMinHeight = React.useMemo(() => {
    if (minHeight !== undefined) {
      return typeof minHeight === 'number' ? `${minHeight}px` : minHeight;
    }
    if (format === 'vertical') return '600px';
    if (format === 'rectangle') return '250px';
    return '90px'; // horizontal/responsive default
  }, [minHeight, format]);

  // Lazy loading using IntersectionObserver
  useEffect(() => {
    if (!lazy || isVisible) return;
    if (!containerRef.current || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '250px 0px' }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [lazy, isVisible]);

  // Global Script & AdSense Tag Initialization
  useEffect(() => {
    if (!isAdsEnabled || !adsenseClientId || !isVisible || adLoaded) return;

    // Load AdSense global script singleton once across the entire app
    const scriptId = 'adsense-script';
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = scriptId;
      scriptTag.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adsenseClientId)}`;
      scriptTag.async = true;
      scriptTag.crossOrigin = 'anonymous';
      document.head.appendChild(scriptTag);
    }

    // Push ad request safely into AdSense queue
    try {
      if (typeof window !== 'undefined') {
        const adsbygoogle = (window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle || [];
        adsbygoogle.push({});
        setAdLoaded(true);
      }
    } catch (e) {
      console.debug('AdSlot queue push notice:', e);
    }
  }, [isAdsEnabled, adsenseClientId, isVisible, adLoaded]);

  // If ads are completely disabled and placeholder flag is OFF: zero DOM footprint
  if (!isAdsEnabled && !showPlaceholders) {
    return null;
  }

  const containerStyle: React.CSSProperties = {
    minHeight: resolvedMinHeight,
    maxWidth: maxWidth !== undefined ? (typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth) : undefined,
    ...style,
  };

  // Development & QA Placeholder Mode
  if (!isAdsEnabled && showPlaceholders) {
    return (
      <div
        ref={containerRef}
        className={`w-full mx-auto flex flex-col items-center justify-center p-3 rounded-2xl bg-[rgba(10,18,28,0.38)] backdrop-blur-md border border-dashed border-white/20 text-center select-none shadow-sm transition-all ${className}`}
        style={containerStyle}
        data-ad-slot={slotId}
        aria-label="Ad placeholder preview"
      >
        {showLabel && (
          <span className="text-[10px] font-semibold text-slate-400 tracking-widest uppercase mb-1.5 opacity-60">
            {label} &bull; PREVIEW
          </span>
        )}
        <div className="flex flex-col sm:flex-row items-center gap-1.5 text-xs font-mono text-cyan-300/80 bg-cyan-950/40 px-3 py-1 rounded-full border border-cyan-800/40">
          <span>ADVERTISEMENT SLOT</span>
          <span className="text-slate-400">&bull;</span>
          <span className="text-slate-300">{slotId}</span>
          <span className="text-slate-400">&bull;</span>
          <span className="text-cyan-400">{format}</span>
        </div>
      </div>
    );
  }

  // Active Production Ad Unit
  return (
    <div
      ref={containerRef}
      className={`w-full mx-auto flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-[rgba(10,18,28,0.38)] backdrop-blur-md border border-white/10 text-center shadow-sm overflow-hidden transition-all ${className}`}
      style={containerStyle}
      data-ad-slot={slotId}
    >
      {showLabel && (
        <span className="text-[10px] font-medium text-slate-400 tracking-wider uppercase mb-1.5 block select-none opacity-60">
          {label}
        </span>
      )}
      <div className="w-full flex items-center justify-center min-h-[50px] overflow-hidden">
        {isVisible && (
          <ins
            ref={adInsRef}
            className="adsbygoogle"
            style={{ display: 'block', width: '100%', minHeight: resolvedMinHeight, ...style }}
            data-ad-client={adsenseClientId}
            data-ad-slot={slotId}
            data-ad-format={format}
            data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
          />
        )}
      </div>
    </div>
  );
};

export default AdSlot;
