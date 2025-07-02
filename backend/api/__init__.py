"""
Clinical Trial Voice Interviewer API Modules

This package contains organized API endpoints grouped by functionality:
- session: Session management endpoints
- study: Study management endpoints  
- audio: Audio settings and TTS endpoints
- clinical_trials: External clinical trials API integration
- admin: Administrative operations
- export: Data download and export endpoints
- websocket: Real-time communication endpoints
"""

from fastapi import APIRouter
from .session import router as session_router
from .study import router as study_router
from .audio import router as audio_router
from .clinical_trials import router as clinical_trials_router
from .admin import router as admin_router

def create_api_routes() -> APIRouter:
    """Create and configure all API routes"""
    api_router = APIRouter()
    
    # Include all sub-routers
    api_router.include_router(session_router, prefix="/sessions", tags=["sessions"])
    api_router.include_router(session_router, prefix="/interviews", tags=["interviews"])  # For save-progress endpoint
    api_router.include_router(study_router, tags=["studies"])
    api_router.include_router(audio_router, prefix="/audio", tags=["audio"])
    api_router.include_router(clinical_trials_router, prefix="/clinicaltrials", tags=["clinical-trials"])
    api_router.include_router(admin_router, tags=["admin"])  # No prefix for admin endpoints
    
    return api_router 