import openai
from typing import Dict
from .base_agent import BaseAgent

class SubmissionAgent(BaseAgent):
    """Agent responsible for handling final submission and study questions"""
    
    async def can_handle(self, conversation_state: str, user_input: str) -> bool:
        """Check if this agent can handle the current state"""
        return conversation_state in ["awaiting_submission", "submission"]
    
    async def get_initial_message(self) -> Dict:
        """Get the submission prompt message"""
        return self._create_response(
            content="Thank you for answering all the screening questions. Would you like to submit your responses for evaluation, or do you have any questions about the study before deciding?",
            requires_response=True,
            awaiting_submission=True,
            question_number=len(self.trial_criteria),
            total_questions=len(self.trial_criteria)
        )
    
    async def process_input(self, user_input: str) -> Dict:
        """Process submission-related user input"""
        # Use submission-specific LLM to classify user intent
        intent = self._classify_submission_user_intent(user_input)
        
        if intent == "ambiguous":
            # Speech was unclear - ask user to speak more clearly
            return self._create_response(
                content="I didn't catch that clearly. Please speak more clearly, or speak in the language you selected.",
                requires_response=True,
                awaiting_submission=True,
                question_number=len(self.trial_criteria),
                total_questions=len(self.trial_criteria)
            )
        
        elif intent == "submit":
            # Start evaluation process - signal to coordinator to complete
            return self._create_response(
                content="Evaluating your responses...",
                requires_response=False,
                evaluating=True,
                transition_to="evaluation",
                question_number=len(self.trial_criteria),
                total_questions=len(self.trial_criteria)
            )
        
        elif intent == "decline":
            # User chooses not to submit/participate
            return self._create_response(
                content="I understand. Thank you for taking the time to answer the screening questions. If you change your mind and would like to participate in the future, feel free to try again.",
                requires_response=False,
                is_final=True,
                consent_rejected=True,  # Use same flag as consent phase for consistency
                question_number=len(self.trial_criteria),
                total_questions=len(self.trial_criteria)
            )
        
        elif intent == "repeat_instruction":
            # User wants to hear the submission instruction again
            return self._create_response(
                content="Thank you for answering all the screening questions. Would you like to submit your responses for evaluation, or do you have any questions about the study before deciding?",
                requires_response=True,
                awaiting_submission=True,
                question_number=len(self.trial_criteria),
                total_questions=len(self.trial_criteria)
            )
        
        elif intent == "study_question":
            # User is asking questions about the study - handle as unclear to get study info
            return await self._handle_unclear_submission_response(user_input)
        
        else:  # intent == "unclear"
            # Use LLM to handle unclear response in submission phase
            return await self._handle_unclear_submission_response(user_input)
    
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
                self.logger.warning(f"LLM returned invalid submission intent '{intent}', defaulting to 'repeat_instruction'")
                return "repeat_instruction"
                
        except Exception as e:
            self.logger.error(f"Error classifying submission user intent: {e}")
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
                "contact_info": self.trial_info.get("contact_info", "Contact information not available"),
                "total_questions": len(self.trial_criteria)
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
            - total questions: {study_context['total_questions']}
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
            
            return self._create_response(
                content=clarification,
                requires_response=True,
                awaiting_submission=True,
                question_number=len(self.trial_criteria),
                total_questions=len(self.trial_criteria)
            )
            
        except Exception as e:
            self.logger.error(f"Error handling unclear submission response: {e}")
            # Fallback response (same as consent clarification pattern)
            overview = self.trial_info.get("overview", {})
            purpose = overview.get("purpose", "Test a new medical treatment")
            return self._create_response(
                content=f"""This study aims to {purpose.lower()}. You've completed all the screening questions. 

Would you like to submit your responses for evaluation, or do you have other questions about the study?""",
                requires_response=True,
                awaiting_submission=True,
                question_number=len(self.trial_criteria),
                total_questions=len(self.trial_criteria)
            ) 