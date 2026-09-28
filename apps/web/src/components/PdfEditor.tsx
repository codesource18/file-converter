'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Type, 
  Pen, 
  Highlighter, 
  Square, 
  Circle, 
  Eraser, 
  ShieldAlert, 
  Stamp, 
  RotateCw, 
  Trash2, 
  Plus, 
  Undo, 
  Redo, 
  ZoomIn, 
  ZoomOut, 
  Download, 
  ArrowLeft, 
  Check, 
  Sparkles, 
  UploadCloud, 
  FileText, 
  MousePointer, 
  ChevronLeft, 
  ChevronRight,
  Edit3,
  Bold,
  Italic,
  Sliders,
  Palette,
  Image as ImageIcon,
  PenTool,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  X,
  Layers,
  FileCheck,
  PlusCircle,
  Tag,
  Move
} from 'lucide-react';
import { PDFDocument, degrees } from 'pdf-lib';
import { PDFAnnotation } from '@fileconverter/shared-types';
import { applyAnnotationsToPdf } from '@fileconverter/conversion-core';
import { useConverterStore } from '../store/converter-store';

interface ExtractedTextItem {
  id: string;
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: 'serif' | 'sans-serif' | 'monospace';
  isBold: boolean;
  isItalic: boolean;
  pageNumber: number;
}

export const PdfEditor: React.FC = () => {
  const { activeFile, setActiveFile, setActiveView, setResult, addRecentActivity } = useConverterStore();
  
  // Navigation & Document State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number }>({ width: 595, height: 842 });
  const [zoom, setZoom] = useState(1.0);
  const [activeTool, setActiveTool] = useState<string>('edit-text');
  const [annotations, setAnnotations] = useState<PDFAnnotation[]>([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  
  // Typography & Styling State
  const [textColor, setTextColor] = useState('#000000');
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans-serif' | 'monospace'>('serif');
  const [fontSize, setFontSize] = useState(14);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [opacity, setOpacity] = useState(1.0);
  
  // Custom Stamp State
  const [customStampInput, setCustomStampInput] = useState('');
  const [stampColor, setStampColor] = useState('#dc2626');
  
  // Modal & Export States
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Signature Pad State
  const [signatureMode, setSignatureMode] = useState<'draw' | 'type'>('draw');
  const [signatureTypedText, setSignatureTypedText] = useState('');
  const [isSignatureDrawing, setIsSignatureDrawing] = useState(false);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Direct In-Place Text Editing State
  const [extractedTexts, setExtractedTexts] = useState<{ [page: number]: ExtractedTextItem[] }>({});
  const [editingTextItem, setEditingTextItem] = useState<{
    id: string;
    originalStr: string;
    currentStr: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
    fontFamily: 'serif' | 'sans-serif' | 'monospace';
    isBold: boolean;
    isItalic: boolean;
    bgColor: string;
    isNew: boolean;
  } | null>(null);

  // Undo / Redo history
  const [history, setHistory] = useState<PDFAnnotation[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // High-performance Drawing Layer & Canvas Refs
  const pageCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageUploadRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const pdfDocRef = useRef<PDFDocument | null>(null);
  const pdfBufferRef = useRef<ArrayBuffer | null>(null);
  const [pdfJsDoc, setPdfJsDoc] = useState<any>(null);
  const [pageThumbnails, setPageThumbnails] = useState<{ [page: number]: string }>({});

  // Performance Optimization Refs (Avoid React re-render lags during active drag/draw)
  const isDrawingRef = useRef(false);
  const drawPointsRef = useRef<{ x: number; y: number }[]>([]);
  const activeRenderTaskRef = useRef<any>(null);
  const isDraggingRef = useRef(false);
  const dragInfoRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const [liveDragPosition, setLiveDragPosition] = useState<{ id: string; x: number; y: number } | null>(null);

  // History Manager
  const pushHistory = useCallback((newAnnotations: PDFAnnotation[]) => {
    setHistory(prev => {
      const updated = prev.slice(0, historyIndex + 1);
      updated.push(newAnnotations);
      return updated;
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setAnnotations(history[historyIndex - 1]);
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setAnnotations(history[historyIndex + 1]);
    }
  }, [historyIndex, history]);

  // Fit Width Calculation
  const handleFitWidth = useCallback(() => {
    if (!workspaceRef.current || !pageDimensions.width) return;
    const availableWidth = workspaceRef.current.clientWidth - 80;
    const newZoom = Math.max(0.2, Math.min(3.0, +(availableWidth / pageDimensions.width).toFixed(2)));
    setZoom(newZoom);
  }, [pageDimensions.width]);

  // Fit Entire Page Calculation (Zero Cropping Guarantee)
  const handleFitPage = useCallback(() => {
    if (!workspaceRef.current || !pageDimensions.width || !pageDimensions.height) return;
    const availableWidth = workspaceRef.current.clientWidth - 80;
    const availableHeight = workspaceRef.current.clientHeight - 80;
    const scaleX = availableWidth / pageDimensions.width;
    const scaleY = availableHeight / pageDimensions.height;
    const newZoom = Math.max(0.2, Math.min(3.0, +(Math.min(scaleX, scaleY)).toFixed(2)));
    setZoom(newZoom);
  }, [pageDimensions.width, pageDimensions.height]);

  // Fast Sample Canvas Background Color
  const sampleCanvasBgColor = useCallback((x: number, y: number): string => {
    if (!pageCanvasRef.current) return '#ffffff';
    try {
      const ctx = pageCanvasRef.current.getContext('2d', { willReadFrequently: true });
      if (!ctx) return '#ffffff';
      const pixelRatio = typeof window !== 'undefined' ? (window.devicePixelRatio || 2) : 2;
      const scale = zoom * pixelRatio;
      const pixel = ctx.getImageData(Math.max(0, x * scale), Math.max(0, y * scale), 1, 1).data;
      if (pixel[3] < 10) return '#ffffff';
      const r = pixel[0].toString(16).padStart(2, '0');
      const g = pixel[1].toString(16).padStart(2, '0');
      const b = pixel[2].toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    } catch {
      return '#ffffff';
    }
  }, [zoom]);

  // Initialize and load PDF document with smooth background workers
  const loadPdfDocument = useCallback(async (file: File | Blob) => {
    try {
      const buffer = await file.arrayBuffer();
      pdfBufferRef.current = buffer.slice(0);
      
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      pdfDocRef.current = doc;
      const count = doc.getPageCount();
      setTotalPages(count);
      setCurrentPage(1);

      if (count > 0) {
        const firstPage = doc.getPage(0);
        const { width, height } = firstPage.getSize();
        setPageDimensions({ width: Math.round(width), height: Math.round(height) });
      }

      // Load PDF.js for crisp hardware-accelerated raster rendering
      try {
        const pdfjsLib = await import('pdfjs-dist');
        if (typeof window !== 'undefined') {
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;
        }
        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
        const loadedPdf = await loadingTask.promise;
        setPdfJsDoc(loadedPdf);

        // Pre-render thumbnails for all pages in background
        const thumbs: { [page: number]: string } = {};
        for (let p = 1; p <= count; p++) {
          try {
            const page = await loadedPdf.getPage(p);
            const thumbViewport = page.getViewport({ scale: 0.25 });
            const thumbCanvas = document.createElement('canvas');
            thumbCanvas.width = thumbViewport.width;
            thumbCanvas.height = thumbViewport.height;
            const thumbCtx = thumbCanvas.getContext('2d');
            if (thumbCtx) {
              await page.render({ canvasContext: thumbCtx, viewport: thumbViewport }).promise;
              thumbs[p] = thumbCanvas.toDataURL();
            }
          } catch (tErr) {
            console.warn(`Thumbnail warning for page ${p}:`, tErr);
          }
        }
        setPageThumbnails(thumbs);

        // Initial auto-fit
        setTimeout(() => {
          if (workspaceRef.current && count > 0) {
            const availW = workspaceRef.current.clientWidth - 80;
            const availH = workspaceRef.current.clientHeight - 80;
            const firstPage = doc.getPage(0);
            const { width, height } = firstPage.getSize();
            const fitScale = Math.min(availW / width, availH / height);
            setZoom(Math.max(0.3, Math.min(1.5, +fitScale.toFixed(2))));
          }
        }, 80);

      } catch (pdfJsErr) {
        console.warn('PDF.js rendering preview fallback:', pdfJsErr);
      }
    } catch (err) {
      console.error('Failed to parse PDF document:', err);
    }
  }, []);

  // Extract text layer from current page
  useEffect(() => {
    async function extractPageText() {
      if (!pdfJsDoc || extractedTexts[currentPage]) return;

      try {
        const page = await pdfJsDoc.getPage(currentPage);
        const textContent = await page.getTextContent();
        const viewport = page.getViewport({ scale: 1.0 });

        const items: ExtractedTextItem[] = [];

        textContent.items.forEach((item: any, idx: number) => {
          if (!item.str || !item.str.trim()) return;

          const tx = item.transform[4];
          const ty = item.transform[5];
          const calculatedFontSize = Math.round(
            Math.sqrt(item.transform[0] * item.transform[0] + item.transform[1] * item.transform[1])
          ) || Math.round(item.height) || 12;

          const fontNameLower = (item.fontName || '').toLowerCase();
          let detectedFamily: 'serif' | 'sans-serif' | 'monospace' = 'serif';
          if (fontNameLower.includes('courier') || fontNameLower.includes('mono') || fontNameLower.includes('consolas')) {
            detectedFamily = 'monospace';
          } else if (fontNameLower.includes('helvetica') || fontNameLower.includes('arial') || fontNameLower.includes('sans')) {
            detectedFamily = 'sans-serif';
          }

          const detectedBold = fontNameLower.includes('bold') || fontNameLower.includes('black') || fontNameLower.includes('heavy');
          const detectedItalic = fontNameLower.includes('italic') || fontNameLower.includes('oblique');

          const [vx, vy] = viewport.convertToViewportPoint(tx, ty);

          items.push({
            id: `text_${currentPage}_${idx}_${Math.random().toString(36).substr(2, 4)}`,
            str: item.str,
            x: Math.round(vx),
            y: Math.round(vy - calculatedFontSize),
            width: Math.max(Math.round(item.width), 12),
            height: Math.max(Math.round(item.height || calculatedFontSize), 12),
            fontSize: calculatedFontSize,
            fontFamily: detectedFamily,
            isBold: detectedBold,
            isItalic: detectedItalic,
            pageNumber: currentPage
          });
        });

        setExtractedTexts(prev => ({ ...prev, [currentPage]: items }));
      } catch (err) {
        console.warn('Text layer extraction note:', err);
      }
    }

    extractPageText();
  }, [pdfJsDoc, currentPage, extractedTexts]);

  // Smooth cancellation-safe Canvas Rendering
  useEffect(() => {
    let isCancelled = false;

    async function renderPage() {
      if (!pdfJsDoc || !pageCanvasRef.current) return;
      
      // Cancel any ongoing render task to avoid frame stutters
      if (activeRenderTaskRef.current) {
        try {
          activeRenderTaskRef.current.cancel();
        } catch {
          // ignore task cancellation
        }
      }

      try {
        const page = await pdfJsDoc.getPage(currentPage);
        if (isCancelled) return;

        const baseViewport = page.getViewport({ scale: 1.0 });
        const naturalWidth = Math.round(baseViewport.width);
        const naturalHeight = Math.round(baseViewport.height);
        
        setPageDimensions({ width: naturalWidth, height: naturalHeight });

        const pixelRatio = typeof window !== 'undefined' ? (window.devicePixelRatio || 2) : 2;
        const renderViewport = page.getViewport({ scale: zoom * pixelRatio });
        const canvas = pageCanvasRef.current;
        const context = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
        if (!context) return;

        canvas.width = Math.floor(renderViewport.width);
        canvas.height = Math.floor(renderViewport.height);

        const renderContext = {
          canvasContext: context,
          viewport: renderViewport,
        };
        const renderTask = page.render(renderContext);
        activeRenderTaskRef.current = renderTask;
        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn('Canvas render info:', err);
        }
      }
    }

    renderPage();
    return () => { isCancelled = true; };
  }, [pdfJsDoc, currentPage, zoom]);

  // Auto-load activeFile if passed from homepage
  useEffect(() => {
    if (activeFile) {
      loadPdfDocument(activeFile);
    }
  }, [activeFile, loadPdfDocument]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setActiveFile(file);
      setExtractedTexts({});
      setAnnotations([]);
      setHistory([]);
      setHistoryIndex(-1);
      await loadPdfDocument(file);
    }
  };

  // Image Annotation Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          const newAnn: PDFAnnotation = {
            id: `img_${Date.now()}`,
            type: 'image',
            pageNumber: currentPage,
            x: Math.round(pageDimensions.width / 3),
            y: Math.round(pageDimensions.height / 3),
            width: 160,
            height: 100,
            imageData: dataUrl,
            opacity: 1.0
          };
          const next = [...annotations, newAnn];
          setAnnotations(next);
          pushHistory(next);
          setSelectedAnnotationId(newAnn.id);
          setActiveTool('select');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Keyboard Shortcuts (Delete, Undo, Redo, Nudge Arrows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingTextItem) {
        if (e.key === 'Escape') setEditingTextItem(null);
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedAnnotationId) {
        setAnnotations(prev => {
          const filtered = prev.filter(a => a.id !== selectedAnnotationId);
          pushHistory(filtered);
          return filtered;
        });
        setSelectedAnnotationId(null);
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.metaKey || e.ctrlKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Escape') {
        setSelectedAnnotationId(null);
      } else if (selectedAnnotationId && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        const delta = e.shiftKey ? 10 : 1;
        const dx = e.key === 'ArrowLeft' ? -delta : e.key === 'ArrowRight' ? delta : 0;
        const dy = e.key === 'ArrowUp' ? -delta : e.key === 'ArrowDown' ? delta : 0;
        setAnnotations(prev =>
          prev.map(ann =>
            ann.id === selectedAnnotationId
              ? { ...ann, x: Math.max(0, ann.x + dx), y: Math.max(0, ann.y + dy) }
              : ann
          )
        );
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAnnotationId, editingTextItem, handleUndo, handleRedo, pushHistory]);

  // Start in-place editing of text with matched styling
  const handleStartEditingExistingText = (item: ExtractedTextItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const sampledBg = sampleCanvasBgColor(item.x, item.y);
    
    setEditingTextItem({
      id: item.id,
      originalStr: item.str,
      currentStr: item.str,
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height,
      fontSize: item.fontSize,
      fontFamily: item.fontFamily,
      isBold: item.isBold,
      isItalic: item.isItalic,
      bgColor: sampledBg,
      isNew: false
    });
    setFontSize(item.fontSize);
    setFontFamily(item.fontFamily);
    setIsBold(item.isBold);
    setIsItalic(item.isItalic);
  };

  // Submit in-place edited text
  const handleSubmitEditedText = () => {
    if (!editingTextItem) return;

    const trimmed = editingTextItem.currentStr;
    if (trimmed && (editingTextItem.isNew || trimmed !== editingTextItem.originalStr)) {
      const annList = [...annotations];

      if (!editingTextItem.isNew) {
        const whiteoutMask: PDFAnnotation = {
          id: `mask_${editingTextItem.id}`,
          type: 'whiteout',
          pageNumber: currentPage,
          x: Math.max(0, editingTextItem.x - 1),
          y: Math.max(0, editingTextItem.y),
          width: Math.max(editingTextItem.width + 2, 10),
          height: Math.max(editingTextItem.height, 10),
          backgroundColor: editingTextItem.bgColor || '#ffffff'
        };
        annList.push(whiteoutMask);
      }

      const newTextAnn: PDFAnnotation = {
        id: `text_edit_${Date.now()}`,
        type: 'text',
        pageNumber: currentPage,
        x: editingTextItem.x,
        y: editingTextItem.y,
        content: trimmed,
        color: textColor,
        fontSize: editingTextItem.fontSize || fontSize,
        fontFamily: editingTextItem.fontFamily || fontFamily,
        isBold: editingTextItem.isBold,
        isItalic: editingTextItem.isItalic
      };
      annList.push(newTextAnn);

      setAnnotations(annList);
      pushHistory(annList);
    }

    setEditingTextItem(null);
  };

  // HIGH-PERFORMANCE GLOBAL DRAG ENGINE (60FPS Smooth RAF)
  const handleStartDrag = (ann: PDFAnnotation, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAnnotationId(ann.id);
    if (activeTool !== 'select') return;

    isDraggingRef.current = true;
    dragInfoRef.current = {
      id: ann.id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: ann.x,
      initialY: ann.y,
      currentX: ann.x,
      currentY: ann.y
    };

    let rafId: number | null = null;

    const onGlobalMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current || !dragInfoRef.current) return;
      const dx = Math.round((moveEvent.clientX - dragInfoRef.current.startX) / zoom);
      const dy = Math.round((moveEvent.clientY - dragInfoRef.current.startY) / zoom);
      const newX = Math.max(0, dragInfoRef.current.initialX + dx);
      const newY = Math.max(0, dragInfoRef.current.initialY + dy);
      
      dragInfoRef.current.currentX = newX;
      dragInfoRef.current.currentY = newY;

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setLiveDragPosition({
          id: dragInfoRef.current!.id,
          x: newX,
          y: newY
        });
      });
    };

    const onGlobalMouseUp = () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onGlobalMouseMove);
      window.removeEventListener('mouseup', onGlobalMouseUp);

      if (isDraggingRef.current && dragInfoRef.current) {
        const finalX = dragInfoRef.current.currentX;
        const finalY = dragInfoRef.current.currentY;
        const targetId = dragInfoRef.current.id;

        setAnnotations(prev => {
          const updated = prev.map(a =>
            a.id === targetId ? { ...a, x: finalX, y: finalY } : a
          );
          pushHistory(updated);
          return updated;
        });
      }

      isDraggingRef.current = false;
      dragInfoRef.current = null;
      setLiveDragPosition(null);
    };

    window.addEventListener('mousemove', onGlobalMouseMove);
    window.addEventListener('mouseup', onGlobalMouseUp);
  };

  // HIGH-PERFORMANCE DRAWING & CANVAS INTERACTION
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (editingTextItem) {
      handleSubmitEditedText();
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) / zoom);
    const y = Math.round((e.clientY - rect.top) / zoom);

    if (activeTool === 'select') {
      setSelectedAnnotationId(null);
      return;
    }

    if (activeTool === 'text' || activeTool === 'edit-text') {
      const sampledBg = sampleCanvasBgColor(x, y);
      setEditingTextItem({
        id: `new_text_${Date.now()}`,
        originalStr: '',
        currentStr: '',
        x,
        y,
        width: 100,
        height: fontSize + 4,
        fontSize,
        fontFamily,
        isBold,
        isItalic,
        bgColor: sampledBg,
        isNew: true
      });
      return;
    }

    if (activeTool === 'draw') {
      isDrawingRef.current = true;
      drawPointsRef.current = [{ x, y }];

      // Initialize draw overlay canvas
      const dCanvas = drawCanvasRef.current;
      if (dCanvas) {
        const ctx = dCanvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, dCanvas.width, dCanvas.height);
          ctx.beginPath();
          ctx.moveTo(x * zoom, y * zoom);
          ctx.strokeStyle = textColor;
          ctx.lineWidth = strokeWidth * zoom;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
        }
      }

      const onDrawMove = (moveEvt: MouseEvent) => {
        if (!isDrawingRef.current) return;
        const currentRect = e.currentTarget.getBoundingClientRect();
        const ptX = Math.round((moveEvt.clientX - currentRect.left) / zoom);
        const ptY = Math.round((moveEvt.clientY - currentRect.top) / zoom);
        
        drawPointsRef.current.push({ x: ptX, y: ptY });

        const dC = drawCanvasRef.current;
        if (dC) {
          const ctx = dC.getContext('2d');
          if (ctx) {
            ctx.lineTo(ptX * zoom, ptY * zoom);
            ctx.stroke();
          }
        }
      };

      const onDrawUp = () => {
        window.removeEventListener('mousemove', onDrawMove);
        window.removeEventListener('mouseup', onDrawUp);
        isDrawingRef.current = false;

        const pts = drawPointsRef.current;
        if (pts.length > 1) {
          const newAnn: PDFAnnotation = {
            id: Math.random().toString(36).substring(2, 9),
            type: 'draw',
            pageNumber: currentPage,
            x: pts[0].x,
            y: pts[0].y,
            points: [...pts],
            color: textColor,
            strokeWidth,
            opacity
          };
          const next = [...annotations, newAnn];
          setAnnotations(next);
          pushHistory(next);
        }

        const dC = drawCanvasRef.current;
        if (dC) {
          const ctx = dC.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, dC.width, dC.height);
        }
        drawPointsRef.current = [];
      };

      window.addEventListener('mousemove', onDrawMove);
      window.addEventListener('mouseup', onDrawUp);

    } else if (activeTool === 'highlight') {
      const newAnn: PDFAnnotation = {
        id: Math.random().toString(36).substring(2, 9),
        type: 'highlight',
        pageNumber: currentPage,
        x,
        y,
        width: 160,
        height: 24,
        color: '#facc15',
        opacity: 0.4
      };
      const next = [...annotations, newAnn];
      setAnnotations(next);
      pushHistory(next);
      setSelectedAnnotationId(newAnn.id);
    } else if (activeTool === 'whiteout' || activeTool === 'redact') {
      const sampledBg = sampleCanvasBgColor(x, y);
      const newAnn: PDFAnnotation = {
        id: Math.random().toString(36).substring(2, 9),
        type: activeTool,
        pageNumber: currentPage,
        x,
        y,
        width: 140,
        height: 28,
        backgroundColor: activeTool === 'whiteout' ? sampledBg : '#000000'
      };
      const next = [...annotations, newAnn];
      setAnnotations(next);
      pushHistory(next);
      setSelectedAnnotationId(newAnn.id);
    } else if (activeTool === 'rect' || activeTool === 'circle') {
      const newAnn: PDFAnnotation = {
        id: Math.random().toString(36).substring(2, 9),
        type: 'shape',
        shapeType: activeTool === 'rect' ? 'rectangle' : 'circle',
        pageNumber: currentPage,
        x,
        y,
        width: 120,
        height: 70,
        color: textColor,
        strokeWidth,
        opacity
      };
      const next = [...annotations, newAnn];
      setAnnotations(next);
      pushHistory(next);
      setSelectedAnnotationId(newAnn.id);
    }
  };

  const handleAddWatermark = (text?: string) => {
    const stampText = text || customStampInput.trim() || 'CONFIDENTIAL';
    if (!stampText) return;
    const newAnn: PDFAnnotation = {
      id: Math.random().toString(36).substring(2, 9),
      type: 'watermark',
      pageNumber: currentPage,
      x: Math.round(pageDimensions.width / 4),
      y: Math.round(pageDimensions.height / 2),
      content: stampText.toUpperCase(),
      color: stampColor,
      fontSize: 42,
      opacity: Math.min(opacity, 0.45)
    };
    const next = [...annotations, newAnn];
    setAnnotations(next);
    pushHistory(next);
    setSelectedAnnotationId(newAnn.id);
    setActiveTool('select');
  };

  // Signature Pad Handlers
  const handleSignatureCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e293b';
    setIsSignatureDrawing(true);
  };

  const handleSignatureCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isSignatureDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleSignatureCanvasMouseUp = () => {
    setIsSignatureDrawing(false);
  };

  const handleClearSignatureCanvas = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleApplySignature = () => {
    let signatureDataUrl = '';
    if (signatureMode === 'draw') {
      const canvas = signatureCanvasRef.current;
      if (!canvas) return;
      signatureDataUrl = canvas.toDataURL('image/png');
    } else {
      if (!signatureTypedText.trim()) return;
      const textCanvas = document.createElement('canvas');
      textCanvas.width = 400;
      textCanvas.height = 120;
      const ctx = textCanvas.getContext('2d');
      if (ctx) {
        ctx.font = 'italic 36px "Brush Script MT", "Caveat", "Segoe Script", cursive';
        ctx.fillStyle = '#1e293b';
        ctx.fillText(signatureTypedText, 20, 70);
        signatureDataUrl = textCanvas.toDataURL('image/png');
      }
    }

    if (signatureDataUrl) {
      const newAnn: PDFAnnotation = {
        id: `sig_${Date.now()}`,
        type: 'signature',
        pageNumber: currentPage,
        x: Math.round(pageDimensions.width / 3),
        y: Math.round(pageDimensions.height / 2),
        width: 150,
        height: 60,
        imageData: signatureDataUrl,
        opacity: 1.0
      };
      const next = [...annotations, newAnn];
      setAnnotations(next);
      pushHistory(next);
      setSelectedAnnotationId(newAnn.id);
      setActiveTool('select');
      setShowSignatureModal(false);
      setSignatureTypedText('');
    }
  };

  const handleInsertPage = async () => {
    if (!pdfDocRef.current) return;
    pdfDocRef.current.insertPage(currentPage, [pageDimensions.width, pageDimensions.height]);
    setTotalPages(pdfDocRef.current.getPageCount());
    setCurrentPage(currentPage + 1);
  };

  const handleDeletePage = async () => {
    if (!pdfDocRef.current || totalPages <= 1) return;
    pdfDocRef.current.removePage(currentPage - 1);
    setTotalPages(pdfDocRef.current.getPageCount());
    setCurrentPage(Math.max(1, currentPage - 1));
  };

  const handleRotatePage = async () => {
    if (!pdfDocRef.current) return;
    const page = pdfDocRef.current.getPage(currentPage - 1);
    const cur = page.getRotation().angle;
    page.setRotation(degrees((cur + 90) % 360));
  };

  const handleExport = async () => {
    setIsExporting(true);
    let sourceFile = activeFile;
    if (!sourceFile) {
      const blankDoc = await PDFDocument.create();
      blankDoc.addPage([595, 842]);
      const bytes = await blankDoc.save();
      sourceFile = new File([bytes.buffer as ArrayBuffer], 'untitled_document.pdf', { type: 'application/pdf' });
    }

    try {
      const res = await applyAnnotationsToPdf(sourceFile, sourceFile.name, annotations);
      setResult(res);
      addRecentActivity({
        toolName: 'Edit PDF',
        actionSummary: `Exported edited PDF (${annotations.length} modifications)`,
        fromFormat: 'PDF',
        toFormat: 'PDF',
        mode: 'local'
      });
      setActiveView('home');
    } catch (err) {
      console.error('Failed to export edited PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const selectedAnnotation = annotations.find(a => a.id === selectedAnnotationId);
  const currentPageTexts = extractedTexts[currentPage] || [];

  const toolsList = [
    { id: 'edit-text', label: 'Edit Text', icon: Edit3, color: 'text-cyan-400' },
    { id: 'select', label: 'Select', icon: MousePointer, color: 'text-blue-400' },
    { id: 'text', label: 'Add Text', icon: Type, color: 'text-sky-400' },
    { id: 'draw', label: 'Pen', icon: Pen, color: 'text-indigo-400' },
    { id: 'highlight', label: 'Highlight', icon: Highlighter, color: 'text-amber-400' },
    { id: 'rect', label: 'Rectangle', icon: Square, color: 'text-blue-400' },
    { id: 'circle', label: 'Circle', icon: Circle, color: 'text-blue-400' },
    { id: 'whiteout', label: 'Whiteout', icon: Eraser, color: 'text-slate-300' },
    { id: 'redact', label: 'Redact', icon: ShieldAlert, color: 'text-rose-400' },
    { id: 'stamp', label: 'Stamp', icon: Stamp, color: 'text-red-400' },
    { id: 'image', label: 'Image', icon: ImageIcon, color: 'text-emerald-400' },
    { id: 'signature', label: 'Sign', icon: PenTool, color: 'text-purple-400' },
  ];

  const activeToolObj = toolsList.find(t => t.id === activeTool) || toolsList[0];

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] select-none overflow-hidden font-sans relative">
      
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileUpload}
        className="hidden"
      />
      <input
        ref={imageUploadRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* TOP STREAMLINED TOOLBAR */}
      <header className="h-16 bg-slate-950/70 backdrop-blur-2xl border-b border-white/10 px-4 md:px-6 flex items-center justify-between shrink-0 z-30 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        
        {/* Left Back, File Loader & Page Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setActiveView('home')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-slate-200 hover:text-white text-xs font-semibold border border-white/15 backdrop-blur-md transition shadow-glass-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exit</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 hover:text-cyan-200 text-xs font-bold border border-cyan-400/30 backdrop-blur-md shadow-[0_0_15px_rgba(56,189,248,0.25)] transition"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>{activeFile ? 'Replace PDF' : 'Open PDF'}</span>
          </button>

          <div className="h-4 w-px bg-white/15 mx-1" />

          {/* Page Navigator */}
          <div className="flex items-center gap-1 text-xs font-bold text-slate-300 bg-white/[0.08] px-2.5 py-1 rounded-full border border-white/15 backdrop-blur-md shadow-glass-sm">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="w-5 h-5 rounded-full hover:bg-white/10 flex items-center justify-center disabled:opacity-30 text-slate-300"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-1 text-cyan-400">{currentPage} <span className="text-slate-500 font-normal">/</span> {totalPages}</span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className="w-5 h-5 rounded-full hover:bg-white/10 flex items-center justify-center disabled:opacity-30 text-slate-300"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Center Active Tool Badge Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-md text-xs font-semibold text-slate-300 shadow-glass-sm">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
          <span>Active Tool: <strong className="text-white">{activeToolObj.label}</strong></span>
        </div>

        {/* Right Zoom, Fit Controls, Undo/Redo & Save */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-1.5 sm:p-2 rounded-full bg-white/[0.08] hover:bg-white/[0.15] disabled:opacity-30 text-slate-300 hover:text-white border border-white/15 backdrop-blur-md transition shadow-glass-sm"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 sm:p-2 rounded-full bg-white/[0.08] hover:bg-white/[0.15] disabled:opacity-30 text-slate-300 hover:text-white border border-white/15 backdrop-blur-md transition shadow-glass-sm"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-white/15 mx-1 hidden sm:block" />

          {/* Fit Controls */}
          <button
            onClick={handleFitWidth}
            className="hidden md:inline-flex px-2.5 py-1 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-[11px] font-semibold text-slate-300 hover:text-white border border-white/15 backdrop-blur-md transition shadow-glass-sm"
            title="Fit Width"
          >
            Fit Width
          </button>

          <button
            onClick={handleFitPage}
            className="hidden md:inline-flex px-2.5 py-1 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-[11px] font-semibold text-slate-300 hover:text-white border border-white/15 backdrop-blur-md transition shadow-glass-sm"
            title="Fit Page"
          >
            Fit Page
          </button>

          {/* Zoom In/Out & Reset */}
          <div className="flex items-center bg-white/[0.08] rounded-full border border-white/15 backdrop-blur-md shadow-glass-sm p-0.5">
            <button
              onClick={() => setZoom(z => Math.max(0.2, +(z - 0.1).toFixed(2)))}
              className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <button
              onClick={() => setZoom(1.0)}
              className="text-[11px] font-bold text-cyan-300 px-1.5 hover:text-cyan-200 transition"
              title="Reset Zoom to 100%"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={() => setZoom(z => Math.min(3.0, +(z + 0.1).toFixed(2)))}
              className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition"
              title="Zoom In"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold shadow-[0_0_20px_rgba(56,189,248,0.4)] transition ml-1 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Saving...' : 'Save & Export'}</span>
          </button>
        </div>
      </header>

      {/* MAIN WORKSPACE LAYOUT */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT PAGE THUMBNAILS RAIL */}
        <div className="w-44 bg-slate-950/60 backdrop-blur-2xl border-r border-white/10 p-3 overflow-y-auto space-y-3 shrink-0 custom-scrollbar">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Pages ({totalPages})</span>
            </span>
            <button
              onClick={handleInsertPage}
              className="p-1 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30 transition"
              title="Add Blank Page"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
              <div
                key={pNum}
                onClick={() => {
                  if (editingTextItem) handleSubmitEditedText();
                  setCurrentPage(pNum);
                }}
                className={`p-2 rounded-xl cursor-pointer transition-all border text-center relative group ${
                  currentPage === pNum
                    ? 'bg-cyan-500/20 border-cyan-400/80 shadow-[0_0_15px_rgba(56,189,248,0.3)] ring-1 ring-cyan-400/50'
                    : 'bg-white/[0.04] border-white/10 hover:border-white/25 hover:bg-white/[0.08]'
                }`}
              >
                <div className="w-full aspect-[1/1.4] bg-white/[0.06] rounded-lg shadow-inner flex flex-col items-center justify-center text-slate-400 text-xs font-serif mb-1 border border-white/10 overflow-hidden relative">
                  {pageThumbnails[pNum] ? (
                    // eslint-disable-next-line @next/next/no-img-element -- Dynamic in-memory PDF page canvas thumbnail data URL
                    <img src={pageThumbnails[pNum]} alt={`Page ${pNum}`} className="w-full h-full object-contain" />
                  ) : (
                    <>
                      <FileText className="w-6 h-6 text-slate-500 mb-1" />
                      <span className="text-[10px] text-slate-400">Page {pNum}</span>
                    </>
                  )}
                </div>
                <span className={`text-xs font-bold ${currentPage === pNum ? 'text-cyan-300' : 'text-slate-400'}`}>
                  Page {pNum}
                </span>
              </div>
            ))}
          </div>

          {/* Page Actions at Bottom of Thumbnail Rail */}
          <div className="pt-3 border-t border-white/10 space-y-1.5">
            <button
              onClick={handleRotatePage}
              className="w-full py-1.5 px-2 bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-white/10 transition shadow-glass-sm"
            >
              <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Rotate Page</span>
            </button>
            <button
              onClick={handleDeletePage}
              disabled={totalPages <= 1}
              className="w-full py-1.5 px-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 disabled:opacity-30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-rose-500/20 transition shadow-glass-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Page</span>
            </button>
          </div>
        </div>

        {/* CENTER PDF CANVAS WORKSPACE */}
        <div 
          ref={workspaceRef} 
          className="flex-1 overflow-auto p-4 sm:p-8 flex bg-slate-950/40 backdrop-blur-xl relative custom-scrollbar"
        >
          <div className="m-auto flex items-center justify-center p-4">
            
            {/* Main Paper Sheet Container with Hardware-Accelerated Rendering */}
            <div 
              onMouseDown={handleCanvasMouseDown}
              className={`relative bg-white shadow-[0_25px_60px_rgba(0,0,0,0.85)] rounded-md border border-white/20 overflow-hidden select-none shrink-0 transform-gpu ${
                activeTool === 'edit-text' ? 'cursor-text' : activeTool === 'select' ? 'cursor-default' : 'cursor-crosshair'
              }`}
              style={{
                width: `${Math.round(pageDimensions.width * zoom)}px`,
                height: `${Math.round(pageDimensions.height * zoom)}px`,
              }}
            >
              {/* Real PDF Page Background Render Canvas */}
              <canvas
                ref={pageCanvasRef}
                className="absolute inset-0 pointer-events-none z-10 w-full h-full block transform-gpu"
              />

              {/* Real-time Drawing Overlay Canvas */}
              <canvas
                ref={drawCanvasRef}
                width={Math.round(pageDimensions.width * zoom)}
                height={Math.round(pageDimensions.height * zoom)}
                className="absolute inset-0 pointer-events-none z-25 w-full h-full block"
              />

              {/* EMPTY STATE: DIRECT UPLOAD CARD IF NO PDF FILE LOADED */}
              {!activeFile && (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center cursor-pointer bg-slate-950/80 backdrop-blur-xl z-30 transition-all hover:bg-slate-950/70 group"
                >
                  <div className="w-18 h-18 p-4 rounded-3xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shadow-[0_0_30px_rgba(56,189,248,0.25)] mb-4 group-hover:scale-105 transition">
                    <UploadCloud className="w-10 h-10" />
                  </div>
                  <h3 className="font-bold text-white text-lg mb-1">Open a PDF to Start Editing</h3>
                  <p className="text-xs text-slate-400 max-w-sm mb-5 leading-relaxed">
                    Click to select a document from your computer or drag and drop it here. 100% private in-browser editing.
                  </p>
                  <span className="px-5 py-2.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 text-white rounded-full text-xs font-bold shadow-[0_0_20px_rgba(56,189,248,0.4)] hover:brightness-110 transition">
                    Select PDF Document
                  </span>
                </div>
              )}

              {/* INTERACTIVE TEXT LAYER FOR DIRECT CLICK-TO-EDIT */}
              {(activeTool === 'edit-text' || activeTool === 'select') && (
                <div className="absolute inset-0 z-20 pointer-events-none">
                  {currentPageTexts.map((item) => (
                    <div
                      key={item.id}
                      onClick={(e) => handleStartEditingExistingText(item, e)}
                      style={{
                        position: 'absolute',
                        left: `${item.x * zoom}px`,
                        top: `${item.y * zoom}px`,
                        width: `${item.width * zoom}px`,
                        height: `${item.height * zoom}px`,
                        fontSize: `${item.fontSize * zoom}px`
                      }}
                      className="pointer-events-auto cursor-text hover:bg-cyan-400/20 hover:outline hover:outline-1 hover:outline-cyan-400/80 rounded-xs transition-all"
                    />
                  ))}
                </div>
              )}

              {/* IN-PLACE TEXT INPUT OVERLAY */}
              {editingTextItem && (
                <div
                  style={{
                    position: 'absolute',
                    left: `${editingTextItem.x * zoom}px`,
                    top: `${editingTextItem.y * zoom}px`,
                    zIndex: 35
                  }}
                  className="animate-in fade-in"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <input
                    ref={textInputRef}
                    type="text"
                    autoFocus
                    value={editingTextItem.currentStr}
                    onChange={(e) => setEditingTextItem({ ...editingTextItem, currentStr: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSubmitEditedText();
                      if (e.key === 'Escape') setEditingTextItem(null);
                    }}
                    onBlur={handleSubmitEditedText}
                    style={{
                      color: textColor,
                      fontSize: `${(editingTextItem.fontSize || fontSize) * zoom}px`,
                      fontFamily: (editingTextItem.fontFamily || fontFamily) === 'serif' ? '"Times New Roman", Times, Georgia, "Liberation Serif", serif' : (editingTextItem.fontFamily || fontFamily) === 'monospace' ? '"Courier New", Courier, monospace' : 'Inter, Helvetica, Arial, sans-serif',
                      fontWeight: editingTextItem.isBold ? 'bold' : 'normal',
                      fontStyle: editingTextItem.isItalic ? 'italic' : 'normal',
                      width: `${Math.max(editingTextItem.currentStr.length * ((editingTextItem.fontSize || fontSize) * 0.58) * zoom, editingTextItem.width * zoom, 30)}px`,
                      backgroundColor: editingTextItem.bgColor || '#ffffff',
                      lineHeight: '1.0'
                    }}
                    className="px-0.5 py-0 outline outline-2 outline-cyan-500 rounded-none shadow-xs text-slate-900 border-0"
                    placeholder="Type text..."
                  />
                </div>
              )}

              {/* Rendered Annotations Overlay with Buttery Smooth Movement */}
              <div className="absolute inset-0 pointer-events-none z-20">
                {annotations
                  .filter(a => a.pageNumber === currentPage)
                  .map((ann) => {
                    const isBeingDragged = liveDragPosition?.id === ann.id;
                    const displayX = isBeingDragged ? liveDragPosition.x : ann.x;
                    const displayY = isBeingDragged ? liveDragPosition.y : ann.y;
                    const isSelected = selectedAnnotationId === ann.id;

                    return (
                      <div
                        key={ann.id}
                        onMouseDown={(e) => handleStartDrag(ann, e)}
                        style={{
                          position: 'absolute',
                          left: `${displayX * zoom}px`,
                          top: `${displayY * zoom}px`,
                          width: ann.width ? `${ann.width * zoom}px` : undefined,
                          height: ann.height ? `${ann.height * zoom}px` : undefined,
                          fontSize: ann.fontSize ? `${ann.fontSize * zoom}px` : undefined,
                          fontFamily: ann.fontFamily === 'serif' ? '"Times New Roman", Times, Georgia, "Liberation Serif", serif' : ann.fontFamily === 'monospace' ? '"Courier New", Courier, monospace' : 'Inter, Helvetica, Arial, sans-serif',
                          fontWeight: ann.isBold ? 'bold' : 'normal',
                          fontStyle: ann.isItalic ? 'italic' : 'normal',
                          backgroundColor: ann.type === 'whiteout' ? (ann.backgroundColor || '#ffffff') : undefined,
                          color: ann.color || '#000000',
                          opacity: ann.opacity ?? 1,
                          lineHeight: '1.0',
                          willChange: isBeingDragged ? 'transform, left, top' : 'auto'
                        }}
                        className={`pointer-events-auto select-none ${
                          activeTool === 'select' ? (isBeingDragged ? 'cursor-grabbing shadow-lg' : 'cursor-grab hover:ring-1 hover:ring-cyan-400/50') : 'cursor-default'
                        } ${
                          isSelected ? 'outline outline-2 outline-cyan-500 ring-2 ring-cyan-400/40 shadow-sm' : ''
                        } ${
                          ann.type === 'redact' ? 'bg-black' :
                          ann.type === 'highlight' ? 'bg-yellow-300/40 rounded' :
                          ann.type === 'shape' && ann.shapeType === 'rectangle' ? 'border-2 border-blue-600 rounded' :
                          ann.type === 'shape' && ann.shapeType === 'circle' ? 'border-2 border-blue-600 rounded-full' :
                          ann.type === 'watermark' ? 'text-red-500/30 rotate-45 font-black text-4xl select-none uppercase tracking-widest' : ''
                        }`}
                      >
                        {/* Drag Handle Tag for Selected Elements */}
                        {isSelected && activeTool === 'select' && (
                          <div className="absolute -top-6 left-0 bg-cyan-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1 pointer-events-none">
                            <Move className="w-2.5 h-2.5" />
                            <span>Drag to Move</span>
                          </div>
                        )}

                        {ann.type === 'draw' && ann.points ? (
                          <svg
                            style={{
                              width: `${(ann.width || pageDimensions.width) * zoom}px`,
                              height: `${(ann.height || pageDimensions.height) * zoom}px`
                            }}
                            className="overflow-visible pointer-events-none"
                          >
                            <polyline
                              fill="none"
                              stroke={ann.color || '#000'}
                              strokeWidth={(ann.strokeWidth || 2) * zoom}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              points={ann.points.map(p => `${p.x * zoom},${p.y * zoom}`).join(' ')}
                            />
                          </svg>
                        ) : (ann.type === 'image' || ann.type === 'signature') && ann.imageData ? (
                          // eslint-disable-next-line @next/next/no-img-element -- Dynamic in-memory client signature/image annotation data URL
                          <img 
                            src={ann.imageData} 
                            alt="Annotation" 
                            className="w-full h-full object-contain pointer-events-none"
                          />
                        ) : (
                          ann.content
                        )}
                      </div>
                    );
                  })}
              </div>

            </div>

          </div>
        </div>

        {/* COMPREHENSIVE RIGHT PROPERTIES & TOOLS PANEL */}
        <div className="w-72 bg-slate-950/65 backdrop-blur-2xl border-l border-white/10 p-4 shrink-0 overflow-y-auto space-y-5 font-sans custom-scrollbar">
          
          {/* Header */}
          <div className="flex items-center gap-2 pb-2.5 border-b border-white/10">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Tools &amp; Properties
            </h4>
          </div>

          {/* 1. ALL TOOLS PALETTE UNDER PROPERTIES */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Select Tool
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {toolsList.map((tool) => {
                const IconComponent = tool.icon;
                const isSelected = activeTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => {
                      if (tool.id === 'image') {
                        imageUploadRef.current?.click();
                      } else if (tool.id === 'signature') {
                        setShowSignatureModal(true);
                      }
                      setActiveTool(tool.id);
                    }}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl text-center border transition-all duration-150 ${
                      isSelected
                        ? 'bg-gradient-to-b from-blue-600/90 to-cyan-500/90 text-white border-cyan-400/80 shadow-[0_0_15px_rgba(56,189,248,0.35)] scale-[1.02]'
                        : 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/[0.09] hover:text-white hover:border-white/20'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 mb-1 ${isSelected ? 'text-white' : tool.color}`} />
                    <span className="text-[10px] font-bold tracking-tight">{tool.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. CONTEXT-AWARE ACTIVE PROPERTIES */}
          <div className="pt-2 border-t border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {activeToolObj.label} Settings
              </span>
              <span className="text-[10px] text-cyan-400 font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                Active
              </span>
            </div>

            {/* Typography Controls */}
            {(activeTool === 'edit-text' || activeTool === 'text' || selectedAnnotation?.type === 'text') && (
              <div className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1.5">Font Family</label>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: 'serif', label: 'Serif', style: 'font-serif' },
                      { id: 'sans-serif', label: 'Sans', style: 'font-sans' },
                      { id: 'monospace', label: 'Mono', style: 'font-mono' }
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => {
                          setFontFamily(f.id as any);
                          if (editingTextItem) setEditingTextItem({ ...editingTextItem, fontFamily: f.id as any });
                        }}
                        className={`py-1.5 px-1 rounded-xl text-[11px] font-semibold border transition text-center ${f.style} ${
                          fontFamily === f.id
                            ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white border-cyan-400 shadow-glass-sm'
                            : 'bg-white/[0.06] border-white/10 text-slate-300 hover:bg-white/[0.12] hover:text-white'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1.5">Font Style</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => {
                        const nb = !isBold;
                        setIsBold(nb);
                        if (editingTextItem) setEditingTextItem({ ...editingTextItem, isBold: nb });
                      }}
                      className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                        isBold 
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white border-cyan-400 shadow-glass-sm' 
                          : 'bg-white/[0.06] border-white/10 text-slate-300 hover:text-white hover:bg-white/[0.12]'
                      }`}
                    >
                      <Bold className="w-3.5 h-3.5" />
                      <span>Bold</span>
                    </button>
                    <button
                      onClick={() => {
                        const ni = !isItalic;
                        setIsItalic(ni);
                        if (editingTextItem) setEditingTextItem({ ...editingTextItem, isItalic: ni });
                      }}
                      className={`py-1.5 px-3 rounded-xl text-xs font-bold italic border transition flex items-center justify-center gap-1.5 ${
                        isItalic 
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white border-cyan-400 shadow-glass-sm' 
                          : 'bg-white/[0.06] border-white/10 text-slate-300 hover:text-white hover:bg-white/[0.12]'
                      }`}
                    >
                      <Italic className="w-3.5 h-3.5" />
                      <span>Italic</span>
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-300 mb-1">
                    <span>Font Size</span>
                    <span className="text-cyan-400">{fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min={8}
                    max={48}
                    value={fontSize}
                    onChange={(e) => {
                      const sz = parseInt(e.target.value);
                      setFontSize(sz);
                      if (editingTextItem) setEditingTextItem({ ...editingTextItem, fontSize: sz });
                    }}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1.5">Text Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-xs font-mono text-slate-300">{textColor}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Stroke & Shape Controls */}
            {(activeTool === 'draw' || activeTool === 'rect' || activeTool === 'circle' || selectedAnnotation?.type === 'draw' || selectedAnnotation?.type === 'shape') && (
              <div className="space-y-3.5">
                <div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-300 mb-1">
                    <span>Stroke Width</span>
                    <span className="text-cyan-400">{strokeWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={12}
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1.5">Stroke Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-xs font-mono text-slate-300">{textColor}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Highlight Controls */}
            {activeTool === 'highlight' && (
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-300 block">Highlighter Preset</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { color: '#facc15', name: 'Yellow' },
                    { color: '#38bdf8', name: 'Cyan' },
                    { color: '#4ade80', name: 'Green' },
                    { color: '#f472b6', name: 'Pink' }
                  ].map(h => (
                    <button
                      key={h.color}
                      onClick={() => setTextColor(h.color)}
                      style={{ backgroundColor: h.color }}
                      className={`h-7 rounded-lg text-[10px] font-bold text-slate-900 border transition ${
                        textColor === h.color ? 'border-white ring-2 ring-cyan-400' : 'border-transparent'
                      }`}
                    >
                      {h.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom & Quick Stamps */}
            {activeTool === 'stamp' && (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1.5">Custom Stamp</label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={customStampInput}
                      onChange={(e) => setCustomStampInput(e.target.value)}
                      placeholder="Type custom text (e.g. PAID, COPY)..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-white/15 text-white text-xs font-bold focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      onClick={() => handleAddWatermark(customStampInput)}
                      className="w-full py-2 bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl text-xs font-bold transition shadow-[0_0_15px_rgba(56,189,248,0.3)] flex items-center justify-center gap-1.5"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Apply Custom Stamp</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10">
                  <label className="text-[11px] font-bold text-slate-300 block mb-1.5">Quick Presets</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['CONFIDENTIAL', 'APPROVED', 'DRAFT', 'VOID', 'PAID', 'FINAL'].map((stamp) => (
                      <button
                        key={stamp}
                        onClick={() => handleAddWatermark(stamp)}
                        className="py-1.5 px-2 bg-white/[0.06] hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 rounded-xl text-[10px] font-black tracking-wider border border-white/10 transition shadow-glass-sm"
                      >
                        {stamp}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10">
                  <label className="text-[11px] font-bold text-slate-300 block mb-1.5">Stamp Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={stampColor}
                      onChange={(e) => setStampColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-xs font-mono text-slate-300">{stampColor}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Image / Signature Quick Launcher */}
            {activeTool === 'image' && (
              <div className="space-y-2">
                <button
                  onClick={() => imageUploadRef.current?.click()}
                  className="w-full py-2 px-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-glass-sm transition"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Choose Image File...</span>
                </button>
                <p className="text-[10px] text-slate-400 text-center">Supports PNG, JPG, SVG, WebP</p>
              </div>
            )}

            {activeTool === 'signature' && (
              <div className="space-y-2">
                <button
                  onClick={() => setShowSignatureModal(true)}
                  className="w-full py-2 px-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-glass-sm transition"
                >
                  <PenTool className="w-4 h-4" />
                  <span>Create New Signature</span>
                </button>
              </div>
            )}

            {/* Opacity Control */}
            <div>
              <div className="flex justify-between text-[11px] font-bold text-slate-300 mb-1">
                <span>Opacity</span>
                <span className="text-cyan-400">{Math.round(opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={1.0}
                step={0.05}
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>

          {/* 3. SELECTED ELEMENT ACTIONS */}
          {selectedAnnotation && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl mt-4">
              <div className="text-xs font-bold text-rose-300 mb-2">Selected ({selectedAnnotation.type})</div>
              <button
                onClick={() => {
                  setAnnotations(annotations.filter(a => a.id !== selectedAnnotationId));
                  setSelectedAnnotationId(null);
                }}
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Element</span>
              </button>
            </div>
          )}

          {/* 4. DOCUMENT STATS */}
          <div className="pt-3 border-t border-white/10 space-y-2 text-[11px] text-slate-400">
            <div className="flex justify-between">
              <span>Page Size:</span>
              <span className="text-slate-200 font-mono">{pageDimensions.width} × {pageDimensions.height} pt</span>
            </div>
            <div className="flex justify-between">
              <span>Modifications:</span>
              <span className="text-cyan-400 font-bold">{annotations.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Current Zoom:</span>
              <span className="text-slate-200 font-mono">{Math.round(zoom * 100)}%</span>
            </div>
          </div>

        </div>

      </div>

      {/* SIGNATURE MODAL */}
      {showSignatureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900/95 backdrop-blur-2xl rounded-3xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-white/20">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PenTool className="w-5 h-5 text-purple-400" />
                <span>Add Signature</span>
              </h3>
              <div className="flex items-center bg-white/[0.08] p-1 rounded-full border border-white/15">
                <button
                  onClick={() => setSignatureMode('draw')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                    signatureMode === 'draw' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Draw
                </button>
                <button
                  onClick={() => setSignatureMode('type')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                    signatureMode === 'type' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Type
                </button>
              </div>
            </div>

            {signatureMode === 'draw' ? (
              <div className="space-y-3">
                <div className="border border-white/15 rounded-2xl bg-white p-2 overflow-hidden shadow-inner">
                  <canvas
                    ref={signatureCanvasRef}
                    width={440}
                    height={160}
                    onMouseDown={handleSignatureCanvasMouseDown}
                    onMouseMove={handleSignatureCanvasMouseMove}
                    onMouseUp={handleSignatureCanvasMouseUp}
                    className="w-full h-40 bg-white cursor-crosshair rounded-xl block"
                  />
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Draw signature with mouse or touch</span>
                  <button
                    onClick={handleClearSignatureCanvas}
                    className="px-3 py-1 bg-white/[0.08] hover:bg-white/[0.15] text-slate-300 rounded-lg font-semibold"
                  >
                    Clear
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  value={signatureTypedText}
                  onChange={(e) => setSignatureTypedText(e.target.value)}
                  placeholder="Type your full name..."
                  className="w-full px-4 py-2.5 rounded-2xl border border-white/15 bg-slate-950/60 text-white focus:outline-none focus:border-purple-400 text-sm font-bold"
                />
                <div className="h-28 bg-white rounded-2xl p-4 flex items-center justify-center border border-white/15 shadow-inner">
                  <span className="font-serif italic text-3xl text-slate-800 tracking-wider">
                    {signatureTypedText || 'Your Signature'}
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-white/10">
              <button
                onClick={() => setShowSignatureModal(false)}
                className="px-4 py-2 rounded-xl text-slate-400 text-xs font-bold hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleApplySignature}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(168,85,247,0.4)]"
              >
                Insert Signature
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
