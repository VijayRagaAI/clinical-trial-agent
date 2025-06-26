import asyncio
import json
import logging
import os
from datetime import datetime
from typing import Dict, List, Optional
import uuid

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn
from dotenv import load_dotenv

from models import create_session, save_eligibility_result
from conversation_agent import ClinicalTrialAgent
from audio_processor import AudioProcessor
from eligibility_evaluator import EligibilityEvaluator

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
eligibility_evaluator = EligibilityEvaluator()

# Pydantic models for API
class StartSessionRequest(BaseModel):
    participant_name: Optional[str] = None
    participant_email: Optional[str] = None

class SessionResponse(BaseModel):
    session_id: str
    participant_id: str
    created_at: str

class EligibilityResponse(BaseModel):
    session_id: str
    eligible: bool
    score: float
    criteria_met: List[Dict]
    summary: str

# Connection manager for WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.session_agents: Dict[str, ClinicalTrialAgent] = {}
        self.active_sessions: Dict[str, any] = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        self.active_connections[session_id] = websocket
        
        # Create a new session for this connection
        session = create_session()
        self.active_sessions[session_id] = session
        self.session_agents[session_id] = ClinicalTrialAgent(session)
        
        logger.info(f"WebSocket connected for session {session_id}")

    def disconnect(self, session_id: str):
        if session_id in self.active_connections:
            del self.active_connections[session_id]
        if session_id in self.session_agents:
            del self.session_agents[session_id]
        if session_id in self.active_sessions:
            del self.active_sessions[session_id]
        logger.info(f"WebSocket disconnected for session {session_id}")

    async def send_message(self, session_id: str, message: dict):
        if session_id in self.active_connections:
            await self.active_connections[session_id].send_text(json.dumps(message))

manager = ConnectionManager()

# REST API Endpoints

@app.get("/")
async def root():
    return {"message": "Clinical Trial Voice Interviewer API", "version": "1.0.0"}

@app.post("/api/sessions/start", response_model=SessionResponse)
async def start_session(request: StartSessionRequest):
    """Start a new interview session"""
    try:
        session = create_session()
        
        logger.info(f"New session started: {session.session_id}")
        
        return SessionResponse(
            session_id=session.session_id,
            participant_id=session.participant_id,
            created_at=datetime.now().isoformat()
        )
    except Exception as e:
        logger.error(f"Error starting session: {e}")
        raise HTTPException(status_code=500, detail="Failed to start session")

@app.get("/api/trial-info")
async def get_trial_info():
    """Get trial information and criteria"""
    with open("eligibility.json", "r") as f:
        trial_data = json.load(f)
    return trial_data

# WebSocket endpoint for real-time voice interaction
@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await manager.connect(websocket, session_id)
    
    try:
        # Send initial greeting with audio
        agent = manager.session_agents.get(session_id)
        if agent:
            initial_message = await agent.get_initial_greeting()
            
            # Generate audio for greeting
            audio_data = await audio_processor.text_to_speech(initial_message)
            
            await manager.send_message(session_id, {
                "type": "agent_message",
                "content": initial_message,
                "audio": audio_data,
                "timestamp": datetime.now().isoformat(),
                "requires_response": True,
                "question_number": 0,  # Consent phase
                "total_questions": len(agent.trial_criteria)
            })
        
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            message_type = message_data.get("type")
            
            if message_type == "audio_data":
                # Process audio data
                audio_data = message_data.get("audio")
                await handle_audio_input(session_id, audio_data)
                
            elif message_type == "text_message":
                # Process text message
                user_message = message_data.get("content")
                await handle_text_input(session_id, user_message)
                
            elif message_type == "start_recording":
                # Notify that recording started
                await manager.send_message(session_id, {
                    "type": "recording_started",
                    "timestamp": datetime.now().isoformat()
                })
                
            elif message_type == "stop_recording":
                # Handle end of recording
                await manager.send_message(session_id, {
                    "type": "recording_stopped",
                    "timestamp": datetime.now().isoformat()
                })
    
    except WebSocketDisconnect:
        manager.disconnect(session_id)
        logger.info(f"Client disconnected from session {session_id}")
    except Exception as e:
        logger.error(f"WebSocket error for session {session_id}: {e}")
        manager.disconnect(session_id)

async def handle_audio_input(session_id: str, audio_data: str):
    """Process audio input from the client"""
    try:
        # Convert audio to text using STT
        transcribed_text = await audio_processor.speech_to_text(audio_data)
        
        if not transcribed_text or transcribed_text.strip() == "":
            await manager.send_message(session_id, {
                "type": "error",
                "content": "Could not understand audio. Please try again.",
                "timestamp": datetime.now().isoformat()
            })
            return
        
        # Process the transcribed text
        await handle_text_input(session_id, transcribed_text)
        
    except Exception as e:
        logger.error(f"Error processing audio for session {session_id}: {e}")
        await manager.send_message(session_id, {
            "type": "error",
            "content": "Error processing audio. Please try again.",
            "timestamp": datetime.now().isoformat()
        })

async def handle_text_input(session_id: str, user_message: str):
    """Process text input and generate agent response"""
    try:
        # Send user message confirmation first
        await manager.send_message(session_id, {
            "type": "user_message",
            "content": user_message,
            "timestamp": datetime.now().isoformat()
        })
        
        # Small delay to ensure message order
        await asyncio.sleep(0.1)
        
        # Get agent response
        agent = manager.session_agents.get(session_id)
        session = manager.active_sessions.get(session_id)
        
        if agent:
            agent_response = await agent.process_user_response(user_message)
            
            # Generate audio for agent response
            audio_data = await audio_processor.text_to_speech(agent_response["content"])
            
            # Send agent response
            await manager.send_message(session_id, {
                "type": "agent_message",
                "content": agent_response["content"],
                "audio": audio_data,
                "timestamp": datetime.now().isoformat(),
                "requires_response": agent_response.get("requires_response", True),
                "is_final": agent_response.get("is_final", False),
                "awaiting_submission": agent_response.get("awaiting_submission", False),
                "question_number": agent_response.get("question_number", 0),
                "total_questions": agent_response.get("total_questions", len(agent.trial_criteria))
            })
            
            # Check if interview is complete
            if agent_response.get("is_final", False) and session:
                # Additional delay before eligibility assessment
                # await asyncio.sleep(0.5)
                
                # Evaluate eligibility
                eligibility_result = eligibility_evaluator.evaluate_eligibility(session)
                
                # Save to JSON with responses
                save_eligibility_result(session.participant_id, session.responses, eligibility_result)
                
                await manager.send_message(session_id, {
                    "type": "interview_complete",
                    "eligibility": eligibility_result,
                    "participant_id": session.participant_id,
                    "timestamp": datetime.now().isoformat()
                })
        
    except Exception as e:
        logger.error(f"Error processing text input for session {session_id}: {e}")
        await manager.send_message(session_id, {
            "type": "error",
            "content": "Error processing your response. Please try again.",
            "timestamp": datetime.now().isoformat()
        })

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "audio_processor": "ready",
            "eligibility_evaluator": "ready"
        }
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 