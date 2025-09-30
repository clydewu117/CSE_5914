#!/usr/bin/env python3
"""
Development server startup script for PeakForm backend
"""
import uvicorn
from app.main import app

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,  # Enable auto-reload during development
        log_level="info",
    )
