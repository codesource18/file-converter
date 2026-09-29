"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertDocxToPdf = convertDocxToPdf;
const jszip_1 = __importDefault(require("jszip"));
const pdf_lib_1 = require("pdf-lib");
async function convertDocxToPdf(file, fileName, options = {}, onProgress) {
    onProgress?.(10, 'Reading Word document...');
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdf_lib_1.PDFDocument.create();
    pdfDoc.setProducer('FileConverter Word-to-PDF Engine');
    pdfDoc.setCreator('FileConverter Local Sandbox');
    // Embed standard typography fonts
    const fonts = {
        regular: await pdfDoc.embedFont(pdf_lib_1.StandardFonts.Helvetica),
        bold: await pdfDoc.embedFont(pdf_lib_1.StandardFonts.HelveticaBold),
        italic: await pdfDoc.embedFont(pdf_lib_1.StandardFonts.HelveticaOblique),
        boldItalic: await pdfDoc.embedFont(pdf_lib_1.StandardFonts.HelveticaBoldOblique),
    };
    onProgress?.(25, 'Parsing document structure & formatting...');
    let elements = [];
    const imageMap = new Map();
    try {
        const zip = await jszip_1.default.loadAsync(arrayBuffer);
        // 1. Extract image media relationships if present
        const relsFile = zip.file('word/_rels/document.xml.rels');
        const relsMap = new Map();
        if (relsFile) {
            const relsXml = await relsFile.async('text');
            const relMatches = relsXml.matchAll(/<Relationship\s+[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g);
            for (const m of relMatches) {
                relsMap.set(m[1], m[2]);
            }
        }
        // 2. Load embedded images from media/
        for (const [rId, target] of relsMap.entries()) {
            const normalizedPath = target.startsWith('media/') ? `word/${target}` : target.startsWith('/') ? target.slice(1) : `word/${target}`;
            const imgFile = zip.file(normalizedPath);
            if (imgFile) {
                const bytes = await imgFile.async('uint8array');
                const isPng = target.toLowerCase().endsWith('.png');
                const isJpg = target.toLowerCase().endsWith('.jpg') || target.toLowerCase().endsWith('.jpeg');
                if (isPng || isJpg) {
                    imageMap.set(rId, { bytes, type: isPng ? 'png' : 'jpeg' });
                }
            }
        }
        // 3. Extract and parse document.xml
        const docXmlFile = zip.file('word/document.xml');
        if (docXmlFile) {
            const docXml = await docXmlFile.async('text');
            elements = parseDocxXml(docXml);
        }
        else {
            // Fallback for non-standard or raw documents
            const rawText = new TextDecoder('utf-8', { fatal: false }).decode(arrayBuffer);
            elements = createFallbackElementsFromText(rawText);
        }
    }
    catch (err) {
        console.warn('Zip parsing error in DOCX, attempting plain text extraction fallback:', err);
        const rawText = new TextDecoder('utf-8', { fatal: false }).decode(arrayBuffer);
        elements = createFallbackElementsFromText(rawText);
    }
    if (elements.length === 0) {
        elements.push({
            type: 'paragraph',
            runs: [{ text: 'Document contains no readable text.' }]
        });
    }
    onProgress?.(50, 'Laying out PDF pages & typography...');
    // Page setup: Standard A4 dimensions
    const PAGE_WIDTH = 595.28;
    const PAGE_HEIGHT = 841.89;
    const MARGIN_LEFT = 54;
    const MARGIN_RIGHT = 54;
    const MARGIN_TOP = 54;
    const MARGIN_BOTTOM = 54;
    const USABLE_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
    let pages = [];
    let currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    pages.push(currentPage);
    let currentY = PAGE_HEIGHT - MARGIN_TOP;
    const checkPageBreak = (neededHeight) => {
        if (currentY - neededHeight < MARGIN_BOTTOM) {
            currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
            pages.push(currentPage);
            currentY = PAGE_HEIGHT - MARGIN_TOP;
        }
    };
    // Render elements sequentially
    for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        onProgress?.(Math.round(50 + ((i + 1) / elements.length) * 35), `Rendering document contents (${i + 1}/${elements.length})...`);
        if (el.type === 'table') {
            currentY = await renderTable(el, pdfDoc, pages, () => currentPage, (p) => { currentPage = p; pages.push(p); }, currentY, PAGE_WIDTH, PAGE_HEIGHT, MARGIN_LEFT, MARGIN_TOP, MARGIN_BOTTOM, USABLE_WIDTH, fonts);
            continue;
        }
        // Paragraph rendering
        const p = el;
        // Check for explicit page break in runs
        if (p.runs.some(r => r.isPageBreak)) {
            currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
            pages.push(currentPage);
            currentY = PAGE_HEIGHT - MARGIN_TOP;
        }
        // Embed and render any embedded images attached to this paragraph
        if (p.imageRels && p.imageRels.length > 0) {
            for (const rId of p.imageRels) {
                const imgData = imageMap.get(rId);
                if (imgData) {
                    try {
                        const embeddedImg = imgData.type === 'png'
                            ? await pdfDoc.embedPng(imgData.bytes)
                            : await pdfDoc.embedJpg(imgData.bytes);
                        const origW = embeddedImg.width;
                        const origH = embeddedImg.height;
                        const maxW = Math.min(USABLE_WIDTH, 480);
                        const scale = Math.min(1, maxW / origW);
                        const drawW = origW * scale;
                        const drawH = origH * scale;
                        checkPageBreak(drawH + 15);
                        currentPage.drawImage(embeddedImg, {
                            x: MARGIN_LEFT + (USABLE_WIDTH - drawW) / 2,
                            y: currentY - drawH,
                            width: drawW,
                            height: drawH,
                        });
                        currentY -= drawH + 15;
                    }
                    catch (imgErr) {
                        console.warn('Failed to embed image from docx:', imgErr);
                    }
                }
            }
        }
        // Determine font sizes and styles based on paragraph type
        let defaultFontSize = 11;
        let defaultLineHeight = 15;
        let isHeading = false;
        let extraSpacingBefore = p.spacingBefore || 0;
        let extraSpacingAfter = p.spacingAfter || 4;
        if (p.type === 'title') {
            defaultFontSize = 22;
            defaultLineHeight = 28;
            isHeading = true;
            extraSpacingBefore = Math.max(extraSpacingBefore, 12);
            extraSpacingAfter = Math.max(extraSpacingAfter, 10);
        }
        else if (p.type === 'heading1') {
            defaultFontSize = 18;
            defaultLineHeight = 24;
            isHeading = true;
            extraSpacingBefore = Math.max(extraSpacingBefore, 10);
            extraSpacingAfter = Math.max(extraSpacingAfter, 6);
        }
        else if (p.type === 'heading2') {
            defaultFontSize = 14;
            defaultLineHeight = 19;
            isHeading = true;
            extraSpacingBefore = Math.max(extraSpacingBefore, 8);
            extraSpacingAfter = Math.max(extraSpacingAfter, 4);
        }
        else if (p.type === 'heading3') {
            defaultFontSize = 12;
            defaultLineHeight = 16;
            isHeading = true;
            extraSpacingBefore = Math.max(extraSpacingBefore, 6);
            extraSpacingAfter = Math.max(extraSpacingAfter, 3);
        }
        else if (p.type === 'bullet' || p.type === 'numbered') {
            extraSpacingAfter = Math.max(extraSpacingAfter, 2);
        }
        // Apply spacing before
        if (extraSpacingBefore > 0) {
            currentY -= extraSpacingBefore;
        }
        // Break paragraph into wrapped lines of text fragments
        const lines = layoutParagraphLines(p, fonts, USABLE_WIDTH, defaultFontSize, isHeading);
        if (lines.length === 0) {
            // Empty paragraph / line break
            currentY -= defaultLineHeight * 0.75;
            continue;
        }
        for (let l = 0; l < lines.length; l++) {
            const line = lines[l];
            const lineHeight = Math.max(defaultLineHeight, ...line.fragments.map(f => (f.fontSize || defaultFontSize) * 1.3));
            checkPageBreak(lineHeight);
            let startX = MARGIN_LEFT;
            if (p.type === 'bullet') {
                startX += 14;
                if (l === 0) {
                    // Draw bullet marker
                    currentPage.drawText('•', {
                        x: MARGIN_LEFT + 2,
                        y: currentY - defaultFontSize,
                        size: defaultFontSize,
                        font: fonts.bold,
                        color: (0, pdf_lib_1.rgb)(0.2, 0.2, 0.2),
                    });
                }
            }
            else if (p.type === 'numbered') {
                startX += 16;
            }
            // Handle alignment
            if (p.alignment === 'center') {
                const totalLineWidth = line.fragments.reduce((sum, f) => sum + f.width, 0);
                startX = MARGIN_LEFT + Math.max(0, (USABLE_WIDTH - totalLineWidth) / 2);
            }
            else if (p.alignment === 'right') {
                const totalLineWidth = line.fragments.reduce((sum, f) => sum + f.width, 0);
                startX = MARGIN_LEFT + Math.max(0, USABLE_WIDTH - totalLineWidth);
            }
            let currentX = startX;
            for (const frag of line.fragments) {
                const font = frag.isBold && frag.isItalic
                    ? fonts.boldItalic
                    : frag.isBold
                        ? fonts.bold
                        : frag.isItalic
                            ? fonts.italic
                            : fonts.regular;
                const fSize = frag.fontSize || defaultFontSize;
                const color = frag.color ? hexToRgb(frag.color) : isHeading ? (0, pdf_lib_1.rgb)(0.1, 0.15, 0.25) : (0, pdf_lib_1.rgb)(0.12, 0.12, 0.12);
                // Sanitize string for standard WinAnsi encoding in pdf-lib
                const safeText = sanitizeWinAnsi(frag.text);
                if (safeText.length > 0) {
                    currentPage.drawText(safeText, {
                        x: currentX,
                        y: currentY - fSize,
                        size: fSize,
                        font,
                        color,
                    });
                    // Draw underline if specified
                    if (frag.isUnderline) {
                        currentPage.drawLine({
                            start: { x: currentX, y: currentY - fSize - 1.5 },
                            end: { x: currentX + frag.width, y: currentY - fSize - 1.5 },
                            thickness: 0.8,
                            color,
                        });
                    }
                    // Draw strikethrough if specified
                    if (frag.isStrike) {
                        currentPage.drawLine({
                            start: { x: currentX, y: currentY - fSize + fSize * 0.35 },
                            end: { x: currentX + frag.width, y: currentY - fSize + fSize * 0.35 },
                            thickness: 0.8,
                            color,
                        });
                    }
                }
                currentX += frag.width;
            }
            currentY -= lineHeight;
        }
        // Apply spacing after
        if (extraSpacingAfter > 0) {
            currentY -= extraSpacingAfter;
        }
    }
    // Draw subtle page numbers in the footer if more than 1 page
    const totalPages = pages.length;
    if (totalPages > 1) {
        for (let idx = 0; idx < totalPages; idx++) {
            const p = pages[idx];
            const pageNumberText = `Page ${idx + 1} of ${totalPages}`;
            const textWidth = fonts.regular.widthOfTextAtSize(pageNumberText, 9);
            p.drawText(pageNumberText, {
                x: PAGE_WIDTH / 2 - textWidth / 2,
                y: 24,
                size: 9,
                font: fonts.regular,
                color: (0, pdf_lib_1.rgb)(0.5, 0.5, 0.5),
            });
        }
    }
    onProgress?.(92, 'Finalizing high-res PDF output...');
    const pdfBytes = await pdfDoc.save();
    const outputBlob = new Blob([pdfBytes.buffer], { type: 'application/pdf' });
    const baseName = fileName.replace(/\.(docx|doc|txt)$/i, '');
    const finalFileName = `${baseName}.pdf`;
    onProgress?.(100, 'Word to PDF conversion complete');
    return {
        success: true,
        blob: outputBlob,
        filename: finalFileName,
        outputFormat: 'PDF',
        originalSize: file.size,
        outputSize: outputBlob.size,
        pages: totalPages,
        executionMode: 'local'
    };
}
// ----------------------------------------------------
// XML PARSING & STRUCTURE EXTRACTION
// ----------------------------------------------------
function parseDocxXml(xml) {
    const elements = [];
    // Match paragraphs and tables in sequence
    const blockRegex = /<w:(p|tbl)\b[\s\S]*?<\/w:\1>/g;
    let blockMatch;
    while ((blockMatch = blockRegex.exec(xml)) !== null) {
        const blockType = blockMatch[1];
        const blockXml = blockMatch[0];
        if (blockType === 'tbl') {
            const table = parseTableXml(blockXml);
            if (table)
                elements.push(table);
        }
        else {
            const paragraph = parseParagraphXml(blockXml);
            if (paragraph)
                elements.push(paragraph);
        }
    }
    return elements;
}
function parseParagraphXml(pXml) {
    // Determine paragraph style / type
    let type = 'paragraph';
    let alignment = undefined;
    const pStyleMatch = pXml.match(/<w:pStyle\s+[^>]*w:val="([^"]+)"/);
    if (pStyleMatch) {
        const val = pStyleMatch[1].toLowerCase();
        if (val.includes('title'))
            type = 'title';
        else if (val.includes('heading1') || val === '1')
            type = 'heading1';
        else if (val.includes('heading2') || val === '2')
            type = 'heading2';
        else if (val.includes('heading3') || val === '3')
            type = 'heading3';
    }
    // Check for numbering or bullets
    if (pXml.includes('<w:numPr>')) {
        type = 'bullet';
    }
    // Check alignment
    const jcMatch = pXml.match(/<w:jc\s+[^>]*w:val="([^"]+)"/);
    if (jcMatch) {
        const jc = jcMatch[1].toLowerCase();
        if (jc === 'center')
            alignment = 'center';
        else if (jc === 'right')
            alignment = 'right';
        else if (jc === 'both')
            alignment = 'justify';
        else
            alignment = 'left';
    }
    // Check embedded image relationships in drawing or pict
    const imageRels = [];
    const blipMatches = pXml.matchAll(/<(?:a:blip|v:imagedata)\s+[^>]*(?:r:embed|r:id)="([^"]+)"/g);
    for (const m of blipMatches) {
        imageRels.push(m[1]);
    }
    // Extract runs
    const runs = [];
    const runRegex = /<w:r\b[\s\S]*?<\/w:r>/g;
    let runMatch;
    while ((runMatch = runRegex.exec(pXml)) !== null) {
        const rXml = runMatch[0];
        const isBold = /<w:b(?:\s+[^>]*w:val="(?:true|1)"|\s*\/)?>/.test(rXml);
        const isItalic = /<w:i(?:\s+[^>]*w:val="(?:true|1)"|\s*\/)?>/.test(rXml);
        const isUnderline = /<w:u\s+[^>]*\/>|<w:u\s+[^>]*w:val="(?!none)[^"]+"/.test(rXml);
        const isStrike = /<w:strike\s*\/>/.test(rXml);
        const isPageBreak = /<w:br\s+[^>]*w:type="page"/.test(rXml) || /<w:lastRenderedPageBreak\s*\/>/.test(rXml);
        const isLineBreak = /<w:br\s*(?!w:type="page")[^>]*\/>/.test(rXml);
        let fontSize;
        const szMatch = rXml.match(/<w:sz\s+[^>]*w:val="(\d+)"/);
        if (szMatch) {
            fontSize = parseInt(szMatch[1], 10) / 2; // half-points to pt
        }
        let color;
        const colorMatch = rXml.match(/<w:color\s+[^>]*w:val="([0-9a-fA-F]{6})"/);
        if (colorMatch && colorMatch[1] !== 'auto') {
            color = `#${colorMatch[1]}`;
        }
        // Extract text nodes inside run (<w:t>)
        const textMatches = rXml.matchAll(/<w:t(?:\s+xml:space="preserve")?>([\s\S]*?)<\/w:t>/g);
        let runText = '';
        for (const tm of textMatches) {
            runText += decodeXmlEntities(tm[1]);
        }
        // Check for tabs
        if (rXml.includes('<w:tab/>')) {
            runText += '    ';
        }
        if (runText.length > 0 || isPageBreak || isLineBreak) {
            runs.push({
                text: runText,
                isBold,
                isItalic,
                isUnderline,
                isStrike,
                fontSize,
                color,
                isPageBreak,
                isLineBreak,
            });
        }
    }
    // Even if no runs exist, if there's an image relation or break, return paragraph
    if (runs.length === 0 && imageRels.length === 0) {
        return { type, alignment, runs: [] };
    }
    return { type, alignment, runs, imageRels: imageRels.length > 0 ? imageRels : undefined };
}
function parseTableXml(tblXml) {
    const rows = [];
    const trRegex = /<w:tr\b[\s\S]*?<\/w:tr>/g;
    let trMatch;
    while ((trMatch = trRegex.exec(tblXml)) !== null) {
        const trXml = trMatch[0];
        const cells = [];
        const tcRegex = /<w:tc\b[\s\S]*?<\/w:tc>/g;
        let tcMatch;
        while ((tcMatch = tcRegex.exec(trXml)) !== null) {
            const tcXml = tcMatch[0];
            const paragraphs = [];
            const pRegex = /<w:p\b[\s\S]*?<\/w:p>/g;
            let pMatch;
            while ((pMatch = pRegex.exec(tcXml)) !== null) {
                const p = parseParagraphXml(pMatch[0]);
                if (p)
                    paragraphs.push(p);
            }
            // Check cell width (w:tcW w:w="...") in dxa (1 pt = 20 dxa)
            let widthPt;
            const wMatch = tcXml.match(/<w:tcW\s+[^>]*w:w="(\d+)"/);
            if (wMatch) {
                widthPt = parseInt(wMatch[1], 10) / 20;
            }
            // Check cell background shading
            let bgColor;
            const shdMatch = tcXml.match(/<w:shd\s+[^>]*w:fill="([0-9a-fA-F]{6})"/);
            if (shdMatch && shdMatch[1] !== 'auto') {
                bgColor = `#${shdMatch[1]}`;
            }
            cells.push({ paragraphs, widthPt, bgColor });
        }
        if (cells.length > 0) {
            rows.push({ cells });
        }
    }
    return rows.length > 0 ? { type: 'table', rows } : null;
}
// ----------------------------------------------------
// TABLE RENDERING
// ----------------------------------------------------
async function renderTable(table, pdfDoc, pages, getCurrentPage, addNewPage, startY, pageWidth, pageHeight, marginLeft, marginTop, marginBottom, usableWidth, fonts) {
    let currentY = startY;
    const numCols = Math.max(...table.rows.map(r => r.cells.length), 1);
    const defaultColWidth = usableWidth / numCols;
    for (const row of table.rows) {
        // Determine row height by measuring cells
        const cellLayouts = [];
        let maxLines = 1;
        for (let c = 0; c < row.cells.length; c++) {
            const cell = row.cells[c];
            const colWidth = cell.widthPt && cell.widthPt > 20 && cell.widthPt <= usableWidth ? cell.widthPt : defaultColWidth;
            let cellLinesCount = 0;
            for (const cp of cell.paragraphs) {
                const lines = layoutParagraphLines(cp, fonts, colWidth - 10, 10, false);
                cellLinesCount += Math.max(1, lines.length);
            }
            maxLines = Math.max(maxLines, cellLinesCount);
            cellLayouts.push({ paragraphs: cell.paragraphs, colWidth, linesCount: cellLinesCount });
        }
        const rowHeight = Math.max(22, maxLines * 14 + 10);
        // Page break check
        if (currentY - rowHeight < marginBottom) {
            const newPage = pdfDoc.addPage([pageWidth, pageHeight]);
            addNewPage(newPage);
            currentY = pageHeight - marginTop;
        }
        const page = getCurrentPage();
        let currentX = marginLeft;
        for (let c = 0; c < cellLayouts.length; c++) {
            const layout = cellLayouts[c];
            const cell = row.cells[c];
            // Draw cell background if provided
            if (cell.bgColor) {
                page.drawRectangle({
                    x: currentX,
                    y: currentY - rowHeight,
                    width: layout.colWidth,
                    height: rowHeight,
                    color: hexToRgb(cell.bgColor),
                });
            }
            // Draw cell border
            page.drawRectangle({
                x: currentX,
                y: currentY - rowHeight,
                width: layout.colWidth,
                height: rowHeight,
                borderColor: (0, pdf_lib_1.rgb)(0.75, 0.78, 0.82),
                borderWidth: 0.75,
            });
            // Render cell text
            let cellY = currentY - 14;
            for (const cp of layout.paragraphs) {
                const lines = layoutParagraphLines(cp, fonts, layout.colWidth - 10, 10, false);
                for (const line of lines) {
                    let lineX = currentX + 5;
                    for (const frag of line.fragments) {
                        const font = frag.isBold ? fonts.bold : fonts.regular;
                        const safe = sanitizeWinAnsi(frag.text);
                        if (safe.length > 0) {
                            page.drawText(safe, {
                                x: lineX,
                                y: cellY,
                                size: 9.5,
                                font,
                                color: (0, pdf_lib_1.rgb)(0.15, 0.15, 0.15),
                            });
                        }
                        lineX += frag.width;
                    }
                    cellY -= 13;
                }
            }
            currentX += layout.colWidth;
        }
        currentY -= rowHeight;
    }
    return currentY - 8;
}
function layoutParagraphLines(paragraph, fonts, maxWidth, defaultFontSize, isHeading) {
    const lines = [];
    let currentLineFrags = [];
    let currentLineWidth = 0;
    for (const run of paragraph.runs) {
        if (run.isLineBreak) {
            lines.push({ fragments: currentLineFrags });
            currentLineFrags = [];
            currentLineWidth = 0;
            continue;
        }
        const fSize = run.fontSize || defaultFontSize;
        const font = (run.isBold || isHeading) && run.isItalic
            ? fonts.boldItalic
            : (run.isBold || isHeading)
                ? fonts.bold
                : run.isItalic
                    ? fonts.italic
                    : fonts.regular;
        const words = run.text.split(/(\s+)/);
        for (const w of words) {
            if (!w)
                continue;
            const safeWord = sanitizeWinAnsi(w);
            const wordWidth = font.widthOfTextAtSize(safeWord, fSize);
            if (currentLineWidth + wordWidth <= maxWidth || currentLineWidth === 0) {
                currentLineFrags.push({
                    text: safeWord,
                    width: wordWidth,
                    isBold: run.isBold || isHeading,
                    isItalic: run.isItalic,
                    isUnderline: run.isUnderline,
                    isStrike: run.isStrike,
                    fontSize: fSize,
                    color: run.color,
                });
                currentLineWidth += wordWidth;
            }
            else {
                // Wrap to next line
                lines.push({ fragments: currentLineFrags });
                currentLineFrags = [];
                currentLineWidth = 0;
                // Skip leading whitespace on new line
                if (safeWord.trim().length > 0) {
                    currentLineFrags.push({
                        text: safeWord,
                        width: wordWidth,
                        isBold: run.isBold || isHeading,
                        isItalic: run.isItalic,
                        isUnderline: run.isUnderline,
                        isStrike: run.isStrike,
                        fontSize: fSize,
                        color: run.color,
                    });
                    currentLineWidth = wordWidth;
                }
            }
        }
    }
    if (currentLineFrags.length > 0) {
        lines.push({ fragments: currentLineFrags });
    }
    return lines;
}
function createFallbackElementsFromText(text) {
    const lines = text.split(/\r?\n/);
    const elements = [];
    for (const l of lines) {
        const trimmed = l.trim();
        if (trimmed.length === 0) {
            elements.push({ type: 'paragraph', runs: [] });
        }
        else if (trimmed.startsWith('# ')) {
            elements.push({ type: 'heading1', runs: [{ text: trimmed.slice(2), isBold: true }] });
        }
        else if (trimmed.startsWith('## ')) {
            elements.push({ type: 'heading2', runs: [{ text: trimmed.slice(3), isBold: true }] });
        }
        else if (trimmed.startsWith('### ')) {
            elements.push({ type: 'heading3', runs: [{ text: trimmed.slice(4), isBold: true }] });
        }
        else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            elements.push({ type: 'bullet', runs: [{ text: trimmed.slice(2) }] });
        }
        else {
            elements.push({ type: 'paragraph', runs: [{ text: l }] });
        }
    }
    return elements;
}
// ----------------------------------------------------
// UTILITIES
// ----------------------------------------------------
function decodeXmlEntities(str) {
    return str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
        .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
}
function sanitizeWinAnsi(str) {
    return str
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2013\u2014]/g, '-')
        .replace(/\u2022/g, '*')
        .replace(/\u2026/g, '...')
        .replace(/\u00A0/g, ' ')
        .replace(/[^\x00-\xFF]/g, '?');
}
function hexToRgb(hex) {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255 || 0;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255 || 0;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255 || 0;
    return (0, pdf_lib_1.rgb)(r, g, b);
}
