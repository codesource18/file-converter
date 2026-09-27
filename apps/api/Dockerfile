FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    poppler-utils \
    tesseract-ocr \
    ffmpeg \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

COPY apps/api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY apps/api/ .

ENV PORT=8000
ENV TEMP_DIR=/tmp/fileconverter_jobs
RUN mkdir -p /tmp/fileconverter_jobs

EXPOSE 8000

CMD ["python", "main.py"]
