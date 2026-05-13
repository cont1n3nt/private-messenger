#!/usr/bin/env sh
set -eu

mkdir -p /app/data /app/keys
python seed.py

exec uvicorn app.main:app --host 0.0.0.0 --port 8000
