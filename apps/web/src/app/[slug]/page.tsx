import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getToolBySlug, getAllIndexableSlugs, ALL_TOOLS } from '@fileconverter/file-detection';
import { Sidebar } from '../../components/Sidebar';
import { TopNav } from '../../components/TopNav';
import { ToolClientView } from '../../components/ToolClientView';
import { AdSlot } from '../../components/AdSlot';
import { SearchModal } from '../../components/SearchModal';
import { RecentActivityModal } from '../../components/RecentActivityModal';
import { 
  Sparkles, 
  ShieldCheck, 
  HelpCircle, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  FileText, 
  Zap, 
  Lock 
} from 'lucide-react';

interface PageProps {
  params: {
    slug: string;
  };
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://fileconvertor.in';

export async function generateStaticParams() {
  const slugs = getAllIndexableSlugs();
  return slugs.map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const tool = getToolBySlug(params.slug);
  if (!tool) {
    return {
      title: 'Tool Not Found — File Converter',
      description: 'The requested conversion tool could not be found.',
    };
  }

  const title = tool.seoTitle || `${tool.name} – Free Online Converter | File Converter`;
  const description = tool.seoDescription || `Convert files with ${tool.name}. Fast, free, and 100% private in-browser file transformation.`;
  const canonicalUrl = `${SITE_URL}/${params.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'File Converter',
      type: 'website',
      images: [
        {
          url: '/brand/file-converter-logo.png',
          width: 800,
          height: 220,
          alt: `${tool.name} - File Converter`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/brand/file-converter-logo.png'],
    },
  };
}

export default function ToolLandingPage({ params }: PageProps) {
  const tool = getToolBySlug(params.slug);

  if (!tool) {
    notFound();
  }

  const relatedTools = ALL_TOOLS.filter(
    (t) => t.id !== tool.id && (t.category === tool.category || t.inputFormats.some(f => tool.inputFormats.includes(f)))
  ).slice(0, 4);

  // Structured Data (JSON-LD)
  const jsonLdApp = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": tool.name,
    "url": `${SITE_URL}/${params.slug}`,
    "description": tool.description,
    "applicationCategory": "UtilitiesApplication",
    "operatingSystem": "All",
    "browserRequirements": "Requires JavaScript. Requires HTML5 Canvas & WebAssembly.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  const jsonLdBreadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": SITE_URL
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Tools",
        "item": `${SITE_URL}/tools`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": tool.name,
        "item": `${SITE_URL}/${params.slug}`
      }
    ]
  };

  const jsonLdFaq = tool.faq && tool.faq.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": tool.faq.map((item) => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.a
      }
    }))
  } : null;

  return (
    <div className="relative min-h-screen flex text-slate-100 selection:bg-blue-600/30 selection:text-white">
      {/* JSON-LD Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdApp) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumbs) }}
      />
      {jsonLdFaq && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
        />
      )}

      {/* Desktop Left Sidebar */}
      <div className="hidden md:block shrink-0">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 z-10">
        <TopNav />

        <main className="flex-1 pb-16">
          {/* SEO Header */}
          <header className="text-center pt-6 pb-2 px-4 max-w-4xl mx-auto select-none">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 text-cyan-300 text-xs font-bold mb-3 border border-cyan-800/50 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>100% Free • In-Browser Processing</span>
            </div>
            
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-2">
              {tool.name}
            </h1>
            
            <p className="text-xs sm:text-sm md:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              {tool.description}
            </p>
          </header>

          {/* Interactive Tool Interface (DropZone / PostDrop / Result / Editor) */}
          <section aria-label="Tool interface" className="w-full my-2">
            <ToolClientView tool={tool} />
          </section>

          {/* Non-Intrusive Mid-Page Ad Slot */}
          <div className="max-w-[970px] mx-auto px-3 sm:px-4 my-6">
            <AdSlot
              slotId="tool-mid-ad"
              format="horizontal"
              minHeight={90}
              maxWidth={970}
              className="w-full"
            />
          </div>

          {/* Deep Content & How-To Section */}
          <div className="max-w-4xl mx-auto px-3 sm:px-4 mt-8 space-y-6 select-none">
            
            {/* Step-by-Step Instructions */}
            <section className="p-6 sm:p-8 rounded-3xl glass-panel-major">
              <h2 className="text-base sm:text-xl font-bold text-white mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                <span>How to Use {tool.name}</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center mb-2">1</div>
                  <h3 className="font-bold text-xs text-white mb-1">Select or Drop Files</h3>
                  <p className="text-[11px] text-slate-300">Choose your file from your phone or computer, or drag it into the box above.</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-300 font-bold text-xs flex items-center justify-center mb-2">2</div>
                  <h3 className="font-bold text-xs text-white mb-1">Process Instantly</h3>
                  <p className="text-[11px] text-slate-300">Our browser engine converts, compresses, or edits your file locally in volatile RAM.</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center justify-center mb-2">3</div>
                  <h3 className="font-bold text-xs text-white mb-1">Download Clean Output</h3>
                  <p className="text-[11px] text-slate-300">Save the result directly to your device with zero storage or retention logs.</p>
                </div>
              </div>
            </section>

            {/* Technical Explanation & Format Specifications */}
            {tool.explanation && (
              <section className="p-6 sm:p-8 rounded-3xl glass-panel-major">
                <h2 className="text-base sm:text-xl font-bold text-white mb-2 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <span>Why Choose File Converter for {tool.name}</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                  {tool.explanation}
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <div className="px-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/10 text-slate-300">
                    <span className="text-slate-400 font-semibold">Inputs: </span>
                    <span className="text-cyan-300 font-bold">{tool.inputFormats.join(', ')}</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/10 text-slate-300">
                    <span className="text-slate-400 font-semibold">Outputs: </span>
                    <span className="text-cyan-300 font-bold">{tool.outputFormats.join(', ')}</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/10 text-slate-300">
                    <span className="text-slate-400 font-semibold">Engine: </span>
                    <span className="text-emerald-300 font-bold">{tool.preferredMode === 'local' ? '100% In-Browser (WASM/Canvas)' : 'Ephemeral Sandbox'}</span>
                  </div>
                </div>
              </section>
            )}

            {/* Related Tools Links */}
            {relatedTools.length > 0 && (
              <section>
                <h2 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
                  Related Conversion Tools
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {relatedTools.map((rel) => (
                    <Link
                      key={rel.id}
                      href={`/${rel.slug}`}
                      className="p-4 rounded-2xl glass-card-tool transition group flex flex-col justify-between"
                    >
                      <div>
                        <h3 className="font-bold text-xs text-white group-hover:text-cyan-300 transition">
                          {rel.name}
                        </h3>
                        <p className="text-[11px] text-slate-300 line-clamp-2 mt-1 font-normal">
                          {rel.description}
                        </p>
                      </div>
                      <div className="pt-2 mt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-cyan-400 font-semibold">
                        <span>Open Tool</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Frequently Asked Questions */}
            {tool.faq && tool.faq.length > 0 && (
              <section className="p-6 sm:p-8 rounded-3xl glass-panel-major">
                <h2 className="text-base sm:text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-cyan-400" />
                  <span>Frequently Asked Questions</span>
                </h2>
                <div className="space-y-4">
                  {tool.faq.map((item, idx) => (
                    <div key={idx} className="border-b border-white/10 pb-3 last:border-0 last:pb-0">
                      <h3 className="text-xs sm:text-sm font-bold text-white mb-1">{item.q}</h3>
                      <p className="text-xs text-slate-300 leading-relaxed font-normal">{item.a}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>

          {/* Footer Ad Slot */}
          <div className="max-w-4xl mx-auto px-3 sm:px-4 mt-10 mb-4">
            <AdSlot
              slotId="tool-footer-ad"
              format="horizontal"
              minHeight={90}
              className="w-full"
            />
          </div>

          {/* Footer */}
          <footer className="mt-8 py-8 border-t border-white/10 flex flex-col items-center justify-center gap-3 text-center px-4">
            <div className="flex items-center gap-2.5 opacity-90 hover:opacity-100 transition-opacity">
              <Image
                src="/brand/logo-horizontal.svg"
                alt="File Converter"
                width={180}
                height={45}
                className="h-8 sm:h-9 w-auto object-contain drop-shadow-[0_0_12px_rgba(56,189,248,0.25)]"
              />
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <Link href="/privacy" className="hover:text-cyan-300 transition-colors">Privacy Policy</Link>
              <span>&bull;</span>
              <Link href="/terms" className="hover:text-cyan-300 transition-colors">Terms of Service</Link>
              <span>&bull;</span>
              <Link href="/about" className="hover:text-cyan-300 transition-colors">About</Link>
              <span>&bull;</span>
              <Link href="/tools" className="hover:text-cyan-300 transition-colors">Tools Directory</Link>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500">
              &copy; 2026 File Converter &bull; Your Files. Your Browser. Nothing Stored. &bull; Developed by Rynex
            </p>
          </footer>
        </main>
      </div>

      {/* Global Modals */}
      <SearchModal />
      <RecentActivityModal />
    </div>
  );
}
