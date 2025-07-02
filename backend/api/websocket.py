"""
WebSocket handling for Clinical Trial Voice Interviewer
Handles real-time voice interaction between frontend and backend
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List
from fastapi import WebSocket, WebSocketDisconnect

from models import create_session, save_conversation_data, save_evaluation_data, ParticipantSession
from agents import ClinicalTrialCoordinator as ClinicalTrialAgent
from agents.evaluation_agent import EligibilityEvaluator

logger = logging.getLogger(__name__)

# Global variables that will be set by main app
audio_processor = None
session_registry = None

def set_dependencies(audio_proc, session_reg):
    """Set dependencies from main app"""
    global audio_processor, session_registry
    audio_processor = audio_proc
    session_registry = session_reg

class ConnectionManager:
    """Manages WebSocket connections and session state"""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.active_sessions: Dict[str, ParticipantSession] = {}
        self.session_agents: Dict[str, ClinicalTrialAgent] = {}
        self.session_studies: Dict[str, str] = {}
        self.session_messages: Dict[str, List[Dict]] = {}

    async def connect(self, websocket: WebSocket, session_id: str, study_id: str):
        """Connect a new WebSocket client"""
        await websocket.accept()
        self.active_connections[session_id] = websocket
        
        # Try to get existing session from registry first
        session = session_registry.get(session_id) if session_registry else None
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
        """Disconnect a WebSocket client and clean up"""
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
        if session_registry and session_id in session_registry:
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
        """Send a message to a specific WebSocket connection"""
        if session_id in self.active_connections:
            await self.active_connections[session_id].send_text(json.dumps(message))

# Global connection manager instance
manager = ConnectionManager()

async def websocket_endpoint(websocket: WebSocket, session_id: str, study_id: str):
    """Main WebSocket endpoint for real-time voice interaction"""
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
                    "eligibility": eligibility_result,
                    "participant_id": session.participant_id,
                    "session_id": session_id,
                    "already_saved": True,
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
                            "conversation_state": "completed",
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
                    save_conversation_data(session_id, session.participant_id, conversation_data)
                    
                    logger.info(f"Saved consent rejection as incomplete: {session.participant_id}")
                
                # Send interview complete event for consent rejection
                await manager.send_message(session_id, {
                    "type": "interview_complete",
                    "consent_rejected": True,
                    "participant_id": session.participant_id,
                    "session_id": session_id,
                    "already_saved": True,
                    "timestamp": datetime.now().isoformat()
                })
        
    except Exception as e:
        logger.error(f"Error processing text input for session {session_id}: {e}")
        await manager.send_message(session_id, {
            "type": "error",
            "content": "Error processing your response. Please try again.",
            "timestamp": datetime.now().isoformat()
        }) 