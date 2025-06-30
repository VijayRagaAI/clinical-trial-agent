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
from clinical_trials_api import clinical_trials_service
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
# Note: EligibilityEvaluator instances are created per-session with specific study_id

# Session registry to store sessions created by REST API
session_registry = {}

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
        self.active_sessions: Dict[str, ParticipantSession] = {}
        self.session_agents: Dict[str, ClinicalTrialAgent] = {}
        self.session_studies: Dict[str, str] = {}
        self.session_messages: Dict[str, List[Dict]] = {}

    async def connect(self, websocket: WebSocket, session_id: str, study_id: str):
        await websocket.accept()
        self.active_connections[session_id] = websocket
        
        # Try to get existing session from registry first
        session = session_registry.get(session_id)
        if session:
            logger.info(f"Reusing existing session for {session_id}: {session.participant_id}")
        else:
            # Create a new session only if one doesn't exist
            session = create_session()
            logger.info(f"Created new session for {session_id}: {session.participant_id}")
        
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
        # Clean up session registry
        if session_id in session_registry:
            del session_registry[session_id]
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
        
        logger.info(f"New session started: {session.session_id} with participant_id: {session.participant_id}")
        
        # Add session to registry so WebSocket can reuse it
        session_registry[session.session_id] = session
        
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
        voice = data.get("voice", "nova")
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
        voice = data.get("voice", "nova")
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
        current_voice = os.getenv("SELECTED_VOICE", "nova")
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

@app.post("/api/study/preferences")
async def update_study_preferences(request: Request):
    """Update study selection preferences"""
    try:
        data = await request.json()
        study_id = data.get("study_id")
        
        if not study_id:
            raise HTTPException(status_code=400, detail="study_id is required")
        
        # Validate that the study exists
        from models import get_available_studies
        studies = get_available_studies()
        valid_study_ids = [study["id"] for study in studies]
        
        if study_id not in valid_study_ids:
            raise HTTPException(status_code=400, detail=f"Invalid study_id: {study_id}")
        
        # Store preference in environment variable
        os.environ["SELECTED_STUDY_ID"] = study_id
        
        logger.info(f"Study preference updated: study_id={study_id}")
        
        return {
            "status": "success",
            "settings": {
                "study_id": study_id
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating study preferences: {e}")
        raise HTTPException(status_code=500, detail="Failed to update study preferences")

@app.get("/api/study/preferences")
async def get_study_preferences():
    """Get current study preferences"""
    try:
        selected_study_id = os.getenv("SELECTED_STUDY_ID")
        
        # Get available studies
        from models import get_available_studies
        studies = get_available_studies()
        
        # Find the selected study details if a preference exists
        selected_study = None
        if selected_study_id:
            selected_study = next((study for study in studies if study["id"] == selected_study_id), None)
        
        return {
            "selected_study_id": selected_study_id,
            "selected_study": selected_study,
            "available_studies": studies
        }
        
    except Exception as e:
        logger.error(f"Error getting study preferences: {e}")
        raise HTTPException(status_code=500, detail="Failed to get study preferences")

@app.post("/api/theme/preferences")
async def update_theme_preferences(request: Request):
    """Update theme preferences"""
    try:
        data = await request.json()
        is_dark_mode = data.get("is_dark_mode", False)
        
        # Validate boolean value
        if not isinstance(is_dark_mode, bool):
            raise HTTPException(status_code=400, detail="is_dark_mode must be a boolean")
        
        # Store preference in environment variable
        os.environ["SELECTED_THEME_DARK"] = str(is_dark_mode).lower()
        
        logger.info(f"Theme preference updated: dark_mode={is_dark_mode}")
        
        return {
            "status": "success",
            "settings": {
                "is_dark_mode": is_dark_mode
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating theme preferences: {e}")
        raise HTTPException(status_code=500, detail="Failed to update theme preferences")

@app.get("/api/theme/preferences")
async def get_theme_preferences():
    """Get current theme preferences"""
    try:
        selected_theme_dark = os.getenv("SELECTED_THEME_DARK", "false").lower()
        is_dark_mode = selected_theme_dark == "true"
        
        return {
            "is_dark_mode": is_dark_mode
        }
        
    except Exception as e:
        logger.error(f"Error getting theme preferences: {e}")
        raise HTTPException(status_code=500, detail="Failed to get theme preferences")

# Google TTS API Endpoints

@app.get("/api/audio/google-tts/models")
async def get_google_tts_models():
    """Get list of available Google TTS models"""
    try:
        models = audio_processor.get_available_models()
        return {"models": models}
    except Exception as e:
        logger.error(f"Error getting Google TTS models: {e}")
        raise HTTPException(status_code=500, detail="Failed to get Google TTS models")

@app.get("/api/audio/google-tts/voices")
async def get_google_tts_voices(language: str = "english"):
    """Get list of available Google TTS voices for a language"""
    try:
        voices = audio_processor.get_available_voices(language)
        return {"voices": voices, "language": language}
    except Exception as e:
        logger.error(f"Error getting Google TTS voices: {e}")
        raise HTTPException(status_code=500, detail="Failed to get Google TTS voices")

@app.post("/api/audio/google-tts-settings")
async def update_google_tts_settings(request: Request):
    """Update Google TTS settings (model, voice, speed, language)"""
    try:
        data = await request.json()
        
        # Extract settings
        model = data.get("model")
        voice = data.get("voice") 
        speed = data.get("speed")
        language = data.get("output_language")
        
        # Validate and prepare settings dict
        settings = {}
        
        if language:
            # Validate language
            supported_languages = [lang["code"] for lang in audio_processor.get_supported_languages()]
            if language not in supported_languages:
                raise HTTPException(status_code=400, detail=f"Unsupported language: {language}")
            settings["language"] = language
            
        if model:
            # Validate model
            available_models = [m["id"] for m in audio_processor.get_available_models()]
            if model not in available_models:
                raise HTTPException(status_code=400, detail=f"Unsupported model: {model}")
            settings["model"] = model
            
        if voice:
            settings["voice"] = voice
            
        if speed is not None:
            # Validate speed range
            speed = float(speed)
            if speed < 0.25 or speed > 4.0:
                raise HTTPException(status_code=400, detail="Speed must be between 0.25 and 4.0")
            settings["speed"] = speed
        
        # Update Google TTS settings
        success = audio_processor.update_google_tts_settings(settings)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update Google TTS settings")
        
        # Store in environment variables for persistence
        if "model" in settings:
            os.environ["GOOGLE_TTS_MODEL"] = settings["model"]
        if "voice" in settings:
            os.environ["GOOGLE_TTS_VOICE"] = settings["voice"]
        if "speed" in settings:
            os.environ["GOOGLE_TTS_SPEED"] = str(settings["speed"])
        if "language" in settings:
            os.environ["OUTPUT_LANGUAGE"] = settings["language"]
        
        logger.info(f"Google TTS settings updated: {settings}")
        
        return {
            "status": "success",
            "settings": settings
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating Google TTS settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to update Google TTS settings")

@app.get("/api/audio/google-tts-settings")
async def get_google_tts_settings():
    """Get current Google TTS settings"""
    try:
        current_model = os.getenv("GOOGLE_TTS_MODEL", "neural2")
        current_voice = os.getenv("GOOGLE_TTS_VOICE", "en-US-Neural2-F")
        current_speed = float(os.getenv("GOOGLE_TTS_SPEED", "1.0"))
        current_language = os.getenv("OUTPUT_LANGUAGE", "english")
        
        return {
            "model": current_model,
            "voice": current_voice,
            "speed": current_speed,
            "output_language": current_language,
            "available_models": audio_processor.get_available_models(),
            "available_languages": audio_processor.get_supported_languages()
        }
        
    except Exception as e:
        logger.error(f"Error getting Google TTS settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to get Google TTS settings")

@app.post("/api/audio/google-tts/voice-preview")
async def generate_google_voice_preview(request: Request):
    """Generate a voice preview using Google TTS"""
    try:
        data = await request.json()
        voice_id = data.get("voice_id")
        text = data.get("text", "Hello, I will guide you.")
        language = data.get("language", "english").lower()
        gender = data.get("gender", "neutral").lower()
        speed = data.get("speed", 1.0)
        
        if not voice_id:
            raise HTTPException(status_code=400, detail="voice_id is required")
        
        logger.info(f"🎤 Voice preview request: voice_id={voice_id}, language={language}, gender={gender}, speed={speed}")
        
        # Generate preview audio with language translation, gender awareness, and speed
        audio_base64 = await audio_processor.play_voice_preview(voice_id, text, language, gender, speed)
        
        if not audio_base64:
            raise HTTPException(status_code=500, detail="Failed to generate voice preview")
        
        return {"audio": audio_base64}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating Google voice preview: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate Google voice preview")

@app.post("/api/translate")
async def translate_text(request: Request):
    """Translate text to specified language"""
    try:
        data = await request.json()
        text = data.get("text")
        target_language = data.get("target_language", "english").lower()
        gender = data.get("gender", "neutral").lower()
        
        if not text:
            raise HTTPException(status_code=400, detail="text is required")
        
        # Use audio processor's translation method with gender awareness
        translated_text = audio_processor.translate_text(text, target_language, gender)
        
        return {"translated_text": translated_text}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error translating text: {e}")
        raise HTTPException(status_code=500, detail="Failed to translate text")

# ClinicalTrials.gov API Integration Endpoints

@app.get("/api/clinicaltrials/search")
async def search_clinical_trials(query: str, max_results: int = 20):
    """Search clinical trials from ClinicalTrials.gov"""
    try:
        if not query or len(query.strip()) < 2:
            raise HTTPException(status_code=400, detail="Query must be at least 2 characters long")
        
        # Clamp max_results to reasonable range
        max_results = max(1, min(100, max_results))
        
        logger.info(f"Searching ClinicalTrials.gov for: '{query}' (max_results: {max_results})")
        
        results = await clinical_trials_service.search_studies(query, max_results)
        
        logger.info(f"Found {results.get('total_count', 0)} studies for query: '{query}'")
        
        return results
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching clinical trials: {e}")
        raise HTTPException(status_code=500, detail="Failed to search clinical trials")

@app.get("/api/clinicaltrials/study/{nct_id}")
async def get_clinical_trial_details(nct_id: str):
    """Get detailed information for a specific clinical trial"""
    try:
        if not nct_id or not nct_id.startswith('NCT'):
            raise HTTPException(status_code=400, detail="Invalid NCT ID format")
        
        logger.info(f"Fetching details for study: {nct_id}")
        
        study_details = await clinical_trials_service.get_study_details(nct_id)
        
        logger.info(f"Successfully fetched details for study: {nct_id}")
        
        return study_details
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching study details: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch study details")

@app.post("/api/clinicaltrials/import")
async def import_clinical_trial(request: Request):
    """Import a clinical trial from ClinicalTrials.gov and convert to local format"""
    try:
        data = await request.json()
        logger.info(f"Import request data keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
        
        external_study = data.get('study')
        logger.info(f"External study data: {external_study}")
        
        if not external_study:
            logger.error("No study data provided")
            raise HTTPException(status_code=400, detail="No study data provided")
        
        if not external_study.get('nct_id'):
            logger.error(f"No NCT ID in study data. Available keys: {list(external_study.keys()) if isinstance(external_study, dict) else 'Not a dict'}")
            raise HTTPException(status_code=400, detail="Study data missing NCT ID")
        
        logger.info(f"Importing study: {external_study.get('nct_id')}")
        
        # Convert external study to local format
        converted_study = await convert_external_study_to_local(external_study)
        
        # Save to local studies file
        success = await save_imported_study(converted_study)
        
        if success:
            logger.info(f"Successfully imported study: {converted_study['id']}")
            return {
                "success": True,
                "message": f"Successfully imported study {external_study.get('nct_id')}",
                "study_id": converted_study['id']
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to save imported study")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error importing clinical trial: {e}")
        raise HTTPException(status_code=500, detail="Failed to import clinical trial")

async def convert_external_study_to_local(external_study: dict) -> dict:
    """Convert ClinicalTrials.gov study format to our local format using AI"""
    import re
    import openai
    import json
    from datetime import datetime
    
    logger.info(f"Converting study using AI: {external_study.get('nct_id')}")
    
    # Generate a unique ID from NCT ID
    nct_id = external_study.get('nct_id', 'unknown')
    study_id = nct_id.lower().replace('nct', 'imported-nct-') if nct_id != 'unknown' else f'imported-{datetime.now().strftime("%Y%m%d%H%M%S")}'
    
    # Sample of our target format for the AI
    sample_study = {
        "id": "diabetes-abc123",
        "trial": {
            "nct_id": "NCT00000000",
            "title": "Phase II Randomized Study of ABC-123 in Adults With Type-2 Diabetes",
            "protocol_version": "v0.4-mixed-responses",
            "last_amended": "2025-06-24",
            "category": "Endocrinology",  # Options: Endocrinology, Cardiology, Oncology, Rheumatology, Neurology, General Medicine
            "description": "Investigating a novel diabetes medication for blood sugar control",
            "phase": "Phase II",
            "sponsor": "DiabetesCare Research Institute"
        },
        "overview": {
            "purpose": "Test if new diabetes pill controls blood sugar in adults with type-2 diabetes",
            "participant_commitment": "About 7 months and 8 clinic visits.",
            "key_procedures": [
                "Blood tests",
                "Blood-pressure and weight checks", 
                "One ECG",
                "Daily study pill"
            ]
        },
        "contact_info": "Study conducted at DiabetesCare Research Institute, Boston MA. Enrolling 200 participants (currently recruiting). Contact: Dr. Johnson, (617) 555-0123. Study runs Jan 2025 - Aug 2025.",
        "criteria": [
            {
                "id": "INC001",
                "text": "Age 18 – 75 years (inclusive)",
                "question": "How old are you?",
                "expected_response": "18-75 years",
                "response": "",
                "priority": "high"  # Core requirement
            },
            {
                "id": "INC002", 
                "text": "Diagnosed with Type-2 diabetes for at least 6 months",
                "question": "How long have you been diagnosed with Type-2 diabetes?",
                "expected_response": "At least 6 months",
                "response": "",
                "priority": "high"  # Core diagnosis
            },
            {
                "id": "INC003",
                "text": "HbA1c level between 7.0% and 10.5%",
                "question": "What was your most recent HbA1c level?",
                "expected_response": "HbA1c 7.0-10.5%",
                "response": "",
                "priority": "medium"  # Important lab value
            },
            {
                "id": "INC004",
                "text": "Stable diabetes medications for at least 3 months",
                "question": "Have your diabetes medications been stable for the past 3 months?",
                "expected_response": "Yes, stable for 3+ months",
                "response": "",
                "priority": "medium"  # Important but not disqualifying
            },
            {
                "id": "INC005",
                "text": "Available for all study visits over 7 months",
                "question": "Would you be able to come for regular clinic visits over the next 7 months?",
                "expected_response": "Available for all visits over 7 months",
                "response": "",
                "priority": "low"  # Administrative requirement
            },
            {
                "id": "INC006",
                "text": "No participation in another clinical trial within the last 30 days",
                "question": "Have you participated in any other clinical trials in the past month?",
                "expected_response": "No recent trial participation",
                "response": "",
                "priority": "low"  # Administrative/safety check
            }
        ]
    }
    
    # Create the AI prompt
    ai_prompt = f"""You are an expert clinical research coordinator. Convert this ClinicalTrials.gov study data into our specific format.

**EXTERNAL STUDY DATA:**
```json
{json.dumps(external_study, indent=2)}
```

**TARGET FORMAT (example):**
```json
{json.dumps(sample_study, indent=2)}
```

**CONVERSION INSTRUCTIONS:**
1. **ID**: Create from NCT ID like "imported-nct-{nct_id.lower().replace('nct', '')}"
2. **Category**: Choose from: Endocrinology, Cardiology, Oncology, Rheumatology, Neurology, General Medicine, etc.
3. **Description**: 1-2 sentence summary of what the study does
4. **Purpose**: Patient-friendly explanation of what the study tests
5. **Participant Commitment**: Estimate time/visits from available data
6. **Key Procedures**: Extract from eligibility criteria and study description (3-6 items)
7. **Contact Info**: Create 1-2 line summary with location, enrollment info, contact details, timeline
8. **Criteria**: Convert eligibility text into interview questions
   - Extract ALL meaningful criteria from eligibility_criteria text
   - Create natural conversation questions using APPROPRIATE QUESTION TYPES
   - Use IDs like "IMP001", "IMP002", etc.

**QUESTION DESIGN APPROACH:**
- Act like a normal doctor having a conversation with a patient
- Ask natural, conversational questions that a healthcare provider would ask
- Questions should cover the full scope of each criterion, not just part of it
- Avoid overly simple yes/no questions when more detail is needed for proper assessment

**PRIORITY ASSIGNMENT RULES (CRITICAL - CREATE MIXTURE):**
- **HIGH priority**: Core medical requirements that absolutely disqualify
  - Age limits, primary diagnosis, serious safety exclusions (pregnancy, active infections)
  - Example: "Age 18-75", "Diagnosed with diabetes", "No active hepatitis"
  
- **MEDIUM priority**: Important but not immediately disqualifying
  - Specific lab values, medication stability, general health status
  - Example: "HbA1c 7.0-10.5%", "Stable medications for 3 months", "BMI 25-40"
  
- **LOW priority**: Nice-to-have or administrative requirements
  - Study commitment, consent willingness, travel ability, previous trial participation
  - Example: "Available for all visits", "Willing to sign consent", "No trials in past 30 days"

**IMPORTANT:**
- MUST create a realistic mixture: ~40% high, ~40% medium, ~20% low priorities
- Extract as many criteria as possible from the eligibility_criteria field
- Questions should be natural and conversational, like a doctor would ask
- Questions should cover the full scope of each criterion when needed
- Avoid overly medical jargon - make it patient-friendly

Return ONLY the JSON object, no markdown or explanation."""

    try:
        # Call OpenAI GPT-4o-mini
        client = openai.OpenAI()  # Uses OPENAI_API_KEY from environment
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system", 
                    "content": "You are an expert clinical research coordinator who converts clinical trial data into structured interview formats. Always return valid JSON."
                },
                {
                    "role": "user", 
                    "content": ai_prompt
                }
            ],
            temperature=0.3,  # Lower temperature for more consistent output
            max_tokens=3000
        )
        
        ai_response = response.choices[0].message.content
        logger.info(f"AI response received for study {nct_id}")
        
        # Parse the AI response
        try:
            # Clean up the response (remove any markdown formatting)
            clean_response = ai_response.strip()
            if clean_response.startswith('```json'):
                clean_response = clean_response[7:]
            if clean_response.endswith('```'):
                clean_response = clean_response[:-3]
            clean_response = clean_response.strip()
            
            converted_study = json.loads(clean_response)
            
            # Validate and ensure required fields
            if not converted_study.get('id'):
                converted_study['id'] = study_id
            
            # Ensure all required trial fields are present
            if 'trial' not in converted_study:
                converted_study['trial'] = {}
            
            trial = converted_study['trial']
            trial['protocol_version'] = f"imported-{datetime.now().strftime('%Y%m%d')}"
            trial['last_amended'] = datetime.now().strftime('%Y-%m-%d')
            trial['nct_id'] = nct_id
            
            # Ensure all required fields have defaults
            if 'title' not in trial:
                trial['title'] = external_study.get('title', 'Imported Study')
            if 'category' not in trial:
                trial['category'] = 'General Medicine'
            if 'description' not in trial:
                trial['description'] = 'Imported clinical trial study'
            if 'phase' not in trial:
                trial['phase'] = external_study.get('phase', 'N/A')
            if 'sponsor' not in trial:
                trial['sponsor'] = external_study.get('sponsor', 'Not specified')
            
            # Ensure overview section exists
            if 'overview' not in converted_study:
                converted_study['overview'] = {}
            
            overview = converted_study['overview']
            if 'purpose' not in overview:
                overview['purpose'] = 'Study purpose not specified'
            if 'participant_commitment' not in overview:
                overview['participant_commitment'] = 'Time commitment not specified'
            if 'key_procedures' not in overview:
                overview['key_procedures'] = ['Standard procedures']
            
            logger.info(f"AI conversion successful for study {nct_id}")
            return converted_study
            
        except json.JSONDecodeError as e:
            logger.error(f"AI response was not valid JSON: {e}")
            logger.error(f"AI response: {ai_response[:500]}...")
            raise Exception("AI returned invalid JSON")
            
    except Exception as e:
        logger.error(f"AI conversion failed for study {nct_id}: {e}")
        raise

async def save_imported_study(study: dict) -> bool:
    """Save imported study to local studies file"""
    try:
        import json
        from pathlib import Path
        
        # Use current file directory to find data directory
        current_dir = Path(__file__).parent
        studies_file = current_dir / "data" / "study_eligibility_data.json"
        
        # Load existing studies
        if studies_file.exists():
            with open(studies_file, 'r', encoding='utf-8') as f:
                studies_data = json.load(f)
        else:
            studies_data = {"studies": [], "meta": {"schema_version": "eligibility-json/2.0-multi-study"}}
        
        # Check if study already exists (by NCT ID)
        existing_study_index = None
        for i, existing_study in enumerate(studies_data['studies']):
            if existing_study.get('trial', {}).get('nct_id') == study['trial']['nct_id']:
                existing_study_index = i
                break
        
        if existing_study_index is not None:
            # Update existing study
            studies_data['studies'][existing_study_index] = study
            logger.info(f"Updated existing study: {study['id']}")
        else:
            # Add new imported study at the top (beginning of the list)
            studies_data['studies'].insert(0, study)
            logger.info(f"Added new study at top: {study['id']}")
        
        # Update metadata
        studies_data['meta']['total_studies'] = len(studies_data['studies'])
        studies_data['meta']['generated_utc'] = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
        
        # Save back to file
        with open(studies_file, 'w', encoding='utf-8') as f:
            json.dump(studies_data, f, indent=2, ensure_ascii=False)
        
        return True
        
    except Exception as e:
        logger.error(f"Error saving imported study: {e}")
        return False

@app.delete("/api/admin/studies/{study_id}")
async def delete_study(study_id: str):
    """Delete a study by study ID"""
    try:
        import json
        from pathlib import Path
        
        # Use current file directory to find data directory
        current_dir = Path(__file__).parent
        studies_file = current_dir / "data" / "study_eligibility_data.json"
        
        if not studies_file.exists():
            raise HTTPException(status_code=404, detail="Studies file not found")
        
        # Load existing studies
        with open(studies_file, 'r', encoding='utf-8') as f:
            studies_data = json.load(f)
        
        # Find and remove the study
        original_count = len(studies_data.get('studies', []))
        studies_data['studies'] = [
            study for study in studies_data.get('studies', []) 
            if study.get('id') != study_id
        ]
        
        if len(studies_data['studies']) == original_count:
            raise HTTPException(status_code=404, detail=f"Study with ID {study_id} not found")
        
        # Update metadata
        studies_data['meta']['total_studies'] = len(studies_data['studies'])
        studies_data['meta']['generated_utc'] = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
        
        # Save back to file
        with open(studies_file, 'w', encoding='utf-8') as f:
            json.dump(studies_data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Successfully deleted study: {study_id}")
        
        return {
            "status": "success",
            "message": f"Study {study_id} has been deleted successfully",
            "remaining_studies": len(studies_data['studies'])
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting study {study_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete study")

@app.delete("/api/admin/interviews/{participant_id}")
async def delete_interview(participant_id: str):
    """Delete an interview by participant ID"""
    try:
        import json
        import os
        from pathlib import Path
        
        # Use current file directory to find data directory
        current_dir = Path(__file__).parent
        data_dir = current_dir / "data"
        
        conversations_file = data_dir / "conversations.json"
        evaluations_file = data_dir / "evaluations.json"
        
        deleted_conversation = False
        deleted_evaluation = False
        
        # Delete from conversations.json
        if conversations_file.exists():
            with open(conversations_file, 'r', encoding='utf-8') as f:
                conversations_data = json.load(f)
            
            if participant_id in conversations_data:
                del conversations_data[participant_id]
                deleted_conversation = True
                
                # Write back to file
                with open(conversations_file, 'w', encoding='utf-8') as f:
                    json.dump(conversations_data, f, indent=2, ensure_ascii=False)
                
                logger.info(f"Deleted conversation data for participant {participant_id}")
        
        # Delete from evaluations.json
        if evaluations_file.exists():
            with open(evaluations_file, 'r', encoding='utf-8') as f:
                evaluations_data = json.load(f)
            
            if participant_id in evaluations_data:
                del evaluations_data[participant_id]
                deleted_evaluation = True
                
                # Write back to file
                with open(evaluations_file, 'w', encoding='utf-8') as f:
                    json.dump(evaluations_data, f, indent=2, ensure_ascii=False)
                
                logger.info(f"Deleted evaluation data for participant {participant_id}")
        
        if not deleted_conversation and not deleted_evaluation:
            raise HTTPException(status_code=404, detail=f"Interview data for participant {participant_id} not found")
        
        return {
            "status": "success",
            "message": f"Interview data for participant {participant_id} has been deleted",
            "deleted_conversation": deleted_conversation,
            "deleted_evaluation": deleted_evaluation
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting interview for participant {participant_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete interview data")

@app.get("/api/admin/interviews")
async def get_all_interviews():
    """Get list of all interviews for admin dashboard"""
    try:
        from models import get_saved_conversation, get_saved_evaluation
        import json
        import os
        from pathlib import Path
        
        interviews = []
        # Use current file directory to find data directory
        current_dir = Path(__file__).parent
        data_dir = current_dir / "data"
        
        # Get all conversation files
        conversations_file = data_dir / "conversations.json"
        evaluations_file = data_dir / "evaluations.json"
        
        conversations_data = {}
        evaluations_data = {}
        
        # Load conversations
        if conversations_file.exists():
            try:
                with open(conversations_file, 'r') as f:
                    conversations_data = json.load(f)
                logger.info(f"Loaded {len(conversations_data)} conversation entries from {conversations_file}")
            except Exception as e:
                logger.error(f"Error loading conversations: {e}")
        else:
            logger.warning(f"Conversations file not found: {conversations_file}")
        
        # Load evaluations  
        if evaluations_file.exists():
            try:
                with open(evaluations_file, 'r') as f:
                    evaluations_data = json.load(f)
                logger.info(f"Loaded {len(evaluations_data)} evaluation entries from {evaluations_file}")
            except Exception as e:
                logger.error(f"Error loading evaluations: {e}")
        else:
            logger.warning(f"Evaluations file not found: {evaluations_file}")
        
        # Process conversations into interview list
        for key, conversation_entry in conversations_data.items():
            try:
                conv_data = conversation_entry.get("data", {})
                metadata = conv_data.get("metadata", {})
                
                participant_id = metadata.get("participant_id", "Unknown")
                session_id = metadata.get("session_id", "")
                study_id = metadata.get("study_id", "Unknown Study")
                
                # Check if there's a corresponding evaluation
                evaluation = None
                eligibility_result = None
                status = "Abandoned"  # Default
                
                # Look for evaluation data
                for eval_key, eval_entry in evaluations_data.items():
                    eval_data = eval_entry.get("data", {})
                    if (eval_data.get("session_id") == session_id or 
                        eval_data.get("participant_id") == participant_id):
                        evaluation = eval_data
                        eligibility_result = evaluation.get("eligibility_result", {})
                        status = "Completed"
                        break
                
                # Determine interview status
                conversation_state = metadata.get("conversation_state", "unknown")
                exit_reason = metadata.get("exit_reason")
                saved_incomplete = metadata.get("saved_incomplete", False)
                interview_status = metadata.get("interview_status")
                
                if conversation_state == "completed" and evaluation:
                    status = "Completed"
                elif saved_incomplete and interview_status:
                    # Use the saved status for incomplete interviews
                    status = interview_status
                elif metadata.get("total_messages", 0) > 2:  # Has some conversation
                    status = "In Progress" if conversation_state != "completed" else "Abandoned"
                
                interview = {
                    "id": session_id or f"conv_{len(interviews)}",
                    "participant_name": participant_id,  # Using participant_id as name for now
                    "participant_id": participant_id,
                    "session_id": session_id,
                    "study_id": study_id,
                    "study_name": study_id.replace("_", " ").title(),
                    "date": metadata.get("export_timestamp", ""),
                    "status": status,
                    "total_messages": metadata.get("total_messages", 0),
                    "eligibility_result": {
                        "eligible": eligibility_result.get("eligible", False) if eligibility_result else None,
                        "score": eligibility_result.get("score", 0) if eligibility_result else None
                    } if eligibility_result else None
                }
                
                interviews.append(interview)
                
            except Exception as e:
                logger.error(f"Error processing conversation entry: {e}")
                continue
        
        # Sort by date (newest first)
        interviews.sort(key=lambda x: x.get("date", ""), reverse=True)
        
        completed_count = len([i for i in interviews if i["status"] == "Completed"])
        in_progress_count = len([i for i in interviews if i["status"] == "In Progress"])
        abandoned_count = len([i for i in interviews if i["status"] == "Abandoned"])
        paused_count = len([i for i in interviews if i["status"] == "Paused"])
        interrupted_count = len([i for i in interviews if i["status"] == "Interrupted"])
        incomplete_count = len([i for i in interviews if i["status"] == "Incomplete"])
        
        logger.info(f"Admin dashboard: returning {len(interviews)} interviews (Completed: {completed_count}, In Progress: {in_progress_count}, Paused: {paused_count}, Interrupted: {interrupted_count}, Abandoned: {abandoned_count}, Incomplete: {incomplete_count})")
        
        return {
            "interviews": interviews,
            "total_count": len(interviews),
            "completed_count": completed_count,
            "in_progress_count": in_progress_count,
            "abandoned_count": abandoned_count,
            "paused_count": paused_count,
            "interrupted_count": interrupted_count,
            "incomplete_count": incomplete_count
        }
        
    except Exception as e:
        logger.error(f"Error getting interviews: {e}")
        raise HTTPException(status_code=500, detail="Failed to get interviews")

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

@app.get("/api/download/interview/{participant_id}")
async def download_interview_data(participant_id: str):
    """Download complete interview data (conversation + evaluation) as JSON"""
    try:
        from models import get_saved_conversation, get_saved_evaluation
        import json
        from pathlib import Path
        
        # Use current file directory to find data directory
        current_dir = Path(__file__).parent
        data_dir = current_dir / "data"
        
        conversations_file = data_dir / "conversations.json"
        evaluations_file = data_dir / "evaluations.json"
        
        conversation_data = None
        evaluation_data = None
        
        # Load conversation data
        if conversations_file.exists():
            with open(conversations_file, 'r', encoding='utf-8') as f:
                conversations = json.load(f)
                conversation_entry = conversations.get(participant_id)
                if conversation_entry:
                    conversation_data = conversation_entry.get("data")
        
        # Load evaluation data
        if evaluations_file.exists():
            with open(evaluations_file, 'r', encoding='utf-8') as f:
                evaluations = json.load(f)
                evaluation_entry = evaluations.get(participant_id)
                if evaluation_entry:
                    evaluation_data = evaluation_entry.get("data")
        
        if not conversation_data and not evaluation_data:
            raise HTTPException(status_code=404, detail=f"No interview data found for participant {participant_id}")
        
        # Extract metadata for participant info
        metadata = conversation_data.get("metadata", {}) if conversation_data else {}
        evaluation_result = evaluation_data.get("eligibility_result", {}) if evaluation_data else {}
        
        # Determine interview status
        conversation_state = metadata.get("conversation_state", "unknown")
        saved_incomplete = metadata.get("saved_incomplete", False)
        status = metadata.get("interview_status", "Unknown")
        
        if conversation_state == "completed" and evaluation_data:
            status = "Completed"
        elif saved_incomplete and metadata.get("interview_status"):
            status = metadata.get("interview_status")
        elif metadata.get("total_messages", 0) > 2:
            status = "In Progress" if conversation_state != "completed" else "Abandoned"
        
        # Build comprehensive download structure
        download_data = {
            "participant_interview_info": {
                "participant_id": participant_id,
                "session_id": metadata.get("session_id", ""),
                "study_name": metadata.get("study_id", "").replace("_", " ").title() if metadata.get("study_id") else "",
                "status": status,
                "interview_status": metadata.get("interview_status", status),
                "Eligibility": {
                    "eligible": evaluation_result.get("eligible", None),
                    "score": evaluation_result.get("score", None),
                    "summary": evaluation_result.get("summary", "No evaluation available")
                } if evaluation_result else None,
                "date_and_time": metadata.get("export_timestamp", ""),
                "download_timestamp": datetime.now().isoformat()
            },
            "conversation": conversation_data if conversation_data else None,
            "evaluation": evaluation_data if evaluation_data else None
        }
        
        return download_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving interview data for download: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve interview data")

@app.post("/api/interviews/save-progress")
async def save_interview_progress(request: Request):
    """Save incomplete interview progress with status"""
    try:
        data = await request.json()
        
        # Extract required fields
        session_id = data.get("session_id")
        participant_id = data.get("participant_id")
        study_id = data.get("study_id")
        exit_reason = data.get("exit_reason", "user_initiated")
        conversation_state = data.get("conversation_state", "unknown")
        messages = data.get("messages", [])
        
        if not session_id or not participant_id or not study_id:
            raise HTTPException(status_code=400, detail="session_id, participant_id, and study_id are required")
        
        # Determine status based on exit reason and conversation state
        def get_status_by_reason(exit_reason, conversation_state, message_count):
            if conversation_state == 'completed':
                return 'Completed'
            
            # Count user messages specifically to detect consent phase
            user_message_count = len([m for m in messages if m.get("type") == "user"])
            
            # Allow saving even with minimal messages if interview was started
            if exit_reason == 'interview_started':
                return 'In Progress'
            
            # If no user responses yet but interview started, it's incomplete consent
            if user_message_count == 0 and message_count > 0:
                consent_exit_reasons = ['consent_abandoned', 'consent_rejected', 'back_to_dashboard', 'page_refresh', 'browser_refresh', 'study_change', 'navigation']
                if exit_reason in consent_exit_reasons:
                    return 'Incomplete'
            
            # Standard exit reason mapping
            exit_reason_to_status = {
                'interview_started': 'In Progress',     # Interview just started
                'interview_completed': 'Completed',     # Interview finished successfully
                'consent_abandoned': 'Incomplete',      # Left during consent phase
                'consent_rejected': 'Incomplete',       # Explicitly rejected consent
                'user_initiated': 'Paused',            # User clicked "Back to Dashboard"
                'back_to_dashboard': 'Paused',         # User clicked "Back to Dashboard"  
                'study_change': 'Abandoned',           # User changed study selection
                'settings_change': 'Paused',           # User changed voice/language settings
                'page_refresh': 'Interrupted',         # Browser refresh/close
                'browser_refresh': 'Interrupted',      # Browser refresh/close
                'connection_lost': 'Interrupted',      # WebSocket disconnect
                'browser_close': 'Interrupted',        # Browser close
                'navigation': 'Interrupted'            # Other navigation
            }
            
            return exit_reason_to_status.get(exit_reason, 'Abandoned')
        
        status = get_status_by_reason(exit_reason, conversation_state, len(messages))
        
        # Don't save if no meaningful progress
        if status is None:
            return {
                "status": "skipped",
                "message": "No meaningful progress to save"
            }
        
        # Calculate conversation duration
        def calculate_duration(messages):
            if len(messages) < 2:
                return "0 minutes"
            
            start_time = datetime.fromisoformat(messages[0]["timestamp"])
            end_time = datetime.fromisoformat(messages[-1]["timestamp"])
            duration_minutes = (end_time - start_time).total_seconds() / 60
            return f"{round(duration_minutes)} minutes"
        
        # Build conversation data with same structure as completed interviews
        conversation_data = {
            "metadata": {
                "participant_id": participant_id,
                "session_id": session_id,
                "study_id": study_id,
                "export_timestamp": datetime.now().isoformat(),
                "total_messages": len(messages),
                "conversation_state": conversation_state,
                "exit_reason": exit_reason,
                "interview_status": status,
                "saved_incomplete": True
            },
            "conversation": messages,
            "summary": {
                "agent_messages": len([m for m in messages if m.get("type") == "agent"]),
                "user_messages": len([m for m in messages if m.get("type") == "user"]),
                "conversation_duration": calculate_duration(messages)
            }
        }
        
        # Save conversation data using existing models
        from models import save_conversation_data
        file_path = save_conversation_data(session_id, participant_id, conversation_data)
        
        if not file_path:
            raise HTTPException(status_code=500, detail="Failed to save conversation data")
        
        logger.info(f"Saved incomplete interview progress: {participant_id} - Status: {status}, Reason: {exit_reason}")
        
        return {
            "status": "success",
            "message": f"Interview progress saved with status: {status}",
            "interview_status": status,
            "participant_id": participant_id,
            "session_id": session_id,
            "exit_reason": exit_reason,
            "message_count": len(messages),
            "file_path": file_path
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving interview progress: {e}")
        raise HTTPException(status_code=500, detail="Failed to save interview progress")

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
            
            # Generate audio for greeting with user's saved speed setting
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
                    "participant_id": session.participant_id,  # ← Same participant_id used for saving
                    "session_id": session_id,  # ← Include session_id for reference
                    "already_saved": True,  # ← Indicate backend already saved data
                    "timestamp": datetime.now().isoformat()
                })
            
            # Check if this is a consent rejection that should be saved as incomplete
            elif agent_response.get("consent_rejected", False):
                # This is a consent rejection - save as incomplete
                session = manager.active_sessions.get(session_id)
                if session:
                    # Build conversation data for consent rejection
                    messages = manager.session_messages.get(session_id, [])
                    
                    conversation_data = {
                        "metadata": {
                            "participant_id": session.participant_id,
                            "session_id": session_id,
                            "study_id": manager.session_studies.get(session_id, "unknown"),
                            "export_timestamp": datetime.now().isoformat(),
                            "total_messages": len(messages),
                            "conversation_state": "completed",  # Agent finished speaking
                            "exit_reason": "consent_rejected",
                            "interview_status": "Incomplete",
                            "saved_incomplete": True
                        },
                        "conversation": messages,
                        "summary": {
                            "agent_messages": len([m for m in messages if m.get("type") == "agent"]),
                            "user_messages": len([m for m in messages if m.get("type") == "user"]),
                            "conversation_duration": "0 minutes"
                        }
                    }
                    
                    # Save conversation data
                    from models import save_conversation_data
                    save_conversation_data(session_id, session.participant_id, conversation_data)
                    
                    logger.info(f"Saved consent rejection as incomplete: {session.participant_id}")
                
                # Send interview complete event for consent rejection
                await manager.send_message(session_id, {
                    "type": "interview_complete",
                    "consent_rejected": True,
                    "participant_id": session.participant_id,  # ← Same participant_id used for saving
                    "session_id": session_id,  # ← Include session_id for reference  
                    "already_saved": True,  # ← Indicate backend already saved data
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
        "api_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 