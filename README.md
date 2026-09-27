# File Converter

> **"Your files. Your browser. Nothing stored."**

A complete, production-ready, privacy-first PDF and image transformation platform with a dark liquid-glass interface, universal format detection, full-featured 60FPS PDF editor, smart target-size compression, WebAssembly OCR, non-intrusive advertising system, and ephemeral compatibility processing.

---

## 🌟 Key Highlights

- **100% Private & Local-First**: PDF manipulations and image conversions execute directly in your browser memory using WebAssembly, Web Workers, and HTML5 Canvas. Your sensitive documents never leave your device.
- **Universal Drop & Smart Recommendation**: Drop any file and our signature inspection engine identifies magic bytes to display the top 3 contextual conversion options plus compatible secondary utilities.
- **Full Interactive PDF Editor**: 60FPS vector drawing, text insertion, highlights, shapes, custom stamps, signatures, whiteout, true redactions, page watermark stamping, and page numbering.
- **Smart Target-Size Compression**: Choose presets (100 KB, 500 KB, 1 MB, 2 MB, 5 MB) or enter custom limits; the iterative psycho-visual engine optimizes quality and resolution to meet your byte target.
- **Before & After Visual Comparison**: Real-time split comparison slider for image compressions.
- **Batch Processing & ZIP Packaging**: Queue dozens of files with per-item progress bars, individual downloads, and single-click ZIP archive export.
- **Pipeline Workflow Mode**: Chain multi-step operations (e.g., *Resize → Convert WebP → Compress → Strip Metadata*) in memory without re-uploading.
- **In-Browser WebAssembly OCR**: Neural character recognition powered by Tesseract.js directly on client hardware.
- **Ephemeral Backend Compatibility Fallback**: High-performance FastAPI fallback for PDF-to-Word DOCX and repair operations in isolated temporary sandboxes with instant TTL deletion.
- **Live Liquid Glass UI**: 3D translucent refraction canvas powered by Three.js with pointer parallax, tab visibility pausing, and reduced-motion compliance.
- **Non-Intrusive AdSense Monetization**: High-visibility ad placements engineered with lazy loading, CLS height reservation, and zero interference with user workflow.

---

## 📐 Architecture Overview

```
                        [ User Drops File ]
                                 │
                                 ▼
                     [ Universal Signature Detection ]
                     (Magic Bytes / Header Inspection)
                                 │
                     ┌───────────┴───────────┐
                     ▼                       ▼
            [ Level A: Local ]      [ Level B: Backend Fallback ]
           - Image conversions      - PDF to DOCX
           - PDF merge / split      - Complex document repair
           - Watermarks / numbers   - Ephemeral temp directory
           - Crop / Resize / Rotate - Zero permanent storage
           - Target size optimizer  - Instant cleanup after DL
           - Tesseract.js OCR
                     │                       │
                     └───────────┬───────────┘
                                 ▼
                    [ Direct Memory Download ]
```

---

## 🗂️ Monorepo Structure

```
fileconverter/
├── apps/
│   ├── web/                    # Next.js 14 App Router, TypeScript, Tailwind, Three.js, Lucide
│   └── api/                    # Python FastAPI temporary compatibility engine & PyMuPDF / pdf2docx
├── packages/
│   ├── shared-types/           # TypeScript interfaces, tool definitions, metadata schemas
│   ├── file-detection/         # Magic-byte classifier and smart recommendation matrix
│   └── conversion-core/        # Local processing algorithms (pdf-lib, canvas transformations, JSZip)
├── docker/
│   ├── Dockerfile.web          # Production container for Next.js web application
│   └── Dockerfile.api          # Container for FastAPI backend with tesseract-ocr
├── tests/
│   ├── detector.test.ts        # File signature & recommendation matrix unit tests
│   ├── pdf.test.ts             # PDF merge, split, rotate, watermark, sanitize tests
│   ├── security.test.ts        # Fake extension & zero-byte security tests
│   ├── adslot.test.ts          # AdSense component & reservation tests
│   └── test_backend.py         # FastAPI compatibility endpoints & security tests
├── docker-compose.yml          # Unified multi-container orchestration
└── pnpm-workspace.yaml         # PNPM workspace configuration
```

---

## 🚀 Quick Start & Development

### Prerequisites
- **Node.js**: v18+ (tested on Node v20/24)
- **pnpm**: v9+ / v12+
- **Python**: 3.10+ (for backend fallback engine)

### 1. Install Dependencies
```bash
pnpm install
pip3 install -r apps/api/requirements.txt
```

### 2. Build Workspace Packages
```bash
pnpm build
```

### 3. Run Automated Tests
```bash
# Frontend & Core unit/integration tests
pnpm test

# Backend API tests
python3 -m pytest tests/test_backend.py
```

### 4. Start Development Servers
```bash
# Start Next.js Frontend (port 3000)
pnpm dev

# Start FastAPI Backend (port 8000)
python3 apps/api/main.py
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🐳 Docker Deployment

Start both the frontend and backend in one command:
```bash
docker compose up --build
```
- **Web UI**: http://localhost:3000
- **API Health**: http://localhost:8000/health

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_ADS_ENABLED=false
NEXT_PUBLIC_ANALYTICS_ENABLED=false
PORT=8000
MAX_UPLOAD_SIZE_MB=500
TEMP_DIR=/tmp/fileconverter_jobs
```

---

## 🔒 Security & Privacy Guarantee

- **Zero Permanent Storage**: Files are processed in volatile RAM.
- **No Document Logging**: Filenames and binary streams are never logged.
- **No Accounts Required**: Zero cookies, logins, or tracking pixels for document data.
- **Ephemeral Server Life-Cycle**: When server fallback is utilized, input files are purged immediately after decoding, and outputs are purged upon download or 15-minute TTL.
