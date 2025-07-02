"""
Session Management API Endpoints
"""

import logging
from datetime import datetime
from fastapi import APIRouter, HTTPException, Request
from .models import StartSessionRequest, SessionResponse

logger = logging.getLogger(__name__)
router = APIRouter()

# Session registry will be imported from main server
session_registry = None

def set_session_registry(registry):
    """Set the session registry from main server"""
    global session_registry
    session_registry = registry

@router.post("/start", response_model=SessionResponse)
async def start_session(request: StartSessionRequest):
    """Start a new interview session"""
    try:
        from models import create_session
        session = create_session()
        
        logger.info(f"New session started: {session.session_id} with participant_id: {session.participant_id}")
        
        # Add session to registry so WebSocket can reuse it
        if session_registry is not None:
            session_registry[session.session_id] = session
        
        return SessionResponse(
            session_id=session.session_id,
            participant_id=session.participant_id,
            created_at=datetime.now().isoformat()
        )
    except Exception as e:
        logger.error(f"Error starting session: {e}")
        raise HTTPException(status_code=500, detail="Failed to start session")

@router.post("/save-progress")
async def save_interview_progress(request: Request):
    """Save incomplete interview progress with status"""
    try:
        from models import save_conversation_data
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