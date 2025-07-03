import openai
from typing import Dict
from .base_agent import BaseAgent

class ConsentAgent(BaseAgent):
    """Agent responsible for handling consent flow"""
    
    async def can_handle(self, conversation_state: str, user_input: str) -> bool:
        """Check if this agent can handle the current state"""
        return conversation_state in ["greeting", "waiting_consent", "consent_clarification"]
    
    async def get_initial_message(self) -> Dict:
        """Generate the initial greeting message"""
        try:
            client = openai.OpenAI()
            
            # Prepare comprehensive study context for LLM
            trial = self.trial_info.get("trial", {})
            overview = self.trial_info.get("overview", {})
            criteria = self.trial_info.get("criteria", [])
            
            study_context = {
                "title": trial.get("title", "Clinical Trial"),
                "category": trial.get("category", "Medical Research"),
                "phase": trial.get("phase", "N/A"),
                "sponsor": trial.get("sponsor", "Research Institution"),
                "nct_id": trial.get("nct_id", "N/A"),
                "purpose": overview.get("purpose", "Test a new medical treatment"),
                "commitment": overview.get("participant_commitment", "Time commitment varies"),
                "procedures": overview.get("key_procedures", ["Standard procedures"]),
                "contact_info": self.trial_info.get("contact_info", "Contact information available upon enrollment"),
                "total_questions": len(criteria),
                "protocol_version": trial.get("protocol_version", "Latest"),
                "last_amended": trial.get("last_amended", "Recent")
            }

            prompt = f"""
            You are MedBot, a clinical trial assistant. Generate a brief, friendly greeting for a potential study participant.

            STUDY INFORMATION:
            - Title: {study_context['title']}
            - Purpose: {study_context['purpose']}
            - total questions: {study_context['total_questions']}
            - time commitment: {study_context['commitment']}

            INSTRUCTIONS:
            - Keep it to 2-3 lines maximum
            - Briefly mention the study purpose in simple terms
            - ALWAYS end with something like(but not exactly this, be creative): "Do you consent to proceed with the screening questions, or do you have any questions about the study before deciding?"
            - Don't include detailed information - users can ask questions later if needed

            Generate a concise greeting:
            """

            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=300,
                temperature=0.8,
                top_p=0.9,
            )
            
            greeting = response.choices[0].message.content.strip()
            
            return self._create_response(
                content=greeting,
                requires_response=True,
                question_number=0,  # Consent phase
                total_questions=len(self.trial_criteria)
            )
            
        except Exception as e:
            self.logger.error(f"Error generating LLM greeting: {e}")
            # Fallback to enhanced template-based greeting
            overview = self.trial_info.get("overview", {})
            trial = self.trial_info.get("trial", {})
            criteria = self.trial_info.get("criteria", [])
            
            title = trial.get("title", "Clinical Trial")
            purpose = overview.get("purpose", "test a new medical treatment")
            commitment = overview.get("participant_commitment", "Time commitment varies")
            total_questions = len(criteria)
            
            greeting = f"""Hello! I'm MedBot, your clinical trial assistant.

I'd like to tell you about "{title}" - this study aims to {purpose.lower()}.

The time commitment is approximately {commitment.lower()}, and you'll be asked {total_questions} screening questions to see if you might be eligible.

Do you consent to proceed with the screening questions, or do you have any questions about the study before deciding?"""
            
            return self._create_response(
                content=greeting,
                requires_response=True,
                question_number=0,
                total_questions=len(self.trial_criteria)
            )
    
    async def process_input(self, user_input: str) -> Dict:
        """Process consent-related user input"""
        # First, check for exact "Ambiguous sound." match directly
        if user_input.strip() == "Ambiguous sound.":
            return self._create_response(
                content="I didn't catch that clearly. Please speak more clearly, or speak in the language you selected.",
                requires_response=True,
                question_number=0,  # Still in consent phase
                total_questions=len(self.trial_criteria)
            )
        
        try:
            # Use LLM to determine if user consented
            client = openai.OpenAI()
            
            prompt = f"""
            Analyze this spoken response to a consent request for participating in a clinical trial screening interview.
            The response came from speech-to-text and may contain transcription errors.
            
            User's response: "{user_input}"
            
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
                # Consent accepted - signal to coordinator to move to questioning
                return self._create_response(
                    content="Great! Let's begin with the screening questions.",
                    requires_response=False,
                    transition_to="questioning",
                    question_number=1,
                    total_questions=len(self.trial_criteria)
                )
            elif intent == "NO":
                # Consent declined
                return self._create_response(
                    content="I understand. Thank you for your time. If you change your mind, feel free to try again later.",
                    requires_response=False,
                    is_final=True,
                    consent_rejected=True,
                    question_number=0,
                    total_questions=len(self.trial_criteria)
                )
            else:  # CLARIFY
                # Generate personalized clarification
                clarification = await self._generate_consent_clarification(user_input)
                
                return self._create_response(
                    content=clarification,
                    requires_response=True,
                    question_number=0,  # Still in consent phase
                    total_questions=len(self.trial_criteria)
                )
                
        except Exception as e:
            self.logger.error(f"Error processing consent response: {e}")
            return self._create_response(
                content="Error processing consent response. Thank you for your time.",
                requires_response=False,
                is_final=True,
                question_number=0,
                total_questions=len(self.trial_criteria)
            )

    async def _generate_consent_clarification(self, user_message: str) -> str:
        """Generate personalized consent clarification using LLM and study context"""
        try:
            client = openai.OpenAI()
            
             # Prepare comprehensive study context for LLM
            trial = self.trial_info.get("trial", {})
            overview = self.trial_info.get("overview", {})
            criteria = self.trial_info.get("criteria", [])
            
            study_context = {
                "title": trial.get("title", "Clinical Trial"),
                "category": trial.get("category", "Medical Research"),
                "phase": trial.get("phase", "N/A"),
                "sponsor": trial.get("sponsor", "Research Institution"),
                "nct_id": trial.get("nct_id", "N/A"),
                "purpose": overview.get("purpose", "Test a new medical treatment"),
                "commitment": overview.get("participant_commitment", "Time commitment varies"),
                "procedures": overview.get("key_procedures", ["Standard procedures"]),
                "contact_info": self.trial_info.get("contact_info", "Contact information available upon enrollment"),
                "total_questions": len(criteria),
                "protocol_version": trial.get("protocol_version", "Latest"),
                "last_amended": trial.get("last_amended", "Recent")
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
            - total questions: {study_context['total_questions']}

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
            self.logger.error(f"Error generating consent clarification: {e}")
            # Fallback to simple clarification
            overview = self.trial_info.get("overview", {})
            purpose = overview.get("purpose", "Test a new medical treatment")
            return f"""Let me clarify: I'm MedBot, your clinical trial assistant. 

This study aims to {purpose.lower()}.

You will be asked a few screening questions to see if you might be eligible.

Do you consent to proceed with the screening questions?""" 