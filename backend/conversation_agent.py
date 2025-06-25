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
        user_message_clean = user_message.strip().lower()
        
        # Check for repeat request first
        if any(phrase in user_message_clean for phrase in ["repeat", "again", "say that again", "didn't hear", "can you repeat"]):
            return await self._handle_repeat_request()
        
        if self.conversation_state == "waiting_consent":
            return await self._handle_consent_response(user_message)
        elif self.conversation_state == "asking_questions":
            return await self._handle_criteria_questions(user_message)
        else:
            # Simple fallback
            return {
                "content": "Interview completed. Thank you for your time!",
                "requires_response": False,
                "is_final": True
            }
    
    async def _handle_repeat_request(self) -> Dict:
        """Handle repeat request - don't advance question index"""
        if self.conversation_state == "waiting_consent":
            return {
                "content": await self.get_initial_greeting(),
                "requires_response": True,
                "is_final": False
            }
        elif self.conversation_state == "asking_questions":
            if self.current_criteria_index < len(self.trial_criteria):
                criteria = self.trial_criteria[self.current_criteria_index]
                return {
                    "content": criteria.question,
                    "requires_response": True,
                    "is_final": False
                }
        
        return {
            "content": "I'm sorry, I can't repeat that right now.",
            "requires_response": True,
            "is_final": False
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
                    "is_final": True
                }
            else:  # CLARIFY
                overview = self.trial_info.get("overview", {})
                purpose = overview.get("purpose", "test a new medical treatment")
                commitment = overview.get("commitment", "a brief screening interview")
                
                clarification = f"""Let me clarify: This is {commitment} for a study to {purpose.lower()}.

I'll ask you some basic questions about your health and background. This usually takes about 5-10 minutes. Your responses will help determine if you might be eligible for the full study.

Would you like to proceed with these screening questions?"""
                
                return {
                    "content": clarification,
                    "requires_response": True,
                    "is_final": False
                }
                
        except Exception as e:
            logger.error(f"Error processing consent response: {e}")
            # Fallback to simple keyword matching
            user_message_lower = user_message.lower()
            if any(word in user_message_lower for word in ["yes", "okay", "ok", "sure", "consent", "agree", "proceed"]):
                self.conversation_state = "asking_questions"
                self.current_criteria_index = 0
                return await self._ask_next_criteria_question()
            else:
                return {
                    "content": "I understand. Thank you for your time. If you change your mind, feel free to try again later.",
                    "requires_response": False,
                    "is_final": True
                }
    
    async def _handle_criteria_questions(self, user_message: str) -> Dict:
        """Handle responses to eligibility criteria questions"""
        if self.current_criteria_index < len(self.trial_criteria):
            current_criteria = self.trial_criteria[self.current_criteria_index]
            
            # Save the response to session
            self.session.responses[current_criteria.id] = user_message.strip()
            
            # Move to next question
            self.current_criteria_index += 1
            
            if self.current_criteria_index < len(self.trial_criteria):
                return await self._ask_next_criteria_question()
            else:
                # All questions completed - final message
                self.conversation_state = "completed"
                return {
                    "content": "Thank you for completing the screening interview! Your responses have been recorded.",
                    "requires_response": False,
                    "is_final": True
                }
        
        # Shouldn't reach here, but just in case
        return {
            "content": "Interview completed. Thank you for your time!",
            "requires_response": False,
            "is_final": True
        }
    
    async def _ask_next_criteria_question(self) -> Dict:
        """Ask the next eligibility criteria question using the question field from JSON"""
        if self.current_criteria_index < len(self.trial_criteria):
            criteria = self.trial_criteria[self.current_criteria_index]
            
            # Use the question directly from the JSON
            question = criteria.question
            
            return {
                "content": question,
                "requires_response": True,
                "is_final": False
            }
        
        return {
            "content": "We've completed all the screening questions.",
            "requires_response": False,
            "is_final": False
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