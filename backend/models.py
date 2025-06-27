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
        
        # Centralized files with participant_id as keys
        self.studies_file = self.data_dir / "study_eligibility_data.json"
        self.conversations_file = self.data_dir / "conversations.json"
        self.evaluations_file = self.data_dir / "evaluations.json"
        
        # Initialize files
        self._init_files()
    
    def _init_files(self):
        """Initialize JSON files if they don't exist"""
        if not self.conversations_file.exists():
            self._save_json(self.conversations_file, {})
        
        if not self.evaluations_file.exists():
            self._save_json(self.evaluations_file, {})
    
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
    
    def save_conversation_data(self, session_id: str, participant_id: str, conversation_data: dict):
        """Save conversation data to centralized conversations.json file"""
        try:
            conversations = self._load_json(self.conversations_file)
            
            # Save with participant_id as key
            conversations[participant_id] = {
                "session_id": session_id,
                "participant_id": participant_id,
                "saved_at": datetime.now().isoformat(),
                "data": conversation_data
            }
            
            self._save_json(self.conversations_file, conversations)
            print(f"Conversation data saved for participant: {participant_id}")
            return str(self.conversations_file)
            
        except Exception as e:
            print(f"Error saving conversation data: {e}")
            return None
    
    def save_evaluation_data(self, session_id: str, participant_id: str, evaluation_data: dict):
        """Save evaluation data to centralized evaluations.json file"""
        try:
            evaluations = self._load_json(self.evaluations_file)
            
            # Save with participant_id as key
            evaluations[participant_id] = {
                "session_id": session_id,
                "participant_id": participant_id,
                "saved_at": datetime.now().isoformat(),
                "data": evaluation_data
            }
            
            self._save_json(self.evaluations_file, evaluations)
            print(f"Evaluation data saved for participant: {participant_id}")
            return str(self.evaluations_file)
            
        except Exception as e:
            print(f"Error saving evaluation data: {e}")
            return None
    
    def get_conversation_data(self, session_id: str, participant_id: str) -> Optional[dict]:
        """Retrieve saved conversation data by participant_id"""
        try:
            conversations = self._load_json(self.conversations_file)
            return conversations.get(participant_id, None)
        except Exception as e:
            print(f"Error loading conversation data: {e}")
            return None
    
    def get_evaluation_data(self, session_id: str, participant_id: str) -> Optional[dict]:
        """Retrieve saved evaluation data by participant_id"""
        try:
            evaluations = self._load_json(self.evaluations_file)
            return evaluations.get(participant_id, None)
        except Exception as e:
            print(f"Error loading evaluation data: {e}")
            return None

# Simple session manager - just creates sessions, no tracking
def create_session() -> ParticipantSession:
    """Create a new participant session"""
    session_id = str(uuid.uuid4())
    participant_id = f"P-{uuid.uuid4().hex[:8].upper()}"
    
    return ParticipantSession(
        session_id=session_id,
        participant_id=participant_id
    )

def save_conversation_data(session_id: str, participant_id: str, conversation_data: dict):
    """Save conversation data to local file"""
    data_manager = JsonDataManager()
    return data_manager.save_conversation_data(session_id, participant_id, conversation_data)

def save_evaluation_data(session_id: str, participant_id: str, evaluation_data: dict):
    """Save evaluation data to local file"""
    data_manager = JsonDataManager()
    return data_manager.save_evaluation_data(session_id, participant_id, evaluation_data)

def get_saved_conversation(session_id: str, participant_id: str) -> Optional[dict]:
    """Get saved conversation data"""
    data_manager = JsonDataManager()
    return data_manager.get_conversation_data(session_id, participant_id)

def get_saved_evaluation(session_id: str, participant_id: str) -> Optional[dict]:
    """Get saved evaluation data"""
    data_manager = JsonDataManager()
    return data_manager.get_evaluation_data(session_id, participant_id)

def load_trial_criteria(study_id: str) -> List[TrialCriteria]:
    """Load trial criteria from study_eligibility_data.json for a specific study"""
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        with open(os.path.join(current_dir, "data", "study_eligibility_data.json"), "r") as f:
            data = json.load(f)
        
        # Find the specific study
        study_data = None
        for study in data.get("studies", []):
            if study["id"] == study_id:
                study_data = study
                break
        
        if not study_data:
            print(f"Study with ID {study_id} not found")
            return []
        
        criteria = []
        for criterion in study_data.get("criteria", []):
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

def get_available_studies() -> List[Dict]:
    """Get list of available clinical studies"""
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        with open(os.path.join(current_dir, "data", "study_eligibility_data.json"), "r") as f:
            data = json.load(f)
        
        studies = []
        for study in data.get("studies", []):
            studies.append({
                "id": study["id"],
                "title": study["trial"]["title"],
                "category": study["trial"]["category"],
                "description": study["trial"]["description"],
                "phase": study["trial"]["phase"],
                "sponsor": study["trial"]["sponsor"],
                "nct_id": study["trial"]["nct_id"],
                "purpose": study["overview"]["purpose"],
                "commitment": study["overview"]["participant_commitment"],
                "procedures": study["overview"]["key_procedures"]
            })
        
        return studies
    except Exception as e:
        print(f"Error loading studies: {e}")
        return []

def get_study_details(study_id: str) -> Optional[Dict]:
    """Get detailed information about a specific study"""
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        with open(os.path.join(current_dir, "data", "study_eligibility_data.json"), "r") as f:
            data = json.load(f)
        
        for study in data.get("studies", []):
            if study["id"] == study_id:
                return study
        
        return None
    except Exception as e:
        print(f"Error loading study details: {e}")
        return None 