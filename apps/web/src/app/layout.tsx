import type { Metadata, Viewport } from "next";
import "./globals.css";
import GatewayFlow from "../components/ui/gateway-flow";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://fileconverter.app'),
  title: "File Converter — PDF & Image Tools",
  applicationName: "File Converter",
  description: "Ultra-fast, 100% private in-browser PDF and image conversion platform. Edit PDF, convert JPG, PNG, WebP, HEIC, compress with target sizes, OCR and batch processing.",
  keywords: ["file converter", "pdf to jpg", "pdf editor", "compress image", "heic to jpg", "private file converter", "batch convert", "ocr online"],
  authors: [{ name: "File Converter Team" }],
  manifest: "/manifest.json",
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
    title: "File Converter — PDF & Image Tools",
    description: "Ultra-fast, 100% private in-browser PDF and image conversion platform.",
    url: "https://fileconverter.app",
    type: "website",
    images: [
      {
        url: "/brand/file-converter-logo.png",
        width: 800,
        height: 220,
        alt: "File Converter",
      },
    ],
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
  return (
    <html lang="en" className="dark" data-theme="dark" data-scheme="dark">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
      </head>
      <body className="antialiased min-h-screen bg-black text-slate-100 selection:bg-blue-600/30 selection:text-white dark relative overflow-x-hidden">
        {/* Full-screen centered live canvas background */}
        <GatewayFlow speed={1.0} opacity={1.0} density={1.1} />
        {children}
      </body>
    </html>
  );
}
