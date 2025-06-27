import json
import logging
from typing import Dict, List, Optional
from datetime import datetime
import os
import openai

from models import ParticipantSession, TrialCriteria, load_trial_criteria

logger = logging.getLogger(__name__)

class ClinicalTrialAgent:
    def __init__(self, session: ParticipantSession, study_id: str):
        self.session = session
        self.study_id = study_id
        self.trial_criteria = load_trial_criteria(study_id)
        self.conversation_state = "greeting"
        self.current_criteria_index = 0
        
        # Load trial information for the specific study
        from models import get_study_details
        self.trial_info = get_study_details(study_id)
        if not self.trial_info:
            raise ValueError(f"Study {study_id} not found")
    
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
            # Get current question
            current_criteria = self.trial_criteria[self.current_criteria_index]
            
            # Use LLM to classify user intent
            intent = self._classify_user_intent(user_message)
            
            if intent == "repeat_current":
                # Just repeat the current question without saving or advancing
                return await self._ask_current_criteria_question()
            
            elif intent == "repeat_previous":
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
            
            elif intent == "answer":
                # This is a normal answer - process it
                self.session.responses[current_criteria.id] = user_message.strip()
                
                # Move to next question
                self.current_criteria_index += 1
                
                if self.current_criteria_index < len(self.trial_criteria):
                    return await self._ask_current_criteria_question()
                else:
                    # All questions answered - wait for user to submit
                    self.conversation_state = "awaiting_submission"
                    return {
                        "content": "Thank you for answering all the screening questions. You now have three options: 'Submit Response' to complete your interview, 'Repeat Last Question' to re-answer the last question, or 'Hear Instruction Again' to repeat these options.",
                        "requires_response": False,
                        "is_final": False,
                        "awaiting_submission": True,
                        "question_number": len(self.trial_criteria),
                        "total_questions": len(self.trial_criteria)
                    }
            
            else:  # intent == "submit"
                # Unexpected submit during questioning phase, treat as answer
                self.session.responses[current_criteria.id] = user_message.strip()
                self.current_criteria_index += 1
                
                if self.current_criteria_index < len(self.trial_criteria):
                    return await self._ask_current_criteria_question()
                else:
                    self.conversation_state = "awaiting_submission"
                    return {
                        "content": "Thank you for answering all the screening questions. You now have three options: 'Submit Response' to complete your interview, 'Repeat Last Question' to re-answer the last question, or 'Hear Instruction Again' to repeat these options.",
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
    
    def _classify_user_intent(self, user_message: str) -> str:
        """Use LLM to classify user intent from their message"""
        try:
            client = openai.OpenAI()
            
            prompt = f"""
            You are analyzing a user's response in a clinical trial interview to determine their intent.
            
            User's response: "{user_message}"
            
            Classify this response into ONE of these categories:
            
            1. "repeat_current" - User wants to repeat/hear the current question again
               Examples: "repeat that question", "what?", "I don't understand", "repeat the current question" etc
            
            2. "repeat_previous" - User wants to go back to the previous question  
               Examples: "go back", "previous question", "repeat the last question", "I want to answer the previous question again"
            
            3. "submit" - User wants to submit their final response and complete the interview
               Examples: "submit", "I'm done", "finish", "complete the interview"
            
            4. "hear_instruction" - User wants to hear the instruction/options again (only in final submission phase)
               Examples: "hear instruction again", "repeat these options", "what are my options"
            
            5. "answer" - User is providing a normal answer to an interview question
               Examples: medical/health responses, personal information, yes/no answers to eligibility questions
            
            
            Respond with ONLY the category name: repeat_current, repeat_previous, submit, hear_instruction, or answer

            NOTE: You must response with ONLY one the category name, in case of doubt respond with 'answer' category
            """
            
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=10,
                temperature=0
            )
            
            intent = response.choices[0].message.content.strip().lower()
            
            # Validate the response
            valid_intents = ["repeat_current", "repeat_previous", "submit", "hear_instruction", "answer"]
            if intent in valid_intents:
                return intent
            else:
                logger.warning(f"LLM returned invalid intent '{intent}', defaulting to 'answer'")
                return "answer"  # Default to answer to ensure responses are saved
                
        except Exception as e:
            logger.error(f"Error classifying user intent: {e}")
            return "answer"  # Default to answer to ensure responses are saved
    
    async def _handle_submission_request(self, user_message: str) -> Dict:
        """Handle submission or repeat request when awaiting final submission"""
        # Use LLM to classify user intent
        intent = self._classify_user_intent(user_message)
        
        if intent == "submit":
            # Start evaluation process
            self.conversation_state = "evaluating"
            return {
                "content": "Evaluating your responses...",
                "requires_response": False,
                "is_final": False,
                "evaluating": True,
                "question_number": len(self.trial_criteria),
                "total_questions": len(self.trial_criteria)
            }
        
        elif intent == "hear_instruction":
            # Repeat the instruction message
            return {
                "content": "Thank you for answering all the screening questions. You now have three options: 'Submit Response' to complete your interview, 'Repeat Last Question' to re-answer the last question, or 'Hear Instruction Again' to repeat these options.",
                "requires_response": False,
                "is_final": False,
                "awaiting_submission": True,
                "question_number": len(self.trial_criteria),
                "total_questions": len(self.trial_criteria)
            }
        
        else:  # repeat_current, repeat_previous, or answer - all treated as wanting to change last answer
            # Go back to the last question
            self.current_criteria_index = len(self.trial_criteria) - 1
            self.conversation_state = "asking_questions"
            
            # Remove the last answer so they can re-answer
            last_criteria = self.trial_criteria[self.current_criteria_index]
            if last_criteria.id in self.session.responses:
                del self.session.responses[last_criteria.id]
            
            return await self._ask_current_criteria_question()
    
    def complete_interview(self) -> Dict:
        """Complete the interview after evaluation"""
        self.conversation_state = "completed"
        return {
            "content": "Thank you for completing the screening interview! Your responses have been recorded and evaluated.",
            "requires_response": False,
            "is_final": True,
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