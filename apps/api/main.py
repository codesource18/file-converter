import os
import shutil
import time
import uuid
import asyncio
from typing import Optional, Dict
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from converter import (
    process_conversion,
    process_compression,
    process_ocr,
    process_repair,
    validate_file_security,
    sanitize_filename
)

# In-memory ephemeral job metadata with TTL (15 minutes)
JOB_CACHE: Dict[str, dict] = {}
JOB_TTL_SECONDS = 900  # 15 minutes
TEMP_BASE_DIR = "/tmp/fileconverter_jobs"

# Simple token bucket / IP rate limiter for compute endpoints
IP_REQUEST_LOG: Dict[str, list] = {}
RATE_LIMIT_WINDOW = 60  # 1 minute
MAX_REQUESTS_PER_MINUTE = 30

os.makedirs(TEMP_BASE_DIR, exist_ok=True)

def check_rate_limit(client_ip: str):
    """Enforce rate limits per IP to prevent compute resource exhaustion."""
    now = time.time()
    timestamps = IP_REQUEST_LOG.get(client_ip, [])
    # Filter timestamps within current window
    valid_timestamps = [t for t in timestamps if now - t < RATE_LIMIT_WINDOW]
    if len(valid_timestamps) >= MAX_REQUESTS_PER_MINUTE:
        raise HTTPException(status_code=429, detail="Too many conversion requests. Please wait a moment.")
    valid_timestamps.append(now)
    IP_REQUEST_LOG[client_ip] = valid_timestamps

async def periodic_cleanup():
    """Background task to remove expired temporary jobs and files."""
    while True:
        try:
            now = time.time()
            expired_job_ids = [
                jid for jid, info in JOB_CACHE.items()
                if now - info.get("created_at", now) > JOB_TTL_SECONDS
            ]
            for jid in expired_job_ids:
                job_dir = os.path.join(TEMP_BASE_DIR, jid)
                if os.path.exists(job_dir):
                    shutil.rmtree(job_dir, ignore_errors=True)
                JOB_CACHE.pop(jid, None)

            # Clean IP log
            for ip in list(IP_REQUEST_LOG.keys()):
                IP_REQUEST_LOG[ip] = [t for t in IP_REQUEST_LOG[ip] if now - t < RATE_LIMIT_WINDOW]
                if not IP_REQUEST_LOG[ip]:
                    IP_REQUEST_LOG.pop(ip, None)
        except Exception:
            pass
        await asyncio.sleep(60)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    cleanup_task = asyncio.create_task(periodic_cleanup())
    yield
    # Shutdown
    cleanup_task.cancel()
    if os.path.exists(TEMP_BASE_DIR):
        shutil.rmtree(TEMP_BASE_DIR, ignore_errors=True)

app = FastAPI(
    title="File Converter Secure Compatibility Engine",
    version="1.0.0",
    docs_url=None,  # Disabled in production to prevent attack surface enumeration
    redoc_url=None,
    openapi_url=None,
    lifespan=lifespan
)

# Strict CORS Configuration
ALLOWED_ORIGINS = [
    "https://fileconvertor.in",
    "https://www.fileconvertor.in",
    "http://localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Accept", "Authorization"],
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    # Enforce request method allowlist
    if request.method not in ["GET", "POST", "DELETE", "OPTIONS", "HEAD"]:
        return JSONResponse(status_code=405, content={"error": "Method Not Allowed"})

    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Server"] = "FileConverter-Engine"
    return response

@app.get("/health")
def health_check():
    """Minimal unprivileged health check with zero sensitive metadata."""
    return {
        "status": "healthy",
        "storage": "ephemeral-only",
        "active_jobs": len(JOB_CACHE)
    }

@app.post("/api/convert")
async def api_convert(
    request: Request,
    file: UploadFile = File(...),
    target_format: str = Form(...),
    options: Optional[str] = Form(None)
):
    client_ip = request.client.host if request.client else "unknown"
    check_rate_limit(client_ip)

    job_id = str(uuid.uuid4())
    job_dir = os.path.join(TEMP_BASE_DIR, job_id)
    os.makedirs(job_dir, exist_ok=True)

    try:
        content = await file.read()
        validate_file_security(content, file.filename)
        safe_name = sanitize_filename(file.filename)

        safe_input_path = os.path.join(job_dir, f"input_{uuid.uuid4().hex[:8]}")
        with open(safe_input_path, "wb") as f:
            f.write(content)

        output_path, output_filename, mime_type = await process_conversion(
            safe_input_path, target_format, job_dir
        )

        # Path traversal verification
        real_output_path = os.path.realpath(output_path)
        real_job_dir = os.path.realpath(job_dir)
        if not real_output_path.startswith(real_job_dir):
            raise ValueError("Path traversal violation detected.")

        # Immediately delete input file
        if os.path.exists(safe_input_path):
            os.remove(safe_input_path)

        JOB_CACHE[job_id] = {
            "created_at": time.time(),
            "output_path": output_path,
            "filename": output_filename,
            "mime_type": mime_type,
            "job_dir": job_dir
        }

        return {
            "job_id": job_id,
            "status": "ready",
            "filename": output_filename,
            "download_url": f"/api/job/{job_id}"
        }

    except ValueError as ve:
        if os.path.exists(job_dir):
            shutil.rmtree(job_dir, ignore_errors=True)
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception:
        if os.path.exists(job_dir):
            shutil.rmtree(job_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail="File processing failed safely.")

@app.post("/api/compress")
async def api_compress(
    request: Request,
    file: UploadFile = File(...),
    target_size_kb: Optional[int] = Form(None),
    quality: Optional[int] = Form(75)
):
    client_ip = request.client.host if request.client else "unknown"
    check_rate_limit(client_ip)

    job_id = str(uuid.uuid4())
    job_dir = os.path.join(TEMP_BASE_DIR, job_id)
    os.makedirs(job_dir, exist_ok=True)

    try:
        content = await file.read()
        validate_file_security(content, file.filename)

        safe_input_path = os.path.join(job_dir, f"input_{uuid.uuid4().hex[:8]}")
        with open(safe_input_path, "wb") as f:
            f.write(content)

        output_path, output_filename, mime_type = await process_compression(
            safe_input_path, target_size_kb, quality, job_dir
        )

        real_output_path = os.path.realpath(output_path)
        real_job_dir = os.path.realpath(job_dir)
        if not real_output_path.startswith(real_job_dir):
            raise ValueError("Path traversal violation detected.")

        if os.path.exists(safe_input_path):
            os.remove(safe_input_path)

        JOB_CACHE[job_id] = {
            "created_at": time.time(),
            "output_path": output_path,
            "filename": output_filename,
            "mime_type": mime_type,
            "job_dir": job_dir
        }

        return {
            "job_id": job_id,
            "status": "ready",
            "filename": output_filename,
            "download_url": f"/api/job/{job_id}"
        }

    except ValueError as ve:
        if os.path.exists(job_dir):
            shutil.rmtree(job_dir, ignore_errors=True)
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception:
        if os.path.exists(job_dir):
            shutil.rmtree(job_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail="Compression operation failed safely.")

@app.post("/api/ocr")
async def api_ocr(
    request: Request,
    file: UploadFile = File(...),
    lang: Optional[str] = Form("eng")
):
    client_ip = request.client.host if request.client else "unknown"
    check_rate_limit(client_ip)

    job_id = str(uuid.uuid4())
    job_dir = os.path.join(TEMP_BASE_DIR, job_id)
    os.makedirs(job_dir, exist_ok=True)

    try:
        content = await file.read()
        validate_file_security(content, file.filename)

        safe_input_path = os.path.join(job_dir, f"input_{uuid.uuid4().hex[:8]}")
        with open(safe_input_path, "wb") as f:
            f.write(content)

        output_path, output_filename, mime_type = await process_ocr(
            safe_input_path, lang or "eng", job_dir
        )

        real_output_path = os.path.realpath(output_path)
        real_job_dir = os.path.realpath(job_dir)
        if not real_output_path.startswith(real_job_dir):
            raise ValueError("Path traversal violation detected.")

        if os.path.exists(safe_input_path):
            os.remove(safe_input_path)

        JOB_CACHE[job_id] = {
            "created_at": time.time(),
            "output_path": output_path,
            "filename": output_filename,
            "mime_type": mime_type,
            "job_dir": job_dir
        }

        return {
            "job_id": job_id,
            "status": "ready",
            "filename": output_filename,
            "download_url": f"/api/job/{job_id}"
        }

    except ValueError as ve:
        if os.path.exists(job_dir):
            shutil.rmtree(job_dir, ignore_errors=True)
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception:
        if os.path.exists(job_dir):
            shutil.rmtree(job_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail="OCR processing failed safely.")

@app.post("/api/repair")
async def api_repair(
    request: Request,
    file: UploadFile = File(...)
):
    client_ip = request.client.host if request.client else "unknown"
    check_rate_limit(client_ip)

    job_id = str(uuid.uuid4())
    job_dir = os.path.join(TEMP_BASE_DIR, job_id)
    os.makedirs(job_dir, exist_ok=True)

    try:
        content = await file.read()
        validate_file_security(content, file.filename)

        safe_input_path = os.path.join(job_dir, f"input_{uuid.uuid4().hex[:8]}")
        with open(safe_input_path, "wb") as f:
            f.write(content)

        output_path, output_filename, mime_type = await process_repair(
            safe_input_path, job_dir
        )

        real_output_path = os.path.realpath(output_path)
        real_job_dir = os.path.realpath(job_dir)
        if not real_output_path.startswith(real_job_dir):
            raise ValueError("Path traversal violation detected.")

        if os.path.exists(safe_input_path):
            os.remove(safe_input_path)

        JOB_CACHE[job_id] = {
            "created_at": time.time(),
            "output_path": output_path,
            "filename": output_filename,
            "mime_type": mime_type,
            "job_dir": job_dir
        }

        return {
            "job_id": job_id,
            "status": "ready",
            "filename": output_filename,
            "download_url": f"/api/job/{job_id}"
        }

    except ValueError as ve:
        if os.path.exists(job_dir):
            shutil.rmtree(job_dir, ignore_errors=True)
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception:
        if os.path.exists(job_dir):
            shutil.rmtree(job_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail="Document repair failed safely.")

@app.get("/api/job/{job_id}")
async def get_job_file(job_id: str, background_tasks: BackgroundTasks):
    if job_id not in JOB_CACHE:
        raise HTTPException(status_code=404, detail="Job expired or not found.")

    job = JOB_CACHE[job_id]
    output_path = job["output_path"]

    if not os.path.exists(output_path):
        raise HTTPException(status_code=404, detail="File no longer available.")

    def cleanup_after_response():
        job_dir = job.get("job_dir")
        if job_dir and os.path.exists(job_dir):
            shutil.rmtree(job_dir, ignore_errors=True)
        JOB_CACHE.pop(job_id, None)

    background_tasks.add_task(cleanup_after_response)

    return FileResponse(
        path=output_path,
        media_type=job["mime_type"],
        filename=job["filename"]
    )

@app.delete("/api/job/{job_id}")
def delete_job(job_id: str):
    if job_id in JOB_CACHE:
        job = JOB_CACHE.pop(job_id)
        job_dir = job.get("job_dir")
        if job_dir and os.path.exists(job_dir):
            shutil.rmtree(job_dir, ignore_errors=True)
        return {"deleted": True}
    return {"deleted": False}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
