import pytest
import io
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../apps/api')))

from main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["storage"] == "ephemeral-only"

def test_convert_image_endpoint():
    # Simple 1x1 PNG bytes
    png_bytes = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
    files = {"file": ("test.png", io.BytesIO(png_bytes), "image/png")}
    response = client.post("/api/convert", data={"target_format": "JPG"}, files=files)
    assert response.status_code == 200
    data = response.json()
    assert "job_id" in data
    assert data["status"] == "ready"

    # Download job
    job_id = data["job_id"]
    dl_response = client.get(f"/api/job/{job_id}")
    assert dl_response.status_code == 200
    assert len(dl_response.content) > 0

def test_security_empty_file():
    files = {"file": ("empty.png", io.BytesIO(b""), "image/png")}
    response = client.post("/api/convert", data={"target_format": "JPG"}, files=files)
    assert response.status_code == 400
    assert "empty 0-byte file" in response.text
