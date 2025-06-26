import json
import logging
from typing import Dict, List, Optional
from datetime import datetime
import os
import openai

from models import ParticipantSession, TrialCriteria, load_trial_criteria

logger = logging.getLogger(__name__)

class ClinicalTrialAgent:
    def __init__(self, session: ParticipantSession):
        self.session = session
        self.trial_criteria = load_trial_criteria()
        self.conversation_state = "greeting"
        self.current_criteria_index = 0
        
        # Load trial information
        current_dir = os.path.dirname(os.path.abspath(__file__))
        with open(os.path.join(current_dir, "eligibility.json"), "r") as f:
            self.trial_info = json.load(f)
    
    async def get_initial_greeting(self) -> str:
        """Generate simple greeting with trial overview and consent request"""
        overview = self.trial_info.get("overview", {})
        
        purpose = overview.get("purpose", "Test a new medical treatment")
        
        greeting = f"""Hello! I'm MedBot, your clinical trial assistant. 

This study aims to {purpose.lower()}.

I'll ask you a few screening questions to see if you might be eligible.

Do you consent to proceed with the screening questions?"""
        
        self.conversation_state = "waiting_consent"
        return greeting
    
    async def process_user_response(self, user_message: str) -> Dict:
        """Process user response and generate appropriate follow-up"""
        
        if self.conversation_state == "waiting_consent":
            return await self._handle_consent_response(user_message)
        elif self.conversation_state == "asking_questions":
            return await self._handle_criteria_questions(user_message)
        elif self.conversation_state == "awaiting_submission":
            return await self._handle_submission_request(user_message)
        else:
            # Simple fallback
            return {
                "content": "Interview completed. Thank you for your time!",
                "requires_response": False,
                "is_final": True,
                "question_number": len(self.trial_criteria),
                "total_questions": len(self.trial_criteria)
            }
    
    async def _handle_consent_response(self, user_message: str) -> Dict:
        """Handle consent response using LLM to understand user intent"""
        try:
            # Use LLM to determine if user consented
            client = openai.OpenAI()
            
            prompt = f"""
            Analyze this response to a consent request for participating in a clinical trial screening interview:
            
            User's response: "{user_message}"
            
            Determine if the user is:
            1. Giving consent/agreeing to proceed (YES)
            2. Declining/refusing to proceed (NO)
            3. Asking for clarification or more information (CLARIFY)
            
            Respond with only: YES, NO, or CLARIFY
            """
            
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=10,
                temperature=0
            )
            
            intent = response.choices[0].message.content.strip().upper()
            
            if intent == "YES":
                self.conversation_state = "asking_questions"
                self.current_criteria_index = 0
                return await self._ask_next_criteria_question()
            elif intent == "NO":
                return {
                    "content": "I understand. Thank you for your time. If you change your mind, feel free to try again later.",
                    "requires_response": False,
                    "is_final": True,
                    "question_number": 0,
                    "total_questions": len(self.trial_criteria)
                }
            else:  # CLARIFY
                overview = self.trial_info.get("overview", {})
                purpose = overview.get("purpose", "Test a new medical treatment")
                clarification = f"""Let me clarify: I'm MedBot, your clinical trial assistant. 

        This study aims to {purpose.lower()}.

        I'll ask you a few screening questions to see if you might be eligible.

        Do you consent to proceed with the screening questions?"""
                
                return {
                    "content": clarification,
                    "requires_response": True,
                    "is_final": False,
                    "question_number": 0,  # Still in consent phase
                    "total_questions": len(self.trial_criteria)
                }
                
        except Exception as e:
            logger.error(f"Error processing consent response: {e}")
            return {
                "content": "Error processing consent response. Thank you for your time.",
                "requires_response": False,
                "is_final": True,
                "question_number": 0,
                "total_questions": len(self.trial_criteria)
            }
    
    async def _handle_criteria_questions(self, user_message: str) -> Dict:
        """Handle responses to eligibility criteria questions"""
        if self.current_criteria_index < len(self.trial_criteria):
            # Check if this is a repeat current question request
            if self._is_repeat_current_request(user_message):
                # Just repeat the current question without saving or advancing
                return await self._ask_current_criteria_question()
            
            # Check if this is a repeat previous question request
            if self._is_repeat_previous_request(user_message):
                # Go back to previous question if possible
                if self.current_criteria_index > 0:
                    # Remove the previous answer from session
                    prev_criteria = self.trial_criteria[self.current_criteria_index - 1]
                    if prev_criteria.id in self.session.responses:
                        del self.session.responses[prev_criteria.id]
                    
                    # Go back to previous question
                    self.current_criteria_index -= 1
                    return await self._ask_current_criteria_question()
                else:
                    # Can't go back further, just repeat current
                    return await self._ask_current_criteria_question()
            
            current_criteria = self.trial_criteria[self.current_criteria_index]
            
            # Save the response to session
            self.session.responses[current_criteria.id] = user_message.strip()
            
            # Move to next question
            self.current_criteria_index += 1
            
            if self.current_criteria_index < len(self.trial_criteria):
                return await self._ask_current_criteria_question()
            else:
                # All questions answered - wait for user to submit
                self.conversation_state = "awaiting_submission"
                return {
                    "content": "Thank you for answering all the screening questions. Please review your final response above and click 'Submit' when you're ready to complete the interview, or 'Repeat Current Question' if you'd like to change your last answer.",
                    "requires_response": False,
                    "is_final": False,
                    "awaiting_submission": True,
                    "question_number": len(self.trial_criteria),
                    "total_questions": len(self.trial_criteria)
                }
        
        # Shouldn't reach here, but just in case
        return {
            "content": "Interview completed. Thank you for your time!",
            "requires_response": False,
            "is_final": True,
            "question_number": len(self.trial_criteria),
            "total_questions": len(self.trial_criteria)
        }
    
    async def _ask_current_criteria_question(self) -> Dict:
        """Ask the current eligibility criteria question using the question field from JSON"""
        if self.current_criteria_index < len(self.trial_criteria):
            criteria = self.trial_criteria[self.current_criteria_index]
            
            # Use the question directly from the JSON
            question = criteria.question
            
            return {
                "content": question,
                "requires_response": True,
                "is_final": False,
                "question_number": self.current_criteria_index + 1,  # 1-based for frontend
                "total_questions": len(self.trial_criteria)
            }
        
        return {
            "content": "We've completed all the screening questions.",
            "requires_response": False,
            "is_final": False,
            "question_number": len(self.trial_criteria),
            "total_questions": len(self.trial_criteria)
        }
    
    async def _ask_next_criteria_question(self) -> Dict:
        """Ask the next eligibility criteria question - wrapper for backward compatibility"""
        return await self._ask_current_criteria_question()
    
    def _is_repeat_current_request(self, user_message: str) -> bool:
        """Check if the user message is a request to repeat the current question"""
        message_lower = user_message.lower().strip()
        repeat_current_phrases = [
            "could you please repeat that question",
            "repeat that question",
            "can you repeat the question",
            "repeat the question",
            "say that again",
            "can you say that again",
            "repeat please",
            "could you repeat that"
        ]
        
        return any(phrase in message_lower for phrase in repeat_current_phrases)
    
    def _is_repeat_previous_request(self, user_message: str) -> bool:
        """Check if the user message is a request to repeat the previous question"""
        message_lower = user_message.lower().strip()
        repeat_previous_phrases = [
            "could you please repeat the previous question",
            "repeat the previous question",
            "go back to the previous question",
            "previous question",
            "last question",
            "want to try answering it again",
            "previous",
            "last"
        ]
        
        return any(phrase in message_lower for phrase in repeat_previous_phrases)
    
    def _is_submit_request(self, user_message: str) -> bool:
        """Check if the user message is a request to submit/complete the interview"""
        message_lower = user_message.lower().strip()
        submit_phrases = [
            "submit",
            "submit response",
            "submit my response",
            "finish",
            "complete",
            "done",
            "i'm done",
            "finish interview",
            "complete interview"
        ]
        
        return any(phrase in message_lower for phrase in submit_phrases)
    
    async def _handle_submission_request(self, user_message: str) -> Dict:
        """Handle submission or repeat request when awaiting final submission"""
        # Check if user wants to repeat the last question
        if self._is_repeat_current_request(user_message):
            # Go back to the last question
            self.current_criteria_index = len(self.trial_criteria) - 1
            self.conversation_state = "asking_questions"
            
            # Remove the last answer so they can re-answer
            last_criteria = self.trial_criteria[self.current_criteria_index]
            if last_criteria.id in self.session.responses:
                del self.session.responses[last_criteria.id]
            
            return await self._ask_current_criteria_question()
        
        # Check if user wants to submit
        elif self._is_submit_request(user_message):
            # Complete the interview
            self.conversation_state = "completed"
            return {
                "content": "Thank you for completing the screening interview! Your responses have been recorded and are being evaluated.",
                "requires_response": False,
                "is_final": True,
                "question_number": len(self.trial_criteria),
                "total_questions": len(self.trial_criteria)
            }
        
        else:
            # User said something else, ask for clarification
            return {
                "content": "Please either click 'Submit' to complete the interview or 'Repeat Current Question' to change your last answer.",
                "requires_response": False,
                "is_final": False,
                "awaiting_submission": True,
                "question_number": len(self.trial_criteria),
                "total_questions": len(self.trial_criteria)
            }
    
    def get_progress(self) -> Dict:
        """Get current interview progress"""
        total_steps = len(self.trial_criteria) + 2  # consent + questions + final
        current_step = 0
        
        if self.conversation_state == "waiting_consent":
            current_step = 0
        elif self.conversation_state == "asking_questions":
            current_step = self.current_criteria_index + 1
        elif self.conversation_state == "completed":
            current_step = total_steps
        
        return {
            "current_step": current_step,
            "total_steps": total_steps,
            "progress_percentage": (current_step / total_steps * 100) if total_steps > 0 else 0,
            "state": self.conversation_state
        } 