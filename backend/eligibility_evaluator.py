import json
import logging
import re
import asyncio
from typing import Dict, List, Tuple
from datetime import datetime, timedelta

from tools.llm_provider import get_llm_response

from models import ParticipantSession, TrialCriteria, load_trial_criteria

logger = logging.getLogger(__name__)

class EligibilityEvaluator:
    def __init__(self, study_id: str):
        self.study_id = study_id
        self.trial_criteria = load_trial_criteria(study_id)
    
    async def evaluate_eligibility(self, session: ParticipantSession) -> Dict:
        """Evaluate participant eligibility based on their responses"""
        try:
            criteria_results = []
            total_score = 0
            max_score = 0
            high_priority_met = 0
            high_priority_total = 0
            
            # ⚡ Parallel evaluation for much faster processing
            evaluation_tasks = []
            criteria_with_responses = []
            
            for criteria in self.trial_criteria:
                response = session.responses.get(criteria.id, "")
                if response:
                    criteria_with_responses.append(criteria)
                    evaluation_tasks.append(self._evaluate_single_criteria_async(criteria, response))
            
            # Execute all evaluations in parallel
            if evaluation_tasks:
                criteria_results = await asyncio.gather(*evaluation_tasks, return_exceptions=True)
                
                # Handle any exceptions in results
                for i, result in enumerate(criteria_results):
                    if isinstance(result, Exception):
                        logger.error(f"Error evaluating criteria {criteria_with_responses[i].id}: {result}")
                        # Fallback to synchronous evaluation for failed criteria
                        criteria_results[i] = self._evaluate_single_criteria_sync(criteria_with_responses[i], session.responses.get(criteria_with_responses[i].id, ""))
            else:
                criteria_results = []
            
            # Calculate scores from all evaluated criteria
            for evaluation in criteria_results:
                criteria_id = evaluation.get("criteria_id")
                # Find the corresponding criteria to get priority
                criteria = next((c for c in self.trial_criteria if c.id == criteria_id), None)
                if criteria:
                    # Calculate scores
                    if criteria.priority == "high":
                        high_priority_total += 1
                        if evaluation["meets_criteria"]:
                            high_priority_met += 1
                    
                    # Weighted scoring
                    weight = 5 if criteria.priority == "high" else 2 if criteria.priority == "medium" else 1
                    max_score += weight
                    if evaluation["meets_criteria"]:
                        total_score += weight
            
            # Calculate overall eligibility
            overall_score = (total_score / max_score * 100) if max_score > 0 else 0
            
            # Must meet all high priority criteria
            high_priority_pass = (high_priority_met == high_priority_total) if high_priority_total > 0 else True
            
            # Overall eligibility decision
            eligible = (overall_score >= 60) and high_priority_pass
            
            # Generate summary
            summary = self._generate_eligibility_summary(
                eligible, overall_score, criteria_results, high_priority_pass
            )
            
            result = {
                "eligible": eligible,
                "score": round(overall_score, 1),
                "criteria_met": criteria_results,
                "summary": summary,
                "high_priority_criteria_met": f"{high_priority_met}/{high_priority_total}",
                "evaluation_timestamp": datetime.now().isoformat(),
                "participant_id": session.participant_id
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Error evaluating eligibility: {e}")
            return {
                "eligible": False,
                "score": 0.0,
                "criteria_met": [],
                "summary": "Error occurred during eligibility evaluation",
                "evaluation_timestamp": datetime.now().isoformat(),
                "participant_id": session.participant_id
            }
    
    async def _evaluate_single_criteria_async(self, criteria: TrialCriteria, response: str) -> Dict:
        """Evaluate a single criteria against the response (async version)"""
        try:
            # Use LLM to evaluate the response
            evaluation_prompt = f"""
            You are evaluating a clinical trial participant's spoken response against eligibility criteria. 
            The response came from speech-to-text conversion and may contain transcription errors.

            CRITERIA: {criteria.text}
            QUESTION: {criteria.question}
            EXPECTED: {criteria.expected_response}
            PARTICIPANT'S RESPONSE: "{response}"

            IMPORTANT - Speech-to-Text Considerations:
            - The response may have transcription errors, incomplete words, or mixed-up similar-sounding words
            - Focus on understanding the participant's INTENT rather than exact wording
            - Look for key information even if grammar/wording is imperfect
            - If response seems completely unrelated, it might be a transcription error - be more lenient
            - Partial responses (e.g., "yeah, I think I..." cut off) should be interpreted based on available context
            - Consider common speech patterns: "yeah"="yes", "nah"="no", partial numbers, etc.

            Evaluate if the participant's response meets the criteria, accounting for speech-to-text imperfections.

            Respond with a JSON object:
            {{
                "meets_criteria": true/false,
                "confidence": 0.0-1.0, # Lower confidence for unclear/incomplete responses due to STT issues
                "reasoning": "brief explanation including any STT considerations",
                "extracted_value": "key value from response if applicable"
            }}
            """
            
            # Note: get_llm_response is synchronous, but we can run it in parallel
            evaluation_text = get_llm_response(system_prompt="You are a clinical trial eligibility evaluator. Provide accurate JSON responses.", user_prompt=evaluation_prompt)

            # Parse JSON response
            evaluation = json.loads(evaluation_text)
        
            # Add metadata
            evaluation.update({
                "criteria_id": criteria.id,
                "criteria_text": criteria.text,
                "criteria_question": criteria.question,
                "priority": criteria.priority,
                "participant_response": response
            })
            
            return evaluation
            
        except Exception as e:
            logger.error(f"Error evaluating criteria {criteria.id}: {e}")
            return {
                "criteria_id": criteria.id,
                "criteria_text": criteria.text,
                "criteria_question": criteria.question,
                "priority": criteria.priority,
                "participant_response": response,
                "meets_criteria": False,
                "confidence": 0.0,
                "reasoning": f"Evaluation error: {str(e)}",
                "extracted_value": None
            }

    def _evaluate_single_criteria_sync(self, criteria: TrialCriteria, response: str) -> Dict:
        """Evaluate a single criteria against the response"""
        try:
            # Use LLM to evaluate the response
            evaluation_prompt = f"""
            You are evaluating a clinical trial participant's spoken response against eligibility criteria. 
            The response came from speech-to-text conversion and may contain transcription errors.

            CRITERIA: {criteria.text}
            QUESTION: {criteria.question}
            EXPECTED: {criteria.expected_response}
            PARTICIPANT'S RESPONSE: "{response}"

            IMPORTANT - Speech-to-Text Considerations:
            - The response may have transcription errors, incomplete words, or mixed-up similar-sounding words
            - Focus on understanding the participant's INTENT rather than exact wording
            - Look for key information even if grammar/wording is imperfect
            - If response seems completely unrelated, it might be a transcription error - be more lenient
            - Partial responses (e.g., "yeah, I think I..." cut off) should be interpreted based on available context
            - Consider common speech patterns: "yeah"="yes", "nah"="no", partial numbers, etc.

            Evaluate if the participant's response meets the criteria, accounting for speech-to-text imperfections.

            Respond with a JSON object:
            {{
                "meets_criteria": true/false,
                "confidence": 0.0-1.0, # Lower confidence for unclear/incomplete responses due to STT issues
                "reasoning": "brief explanation including any STT considerations",
                "extracted_value": "key value from response if applicable"
            }}
            """
            
            evaluation_text = get_llm_response(system_prompt="You are a clinical trial eligibility evaluator. Provide accurate JSON responses.", user_prompt=evaluation_prompt)

            # Parse JSON response
            evaluation = json.loads(evaluation_text)
        
            # Add metadata
            evaluation.update({
                "criteria_id": criteria.id,
                "criteria_text": criteria.text,
                "criteria_question": criteria.question,
                "priority": criteria.priority,
                "participant_response": response
            })
            
            return evaluation
            
        except Exception as e:
            logger.error(f"Error evaluating criteria {criteria.id}: {e}")
            return {
                "criteria_id": criteria.id,
                "criteria_text": criteria.text,
                "criteria_question": criteria.question,
                "priority": criteria.priority,
                "participant_response": response,
                "meets_criteria": False,
                "confidence": 0.0,
                "reasoning": f"Evaluation error: {str(e)}",
                "extracted_value": None
            }
    
    

    def _generate_eligibility_summary(self, eligible: bool, score: float, 
                                    criteria_results: List[Dict], high_priority_pass: bool) -> str:
        """Generate a human-readable eligibility summary"""
        try:
            if eligible:
                summary = f"✅ **ELIGIBLE** - Overall score: {score:.1f}%\n\n"
                summary += "The participant appears to meet the eligibility criteria for this clinical trial. "
                summary += "Our research team will contact them for the next steps.\n\n"
            else:
                summary = f"❌ **NOT ELIGIBLE** - Overall score: {score:.1f}%\n\n"
                if not high_priority_pass:
                    summary += "The participant does not meet one or more high-priority eligibility criteria.\n\n"
                else:
                    summary += "The participant's overall score is below the required threshold.\n\n"
            
            # Add criteria breakdown
            summary += "**Criteria Assessment:**\n"
            
            for result in criteria_results:
                status = "✅" if result["meets_criteria"] else "❌"
                priority = "🔴" if result["priority"] == "high" else "🟡" if result["priority"] == "medium" else "🟢"
                
                summary += f"{status} {priority} {result['criteria_text']}\n"
                summary += f"   Response: \"{result['participant_response']}\"\n"
                if result.get("reasoning"):
                    summary += f"   Assessment: {result['reasoning']}\n"
                summary += "\n"
            
            return summary
            
        except Exception as e:
            logger.error(f"Error generating summary: {e}")
            return f"Eligibility: {'Eligible' if eligible else 'Not Eligible'} (Score: {score:.1f}%)"
    
    def _save_eligibility_result(self, session_id: str, result: Dict):
        """Save eligibility result to JSON storage"""
        try:
            from models import JsonDataManager
            data_manager = JsonDataManager()
            data_manager.save_eligibility_result(session_id, result)
            
        except Exception as e:
            logger.error(f"Error saving eligibility result: {e}")
    
    def get_eligibility_statistics(self) -> Dict:
        """Get overall eligibility statistics"""
        try:
            from models import JsonDataManager
            data_manager = JsonDataManager()
            return data_manager.get_eligibility_statistics()
            
        except Exception as e:
            logger.error(f"Error getting statistics: {e}")
            return {"total": 0, "eligible": 0, "not_eligible": 0, "average_score": 0.0}
    
    def re_evaluate_session(self, session_id: str) -> Dict:
        """Re-evaluate a session's eligibility"""
        from models import SessionManager
        session_manager = SessionManager()
        
        session = session_manager.get_session(session_id)
        if not session:
            raise ValueError("Session not found")
        
        return self.evaluate_eligibility(session) 