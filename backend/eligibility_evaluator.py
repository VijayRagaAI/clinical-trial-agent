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
        
        # Decision algorithm constants
        self.HIGH_PRIORITY_CONFIDENCE_THRESHOLD = 0.8
        self.DECISION_THRESHOLD = 0.0  # Can be tuned based on study requirements
        self.weights = {
            'high': 5.0,
            'medium': 2.5,
            'low': 1.0
        }
    
    def decide(self, questions):
        """
        Decision algorithm for eligibility based on confidence-weighted scoring
        
        Args:
            questions: List of tuples (category, result, confidence)
                      category: 'high', 'medium', 'low' 
                      result: 'Yes' or 'No' (or True/False)
                      confidence: float [0, 1]
        
        Returns:
            'Accept' or 'Reject'
        """
        # 1. Immediate-reject rule
        for cat, result, conf in questions:
            # Convert boolean to string if needed
            result_str = 'Yes' if (result is True or result == 'Yes') else 'No'
            
            if cat == 'high' and result_str == 'No' and conf >= self.HIGH_PRIORITY_CONFIDENCE_THRESHOLD:
                return 'Reject'
        
        # 2. Compute total weighted score
        total = 0.0
        for cat, result, conf in questions:
            # Convert boolean to string if needed
            result_str = 'Yes' if (result is True or result == 'Yes') else 'No'
            
            sign = +1 if result_str == 'Yes' else -1
            total += sign * conf * self.weights[cat]
        
        # 3. Final threshold check
        return 'Accept' if total >= self.DECISION_THRESHOLD else 'Reject'
    
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
            
            # Prepare questions for decision algorithm
            questions = []
            for evaluation in criteria_results:
                criteria_id = evaluation.get("criteria_id")
                # Find the corresponding criteria to get priority
                criteria = next((c for c in self.trial_criteria if c.id == criteria_id), None)
                if criteria:
                    # Calculate legacy scores for reporting
                    if criteria.priority == "high":
                        high_priority_total += 1
                        if evaluation["meets_criteria"]:
                            high_priority_met += 1
                    
                    # Weighted scoring for legacy score calculation
                    weight = 5 if criteria.priority == "high" else 2 if criteria.priority == "medium" else 1
                    max_score += weight
                    if evaluation["meets_criteria"]:
                        total_score += weight
                    
                    # Prepare for new decision algorithm
                    questions.append((
                        criteria.priority,  # 'high', 'medium', 'low'
                        evaluation["meets_criteria"],  # True/False
                        evaluation.get("confidence", 1.0)  # confidence score
                    ))
            
            # Calculate legacy overall score for reporting
            overall_score = (total_score / max_score * 100) if max_score > 0 else 0
            
            # Use new decision algorithm
            decision = self.decide(questions)
            eligible = (decision == 'Accept')
            
            # Legacy high priority calculation for reporting
            high_priority_pass = (high_priority_met == high_priority_total) if high_priority_total > 0 else True
            
            # Calculate decision algorithm score for reporting
            decision_score = 0.0
            for cat, result, conf in questions:
                result_str = 'Yes' if (result is True or result == 'Yes') else 'No'
                sign = +1 if result_str == 'Yes' else -1
                decision_score += sign * conf * self.weights[cat]
            
            # Generate summary
            summary = self._generate_eligibility_summary(
                eligible, overall_score, criteria_results, high_priority_pass, decision_score, decision
            )
            
            result = {
                "eligible": eligible,
                "score": round(overall_score, 1),
                "criteria_met": criteria_results,
                "summary": summary,
                "high_priority_criteria_met": f"{high_priority_met}/{high_priority_total}",
                "decision_algorithm_score": round(decision_score, 2),
                "decision_algorithm_result": decision,
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
            evaluation_text = get_llm_response(system_prompt="You are a clinical trial eligibility evaluator. Provide accurate JSON responses.", user_prompt=evaluation_prompt, model="gpt-4o")

            # Parse JSON response
            evaluation = json.loads(evaluation_text)
        
            # Add metadata
            evaluation.update({
                "criteria_id": criteria.id,
                "criteria_text": criteria.text,
                "criteria_question": criteria.question,
                "expected_response": criteria.expected_response,
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
                "expected_response": criteria.expected_response,
                "priority": criteria.priority,
                "participant_response": response,
                "meets_criteria": False,
                "confidence": 0.0,
                "reasoning": f"Evaluation error: {str(e)}",
                "extracted_value": None
            }

    def _evaluate_single_criteria_sync(self, criteria: TrialCriteria, response: str, model: str = "gpt-4o") -> Dict:
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
                "expected_response": criteria.expected_response,
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
                "expected_response": criteria.expected_response,
                "priority": criteria.priority,
                "participant_response": response,
                "meets_criteria": False,
                "confidence": 0.0,
                "reasoning": f"Evaluation error: {str(e)}",
                "extracted_value": None
            }
    
    

    def _generate_eligibility_summary(self, eligible: bool, score: float, 
                                    criteria_results: List[Dict], high_priority_pass: bool,
                                    decision_score: float, decision: str) -> str:
        """Generate a human-readable eligibility summary"""
        try:
            if eligible:
                summary = f"✅ **ELIGIBLE** - Decision Algorithm: {decision}\n\n"
                summary += f"**Confidence-Weighted Score**: {decision_score:.2f} (≥ {self.DECISION_THRESHOLD})\n"
                summary += f"**Legacy Score**: {score:.1f}%\n\n"
                summary += "The participant appears to meet the eligibility criteria for this clinical trial. "
                summary += "Our research team will contact them for the next steps.\n\n"
            else:
                summary = f"❌ **NOT ELIGIBLE** - Decision Algorithm: {decision}\n\n"
                summary += f"**Confidence-Weighted Score**: {decision_score:.2f} (< {self.DECISION_THRESHOLD})\n"
                summary += f"**Legacy Score**: {score:.1f}%\n\n"
                
                # Check if immediate rejection occurred
                immediate_reject = False
                for result in criteria_results:
                    if (result.get("priority") == "high" and 
                        not result.get("meets_criteria") and 
                        result.get("confidence", 0) >= self.HIGH_PRIORITY_CONFIDENCE_THRESHOLD):
                        immediate_reject = True
                        break
                
                if immediate_reject:
                    summary += f"**Immediate Rejection**: High-priority criterion failed with confidence ≥ {self.HIGH_PRIORITY_CONFIDENCE_THRESHOLD}\n\n"
                else:
                    summary += "The participant's confidence-weighted score is below the required threshold.\n\n"
            
            # Add criteria breakdown
            summary += "**Criteria Assessment:**\n"
            
            for result in criteria_results:
                status = "✅" if result["meets_criteria"] else "❌"
                priority = "🔴" if result["priority"] == "high" else "🟡" if result["priority"] == "medium" else "🟢"
                confidence = result.get("confidence", 1.0)
                
                summary += f"{status} {priority} {result['criteria_text']}\n"
                summary += f"   Response: \"{result['participant_response']}\"\n"
                summary += f"   Confidence: {confidence:.2f} | Weight: {self.weights[result['priority']]}\n"
                if result.get("reasoning"):
                    summary += f"   Assessment: {result['reasoning']}\n"
                summary += "\n"
            
            return summary
            
        except Exception as e:
            logger.error(f"Error generating summary: {e}")
            return f"Eligibility: {'Eligible' if eligible else 'Not Eligible'} (Decision: {decision}, Score: {decision_score:.2f})"
    
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