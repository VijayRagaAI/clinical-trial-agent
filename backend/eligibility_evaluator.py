import json
import logging
import re
from typing import Dict, List, Tuple
from datetime import datetime, timedelta

from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage

from models import ParticipantSession, TrialCriteria, load_trial_criteria

logger = logging.getLogger(__name__)

class EligibilityEvaluator:
    def __init__(self):
        self.llm = ChatOpenAI(
            temperature=0.1,  # Low temperature for consistent evaluation
            model_name="gpt-4o-mini",
            max_tokens=500
        )
        self.trial_criteria = load_trial_criteria()
    
    def evaluate_eligibility(self, session: ParticipantSession) -> Dict:
        """Evaluate participant eligibility based on their responses"""
        try:
            criteria_results = []
            total_score = 0
            max_score = 0
            high_priority_met = 0
            high_priority_total = 0
            
            for criteria in self.trial_criteria:
                response = session.responses.get(criteria.id, "")
                
                if response:
                    # Evaluate this specific criteria
                    evaluation = self._evaluate_single_criteria(criteria, response)
                    criteria_results.append(evaluation)
                    
                    # Calculate scores
                    if criteria.priority == "high":
                        high_priority_total += 1
                        if evaluation["meets_criteria"]:
                            high_priority_met += 1
                    
                    # Weighted scoring
                    weight = 3 if criteria.priority == "high" else 1
                    max_score += weight
                    if evaluation["meets_criteria"]:
                        total_score += weight
            
            # Calculate overall eligibility
            overall_score = (total_score / max_score * 100) if max_score > 0 else 0
            
            # Must meet all high priority criteria
            high_priority_pass = (high_priority_met == high_priority_total) if high_priority_total > 0 else True
            
            # Overall eligibility decision
            eligible = (overall_score >= 70) and high_priority_pass
            
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
    
    def _evaluate_single_criteria(self, criteria: TrialCriteria, response: str) -> Dict:
        """Evaluate a single criteria against the response"""
        try:
            # Use LLM to evaluate the response
            evaluation_prompt = f"""
            You are evaluating a clinical trial participant's response against eligibility criteria.
            
            CRITERIA: {criteria.text}
            EXPECTED: {criteria.expected_response}
            PARTICIPANT'S RESPONSE: "{response}"
            
            Evaluate if the participant's response meets the criteria. Consider:
            1. Does the response align with the expected answer?
            2. Are there any red flags or exclusions?
            3. Is the response clear and definitive?
            
            Respond with a JSON object:
            {{
                "meets_criteria": true/false,
                "confidence": 0.0-1.0,
                "reasoning": "brief explanation",
                "extracted_value": "key value from response if applicable"
            }}
            """
            
            messages = [
                SystemMessage(content="You are a clinical trial eligibility evaluator. Provide accurate JSON responses."),
                HumanMessage(content=evaluation_prompt)
            ]
            
            # Get LLM evaluation
            response_obj = self.llm.invoke(messages)
            evaluation_text = response_obj.content.strip()
            
            # Parse JSON response
            try:
                evaluation = json.loads(evaluation_text)
            except json.JSONDecodeError:
                # Fallback evaluation
                evaluation = self._fallback_evaluation(criteria, response)
            
            # Add metadata
            evaluation.update({
                "criteria_id": criteria.id,
                "criteria_text": criteria.text,
                "priority": criteria.priority,
                "participant_response": response
            })
            
            return evaluation
            
        except Exception as e:
            logger.error(f"Error evaluating criteria {criteria.id}: {e}")
            return {
                "criteria_id": criteria.id,
                "criteria_text": criteria.text,
                "priority": criteria.priority,
                "participant_response": response,
                "meets_criteria": False,
                "confidence": 0.0,
                "reasoning": f"Evaluation error: {str(e)}",
                "extracted_value": None
            }
    
    def _fallback_evaluation(self, criteria: TrialCriteria, response: str) -> Dict:
        """Simple rule-based fallback evaluation"""
        response_lower = response.lower().strip()
        
        # Age criteria
        if "age" in criteria.text.lower():
            age_match = re.search(r'\b(\d{1,3})\b', response)
            if age_match:
                age = int(age_match.group(1))
                meets = 18 <= age <= 75
                return {
                    "meets_criteria": meets,
                    "confidence": 0.8,
                    "reasoning": f"Age {age} extracted from response",
                    "extracted_value": str(age)
                }
        
        # Yes/No questions
        if "no" in criteria.expected_response.lower():
            has_no = any(word in response_lower for word in ["no", "never", "not", "none"])
            return {
                "meets_criteria": has_no,
                "confidence": 0.7,
                "reasoning": "Looking for negative response",
                "extracted_value": response_lower
            }
        
        # Default conservative evaluation
        return {
            "meets_criteria": False,
            "confidence": 0.3,
            "reasoning": "Could not definitively evaluate response",
            "extracted_value": response
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
                priority = "🔴" if result["priority"] == "high" else "🟡"
                
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