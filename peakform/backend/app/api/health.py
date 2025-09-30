from fastapi import APIRouter
from sqlalchemy.orm import Session
from app.database import SessionLocal

router = APIRouter()


def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/api/health")
async def api_health_check():
    """API health check endpoint"""
    return {
        "status": "healthy",
        "service": "PeakForm API",
        "version": "1.0.0",
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "api_health": "/api/health",
        },
    }


@router.get("/api/version")
async def get_version():
    """Get API version information"""
    return {
        "api_version": "1.0.0",
        "service": "PeakForm API",
        "description": "Personalized workout plan generation API",
    }
