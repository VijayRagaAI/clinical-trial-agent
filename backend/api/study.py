"""
Study Management API Endpoints
"""

import os
import logging
from fastapi import APIRouter, HTTPException, Request
from .models import StudyPreferencesRequest, ThemePreferencesRequest

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/studies")
async def get_available_studies():
    """Get list of available clinical studies"""
    try:
        from models import get_available_studies
        studies = get_available_studies()
        return {"studies": studies}
    except Exception as e:
        logger.error(f"Error getting studies: {e}")
        raise HTTPException(status_code=500, detail="Failed to get available studies")

@router.get("/studies/{study_id}")
async def get_study_details(study_id: str):
    """Get detailed information about a specific study"""
    try:
        from models import get_study_details
        study = get_study_details(study_id)
        if not study:
            raise HTTPException(status_code=404, detail="Study not found")
        return study
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting study details: {e}")
        raise HTTPException(status_code=500, detail="Failed to get study details")

@router.get("/trial-info")
async def get_trial_info():
    """Get trial information and criteria for first available study (deprecated - use /api/studies)"""
    try:
        from models import get_available_studies
        studies = get_available_studies()
        if not studies or len(studies) == 0:
            raise HTTPException(status_code=404, detail="No studies available")
        return studies[0]  # Return first available study
    except Exception as e:
        logger.error(f"Error getting trial info: {e}")
        raise HTTPException(status_code=500, detail="Failed to get trial information")

@router.post("/study/preferences")
async def update_study_preferences(request: Request):
    """Update study selection preferences"""
    try:
        data = await request.json()
        study_id = data.get("study_id")
        
        if not study_id:
            raise HTTPException(status_code=400, detail="study_id is required")
        
        # Validate that the study exists
        from models import get_available_studies
        studies = get_available_studies()
        valid_study_ids = [study["id"] for study in studies]
        
        if study_id not in valid_study_ids:
            raise HTTPException(status_code=400, detail=f"Invalid study_id: {study_id}")
        
        # Store preference in environment variable
        os.environ["SELECTED_STUDY_ID"] = study_id
        
        logger.info(f"Study preference updated: study_id={study_id}")
        
        return {
            "status": "success",
            "settings": {
                "study_id": study_id
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating study preferences: {e}")
        raise HTTPException(status_code=500, detail="Failed to update study preferences")

@router.get("/study/preferences")
async def get_study_preferences():
    """Get current study preferences"""
    try:
        selected_study_id = os.getenv("SELECTED_STUDY_ID")
        
        # Get available studies
        from models import get_available_studies
        studies = get_available_studies()
        
        # Find the selected study details if a preference exists
        selected_study = None
        if selected_study_id:
            selected_study = next((study for study in studies if study["id"] == selected_study_id), None)
        
        return {
            "selected_study_id": selected_study_id,
            "selected_study": selected_study,
            "available_studies": studies
        }
        
    except Exception as e:
        logger.error(f"Error getting study preferences: {e}")
        raise HTTPException(status_code=500, detail="Failed to get study preferences")

@router.post("/theme/preferences")
async def update_theme_preferences(request: Request):
    """Update theme preferences"""
    try:
        data = await request.json()
        is_dark_mode = data.get("is_dark_mode", False)
        
        # Validate boolean value
        if not isinstance(is_dark_mode, bool):
            raise HTTPException(status_code=400, detail="is_dark_mode must be a boolean")
        
        # Store preference in environment variable
        os.environ["SELECTED_THEME_DARK"] = str(is_dark_mode).lower()
        
        logger.info(f"Theme preference updated: dark_mode={is_dark_mode}")
        
        return {
            "status": "success",
            "settings": {
                "is_dark_mode": is_dark_mode
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating theme preferences: {e}")
        raise HTTPException(status_code=500, detail="Failed to update theme preferences")

@router.get("/theme/preferences")
async def get_theme_preferences():
    """Get current theme preferences"""
    try:
        selected_theme_dark = os.getenv("SELECTED_THEME_DARK", "false").lower()
        is_dark_mode = selected_theme_dark == "true"
        
        return {
            "is_dark_mode": is_dark_mode
        }
        
    except Exception as e:
        logger.error(f"Error getting theme preferences: {e}")
        raise HTTPException(status_code=500, detail="Failed to get theme preferences") 