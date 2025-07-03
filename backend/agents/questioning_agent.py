import openai
from typing import Dict
from .base_agent import BaseAgent

class QuestioningAgent(BaseAgent):
    """Agent responsible for handling eligibility criteria questioning"""
    
    def __init__(self, session, study_id, trial_criteria, trial_info):
        super().__init__(session, study_id, trial_criteria, trial_info)
        self.current_criteria_index = 0
    
    async def can_handle(self, conversation_state: str, user_input: str) -> bool:
        """Check if this agent can handle the current state"""
        return conversation_state in ["asking_questions", "questioning"]
    
    async def get_initial_message(self) -> Dict:
        """Get the first question"""
        return await self._ask_current_criteria_question()
    
    async def process_input(self, user_input: str) -> Dict:
        """Process questioning-related user input"""
        if self.current_criteria_index < len(self.trial_criteria):
            # Get current question
            current_criteria = self.trial_criteria[self.current_criteria_index]
            
            # Use LLM to classify user intent
            intent = self._classify_user_intent(user_input, current_criteria)
            
            if intent == "ambiguous":
                # Speech was unclear - ask user to speak more clearly without advancing
                return self._create_response(
                    content="I didn't catch that clearly. Please speak more clearly, or speak in the language you selected.",
                    requires_response=True,
                    question_number=self.current_criteria_index + 1,  # Stay on current question
                    total_questions=len(self.trial_criteria)
                )
            
            elif intent == "unclear":
                # Use LLM to handle unclear response with full context
                return await self._handle_unclear_response(user_input)
            
            elif intent == "decline":
                # User wants to decline/withdraw during questioning phase
                return self._create_response(
                    content="I understand. Thank you for your time. If you change your mind and would like to participate in the future, feel free to try again.",
                    requires_response=False,
                    is_final=True,
                    consent_rejected=True,  # Use same flag as consent phase for consistency
                    question_number=self.current_criteria_index + 1,
                    total_questions=len(self.trial_criteria)
                )
            
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
                self.session.responses[current_criteria.id] = user_input.strip()
                
                # Move to next question
                self.current_criteria_index += 1
                
                if self.current_criteria_index < len(self.trial_criteria):
                    return await self._ask_current_criteria_question()
                else:
                    # All questions answered - transition to submission
                    return self._create_response(
                        content="Thank you for answering all the screening questions. Would you like to submit your responses for evaluation, or do you have any questions about the study before deciding?",
                        requires_response=True,
                        transition_to="submission",
                        awaiting_submission=True,
                        question_number=len(self.trial_criteria),
                        total_questions=len(self.trial_criteria)
                    )
            
            else:
                # Any other intent (including unrecognized responses) - treat as answer
                self.session.responses[current_criteria.id] = user_input.strip()
                
                # Move to next question
                self.current_criteria_index += 1
                
                if self.current_criteria_index < len(self.trial_criteria):
                    return await self._ask_current_criteria_question()
                else:
                    # All questions answered - transition to submission
                    return self._create_response(
                        content="Thank you for answering all the screening questions. Would you like to submit your responses for evaluation, or do you have any questions about the study before deciding?",
                        requires_response=True,
                        transition_to="submission",
                        awaiting_submission=True,
                        question_number=len(self.trial_criteria),
                        total_questions=len(self.trial_criteria)
                    )
        
        # Shouldn't reach here, but just in case
        return self._create_response(
            content="Interview completed. Thank you for your time!",
            requires_response=False,
            is_final=True,
            question_number=len(self.trial_criteria),
            total_questions=len(self.trial_criteria)
        )
    
    async def _ask_current_criteria_question(self) -> Dict:
        """Ask the current eligibility criteria question using the question field from JSON"""
        if self.current_criteria_index < len(self.trial_criteria):
            criteria = self.trial_criteria[self.current_criteria_index]
            
            # Use the question directly from the JSON
            question = criteria.question
            
            return self._create_response(
                content=question,
                requires_response=True,
                question_number=self.current_criteria_index + 1,  # 1-based for frontend
                total_questions=len(self.trial_criteria)
            )
        
        return self._create_response(
            content="We've completed all the screening questions.",
            requires_response=False,
            question_number=len(self.trial_criteria),
            total_questions=len(self.trial_criteria)
        )
    
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
            
            3. "decline" - User wants to decline/withdraw from participation in the interview(skip this category if he is declining to answer the question)
               Examples: "I don't want to participate", "I withdraw", "I don't want to submit", "I want to stop"
            
            4. "answer" - User is providing a normal answer to an interview question
               Examples: medical/health responses, personal information, yes/no answers to eligibility questions
            
            5. "unclear" - Response is completely unclear, nonsensical, or seems to be a technical/navigation question that doesn't fit other categories
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
                self.logger.warning(f"LLM returned invalid intent '{intent}', defaulting to 'answer'")
                return "answer"
                
        except Exception as e:
            self.logger.error(f"Error classifying user intent: {e}")
            return "answer"
    
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
            
            return self._create_response(
                content=clarification,
                requires_response=True,
                question_number=self.current_criteria_index + 1,  # Stay on current question
                total_questions=len(self.trial_criteria)
            )
            
        except Exception as e:
            self.logger.error(f"Error handling unclear response: {e}")
            # Fallback response
            current_criteria = self.trial_criteria[self.current_criteria_index]
            return self._create_response(
                content=f"I didn't quite understand that. Let me ask the question again: {current_criteria.question}",
                requires_response=True,
                question_number=self.current_criteria_index + 1,
                total_questions=len(self.trial_criteria)
            ) 