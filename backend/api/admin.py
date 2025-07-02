"""
Admin API Endpoints
"""

import logging
import json
import os
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, HTTPException, Request

logger = logging.getLogger(__name__)
router = APIRouter()

@router.delete("/admin/studies/{study_id}")
async def delete_study(study_id: str):
    """Delete a study by study ID"""
    try:
        
        # Use current file directory to find data directory
        current_dir = Path(__file__).parent.parent
        studies_file = current_dir / "data" / "study_eligibility_data.json"
        
        if not studies_file.exists():
            raise HTTPException(status_code=404, detail="Studies file not found")
        
        # Load existing studies
        with open(studies_file, 'r', encoding='utf-8') as f:
            studies_data = json.load(f)
        
        # Find and remove the study
        original_count = len(studies_data.get('studies', []))
        studies_data['studies'] = [
            study for study in studies_data.get('studies', []) 
            if study.get('id') != study_id
        ]
        
        if len(studies_data['studies']) == original_count:
            raise HTTPException(status_code=404, detail=f"Study with ID {study_id} not found")
        
        # Update metadata
        studies_data['meta']['total_studies'] = len(studies_data['studies'])
        studies_data['meta']['generated_utc'] = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
        
        # Save back to file
        with open(studies_file, 'w', encoding='utf-8') as f:
            json.dump(studies_data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Successfully deleted study: {study_id}")
        
        return {
            "status": "success",
            "message": f"Study {study_id} has been deleted successfully",
            "remaining_studies": len(studies_data['studies'])
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting study {study_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete study")

@router.delete("/admin/interviews/{participant_id}")
async def delete_interview(participant_id: str):
    """Delete an interview by participant ID"""
    try:
        
        # Use current file directory to find data directory
        current_dir = Path(__file__).parent.parent
        data_dir = current_dir / "data"
        
        conversations_file = data_dir / "conversations.json"
        evaluations_file = data_dir / "evaluations.json"
        
        deleted_conversation = False
        deleted_evaluation = False
        
        # Delete from conversations.json
        if conversations_file.exists():
            with open(conversations_file, 'r', encoding='utf-8') as f:
                conversations_data = json.load(f)
            
            if participant_id in conversations_data:
                del conversations_data[participant_id]
                deleted_conversation = True
                
                # Write back to file
                with open(conversations_file, 'w', encoding='utf-8') as f:
                    json.dump(conversations_data, f, indent=2, ensure_ascii=False)
                
                logger.info(f"Deleted conversation data for participant {participant_id}")
        
        # Delete from evaluations.json
        if evaluations_file.exists():
            with open(evaluations_file, 'r', encoding='utf-8') as f:
                evaluations_data = json.load(f)
            
            if participant_id in evaluations_data:
                del evaluations_data[participant_id]
                deleted_evaluation = True
                
                # Write back to file
                with open(evaluations_file, 'w', encoding='utf-8') as f:
                    json.dump(evaluations_data, f, indent=2, ensure_ascii=False)
                
                logger.info(f"Deleted evaluation data for participant {participant_id}")
        
        if not deleted_conversation and not deleted_evaluation:
            raise HTTPException(status_code=404, detail=f"Interview data for participant {participant_id} not found")
        
        return {
            "status": "success",
            "message": f"Interview data for participant {participant_id} has been deleted",
            "deleted_conversation": deleted_conversation,
            "deleted_evaluation": deleted_evaluation
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting interview for participant {participant_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete interview data")

@router.get("/admin/interviews")
async def get_all_interviews():
    """Get list of all interviews for admin dashboard"""
    try:
        from models import get_saved_conversation, get_saved_evaluation
        
        interviews = []
        # Use current file directory to find data directory
        current_dir = Path(__file__).parent.parent
        data_dir = current_dir / "data"
        
        # Get all conversation files
        conversations_file = data_dir / "conversations.json"
        evaluations_file = data_dir / "evaluations.json"
        
        conversations_data = {}
        evaluations_data = {}
        
        # Load conversations
        if conversations_file.exists():
            try:
                with open(conversations_file, 'r') as f:
                    conversations_data = json.load(f)
                logger.info(f"Loaded {len(conversations_data)} conversation entries from {conversations_file}")
            except Exception as e:
                logger.error(f"Error loading conversations: {e}")
        else:
            logger.warning(f"Conversations file not found: {conversations_file}")
        
        # Load evaluations  
        if evaluations_file.exists():
            try:
                with open(evaluations_file, 'r') as f:
                    evaluations_data = json.load(f)
                logger.info(f"Loaded {len(evaluations_data)} evaluation entries from {evaluations_file}")
            except Exception as e:
                logger.error(f"Error loading evaluations: {e}")
        else:
            logger.warning(f"Evaluations file not found: {evaluations_file}")
        
        # Process conversations into interview list
        for key, conversation_entry in conversations_data.items():
            try:
                conv_data = conversation_entry.get("data", {})
                metadata = conv_data.get("metadata", {})
                
                participant_id = metadata.get("participant_id", "Unknown")
                session_id = metadata.get("session_id", "")
                study_id = metadata.get("study_id", "Unknown Study")
                
                # Check if there's a corresponding evaluation
                evaluation = None
                eligibility_result = None
                status = "Abandoned"  # Default
                
                # Look for evaluation data
                for eval_key, eval_entry in evaluations_data.items():
                    eval_data = eval_entry.get("data", {})
                    if (eval_data.get("session_id") == session_id or 
                        eval_data.get("participant_id") == participant_id):
                        evaluation = eval_data
                        eligibility_result = evaluation.get("eligibility_result", {})
                        status = "Completed"
                        break
                
                # Determine interview status
                conversation_state = metadata.get("conversation_state", "unknown")
                exit_reason = metadata.get("exit_reason")
                saved_incomplete = metadata.get("saved_incomplete", False)
                interview_status = metadata.get("interview_status")
                
                if conversation_state == "completed" and evaluation:
                    status = "Completed"
                elif saved_incomplete and interview_status:
                    # Use the saved status for incomplete interviews
                    status = interview_status
                elif metadata.get("total_messages", 0) > 2:  # Has some conversation
                    status = "In Progress" if conversation_state != "completed" else "Abandoned"
                
                interview = {
                    "id": session_id or f"conv_{len(interviews)}",
                    "participant_name": participant_id,  # Using participant_id as name for now
                    "participant_id": participant_id,
                    "session_id": session_id,
                    "study_id": study_id,
                    "study_name": study_id.replace("_", " ").title(),
                    "date": metadata.get("export_timestamp", ""),
                    "status": status,
                    "total_messages": metadata.get("total_messages", 0),
                    "eligibility_result": {
                        "eligible": eligibility_result.get("eligible", False) if eligibility_result else None,
                        "score": eligibility_result.get("score", 0) if eligibility_result else None
                    } if eligibility_result else None
                }
                
                interviews.append(interview)
                
            except Exception as e:
                logger.error(f"Error processing conversation entry: {e}")
                continue
        
        # Sort by date (newest first)
        interviews.sort(key=lambda x: x.get("date", ""), reverse=True)
        
        completed_count = len([i for i in interviews if i["status"] == "Completed"])
        in_progress_count = len([i for i in interviews if i["status"] == "In Progress"])
        abandoned_count = len([i for i in interviews if i["status"] == "Abandoned"])
        paused_count = len([i for i in interviews if i["status"] == "Paused"])
        interrupted_count = len([i for i in interviews if i["status"] == "Interrupted"])
        incomplete_count = len([i for i in interviews if i["status"] == "Incomplete"])
        
        return {
            "interviews": interviews,
            "total_count": len(interviews),
            "completed_count": completed_count,
            "in_progress_count": in_progress_count,
            "abandoned_count": abandoned_count,
            "paused_count": paused_count,
            "interrupted_count": interrupted_count,
            "incomplete_count": incomplete_count
        }
        
    except Exception as e:
        logger.error(f"Error getting all interviews: {e}")
        raise HTTPException(status_code=500, detail="Failed to get interviews")

@router.get("/download/interview/{participant_id}")
async def download_interview_data(participant_id: str):
    """Download complete interview data (conversation + evaluation) as JSON"""
    try:
        from models import get_saved_conversation, get_saved_evaluation
        
        # Use current file directory to find data directory
        current_dir = Path(__file__).parent.parent
        data_dir = current_dir / "data"
        
        conversations_file = data_dir / "conversations.json"
        evaluations_file = data_dir / "evaluations.json"
        
        conversation_data = None
        evaluation_data = None
        
        # Load conversation data
        if conversations_file.exists():
            with open(conversations_file, 'r', encoding='utf-8') as f:
                conversations = json.load(f)
                conversation_entry = conversations.get(participant_id)
                if conversation_entry:
                    conversation_data = conversation_entry.get("data")
        
        # Load evaluation data
        if evaluations_file.exists():
            with open(evaluations_file, 'r', encoding='utf-8') as f:
                evaluations = json.load(f)
                evaluation_entry = evaluations.get(participant_id)
                if evaluation_entry:
                    evaluation_data = evaluation_entry.get("data")
        
        if not conversation_data and not evaluation_data:
            raise HTTPException(status_code=404, detail=f"No interview data found for participant {participant_id}")
        
        # Extract metadata for participant info
        metadata = conversation_data.get("metadata", {}) if conversation_data else {}
        evaluation_result = evaluation_data.get("eligibility_result", {}) if evaluation_data else {}
        
        # Determine interview status
        conversation_state = metadata.get("conversation_state", "unknown")
        saved_incomplete = metadata.get("saved_incomplete", False)
        status = metadata.get("interview_status", "Unknown")
        
        if conversation_state == "completed" and evaluation_data:
            status = "Completed"
        elif saved_incomplete and metadata.get("interview_status"):
            status = metadata.get("interview_status")
        elif metadata.get("total_messages", 0) > 2:
            status = "In Progress" if conversation_state != "completed" else "Abandoned"
        
        # Build comprehensive download structure
        download_data = {
            "participant_interview_info": {
                "participant_id": participant_id,
                "session_id": metadata.get("session_id", ""),
                "study_name": metadata.get("study_id", "").replace("_", " ").title() if metadata.get("study_id") else "",
                "status": status,
                "interview_status": metadata.get("interview_status", status),
                "Eligibility": {
                    "eligible": evaluation_result.get("eligible", None),
                    "score": evaluation_result.get("score", None),
                    "summary": evaluation_result.get("summary", "No evaluation available")
                } if evaluation_result else None,
                "date_and_time": metadata.get("export_timestamp", ""),
                "download_timestamp": datetime.now().isoformat()
            },
            "conversation": conversation_data if conversation_data else None,
            "evaluation": evaluation_data if evaluation_data else None
        }
        
        return download_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving interview data for download: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve interview data")

@router.get("/download/conversation/{session_id}/{participant_id}")
async def download_conversation_data(session_id: str, participant_id: str):
    """Get saved conversation data for download"""
    try:
        from models import get_saved_conversation
        conversation_data = get_saved_conversation(session_id, participant_id)
        if not conversation_data:
            raise HTTPException(status_code=404, detail="Conversation data not found")
        
        return conversation_data["data"]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving conversation data: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve conversation data")

@router.get("/download/evaluation/{session_id}/{participant_id}")
async def download_evaluation_data(session_id: str, participant_id: str):
    """Get saved evaluation data for download"""
    try:
        from models import get_saved_evaluation
        evaluation_data = get_saved_evaluation(session_id, participant_id)
        if not evaluation_data:
            raise HTTPException(status_code=404, detail="Evaluation data not found")
        
        return evaluation_data["data"]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving evaluation data: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve evaluation data") 