import asyncio
import json
import logging
import os
from datetime import datetime
from typing import Dict, List, Optional
import uuid

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn
from dotenv import load_dotenv

from models import create_session, save_conversation_data, save_evaluation_data, get_saved_conversation, get_saved_evaluation, ParticipantSession
from agents import ClinicalTrialCoordinator as ClinicalTrialAgent
from audio import AudioCoordinator as AudioProcessor
from agents.evaluation_agent import EligibilityEvaluator

# Import organized API modules
from api import create_api_routes
from api.session import set_session_registry
from api.audio import set_audio_processor
from api.websocket import websocket_endpoint, set_dependencies

# Import the real clinical trials service
from api.clinical_trials_service import clinical_trials_service

from api.clinical_trials import set_clinical_trials_service

import openai

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=getattr(logging, os.getenv('LOG_LEVEL', 'INFO')))
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Clinical Trial Voice Interviewer API",
    description="AI-powered voice agent for clinical trial participant screening",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://localhost:5173').split(','),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
audio_processor = AudioProcessor()
session_registry = {}

# Set up API module dependencies
set_session_registry(session_registry)
set_audio_processor(audio_processor)
set_clinical_trials_service(clinical_trials_service)
set_dependencies(audio_processor, session_registry)

# Include organized API routes
app.include_router(create_api_routes(), prefix="/api")

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Clinical Trial Voice Interviewer API", "version": "1.0.0"}

# WebSocket endpoint (uses organized websocket module)
@app.websocket("/ws/{session_id}/{study_id}")
async def websocket_handler(websocket: WebSocket, session_id: str, study_id: str):
    """WebSocket endpoint that delegates to the organized websocket module"""
    await websocket_endpoint(websocket, session_id, study_id)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "services": {
            "audio_processor": "ready",
            "studies_api": "ready"
        }
    }

if __name__ == "__main__":
    uvicorn.run(
        "api_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 