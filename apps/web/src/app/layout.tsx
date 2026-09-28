import type { Metadata, Viewport } from "next";
import dynamic from "next/dynamic";
import "./globals.css";

const DynamicLiquidBackground = dynamic(
  () => import("../components/LiquidGlassBackground").then((mod) => mod.LiquidGlassBackground),
  { ssr: false }
);

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://fileconvertor.in';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "File Converter — 100% Free & Private Online PDF & Image Tools",
    template: "%s | File Converter"
  },
  applicationName: "File Converter",
  description: "Ultra-fast, 100% private in-browser file converter. Convert PDF to Word, PDF to JPG, Merge, Split, Compress, Edit PDF, HEIC to JPG, WebP, OCR, and resize images with zero uploads.",
  keywords: [
    "file converter", "pdf converter", "convert pdf to word", "pdf to jpg", "merge pdf", 
    "compress pdf", "edit pdf online", "heic to jpg", "image converter", "compress image",
    "png to jpg", "webp to png", "ocr pdf", "free pdf tools", "private file converter"
  ],
  authors: [{ name: "File Converter Team", url: SITE_URL }],
  creator: "File Converter",
  publisher: "File Converter",
  manifest: "/manifest.json",
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    title: "File Converter",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    siteName: "File Converter",
    title: "File Converter — 100% Free & Private Online PDF & Image Tools",
    description: "Ultra-fast, 100% private in-browser file conversion. Convert, compress, and edit PDFs and images with zero server uploads.",
    url: SITE_URL,
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/brand/file-converter-logo.png",
        width: 800,
        height: 220,
        alt: "File Converter Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "File Converter — Free & Private PDF & Image Tools",
    description: "Convert, edit, compress, and organize your files directly in your browser. 100% private with no file storage.",
    images: ["/brand/file-converter-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLdWebsite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "File Converter",
    "url": SITE_URL,
    "description": "Free, private, browser-first file conversion and PDF editing tools.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${SITE_URL}/tools?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  const jsonLdOrg = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "File Converter",
    "url": SITE_URL,
    "logo": `${SITE_URL}/brand/file-converter-logo.png`,
    "sameAs": []
  };

  return (
    <html lang="en" className="dark" data-theme="dark" data-scheme="dark">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebsite) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }}
        />
      </head>
      <body className="antialiased min-h-screen bg-black text-slate-100 selection:bg-blue-600/30 selection:text-white dark relative overflow-x-hidden">
        {/* Lazily mounted 3D background with zero initial blocking */}
        <DynamicLiquidBackground />
        {children}
      </body>
    </html>
  );
}
