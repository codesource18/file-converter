import os
import shutil
import time
import uuid
import asyncio
from typing import Optional, Dict
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks, Header
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from converter import (
    process_conversion,
    process_compression,
    process_ocr,
    process_repair,
    validate_file_security
)

# In-memory ephemeral job metadata with TTL (15 minutes)
JOB_CACHE: Dict[str, dict] = {}
JOB_TTL_SECONDS = 900  # 15 minutes
TEMP_BASE_DIR = "/tmp/fileconverter_jobs"

os.makedirs(TEMP_BASE_DIR, exist_ok=True)

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
    docs_url="/docs",
    redoc_url=None,
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "File Converter Compatibility API",
        "timestamp": time.time(),
        "storage": "ephemeral-only",
        "active_jobs": len(JOB_CACHE)
    }

@app.post("/api/convert")
async def api_convert(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    target_format: str = Form(...),
    options: Optional[str] = Form(None)
):
    job_id = str(uuid.uuid4())
    job_dir = os.path.join(TEMP_BASE_DIR, job_id)
    os.makedirs(job_dir, exist_ok=True)

    try:
        content = await file.read()
        validate_file_security(content, file.filename)

        safe_input_path = os.path.join(job_dir, f"input_{uuid.uuid4().hex[:8]}")
        with open(safe_input_path, "wb") as f:
            f.write(content)

        output_path, output_filename, mime_type = await process_conversion(
            safe_input_path, target_format, job_dir
        )

        # Delete input file immediately
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

    except Exception as e:
        if os.path.exists(job_dir):
            shutil.rmtree(job_dir, ignore_errors=True)
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/compress")
async def api_compress(
    file: UploadFile = File(...),
    target_size_kb: Optional[int] = Form(None),
    quality: Optional[int] = Form(75)
):
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

    except Exception as e:
        if os.path.exists(job_dir):
            shutil.rmtree(job_dir, ignore_errors=True)
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/ocr")
async def api_ocr(
    file: UploadFile = File(...),
    lang: Optional[str] = Form("eng")
):
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
            safe_input_path, lang, job_dir
        )

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

    except Exception as e:
        if os.path.exists(job_dir):
            shutil.rmtree(job_dir, ignore_errors=True)
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/repair")
async def api_repair(
    file: UploadFile = File(...)
):
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

    except Exception as e:
        if os.path.exists(job_dir):
            shutil.rmtree(job_dir, ignore_errors=True)
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/job/{job_id}")
async def get_job_file(job_id: str, background_tasks: BackgroundTasks):
    if job_id not in JOB_CACHE:
        raise HTTPException(status_code=404, detail="Job expired or not found.")

    job = JOB_CACHE[job_id]
    output_path = job["output_path"]

    if not os.path.exists(output_path):
        raise HTTPException(status_code=404, detail="Converted file no longer available.")

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
