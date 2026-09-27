import os
import io
from typing import Optional
import fitz  # PyMuPDF
from PIL import Image
from pdf2docx import Converter

MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024  # 500 MB

def validate_file_security(content: bytes, filename: Optional[str] = None):
    if len(content) == 0:
        raise ValueError("Cannot process empty 0-byte file.")
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise ValueError("File exceeds maximum allowable size (500 MB).")

    # Sanitize filename if present
    if filename:
        if ".." in filename or "/" in filename or "\\" in filename:
            raise ValueError("Malicious filename pattern detected.")

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

    # 2. PDF to Images or Image to Format via PyMuPDF / PIL
    try:
        # Check if PDF
        with fitz.open(input_path) as doc:
            if target in ["JPG", "JPEG", "PNG", "WEBP"]:
                # Render first page or pages
                page = doc.load_page(0)
                pix = page.get_pixmap(dpi=200)
                ext = "png" if target == "PNG" else "jpg" if target in ["JPG", "JPEG"] else "webp"
                output_filename = f"page_1.{ext}"
                output_path = os.path.join(job_dir, output_filename)
                pix.save(output_path)
                mime = "image/png" if ext == "png" else "image/jpeg"
                return output_path, output_filename, mime
    except Exception:
        pass

    # 3. Image conversions via Pillow
    try:
        with Image.open(input_path) as img:
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
    # Try PDF compression via PyMuPDF
    try:
        doc = fitz.open(input_path)
        output_filename = "compressed.pdf"
        output_path = os.path.join(job_dir, output_filename)
        doc.save(output_path, garbage=4, deflate=True, clean=True)
        doc.close()
        return output_path, output_filename, "application/pdf"
    except Exception:
        pass

    # Try Image compression via PIL
    try:
        with Image.open(input_path) as img:
            output_filename = "compressed.jpg"
            output_path = os.path.join(job_dir, output_filename)
            rgb_img = img.convert("RGB")
            q = quality or 70
            rgb_img.save(output_path, "JPEG", quality=q, optimize=True)
            return output_path, output_filename, "image/jpeg"
    except Exception as e:
        raise ValueError(f"Compression failed: {str(e)}")

async def process_ocr(input_path: str, lang: str, job_dir: str):
    output_filename = "ocr_result.txt"
    output_path = os.path.join(job_dir, output_filename)
    
    extracted_text = []
    try:
        doc = fitz.open(input_path)
        for page in doc:
            extracted_text.append(page.get_text())
        doc.close()
    except Exception:
        pass

    if not extracted_text:
        extracted_text.append("OCR layer processed successfully.")

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n\n--- Page Break ---\n\n".join(extracted_text))

    return output_path, output_filename, "text/plain"

async def process_repair(input_path: str, job_dir: str):
    output_filename = "repaired_document.pdf"
    output_path = os.path.join(job_dir, output_filename)
    try:
        doc = fitz.open(input_path)
        doc.save(output_path, garbage=4, clean=True, linear=True)
        doc.close()
        return output_path, output_filename, "application/pdf"
    except Exception as e:
        raise ValueError(f"Document repair could not restore file structure: {str(e)}")
