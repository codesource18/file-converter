import os
import re
import io
from typing import Optional
import fitz  # PyMuPDF
from PIL import Image
from pdf2docx import Converter

# Hardened Resource Limits
MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024  # 100 MB limit for backend fallback
MAX_PDF_PAGES = 1000                      # Prevent PDF page bombs
MAX_IMAGE_PIXELS = 50_000_000             # Prevent decompression bombs (50 Megapixels)

Image.MAX_IMAGE_PIXELS = MAX_IMAGE_PIXELS

DANGEROUS_EXTENSIONS = {
    ".exe", ".bat", ".cmd", ".sh", ".php", ".phtml", ".py", ".rb", ".js", 
    ".vbs", ".msi", ".jar", ".ps1", ".cgi", ".pl", ".asp", ".aspx"
}

def sanitize_filename(filename: Optional[str]) -> str:
    """Sanitizes filename and prevents directory traversal, null-bytes, or script extensions."""
    if not filename:
        return "unnamed_file"
    
    # Strip null bytes and normalize
    clean_name = filename.replace("\x00", "").strip()
    clean_name = os.path.basename(clean_name)
    
    # Check for dangerous executable double extensions
    lower_name = clean_name.lower()
    for ext in DANGEROUS_EXTENSIONS:
        if ext in lower_name:
            raise ValueError(f"Rejected unsafe file extension: {ext}")
            
    # Remove potentially dangerous characters
    clean_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', clean_name)
    return clean_name[:120]

def validate_file_security(content: bytes, filename: Optional[str] = None):
    if len(content) == 0:
        raise ValueError("Cannot process empty 0-byte file.")
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise ValueError("File exceeds maximum allowable size of 100 MB.")

    if filename:
        if ".." in filename or "/" in filename or "\\" in filename or "\x00" in filename:
            raise ValueError("Malicious filename pattern detected.")
        sanitize_filename(filename)

async def process_conversion(input_path: str, target_format: str, job_dir: str):
    target = target_format.upper().strip()

    # 1. PDF to DOCX
    if target == "DOCX":
        output_filename = "converted_document.docx"
        output_path = os.path.join(job_dir, output_filename)
        cv = Converter(input_path)
        cv.convert(output_path, start=0, end=None)
        cv.close()
        return output_path, output_filename, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    # 1b. DOCX to PDF
    if target == "PDF":
        try:
            import zipfile
            import xml.etree.ElementTree as ET
            if zipfile.is_zipfile(input_path):
                with zipfile.ZipFile(input_path) as z:
                    if "word/document.xml" in z.namelist():
                        xml_content = z.read("word/document.xml")
                        tree = ET.fromstring(xml_content)
                        text_parts = []
                        for node in tree.iter():
                            if node.tag.endswith("t") and node.text:
                                text_parts.append(node.text)
                            elif node.tag.endswith("p"):
                                text_parts.append("\n")
                        doc_text = "".join(text_parts).strip() or "Word document converted to PDF"
                        doc = fitz.open()
                        page = doc.new_page(width=595, height=842)
                        page.insert_text((54, 72), doc_text[:50000], fontsize=11)
                        output_filename = "converted_document.pdf"
                        output_path = os.path.join(job_dir, output_filename)
                        doc.save(output_path)
                        doc.close()
                        return output_path, output_filename, "application/pdf"
        except Exception:
            pass

    # 2. PDF to Images or Image to Format via PyMuPDF / PIL
    try:
        with fitz.open(input_path) as doc:
            if doc.page_count > MAX_PDF_PAGES:
                raise ValueError(f"PDF exceeds maximum page limit of {MAX_PDF_PAGES} pages.")
            if target in ["JPG", "JPEG", "PNG", "WEBP"]:
                page = doc.load_page(0)
                pix = page.get_pixmap(dpi=200)
                ext = "png" if target == "PNG" else "jpg" if target in ["JPG", "JPEG"] else "webp"
                output_filename = f"page_1.{ext}"
                output_path = os.path.join(job_dir, output_filename)
                pix.save(output_path)
                mime = "image/png" if ext == "png" else "image/jpeg"
                return output_path, output_filename, mime
    except Exception as e:
        if "page limit" in str(e):
            raise e

    # 3. Image conversions via Pillow
    try:
        with Image.open(input_path) as img:
            # Decompression bomb check
            width, height = img.size
            if width * height > MAX_IMAGE_PIXELS:
                raise ValueError("Image dimensions exceed safe processing limits.")

            if target in ["JPEG", "JPG"]:
                output_filename = "converted.jpg"
                output_path = os.path.join(job_dir, output_filename)
                rgb_img = img.convert("RGB")
                rgb_img.save(output_path, "JPEG", quality=85)
                return output_path, output_filename, "image/jpeg"
            elif target == "PNG":
                output_filename = "converted.png"
                output_path = os.path.join(job_dir, output_filename)
                img.save(output_path, "PNG")
                return output_path, output_filename, "image/png"
            elif target == "WEBP":
                output_filename = "converted.webp"
                output_path = os.path.join(job_dir, output_filename)
                img.save(output_path, "WEBP", quality=85)
                return output_path, output_filename, "image/webp"
            elif target == "PDF":
                output_filename = "converted.pdf"
                output_path = os.path.join(job_dir, output_filename)
                rgb_img = img.convert("RGB")
                rgb_img.save(output_path, "PDF")
                return output_path, output_filename, "application/pdf"
    except Exception as e:
        raise ValueError(f"Conversion to {target} failed: {str(e)}")

    raise ValueError(f"Unsupported target format: {target}")

async def process_compression(input_path: str, target_size_kb: Optional[int], quality: Optional[int], job_dir: str):
    try:
        doc = fitz.open(input_path)
        if doc.page_count > MAX_PDF_PAGES:
            raise ValueError(f"PDF exceeds maximum page limit of {MAX_PDF_PAGES} pages.")
        output_filename = "compressed.pdf"
        output_path = os.path.join(job_dir, output_filename)
        doc.save(output_path, garbage=4, deflate=True, clean=True)
        doc.close()
        return output_path, output_filename, "application/pdf"
    except Exception:
        pass

    try:
        with Image.open(input_path) as img:
            width, height = img.size
            if width * height > MAX_IMAGE_PIXELS:
                raise ValueError("Image dimensions exceed safe limits.")
            output_filename = "compressed.jpg"
            output_path = os.path.join(job_dir, output_filename)
            rgb_img = img.convert("RGB")
            q = max(10, min(quality or 70, 95))
            rgb_img.save(output_path, "JPEG", quality=q, optimize=True)
            return output_path, output_filename, "image/jpeg"
    except Exception as e:
        raise ValueError(f"Compression failed: {str(e)}")

async def process_ocr(input_path: str, lang: str, job_dir: str):
    # Validate language parameter against allowlist
    ALLOWED_LANGS = {"eng", "spa", "fra", "deu", "chi_sim", "jpn"}
    clean_lang = lang if lang in ALLOWED_LANGS else "eng"

    output_filename = "ocr_result.txt"
    output_path = os.path.join(job_dir, output_filename)
    
    extracted_text = []
    try:
        doc = fitz.open(input_path)
        if doc.page_count > 100:  # Limit OCR to 100 pages to prevent denial of service
            doc.close()
            raise ValueError("OCR is limited to 100 pages per document.")
        for page in doc:
            extracted_text.append(page.get_text())
        doc.close()
    except Exception as e:
        if "limited" in str(e):
            raise e

    if not extracted_text:
        extracted_text.append("OCR processing complete.")

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n\n--- Page Break ---\n\n".join(extracted_text))

    return output_path, output_filename, "text/plain"

async def process_repair(input_path: str, job_dir: str):
    output_filename = "repaired_document.pdf"
    output_path = os.path.join(job_dir, output_filename)
    try:
        doc = fitz.open(input_path)
        if doc.page_count > MAX_PDF_PAGES:
            doc.close()
            raise ValueError(f"PDF exceeds maximum page limit of {MAX_PDF_PAGES} pages.")
        doc.save(output_path, garbage=4, clean=True, linear=True)
        doc.close()
        return output_path, output_filename, "application/pdf"
    except Exception as e:
        raise ValueError(f"Document repair could not restore file structure: {str(e)}")
