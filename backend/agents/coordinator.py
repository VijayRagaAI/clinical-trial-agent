import logging
from typing import Dict, Optional
from models import ParticipantSession, load_trial_criteria
from .consent_agent import ConsentAgent
from .questioning_agent import QuestioningAgent
from .submission_agent import SubmissionAgent

logger = logging.getLogger(__name__)

class ClinicalTrialCoordinator:
    """
    Coordinator that maintains the same API as the original ClinicalTrialAgent
    while routing between specialized agents based on conversation state.
    
    This maintains full backward compatibility with the existing frontend and API.
    """
    
    def __init__(self, session: ParticipantSession, study_id: str):
        """Initialize coordinator with same signature as original ClinicalTrialAgent"""
        self.session = session
        self.study_id = study_id
        self.trial_criteria = load_trial_criteria(study_id)
        self.conversation_state = "greeting"
        
        # Load trial information for the specific study
        from models import get_study_details
        self.trial_info = get_study_details(study_id)
        if not self.trial_info:
            raise ValueError(f"Study {study_id} not found")
        
        # Initialize specialized agents
        self.agents = {
            "consent": ConsentAgent(session, study_id, self.trial_criteria, self.trial_info),
            "questioning": QuestioningAgent(session, study_id, self.trial_criteria, self.trial_info),
            "submission": SubmissionAgent(session, study_id, self.trial_criteria, self.trial_info)
        }
        
        # Track current active agent
        self.current_agent = self.agents["consent"]
        
        # Maintain current question index for backward compatibility
        self.current_criteria_index = 0
        
        logger.info(f"ClinicalTrialCoordinator initialized for study {study_id}")
    
    async def get_initial_greeting(self) -> str:
        """
        Generate initial greeting - maintains same API as original ClinicalTrialAgent.
        
        Returns:
            str: The greeting message content
        """
        try:
            # Set conversation state to waiting_consent after greeting
            self.conversation_state = "waiting_consent"
            
            # Get initial message from consent agent
            response = await self.agents["consent"].get_initial_message()
            
            return response["content"]
            
        except Exception as e:
            logger.error(f"Error generating initial greeting: {e}")
            # Fallback greeting
            title = self.trial_info.get("trial", {}).get("title", "Clinical Trial")
            return f"Hello! I'm MedBot, your clinical trial assistant for '{title}'. Do you consent to proceed with the screening questions?"
    
    async def process_user_response(self, user_message: str) -> Dict:
        """
        Process user response and generate appropriate follow-up.
        Maintains same API as original ClinicalTrialAgent.
        
        Args:
            user_message: User's input message
            
        Returns:
            Dict: Response dict with same format as original agent
        """
        try:
            # Route to appropriate agent based on current conversation state
            if self.conversation_state in ["waiting_consent", "consent_clarification"]:
                response = await self._handle_consent_phase(user_message)
            elif self.conversation_state in ["asking_questions", "questioning"]:
                response = await self._handle_questioning_phase(user_message)
            elif self.conversation_state in ["awaiting_submission", "submission"]:
                response = await self._handle_submission_phase(user_message)
            elif self.conversation_state == "evaluating":
                # Evaluation phase - should trigger completion
                response = await self._handle_evaluation_completion()
            else:
                # Default fallback
                response = {
                    "content": "Interview completed. Thank you for your time!",
                    "requires_response": False,
                    "is_final": True,
                    "question_number": len(self.trial_criteria),
                    "total_questions": len(self.trial_criteria)
                }
            
            # Handle state transitions based on agent responses
            if "transition_to" in response:
                await self._handle_state_transition(response["transition_to"])
                
            return response
            
        except Exception as e:
            logger.error(f"Error processing user response: {e}")
            return {
                "content": "I encountered an error processing your response. Please try again.",
                "requires_response": True,
                "is_final": False,
                "question_number": self.current_criteria_index + 1,
                "total_questions": len(self.trial_criteria)
            }
    
    async def _handle_consent_phase(self, user_message: str) -> Dict:
        """Handle consent phase using consent agent"""
        response = await self.agents["consent"].process_input(user_message)
        
        # Update coordinator state based on response
        if response.get("transition_to") == "questioning":
            self.conversation_state = "asking_questions"
            self.current_agent = self.agents["questioning"]
            # Get first question from questioning agent
            first_question = await self.agents["questioning"].get_initial_message()
            return first_question
        elif response.get("consent_rejected") or response.get("is_final"):
            self.conversation_state = "completed"
            
        return response
    
    async def _handle_questioning_phase(self, user_message: str) -> Dict:
        """Handle questioning phase using questioning agent"""
        response = await self.agents["questioning"].process_input(user_message)
        
        # Sync current criteria index with questioning agent
        self.current_criteria_index = self.agents["questioning"].current_criteria_index
        
        # Update coordinator state based on response
        if response.get("transition_to") == "submission":
            self.conversation_state = "awaiting_submission"
            self.current_agent = self.agents["submission"]
            return response
        elif response.get("consent_rejected") or response.get("is_final"):
            self.conversation_state = "completed"
            
        return response
    
    async def _handle_submission_phase(self, user_message: str) -> Dict:
        """Handle submission phase using submission agent"""
        response = await self.agents["submission"].process_input(user_message)
        
        # Update coordinator state based on response
        if response.get("transition_to") == "evaluation":
            self.conversation_state = "evaluating"
            return response
        elif response.get("consent_rejected") or response.get("is_final"):
            self.conversation_state = "completed"
            
        return response
    
    async def _handle_evaluation_completion(self) -> Dict:
        """Handle completion after evaluation"""
        self.conversation_state = "completed"
        return {
            "content": "Thank you for completing the screening interview! Your responses have been recorded and evaluated.",
            "requires_response": False,
            "is_final": True,
            "question_number": len(self.trial_criteria),
            "total_questions": len(self.trial_criteria)
        }
    
    async def _handle_state_transition(self, new_state: str):
        """Handle transitions between conversation states"""
        logger.info(f"Transitioning from {self.conversation_state} to {new_state}")
        
        if new_state == "questioning":
            self.conversation_state = "asking_questions"
            self.current_agent = self.agents["questioning"]
        elif new_state == "submission":
            self.conversation_state = "awaiting_submission"
            self.current_agent = self.agents["submission"]
        elif new_state == "evaluation":
            self.conversation_state = "evaluating"
        elif new_state == "completed":
            self.conversation_state = "completed"
    
    # Backward compatibility methods from original ClinicalTrialAgent
    
    def complete_interview(self) -> Dict:
        """Complete the interview after evaluation - backward compatibility"""
        self.conversation_state = "completed"
        return {
            "content": "Thank you for completing the screening interview! Your responses have been recorded and evaluated.",
            "requires_response": False,
            "is_final": True,
            "question_number": len(self.trial_criteria),
            "total_questions": len(self.trial_criteria)
        }

    def get_progress(self) -> Dict:
        """Get current interview progress - backward compatibility"""
        total_steps = len(self.trial_criteria) + 2  # consent + questions + final
        current_step = 0
        
        if self.conversation_state == "waiting_consent":
            current_step = 0
        elif self.conversation_state == "asking_questions":
            current_step = self.current_criteria_index + 1
        elif self.conversation_state == "evaluating":
            current_step = total_steps - 1
        elif self.conversation_state == "completed":
            current_step = total_steps
        
        return {
            "current_step": current_step,
            "total_steps": total_steps,
            "progress_percentage": (current_step / total_steps * 100) if total_steps > 0 else 0,
            "state": self.conversation_state
        }
    
    # Properties for backward compatibility
    @property
    def trial_criteria(self):
        """Access to trial criteria - backward compatibility"""
        return self._trial_criteria
    
    @trial_criteria.setter 
    def trial_criteria(self, value):
        """Set trial criteria - backward compatibility"""
        self._trial_criteria = value 