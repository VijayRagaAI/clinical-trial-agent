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

You will be asked a few screening questions to see if you might be eligible.

Do you consent to proceed with the screening questions, or do you have any questions about the study before deciding?"""
        
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
            # First, check for exact "Ambiguous sound." match directly
            if user_message.strip() == "Ambiguous sound.":
                return {
                    "content": "I didn't catch that clearly. Please speak more clearly.",
                    "requires_response": True,
                    "is_final": False,
                    "question_number": 0,  # Still in consent phase
                    "total_questions": len(self.trial_criteria)
                }
            
            # Use LLM to determine if user consented
            client = openai.OpenAI()
            
            prompt = f"""
            Analyze this spoken response to a consent request for participating in a clinical trial screening interview.
            The response came from speech-to-text and may contain transcription errors.
            
            User's response: "{user_message}"
            
            Determine if the user is:
            1. Giving consent/agreeing to proceed (YES)
               - Examples: "yes", "yeah", "sure", "okay", "I agree", "let's go", "proceed", partial affirmatives
            2. Declining/refusing to proceed (NO)  
               - Examples: "no", "nah", "I don't want to", "not interested", "decline"
            3. Asking for clarification or more information (CLARIFY)
               - Examples: questions about time, procedures, risks, "what does this involve?", "tell me more"
            
            IMPORTANT: Account for speech-to-text imperfections:
            - Focus on intent rather than exact wording
            - "yeah" = "yes", "nah" = "no" 
            - Incomplete responses like "I think..." or "maybe I..." likely indicate need for clarification
            - If response seems confused or off-topic, classify as CLARIFY
            
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
                    "consent_rejected": True,  # Flag to indicate consent rejection
                    "question_number": 0,
                    "total_questions": len(self.trial_criteria)
                }
            else:  # CLARIFY
                # Use LLM to generate personalized clarification based on study data and user's specific question
                clarification = await self._generate_consent_clarification(user_message)
                
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

    async def _generate_consent_clarification(self, user_message: str) -> str:
        """Generate personalized consent clarification using LLM and study context"""
        try:
            client = openai.OpenAI()
            
            # Prepare study context for LLM
            overview = self.trial_info.get("overview", {})
            trial = self.trial_info.get("trial", {})
            
            study_context = {
                "title": trial.get("title", "Clinical Trial"),
                "purpose": overview.get("purpose", "Test a new medical treatment"),
                "commitment": overview.get("participant_commitment", "Time commitment varies"),
                "procedures": overview.get("key_procedures", ["Standard procedures"]),
                "phase": trial.get("phase", "Not specified"),
                "sponsor": trial.get("sponsor", "Research institution"),
                "category": trial.get("category", "Medical research"),
                "contact_info": self.trial_info.get("contact_info", "Contact information not available")
            }

            prompt = f"""
            You are MedBot, a clinical trial assistant helping explain a research study to a potential participant.
            The participant has asked a question about the study during the consent process.
            The participant's message came from speech-to-text conversion and may contain transcription errors.

            STUDY INFORMATION:
            - Title: {study_context['title']}
            - Purpose: {study_context['purpose']}
            - Category: {study_context['category']}
            - Phase: {study_context['phase']}
            - Sponsor: {study_context['sponsor']}
            - Time Commitment: {study_context['commitment']}
            - Key Procedures: {', '.join(study_context['procedures'])}
            - Location & Contact: {study_context['contact_info']}

            PARTICIPANT'S QUESTION/CONCERN: "{user_message}"

            INSTRUCTIONS:
            - Address their specific question/concern directly using the study information provided
            - Be conversational, helpful, and reassuring while staying factual
            - Only use information provided above - DO NOT invent or assume details
            - Keep response concise (2-3 sentences max)
            - Always end by asking for their consent to proceed with screening questions
            - If their question is about something not covered in the study info, acknowledge this and offer to proceed with screening

            SPEECH-TO-TEXT CONSIDERATIONS:
            - The participant's message may have transcription errors or be incomplete
            - Focus on understanding their likely intent rather than exact wording
            - If the message seems unclear, provide general helpful information and ask for consent

            SAFETY RULES:
            - DO NOT provide medical advice
            - DO NOT guarantee study outcomes  
            - DO NOT make promises about results
            - DO NOT discuss specific risks/side effects (not provided in basic info)
            - Stay focused on the screening consent, not full study consent

            Generate a helpful, personalized response:
            """

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=200,
                temperature=0.3
            )
            
            clarification = response.choices[0].message.content.strip()
            
            return clarification
            
        except Exception as e:
            logger.error(f"Error generating consent clarification: {e}")
            # Fallback to simple clarification
            overview = self.trial_info.get("overview", {})
            purpose = overview.get("purpose", "Test a new medical treatment")
            return f"""Let me clarify: I'm MedBot, your clinical trial assistant. 

This study aims to {purpose.lower()}.

You will be asked a few screening questions to see if you might be eligible.

Do you consent to proceed with the screening questions?"""
    
    async def _handle_unclear_response(self, user_message: str) -> Dict:
        """Handle unclear response using LLM with full context"""
        try:
            client = openai.OpenAI()
            
            # Get current question context
            current_criteria = self.trial_criteria[self.current_criteria_index]
            
            # Prepare study context
            overview = self.trial_info.get("overview", {})
            trial = self.trial_info.get("trial", {})
            
            study_context = {
                "title": trial.get("title", "Clinical Trial"),
                "purpose": overview.get("purpose", "Test a new medical treatment"),
                "category": trial.get("category", "Medical research")
            }
            
            prompt = f"""
            You are MedBot, a clinical trial assistant. A participant has given an unclear response during a screening interview.
            Their message came from speech-to-text and may contain transcription errors.

            STUDY CONTEXT:
            - Title: {study_context['title']}
            - Purpose: {study_context['purpose']}
            - Category: {study_context['category']}

            CURRENT INTERVIEW CONTEXT:
            - Current question: "{current_criteria.question}"
            - expected response: {current_criteria.expected_response}
            - Question {self.current_criteria_index + 1} of {len(self.trial_criteria)} screening questions
            - This question is about: {current_criteria.text}

            PARTICIPANT'S UNCLEAR RESPONSE: "{user_message}"

            INSTRUCTIONS:
            - This could be due to speech-to-text errors, technical confusion, or off-topic responses, or a question
            - Generate a helpful response that gently redirects them back to the current question
            - Stay conversational and supportive
            - Keep response concise (2-3 sentences max)
            - Do NOT advance to the next question - stay on the current question

            RESPONSE GUIDELINES:
            - Be understanding about potential technical issues
            - Clearly restate the current question
            - Encourage them to provide a clear answer
            - Don't make assumptions about what they meant to say

            Generate a helpful response:
            """

            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=200,
                temperature=0.3
            )
            
            clarification = response.choices[0].message.content.strip()
            
            return {
                "content": clarification,
                "requires_response": True,
                "is_final": False,
                "question_number": self.current_criteria_index + 1,  # Stay on current question
                "total_questions": len(self.trial_criteria)
            }
            
        except Exception as e:
            logger.error(f"Error handling unclear response: {e}")
            # Fallback response
            current_criteria = self.trial_criteria[self.current_criteria_index]
            return {
                "content": f"I didn't quite understand that. Let me ask the question again: {current_criteria.question}",
                "requires_response": True,
                "is_final": False,
                "question_number": self.current_criteria_index + 1,
                "total_questions": len(self.trial_criteria)
            }
    
    async def _handle_criteria_questions(self, user_message: str) -> Dict:
        """Handle responses to eligibility criteria questions"""
        if self.current_criteria_index < len(self.trial_criteria):
            # Get current question
            current_criteria = self.trial_criteria[self.current_criteria_index]
            
            # Use LLM to classify user intent
            intent = self._classify_user_intent(user_message, current_criteria)
            
            if intent == "ambiguous":
                # Speech was unclear - ask user to speak more clearly without advancing
                return {
                    "content": "I didn't catch that clearly. Please speak more clearly.",
                    "requires_response": True,
                    "is_final": False,
                    "question_number": self.current_criteria_index + 1,  # Stay on current question
                    "total_questions": len(self.trial_criteria)
                }
            
            elif intent == "unclear":
                # Use LLM to handle unclear response with full context
                return await self._handle_unclear_response(user_message)
            
            elif intent == "decline":
                # User wants to decline/withdraw during questioning phase
                return {
                    "content": "I understand. Thank you for your time. If you change your mind and would like to participate in the future, feel free to try again.",
                    "requires_response": False,
                    "is_final": True,
                    "consent_rejected": True,  # Use same flag as consent phase for consistency
                    "question_number": self.current_criteria_index + 1,
                    "total_questions": len(self.trial_criteria)
                }
            
            elif intent == "repeat_current":
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
                        "content": "Thank you for answering all the screening questions. Would you like to submit your responses for evaluation, or do you have any questions about the study before deciding?",
                        "requires_response": True,
                        "is_final": False,
                        "awaiting_submission": True,
                        "question_number": len(self.trial_criteria),
                        "total_questions": len(self.trial_criteria)
                    }
            
            else:
                # Any other intent (including unrecognized responses) - treat as answer
                self.session.responses[current_criteria.id] = user_message.strip()
                
                # Move to next question
                self.current_criteria_index += 1
                
                if self.current_criteria_index < len(self.trial_criteria):
                    return await self._ask_current_criteria_question()
                else:
                    # All questions answered - wait for user to submit
                    self.conversation_state = "awaiting_submission"
                    return {
                        "content": "Thank you for answering all the screening questions. Would you like to submit your responses for evaluation, or do you have any questions about the study before deciding?",
                        "requires_response": True,
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
    
    def _classify_user_intent(self, user_message: str, current_criteria=None) -> str:
        """Use LLM to classify user intent from their message during questioning phase"""
        try:
            # First, check for exact "Ambiguous sound." match directly (more reliable than LLM)
            if user_message.strip() == "Ambiguous sound.":
                return "ambiguous"
            
            client = openai.OpenAI()
            
            # Build context section for questioning phase
            context_section = ""
            if current_criteria:
                context_section = f"""
            Current question: "{current_criteria.question}"
            Eligibility criteria: "{current_criteria.text}"
            Expected response: {current_criteria.expected_response}
            """
            
            prompt = f"""
            You are analyzing a user's spoken response in a clinical trial interview during the QUESTIONING PHASE to determine their intent.
            The response came from speech-to-text and may contain transcription errors.
            Analyze this user response in the context of the current question and eligibility criteria.
            {context_section}

            User's response: "{user_message}"
            
            Classify this response into ONE of these categories:
            
            1. "repeat_current" - User wants to repeat/hear the current question again
               Examples: "repeat that question", "what?", "I don't understand", "repeat the current question" etc
            
            2. "repeat_previous" - User wants to go back to the previous question  
               Examples: "go back", "previous question", "repeat the last question", "I want to answer the previous question again", "previous question's answer was or change previous answers as: '...'"
            
           
            
            4. "decline" - User wants to decline/withdraw from participation in the interview(skip this category if he is declining to answer the question)
               Examples: "I don't want to participate", "I withdraw", "I don't want to submit", "I want to stop"
            
            5. "answer" - User is providing a normal answer to an interview question
               Examples: medical/health responses, personal information, yes/no answers to eligibility questions
            
            6. "unclear" - Response is completely unclear, nonsensical, or seems to be a technical/navigation question that doesn't fit other categories
               Examples: garbled STT text, technical questions about the interview process, completely off-topic responses, or a question
               IMPORTANT: Only use this for very rare cases when you are highly unsure - if there's any chance it's an answer, classify as "answer"
            
            SPEECH-TO-TEXT CONSIDERATIONS:
            - Focus on intent rather than exact wording
            - Account for transcription errors and incomplete responses
            - Be more lenient with classification due to potential STT issues
            
            IMPORTANT NOTE: Users can decline/withdraw at ANY phase (consent, questioning, submission) - always respect their choice to withdraw.
            
            Respond with ONLY the category name: repeat_current, repeat_previous, decline, answer, or unclear

            NOTE: In case of doubt, prefer "answer" over "unclear" to avoid getting stuck. Always respect user's choice to decline/withdraw.
            """
            
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=10,
                temperature=0
            )
            
            intent = response.choices[0].message.content.strip().lower()
            
            # Validate the response
            valid_intents = ["repeat_current", "repeat_previous", "decline", "answer", "unclear"]
            if intent in valid_intents:
                return intent
            else:
                logger.warning(f"LLM returned invalid intent '{intent}', defaulting to 'answer'")
                return "answer"
                
        except Exception as e:
            logger.error(f"Error classifying user intent: {e}")
            return "answer"

    def _classify_submission_user_intent(self, user_message: str) -> str:
        """Use LLM to classify user intent from their message during submission phase"""
        try:
            # First, check for exact "Ambiguous sound." match directly (more reliable than LLM)
            if user_message.strip() == "Ambiguous sound.":
                return "ambiguous"
            
            client = openai.OpenAI()
            
            prompt = f"""
            You are analyzing a user's spoken response in a clinical trial interview during the SUBMISSION PHASE to determine their intent.
            The user has already answered ALL screening questions and is now deciding whether to submit their responses.
            The response came from speech-to-text and may contain transcription errors.

            User's response: "{user_message}"
            
            Classify this response into ONE of these categories:
            
            1. "repeat_instruction" - User wants to hear the submission instruction/options again
               Examples: "repeat", "what?", "I don't understand", "repeat that", "what are my options", "say that again"
            
            2. "submit" - User wants to submit their responses and complete the interview
               Examples: "submit", "yes", "I'm done", "finish", "complete", "proceed", "yes I want to submit"
            
            3. "decline" - User wants to decline/withdraw from participation and NOT submit
               Examples: "no", "I don't want to participate", "I withdraw", "I don't want to submit"
            
            4. "study_question" - User is asking questions about the study itself before deciding
               Examples: "What is the timeline?", "How long is the study?", "What happens next?", "Tell me more about the study"
            
            5. "unclear" - Response is completely unclear, nonsensical, or technical issue
               Examples: garbled STT text, completely off-topic responses, technical problems
            
            SUBMISSION PHASE CONTEXT:
            - User has completed all screening questions
            - They are deciding whether to submit or not
            - "Repeat" in this context means repeat the submission instruction
            - They can ask study questions, submit, or decline
            
            SPEECH-TO-TEXT CONSIDERATIONS:
            - Focus on intent rather than exact wording
            - Account for transcription errors and incomplete responses
            - Be more lenient with classification due to potential STT issues
            
            Respond with ONLY the category name: repeat_instruction, submit, decline, study_question, or unclear

            NOTE: When user says "repeat" during submission, they mean repeat the submission instruction.
            """
            
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=10,
                temperature=0
            )
            
            intent = response.choices[0].message.content.strip().lower()
            
            # Validate the response
            valid_intents = ["repeat_instruction", "submit", "decline", "study_question", "unclear"]
            if intent in valid_intents:
                return intent
            else:
                logger.warning(f"LLM returned invalid submission intent '{intent}', defaulting to 'repeat_instruction'")
                return "repeat_instruction"
                
        except Exception as e:
            logger.error(f"Error classifying submission user intent: {e}")
            return "repeat_instruction"
    
    async def _handle_unclear_submission_response(self, user_message: str) -> Dict:
        """Handle unclear response during submission phase - may be study questions like consent phase"""
        try:
            client = openai.OpenAI()
            
            # Prepare study context (same as consent clarification)
            overview = self.trial_info.get("overview", {})
            trial = self.trial_info.get("trial", {})
            
            study_context = {
                "title": trial.get("title", "Clinical Trial"),
                "purpose": overview.get("purpose", "Test a new medical treatment"),
                "commitment": overview.get("participant_commitment", "Time commitment varies"),
                "procedures": overview.get("key_procedures", ["Standard procedures"]),
                "phase": trial.get("phase", "Not specified"),
                "sponsor": trial.get("sponsor", "Research institution"),
                "category": trial.get("category", "Medical research"),
                "contact_info": self.trial_info.get("contact_info", "Contact information not available")
            }

            prompt = f"""
            You are MedBot, a clinical trial assistant. A participant has completed all screening questions and may have a question about the study before submitting their responses.
            The participant's message came from speech-to-text conversion and may contain transcription errors.

            STUDY INFORMATION:
            - Title: {study_context['title']}
            - Purpose: {study_context['purpose']}
            - Category: {study_context['category']}
            - Phase: {study_context['phase']}
            - Sponsor: {study_context['sponsor']}
            - Time Commitment: {study_context['commitment']}
            - Key Procedures: {', '.join(study_context['procedures'])}
            - Location & Contact: {study_context['contact_info']}

            SUBMISSION PHASE CONTEXT:
            - Participant has answered all {len(self.trial_criteria)} screening questions
            - They are now deciding whether to submit their responses for evaluation
            - They have the choice to submit, decline, ask more questions, or change previous answers

            PARTICIPANT'S QUESTION/CONCERN: "{user_message}"

            INSTRUCTIONS:
            - The participant may be asking about the study before making their decision
            - Address their specific question/concern directly using the study information provided
            - Be conversational, helpful, and reassuring while staying factual
            - Only use information provided above - DO NOT invent or assume details
            - Keep response concise (2-3 sentences max)
            - End by asking if they'd like to submit their responses or if they have other questions
            - If their question is about something not covered in the study info, acknowledge this honestly

            SPEECH-TO-TEXT CONSIDERATIONS:
            - The participant's message may have transcription errors or be incomplete
            - Focus on understanding their likely intent rather than exact wording
            - If the message seems unclear, provide general helpful information and present the options

            SAFETY RULES:
            - DO NOT provide medical advice
            - DO NOT guarantee study outcomes  
            - DO NOT make promises about results
            - DO NOT discuss specific risks/side effects (not provided in basic info)
            - Stay focused on helping them understand the study basics before submission

            Generate a helpful, personalized response:
            """

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=200,
                temperature=0.3
            )
            
            clarification = response.choices[0].message.content.strip()
            
            
            return {
                "content": clarification,
                "requires_response": False,
                "is_final": False,
                "awaiting_submission": True,
                "question_number": len(self.trial_criteria),
                "total_questions": len(self.trial_criteria)
            }
            
        except Exception as e:
            logger.error(f"Error handling unclear submission response: {e}")
            # Fallback response (same as consent clarification pattern)
            overview = self.trial_info.get("overview", {})
            purpose = overview.get("purpose", "Test a new medical treatment")
            return {
                "content": f"""This study aims to {purpose.lower()}. You've completed all the screening questions. 

Would you like to submit your responses for evaluation, or do you have other questions about the study?""",
                "requires_response": True,
                "is_final": False,
                "awaiting_submission": True,
                "question_number": len(self.trial_criteria),
                "total_questions": len(self.trial_criteria)
            }
    
    async def _handle_submission_request(self, user_message: str) -> Dict:
        """Handle submission or repeat request when awaiting final submission"""
        
        # Use submission-specific LLM to classify user intent
        intent = self._classify_submission_user_intent(user_message)
        
        if intent == "ambiguous":
            # Speech was unclear - ask user to speak more clearly
            return {
                "content": "I didn't catch that clearly. Please speak more clearly.",
                "requires_response": True,
                "is_final": False,
                "awaiting_submission": True,
                "question_number": len(self.trial_criteria),
                "total_questions": len(self.trial_criteria)
            }
        
        elif intent == "submit":
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
        
        elif intent == "decline":
            # User chooses not to submit/participate
            return {
                "content": "I understand. Thank you for taking the time to answer the screening questions. If you change your mind and would like to participate in the future, feel free to try again.",
                "requires_response": False,
                "is_final": True,
                "consent_rejected": True,  # Use same flag as consent phase for consistency
                "question_number": len(self.trial_criteria),
                "total_questions": len(self.trial_criteria)
            }
        
        elif intent == "repeat_instruction":
            # User wants to hear the submission instruction again
            return {
                "content": "Thank you for answering all the screening questions. Would you like to submit your responses for evaluation, or do you have any questions about the study before deciding?",
                "requires_response": True,
                "is_final": False,
                "awaiting_submission": True,
                "question_number": len(self.trial_criteria),
                "total_questions": len(self.trial_criteria)
            }
        
        
        elif intent == "study_question":
            # User is asking questions about the study - handle as unclear to get study info
            return await self._handle_unclear_submission_response(user_message)
        
        else:  # intent == "unclear"
            # Use LLM to handle unclear response in submission phase
            return await self._handle_unclear_submission_response(user_message)
    
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