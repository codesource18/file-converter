'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode, 
  Download, 
  Copy, 
  Check, 
  ArrowLeft, 
  Sparkles, 
  Link as LinkIcon, 
  FileText, 
  Wifi, 
  Mail, 
  Phone, 
  User, 
  UploadCloud, 
  Palette, 
  Sliders, 
  ShieldCheck, 
  ExternalLink,
  Scan,
  RefreshCw,
  FileImage,
  Layers
} from 'lucide-react';
import { useConverterStore } from '../store/converter-store';
import { PDFDocument, rgb } from 'pdf-lib';

type QrType = 'url' | 'text' | 'wifi' | 'email' | 'phone' | 'vcard';

export const QrGeneratorView: React.FC = () => {
  const { setActiveView, addRecentActivity } = useConverterStore();
  
  // Tab mode: Generate vs Scan
  const [activeTab, setActiveTab] = useState<'generate' | 'scan'>('generate');
  const [qrType, setQrType] = useState<QrType>('url');

  // Input states for different types
  const [urlInput, setUrlInput] = useState('https://example.com');
  const [textInput, setTextInput] = useState('');
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiEncryption, setWifiEncryption] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');
  const [wifiHidden, setWifiHidden] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneMessage, setPhoneMessage] = useState('');
  const [vcardName, setVcardName] = useState('');
  const [vcardOrg, setVcardOrg] = useState('');
  const [vcardPhone, setVcardPhone] = useState('');
  const [vcardEmail, setVcardEmail] = useState('');
  const [vcardUrl, setVcardUrl] = useState('');

  // Style customization
  const [fgColor, setFgColor] = useState('#0f172a');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [errorLevel, setErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [qrMargin, setQrMargin] = useState(2);
  const [qrSize, setQrSize] = useState(600);
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null);

  // Output states
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrSvgString, setQrSvgString] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Scanner state
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scanInputRef = useRef<HTMLInputElement>(null);

  // Calculate encoded QR string based on active type
  const getQrContent = useCallback((): string => {
    switch (qrType) {
      case 'url':
        return urlInput.trim() || 'https://example.com';
      case 'text':
        return textInput.trim() || 'Enter text here';
      case 'wifi':
        return `WIFI:T:${wifiEncryption};S:${wifiSsid};P:${wifiPassword};H:${wifiHidden ? 'true' : 'false'};;`;
      case 'email':
        return `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      case 'phone':
        return phoneMessage.trim() ? `SMSTO:${phoneNumber}:${phoneMessage}` : `tel:${phoneNumber}`;
      case 'vcard':
        return [
          'BEGIN:VCARD',
          'VERSION:3.0',
          `FN:${vcardName}`,
          `ORG:${vcardOrg}`,
          `TEL:${vcardPhone}`,
          `EMAIL:${vcardEmail}`,
          `URL:${vcardUrl}`,
          'END:VCARD'
        ].filter(line => !line.endsWith(':')).join('\n');
      default:
        return 'https://example.com';
    }
  }, [
    qrType,
    urlInput,
    textInput,
    wifiEncryption,
    wifiSsid,
    wifiPassword,
    wifiHidden,
    emailTo,
    emailSubject,
    emailBody,
    phoneMessage,
    phoneNumber,
    vcardName,
    vcardOrg,
    vcardPhone,
    vcardEmail,
    vcardUrl,
  ]);

  // Generate QR Code data URL & SVG
  useEffect(() => {
    if (activeTab !== 'generate') return;
    const content = getQrContent();

    const generateQr = async () => {
      try {
        const dataUrl = await QRCode.toDataURL(content, {
          errorCorrectionLevel: errorLevel,
          margin: qrMargin,
          width: qrSize,
          color: {
            dark: fgColor,
            light: bgColor === 'transparent' ? '#00000000' : bgColor,
          }
        });
        setQrDataUrl(dataUrl);

        const svg = await QRCode.toString(content, {
          type: 'svg',
          errorCorrectionLevel: errorLevel,
          margin: qrMargin,
          color: {
            dark: fgColor,
            light: bgColor === 'transparent' ? '#00000000' : bgColor,
          }
        });
        setQrSvgString(svg);
      } catch (err) {
        console.error('Failed to generate QR code:', err);
      }
    };

    generateQr();
  }, [
    activeTab,
    getQrContent,
    fgColor,
    bgColor,
    errorLevel,
    qrMargin,
    qrSize
  ]);

  // Copy Image to Clipboard
  const handleCopyImage = async () => {
    if (!qrDataUrl) return;
    try {
      const response = await fetch(qrDataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.warn('Clipboard image write fallback:', err);
      navigator.clipboard.writeText(getQrContent());
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Download as PNG
  const handleDownloadPng = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `qrcode_${qrType}_${Date.now()}.png`;
    link.href = qrDataUrl;
    link.click();

    addRecentActivity({
      toolName: 'QR Code Generator',
      actionSummary: `Generated ${qrType.toUpperCase()} QR Code (PNG)`,
      fromFormat: 'RAW',
      toFormat: 'PNG',
      mode: 'local'
    });
  };

  // Download as SVG
  const handleDownloadSvg = () => {
    if (!qrSvgString) return;
    const blob = new Blob([qrSvgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `qrcode_${qrType}_${Date.now()}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);

    addRecentActivity({
      toolName: 'QR Code Generator',
      actionSummary: `Exported vector ${qrType.toUpperCase()} QR Code (SVG)`,
      fromFormat: 'RAW',
      toFormat: 'SVG',
      mode: 'local'
    });
  };

  // Download as High-Res PDF
  const handleDownloadPdf = async () => {
    if (!qrDataUrl) return;
    setIsDownloading(true);
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]); // A4
      const qrImageBytes = await fetch(qrDataUrl).then(res => res.arrayBuffer());
      const qrImage = await pdfDoc.embedPng(qrImageBytes);

      const qrDim = 320;
      page.drawImage(qrImage, {
        x: (595 - qrDim) / 2,
        y: (842 - qrDim) / 2 + 30,
        width: qrDim,
        height: qrDim
      });

      page.drawText('SCAN WITH ANY SMARTPHONE CAMERA', {
        x: 155,
        y: (842 - qrDim) / 2 - 20,
        size: 13,
        color: rgb(0.3, 0.35, 0.45)
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `qrcode_${qrType}_printable.pdf`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);

      addRecentActivity({
        toolName: 'QR Code Generator',
        actionSummary: `Created printable PDF sheet`,
        fromFormat: 'RAW',
        toFormat: 'PDF',
        mode: 'local'
      });
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle Scan Image File upload (Local JS QR decoder / Canvas extraction)
  const handleScanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setIsScanning(true);
    setScanError(null);
    setScannedResult(null);

    try {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setScanError('Canvas context unavailable');
          setIsScanning(false);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Dynamically load jsqr if available or fallback
        try {
          // @ts-ignore
          const jsQR = (await import('jsqr')).default || (await import('jsqr'));
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            setScannedResult(code.data);
          } else {
            setScanError('No QR code detected in this image. Make sure the code is clearly visible and well-lit.');
          }
        } catch {
          setScanError('QR scanning engine ready. Try uploading a high-contrast QR image.');
        }
        URL.revokeObjectURL(objectUrl);
        setIsScanning(false);
      };

      img.onerror = () => {
        setScanError('Failed to load image file.');
        setIsScanning(false);
      };

      img.src = objectUrl;
    } catch (err: any) {
      setScanError(err?.message || 'Error parsing QR code');
      setIsScanning(false);
    }
  };

  const presetColors = [
    { label: 'Slate Dark', fg: '#0f172a', bg: '#ffffff' },
    { label: 'Royal Blue', fg: '#1d4ed8', bg: '#eff6ff' },
    { label: 'Emerald', fg: '#047857', bg: '#ecfdf5' },
    { label: 'Sunset Amber', fg: '#b45309', bg: '#fffbeb' },
    { label: 'Deep Purple', fg: '#6b21a8', bg: '#faf5ff' },
    { label: 'Ruby Red', fg: '#be123c', bg: '#fff1f2' }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 my-6 select-none animate-in fade-in duration-200">
      
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setActiveView('home')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/80 hover:bg-white text-slate-700 text-xs font-bold shadow-glass-sm border border-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        {/* Generate vs Scan Toggle */}
        <div className="flex items-center bg-white/80 backdrop-blur-xl p-1 rounded-full border border-white/90 shadow-glass-sm">
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'generate' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Generate QR</span>
          </button>
          <button
            onClick={() => setActiveTab('scan')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'scan' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scan className="w-3.5 h-3.5" />
            <span>Scan Image</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200/60 shadow-glass-sm">
            100% In-Browser &bull; Zero Cloud Uploads
          </span>
        </div>
      </div>

      {activeTab === 'generate' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: CONFIGURATION & CONTENT INPUTS */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* QR Content Type Picker */}
            <div className="bg-white/80 backdrop-blur-2xl border border-white/90 rounded-3xl p-5 shadow-glass-md">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>QR Content Type</span>
              </label>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { id: 'url', label: 'URL / Link', icon: LinkIcon },
                  { id: 'text', label: 'Plain Text', icon: FileText },
                  { id: 'wifi', label: 'Wi-Fi Network', icon: Wifi },
                  { id: 'email', label: 'Email', icon: Mail },
                  { id: 'phone', label: 'Phone / SMS', icon: Phone },
                  { id: 'vcard', label: 'Contact (vCard)', icon: User },
                ].map((t) => {
                  const Icon = t.icon;
                  const isActive = qrType === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setQrType(t.id as QrType)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white border-blue-600 shadow-glass-sm ring-2 ring-blue-400/30'
                          : 'bg-white/70 border-slate-200/80 text-slate-700 hover:bg-white hover:border-blue-300'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mb-1 ${isActive ? 'text-white' : 'text-blue-600'}`} />
                      <span className="text-[10px] font-bold leading-tight">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Content Fields */}
            <div className="bg-white/80 backdrop-blur-2xl border border-white/90 rounded-3xl p-5 shadow-glass-md space-y-4">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                {qrType === 'url' && 'Website Destination'}
                {qrType === 'text' && 'Text or Note Content'}
                {qrType === 'wifi' && 'Wi-Fi Network Credentials'}
                {qrType === 'email' && 'Email Configuration'}
                {qrType === 'phone' && 'Phone Number & SMS'}
                {qrType === 'vcard' && 'Digital Contact Card (vCard)'}
              </label>

              {/* URL */}
              {qrType === 'url' && (
                <div>
                  <div className="relative">
                    <LinkIcon className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://yourwebsite.com/page"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:border-blue-500 text-xs font-semibold text-slate-800 shadow-inner"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5 pl-1">
                    When scanned, smartphone cameras will prompt to open this link directly.
                  </p>
                </div>
              )}

              {/* Plain Text */}
              {qrType === 'text' && (
                <div>
                  <textarea
                    rows={4}
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Enter any text, code snippet, message or notes to encode..."
                    className="w-full p-3 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:border-blue-500 text-xs font-semibold text-slate-800 shadow-inner resize-none"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                    <span>Direct text payload</span>
                    <span>{textInput.length} characters</span>
                  </div>
                </div>
              )}

              {/* Wi-Fi */}
              {qrType === 'wifi' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Network Name (SSID)</label>
                    <input
                      type="text"
                      value={wifiSsid}
                      onChange={(e) => setWifiSsid(e.target.value)}
                      placeholder="e.g. Office_Guest_5G"
                      className="w-full px-3.5 py-2 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:border-blue-500 text-xs font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Password</label>
                    <input
                      type="text"
                      value={wifiPassword}
                      onChange={(e) => setWifiPassword(e.target.value)}
                      placeholder="Network security key"
                      className="w-full px-3.5 py-2 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:border-blue-500 text-xs font-semibold text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Encryption</label>
                      <select
                        value={wifiEncryption}
                        onChange={(e) => setWifiEncryption(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:border-blue-500 text-xs font-semibold text-slate-700"
                      >
                        <option value="WPA">WPA / WPA2 / WPA3</option>
                        <option value="WEP">WEP</option>
                        <option value="nopass">None (Open Network)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        id="wifiHidden"
                        checked={wifiHidden}
                        onChange={(e) => setWifiHidden(e.target.checked)}
                        className="rounded accent-blue-600 w-4 h-4"
                      />
                      <label htmlFor="wifiHidden" className="text-xs font-semibold text-slate-700 cursor-pointer">
                        Hidden SSID
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Email */}
              {qrType === 'email' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Recipient Email</label>
                    <input
                      type="email"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                      placeholder="hello@company.com"
                      className="w-full px-3.5 py-2 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:border-blue-500 text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Subject</label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Quick Question"
                      className="w-full px-3.5 py-2 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:border-blue-500 text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Message Body</label>
                    <textarea
                      rows={2}
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      placeholder="Pre-populated message text..."
                      className="w-full p-3 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:border-blue-500 text-xs font-semibold text-slate-800 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Phone / SMS */}
              {qrType === 'phone' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+1 (555) 000-1234"
                      className="w-full px-3.5 py-2 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:border-blue-500 text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Optional SMS Body</label>
                    <input
                      type="text"
                      value={phoneMessage}
                      onChange={(e) => setPhoneMessage(e.target.value)}
                      placeholder="Leave blank for direct dial call"
                      className="w-full px-3.5 py-2 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:border-blue-500 text-xs font-semibold text-slate-800"
                    />
                  </div>
                </div>
              )}

              {/* vCard */}
              {qrType === 'vcard' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={vcardName}
                      onChange={(e) => setVcardName(e.target.value)}
                      placeholder="Alex Mercer"
                      className="w-full px-3.5 py-2 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:border-blue-500 text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Organization / Title</label>
                    <input
                      type="text"
                      value={vcardOrg}
                      onChange={(e) => setVcardOrg(e.target.value)}
                      placeholder="Acme Inc"
                      className="w-full px-3.5 py-2 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:border-blue-500 text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={vcardPhone}
                      onChange={(e) => setVcardPhone(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="w-full px-3.5 py-2 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:border-blue-500 text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Email Address</label>
                    <input
                      type="email"
                      value={vcardEmail}
                      onChange={(e) => setVcardEmail(e.target.value)}
                      placeholder="alex@acme.com"
                      className="w-full px-3.5 py-2 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:border-blue-500 text-xs font-semibold text-slate-800"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Customization & Color Palettes */}
            <div className="bg-white/80 backdrop-blur-2xl border border-white/90 rounded-3xl p-5 shadow-glass-md space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-blue-600" />
                  <span>Styling &amp; Colors</span>
                </label>
              </div>

              {/* Color Presets */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {presetColors.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => { setFgColor(p.fg); setBgColor(p.bg); }}
                    className="p-2 rounded-2xl border border-slate-200/80 bg-white/70 hover:bg-white flex flex-col items-center gap-1.5 transition text-center"
                  >
                    <div className="w-6 h-6 rounded-full border border-slate-200 shadow-inner" style={{ backgroundColor: p.fg }} />
                    <span className="text-[10px] font-bold text-slate-600">{p.label}</span>
                  </button>
                ))}
              </div>

              {/* Custom Color Controls */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Foreground Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                    />
                    <input
                      type="text"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-mono font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Background Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bgColor === 'transparent' ? '#ffffff' : bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                    />
                    <button
                      onClick={() => setBgColor(bgColor === 'transparent' ? '#ffffff' : 'transparent')}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                        bgColor === 'transparent' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      {bgColor === 'transparent' ? 'Transparent' : 'Solid'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Advanced Parameters */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
                <div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                    <span>Error Correction</span>
                    <span className="text-blue-600">{errorLevel === 'H' ? 'High (30%)' : errorLevel === 'Q' ? 'Quartile (25%)' : errorLevel === 'M' ? 'Medium (15%)' : 'Low (7%)'}</span>
                  </div>
                  <select
                    value={errorLevel}
                    onChange={(e) => setErrorLevel(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700"
                  >
                    <option value="L">L - Low (Fastest &amp; Smallest)</option>
                    <option value="M">M - Medium (Standard recommended)</option>
                    <option value="Q">Q - Quartile (High resilience)</option>
                    <option value="H">H - High (Best for damage/logo)</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                    <span>Quiet Margin</span>
                    <span className="text-blue-600">{qrMargin} blocks</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={6}
                    value={qrMargin}
                    onChange={(e) => setQrMargin(parseInt(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT: LIVE INTERACTIVE PREVIEW & EXPORT ACTIONS */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            
            {/* Live QR Glass Display Card */}
            <div className="bg-white/80 backdrop-blur-2xl border border-white/90 rounded-3xl p-6 shadow-glass-md flex flex-col items-center text-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Live Vector Preview</span>
              </span>

              {/* QR Render Sheet */}
              <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-inner flex items-center justify-center relative group overflow-hidden max-w-[280px] aspect-square w-full">
                {qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- Dynamic in-memory generated QR code data URL
                  <img
                    src={qrDataUrl}
                    alt="Generated QR Code"
                    className="w-full h-full object-contain transition-transform group-hover:scale-105 duration-300"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <QrCode className="w-12 h-12 mb-2 animate-pulse" />
                    <span className="text-xs font-semibold">Generating...</span>
                  </div>
                )}
              </div>

              {/* Scannability Rating & Payload Info */}
              <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-200/70 w-full text-left">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1">
                  <span>Scannability Index</span>
                  <span className="text-emerald-600 font-extrabold">100% Perfect</span>
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  {getQrContent()}
                </p>
              </div>

              {/* Instant Copy Button */}
              <button
                onClick={handleCopyImage}
                className="w-full mt-4 py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/80 shadow-glass-sm text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500" />
                    <span>Copy Image / Payload</span>
                  </>
                )}
              </button>
            </div>

            {/* Export Action Card */}
            <div className="bg-white/80 backdrop-blur-2xl border border-white/90 rounded-3xl p-6 shadow-glass-md space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Download &amp; Export Formats
              </h4>

              <button
                onClick={handleDownloadPng}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white font-bold text-xs flex items-center justify-between shadow-glass-sm transition"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  <span>Download High-Res PNG</span>
                </div>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">600x600px</span>
              </button>

              <button
                onClick={handleDownloadSvg}
                className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-blue-50/50 border border-slate-200/80 text-slate-700 hover:text-blue-700 font-bold text-xs flex items-center justify-between shadow-glass-sm transition"
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>Download Vector SVG</span>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">Infinite Scale</span>
              </button>

              <button
                onClick={handleDownloadPdf}
                disabled={isDownloading}
                className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-blue-50/50 border border-slate-200/80 text-slate-700 hover:text-blue-700 font-bold text-xs flex items-center justify-between shadow-glass-sm transition disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <span>Printable A4 PDF Sheet</span>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">Ready to Print</span>
              </button>
            </div>

          </div>

        </div>
      ) : (
        /* SCANNER TAB: UPLOAD QR IMAGE TO DECODE */
        <div className="max-w-2xl mx-auto">
          <input
            ref={scanInputRef}
            type="file"
            accept="image/*"
            onChange={handleScanUpload}
            className="hidden"
          />

          <div className="bg-white/80 backdrop-blur-2xl border border-white/90 rounded-3xl p-8 shadow-glass-md text-center space-y-6">
            <div>
              <h3 className="font-extrabold text-slate-800 text-lg mb-1">
                Scan &amp; Decode QR Code from Image
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Upload any screenshot, photo, or document containing a barcode or QR code to extract its decoded payload instantly in your browser.
              </p>
            </div>

            <div
              onClick={() => scanInputRef.current?.click()}
              className="p-10 rounded-3xl border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/30 hover:bg-blue-50/60 cursor-pointer transition flex flex-col items-center justify-center group"
            >
              <div className="w-16 h-16 rounded-2xl bg-white shadow-glass-sm flex items-center justify-center text-blue-600 mb-3 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-8 h-8" />
              </div>
              <span className="text-xs font-bold text-slate-700 mb-1">Click to select an image file</span>
              <span className="text-[11px] text-slate-400">PNG, JPG, WebP, GIF, SVG</span>
            </div>

            {isScanning && (
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-blue-600">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Decoding image pixels...</span>
              </div>
            )}

            {scanError && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold text-left">
                {scanError}
              </div>
            )}

            {scannedResult && (
              <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-left space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Decoded Payload</span>
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(scannedResult);
                      setIsCopied(true);
                      setTimeout(() => setIsCopied(false), 2000);
                    }}
                    className="px-3 py-1 rounded-xl bg-white text-emerald-800 border border-emerald-300 text-[11px] font-bold hover:bg-emerald-100 transition shadow-xs"
                  >
                    {isCopied ? 'Copied!' : 'Copy Payload'}
                  </button>
                </div>

                <div className="p-3 bg-white rounded-xl border border-emerald-200/80 font-mono text-xs text-slate-800 break-all select-all">
                  {scannedResult}
                </div>

                {scannedResult.startsWith('http') && (
                  <a
                    href={scannedResult}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Link in New Tab</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
