"""
Shared API models for Clinical Trial Voice Interviewer
"""

from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel

# Session Models
class StartSessionRequest(BaseModel):
    participant_name: Optional[str] = None
    participant_email: Optional[str] = None
    study_id: str

class SessionResponse(BaseModel):
    session_id: str
    participant_id: str
    created_at: str

# Eligibility Models
class EligibilityResponse(BaseModel):
    session_id: str
    eligible: bool
    score: float
    criteria_met: List[Dict]
    summary: str

# Audio Models
class AudioSettingsRequest(BaseModel):
    output_language: Optional[str] = None
    voice: Optional[str] = None
    speed: Optional[float] = None

class VoicePreviewRequest(BaseModel):
    text: str = "Hello, this is a preview of my voice."
    voice: str = "nova"
    language: str = "english"
    speed: float = 1.0

# Study Models
class StudyPreferencesRequest(BaseModel):
    study_id: str

# Theme Models
class ThemePreferencesRequest(BaseModel):
    is_dark_mode: bool

# Clinical Trials Models
class ImportTrialRequest(BaseModel):
    study: Dict 