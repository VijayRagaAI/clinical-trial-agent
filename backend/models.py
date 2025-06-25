import json
import uuid
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass
from pathlib import Path
import os

@dataclass
class ParticipantSession:
    session_id: str
    participant_id: str
    responses: Dict = None
    
    def __post_init__(self):
        if self.responses is None:
            self.responses = {}

@dataclass
class TrialCriteria:
    id: str
    text: str
    question: str
    expected_response: str
    priority: str
    response: str = ""

class JsonDataManager:
    def __init__(self, data_dir: str = "data"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        
        # Only need eligibility results file
        self.eligibility_file = self.data_dir / "eligibility_results.json"
        
        # Initialize file if it doesn't exist
        self._init_files()
    
    def _init_files(self):
        """Initialize JSON files if they don't exist"""
        if not self.eligibility_file.exists():
            self._save_json(self.eligibility_file, {})
    
    def _load_json(self, file_path: Path) -> dict:
        """Load data from JSON file"""
        try:
            with open(file_path, 'r') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return {}
    
    def _save_json(self, file_path: Path, data: dict):
        """Save data to JSON file"""
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2, default=str)
    
    def save_eligibility_result(self, participant_id: str, responses: dict, result: dict):
        """Save eligibility result with responses"""
        results = self._load_json(self.eligibility_file)
        results[participant_id] = {
            "responses": responses,
            "eligibility": result,
            "created_at": datetime.now().isoformat()
        }
        self._save_json(self.eligibility_file, results)
    
    def get_eligibility_statistics(self) -> dict:
        """Get eligibility statistics"""
        results = self._load_json(self.eligibility_file)
        
        if not results:
            return {"total": 0, "eligible": 0, "not_eligible": 0, "average_score": 0.0}
        
        total = len(results)
        eligible = sum(1 for r in results.values() if r.get("eligibility", {}).get("eligible", False))
        not_eligible = total - eligible
        
        scores = [r.get("eligibility", {}).get("score", 0) for r in results.values()]
        average_score = sum(scores) / len(scores) if scores else 0
        
        return {
            "total": total,
            "eligible": eligible,
            "not_eligible": not_eligible,
            "eligibility_rate": (eligible / total * 100) if total > 0 else 0,
            "average_score": round(average_score, 1)
        }

# Simple session manager - just creates sessions, no tracking
def create_session() -> ParticipantSession:
    """Create a new participant session"""
    session_id = str(uuid.uuid4())
    participant_id = f"P-{uuid.uuid4().hex[:8].upper()}"
    
    return ParticipantSession(
        session_id=session_id,
        participant_id=participant_id
    )

def save_eligibility_result(participant_id: str, responses: dict, result: dict):
    """Save eligibility result to JSON"""
    data_manager = JsonDataManager()
    data_manager.save_eligibility_result(participant_id, responses, result)

def load_trial_criteria() -> List[TrialCriteria]:
    """Load trial criteria from eligibility.json"""
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        with open(os.path.join(current_dir, "eligibility.json"), "r") as f:
            data = json.load(f)
        
        criteria = []
        for criterion in data.get("criteria", []):
            criteria.append(TrialCriteria(
                id=criterion["id"],
                text=criterion["text"],
                question=criterion["question"],
                expected_response=criterion["expected_response"],
                priority=criterion["priority"]
            ))
        
        return criteria
    except Exception as e:
        print(f"Error loading trial criteria: {e}")
        return [] 