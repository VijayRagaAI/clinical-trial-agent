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

from models import create_session, save_conversation_data, save_evaluation_data, get_saved_conversation, get_saved_evaluation
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
# Note: EligibilityEvaluator instances are created per-session with specific study_id

# Pydantic models for API
class StartSessionRequest(BaseModel):
    participant_name: Optional[str] = None
    participant_email: Optional[str] = None
    study_id: str

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
        self.session_studies: Dict[str, str] = {}  # Track study ID for each session
        self.session_messages: Dict[str, List] = {}  # Track messages for each session

    async def connect(self, websocket: WebSocket, session_id: str, study_id: str):
        await websocket.accept()
        self.active_connections[session_id] = websocket
        
        # Create a new session for this connection
        session = create_session()
        self.active_sessions[session_id] = session
        self.session_studies[session_id] = study_id
        self.session_messages[session_id] = []  # Initialize message tracking
        
        # Create agent with specific study
        self.session_agents[session_id] = ClinicalTrialAgent(session, study_id)
        
        logger.info(f"WebSocket connected for session {session_id} with study {study_id}")

    def disconnect(self, session_id: str):
        if session_id in self.active_connections:
            del self.active_connections[session_id]
        if session_id in self.session_agents:
            del self.session_agents[session_id]
        if session_id in self.active_sessions:
            del self.active_sessions[session_id]
        if session_id in self.session_studies:
            del self.session_studies[session_id]
        if session_id in self.session_messages:
            del self.session_messages[session_id]
        logger.info(f"WebSocket disconnected for session {session_id}")
    
    def add_message(self, session_id: str, message_type: str, content: str):
        """Add a message to the session's message history"""
        if session_id in self.session_messages:
            message = {
                "id": f"{message_type}-{len(self.session_messages[session_id])}",
                "type": message_type,
                "content": content,
                "timestamp": datetime.now().isoformat()
            }
            self.session_messages[session_id].append(message)
    
    def save_session_data(self, session_id: str, eligibility_result: dict = None):
        """Save conversation and evaluation data when interview completes"""
        if session_id in self.active_sessions:
            session = self.active_sessions[session_id]
            study_id = self.session_studies.get(session_id)
            messages = self.session_messages.get(session_id, [])
            
            # Save conversation data
            conversation_data = {
                "metadata": {
                    "participant_id": session.participant_id,
                    "session_id": session_id,
                    "study_id": study_id,
                    "export_timestamp": datetime.now().isoformat(),
                    "total_messages": len(messages),
                    "conversation_state": "completed"
                },
                "conversation": messages,
                "summary": {
                    "agent_messages": len([m for m in messages if m["type"] == "agent"]),
                    "user_messages": len([m for m in messages if m["type"] == "user"]),
                    "conversation_duration": self._calculate_duration(messages)
                }
            }
            
            # Save conversation data to file
            save_conversation_data(session_id, session.participant_id, conversation_data)
            
            # Save evaluation data if provided
            if eligibility_result:
                evaluation_data = {
                    "participant_id": session.participant_id,
                    "session_id": session_id,
                    "study_id": study_id,
                    "eligibility_result": eligibility_result,
                    "export_timestamp": datetime.now().isoformat()
                }
                save_evaluation_data(session_id, session.participant_id, evaluation_data)
    
    def _calculate_duration(self, messages):
        """Calculate conversation duration"""
        if len(messages) < 2:
            return "0 minutes"
        
        start_time = datetime.fromisoformat(messages[0]["timestamp"])
        end_time = datetime.fromisoformat(messages[-1]["timestamp"])
        duration_minutes = (end_time - start_time).total_seconds() / 60
        return f"{round(duration_minutes)} minutes"

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

@app.get("/api/studies")
async def get_available_studies():
    """Get list of available clinical studies"""
    try:
        from models import get_available_studies
        studies = get_available_studies()
        return {"studies": studies}
    except Exception as e:
        logger.error(f"Error getting studies: {e}")
        raise HTTPException(status_code=500, detail="Failed to get available studies")

@app.get("/api/studies/{study_id}")
async def get_study_details(study_id: str):
    """Get detailed information about a specific study"""
    try:
        from models import get_study_details
        study = get_study_details(study_id)
        if not study:
            raise HTTPException(status_code=404, detail="Study not found")
        return study
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting study details: {e}")
        raise HTTPException(status_code=500, detail="Failed to get study details")

@app.get("/api/trial-info")
async def get_trial_info():
    """Get trial information and criteria for first available study (deprecated - use /api/studies)"""
    try:
        from models import get_available_studies
        studies = get_available_studies()
        if not studies or len(studies) == 0:
            raise HTTPException(status_code=404, detail="No studies available")
        return studies[0]  # Return first available study
    except Exception as e:
        logger.error(f"Error getting trial info: {e}")
        raise HTTPException(status_code=500, detail="Failed to get trial information")

@app.get("/api/audio/languages")
async def get_supported_languages():
    """Get list of supported output languages"""
    try:
        languages = audio_processor.get_supported_languages()
        return {"languages": languages}
    except Exception as e:
        logger.error(f"Error getting languages: {e}")
        raise HTTPException(status_code=500, detail="Failed to get supported languages")

@app.get("/api/audio/voices")
async def get_available_voices():
    """Get list of available TTS voices"""
    try:
        voices = audio_processor.get_available_voices()
        return {"voices": voices}
    except Exception as e:
        logger.error(f"Error getting voices: {e}")
        raise HTTPException(status_code=500, detail="Failed to get available voices")

@app.post("/api/audio/voice-preview")
async def generate_voice_preview(request: Request):
    """Generate a voice preview sample"""
    try:
        data = await request.json()
        text = data.get("text", "Hello, this is a preview of my voice.")
        voice = data.get("voice", "onyx")
        language = data.get("language", "english")
        speed = float(data.get("speed", 1.0))
        
        # Clamp speed to valid range
        speed = max(0.25, min(4.0, speed))
        
        # Temporarily set the output language for preview
        original_language = audio_processor.output_language
        audio_processor.output_language = language
        
        # Generate preview audio using OpenAI TTS with specified voice and speed
        import openai
        
        # Translate preview text if needed
        if language != "english":
            preview_text = audio_processor.translate_text(text, language)
        else:
            preview_text = text
            
        response = openai.audio.speech.create(
            model="tts-1",
            voice=voice,
            input=preview_text,
            speed=speed
        )
        
        # Convert to base64
        import base64
        audio_base64 = base64.b64encode(response.content).decode('utf-8')
        
        # Restore original language
        audio_processor.output_language = original_language
        
        return {"audio": audio_base64}
        
    except Exception as e:
        logger.error(f"Error generating voice preview: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate voice preview")

@app.post("/api/audio/settings")
async def update_audio_settings(request: Request):
    """Update audio settings (language, voice, and speed)"""
    try:
        data = await request.json()
        output_language = data.get("output_language", "english")
        voice = data.get("voice", "onyx")
        speed = float(data.get("speed", 1.0))
        
        # Clamp speed to valid range
        speed = max(0.25, min(2.0, speed))  # Using 2.0 as max per user request
        
        # Validate language
        supported_languages = [lang["code"] for lang in audio_processor.get_supported_languages()]
        if output_language not in supported_languages:
            raise HTTPException(status_code=400, detail=f"Unsupported language: {output_language}")
        
        # Validate voice
        available_voices = [voice_item["id"] for voice_item in audio_processor.get_available_voices()]
        if voice not in available_voices:
            raise HTTPException(status_code=400, detail=f"Unsupported voice: {voice}")
        
        # Update processor settings
        audio_processor.set_output_language(output_language)
        
        # Store preferences
        os.environ["SELECTED_VOICE"] = voice
        os.environ["SELECTED_SPEED"] = str(speed)
        
        logger.info(f"Audio settings updated: language={output_language}, voice={voice}, speed={speed}x")
        
        return {
            "status": "success",
            "settings": {
                "output_language": output_language,
                "voice": voice,
                "speed": speed
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating audio settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to update audio settings")

@app.get("/api/audio/settings")
async def get_audio_settings():
    """Get current audio settings"""
    try:
        current_language = audio_processor.output_language
        current_voice = os.getenv("SELECTED_VOICE", "onyx")
        current_speed = float(os.getenv("SELECTED_SPEED", "1.0"))
        
        return {
            "output_language": current_language,
            "voice": current_voice,
            "speed": current_speed,
            "available_languages": audio_processor.get_supported_languages(),
            "available_voices": audio_processor.get_available_voices()
        }
        
    except Exception as e:
        logger.error(f"Error getting audio settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to get audio settings")

@app.get("/api/download/conversation/{session_id}/{participant_id}")
async def download_conversation_data(session_id: str, participant_id: str):
    """Get saved conversation data for download"""
    try:
        conversation_data = get_saved_conversation(session_id, participant_id)
        if not conversation_data:
            raise HTTPException(status_code=404, detail="Conversation data not found")
        
        return conversation_data["data"]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving conversation data: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve conversation data")

@app.get("/api/download/evaluation/{session_id}/{participant_id}")
async def download_evaluation_data(session_id: str, participant_id: str):
    """Get saved evaluation data for download"""
    try:
        evaluation_data = get_saved_evaluation(session_id, participant_id)
        if not evaluation_data:
            raise HTTPException(status_code=404, detail="Evaluation data not found")
        
        return evaluation_data["data"]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving evaluation data: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve evaluation data")

# WebSocket endpoint for real-time voice interaction
@app.websocket("/ws/{session_id}/{study_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str, study_id: str):
    await manager.connect(websocket, session_id, study_id)
    
    try:
        # Send initial greeting with audio
        agent = manager.session_agents.get(session_id)
        if agent:
            initial_message = await agent.get_initial_greeting()
            
            # Track initial greeting message
            manager.add_message(session_id, "agent", initial_message)
            
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
        
        # Track user message
        manager.add_message(session_id, "user", user_message)
        
        # Small delay to ensure message order
        await asyncio.sleep(0.1)
        
        # Get agent response
        agent = manager.session_agents.get(session_id)
        session = manager.active_sessions.get(session_id)
        
        if agent:
            agent_response = await agent.process_user_response(user_message)
            
            # Generate audio for agent response
            audio_data = await audio_processor.text_to_speech(agent_response["content"])
            
            # Track agent message
            manager.add_message(session_id, "agent", agent_response["content"])
            
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
            
            # Check if we need to start evaluation
            if agent_response.get("evaluating", False) and session:
                # Small delay before starting evaluation
                await asyncio.sleep(1.0)
                
                # Get study ID for this session
                study_id = manager.session_studies.get(session_id)
                if not study_id:
                    raise ValueError(f"No study ID found for session {session_id}")
                
                # Create study-specific evaluator
                study_evaluator = EligibilityEvaluator(study_id)
                
                # Evaluate eligibility (now async for parallel processing)
                eligibility_result = await study_evaluator.evaluate_eligibility(session)
                
                # Complete the interview
                completion_response = agent.complete_interview()
                
                # Generate audio for completion message
                completion_audio = await audio_processor.text_to_speech(completion_response["content"])
                
                # Track completion message
                manager.add_message(session_id, "agent", completion_response["content"])
                
                # Send completion message
                await manager.send_message(session_id, {
                    "type": "agent_message",
                    "content": completion_response["content"],
                    "audio": completion_audio,
                    "timestamp": datetime.now().isoformat(),
                    "requires_response": completion_response.get("requires_response", False),
                    "is_final": completion_response.get("is_final", False),
                    "question_number": completion_response.get("question_number", 0),
                    "total_questions": completion_response.get("total_questions", len(agent.trial_criteria))
                })
                
                # Save session data (conversation + evaluation) FIRST
                manager.save_session_data(session_id, eligibility_result)
                
                # Send interview complete event with the same data we just saved
                await manager.send_message(session_id, {
                    "type": "interview_complete",
                    "eligibility": eligibility_result,  # ← Same data we just saved
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
            "studies_api": "ready"
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