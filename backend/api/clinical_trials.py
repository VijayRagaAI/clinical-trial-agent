"""
Clinical Trials API Integration Endpoints
"""

import logging
import openai
import json
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, HTTPException, Request

logger = logging.getLogger(__name__)
router = APIRouter()

# Clinical trials service will be set from main server
clinical_trials_service = None

def set_clinical_trials_service(service):
    """Set the clinical trials service from main server"""
    global clinical_trials_service
    clinical_trials_service = service

@router.get("/search")
async def search_clinical_trials(query: str, max_results: int = 20):
    """Search clinical trials from ClinicalTrials.gov"""
    try:
        if not query or len(query.strip()) < 2:
            raise HTTPException(status_code=400, detail="Query must be at least 2 characters long")
        
        # Clamp max_results to reasonable range
        max_results = max(1, min(100, max_results))
        
        logger.info(f"Searching ClinicalTrials.gov for: '{query}' (max_results: {max_results})")
        
        results = await clinical_trials_service.search_studies(query, max_results)
        
        logger.info(f"Found {results.get('total_count', 0)} studies for query: '{query}'")
        
        return results
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching clinical trials: {e}")
        raise HTTPException(status_code=500, detail="Failed to search clinical trials")

@router.get("/study/{nct_id}")
async def get_clinical_trial_details(nct_id: str):
    """Get detailed information for a specific clinical trial"""
    try:
        if not nct_id or not nct_id.startswith('NCT'):
            raise HTTPException(status_code=400, detail="Invalid NCT ID format")
        
        logger.info(f"Fetching details for study: {nct_id}")
        
        study_details = await clinical_trials_service.get_study_details(nct_id)
        
        logger.info(f"Successfully fetched details for study: {nct_id}")
        
        return study_details
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching study details: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch study details")

@router.post("/import")
async def import_clinical_trial(request: Request):
    """Import a clinical trial from ClinicalTrials.gov and convert to local format"""
    try:
        data = await request.json()
        logger.info(f"Import request data keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
        
        external_study = data.get('study')
        logger.info(f"External study data: {external_study}")
        
        if not external_study:
            logger.error("No study data provided")
            raise HTTPException(status_code=400, detail="No study data provided")
        
        if not external_study.get('nct_id'):
            logger.error(f"No NCT ID in study data. Available keys: {list(external_study.keys()) if isinstance(external_study, dict) else 'Not a dict'}")
            raise HTTPException(status_code=400, detail="Study data missing NCT ID")
        
        logger.info(f"Importing study: {external_study.get('nct_id')}")
        
        # Convert external study to local format
        converted_study = await convert_external_study_to_local(external_study)
        
        # Save to local studies file
        success = await save_imported_study(converted_study)
        
        if success:
            logger.info(f"Successfully imported study: {converted_study['id']}")
            return {
                "success": True,
                "message": f"Successfully imported study {external_study.get('nct_id')}",
                "study_id": converted_study['id']
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to save imported study")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error importing clinical trial: {e}")
        raise HTTPException(status_code=500, detail="Failed to import clinical trial")

async def convert_external_study_to_local(external_study: dict) -> dict:
    """Convert ClinicalTrials.gov study format to our local format using AI"""
    import re
    
    logger.info(f"Converting study using AI: {external_study.get('nct_id')}")
    
    # Generate a unique ID from NCT ID
    nct_id = external_study.get('nct_id', 'unknown')
    study_id = nct_id.lower().replace('nct', 'imported-nct-') if nct_id != 'unknown' else f'imported-{datetime.now().strftime("%Y%m%d%H%M%S")}'
    
    # Sample of our target format for the AI
    sample_study = {
        "id": "diabetes-abc123",
        "trial": {
            "nct_id": "NCT00000000",
            "title": "Phase II Randomized Study of ABC-123 in Adults With Type-2 Diabetes",
            "protocol_version": "v0.4-mixed-responses",
            "last_amended": "2025-06-24",
            "category": "Endocrinology",
            "description": "Investigating a novel diabetes medication for blood sugar control",
            "phase": "Phase II",
            "sponsor": "DiabetesCare Research Institute"
        },
        "overview": {
            "purpose": "Test if new diabetes pill controls blood sugar in adults with type-2 diabetes",
            "participant_commitment": "About 7 months and 8 clinic visits.",
            "key_procedures": [
                "Blood tests",
                "Blood-pressure and weight checks", 
                "One ECG",
                "Daily study pill"
            ]
        },
        "contact_info": "Study conducted at DiabetesCare Research Institute, Boston MA. Enrolling 200 participants (currently recruiting). Contact: Dr. Johnson, (617) 555-0123. Study runs Jan 2025 - Aug 2025.",
        "criteria": [
            {
                "id": "INC001",
                "text": "Age 18 – 75 years (inclusive)",
                "question": "How old are you?",
                "expected_response": "18-75 years",
                "response": "",
                "priority": "high"
            },
            {
                "id": "INC002", 
                "text": "Diagnosed with Type-2 diabetes for at least 6 months",
                "question": "How long have you been diagnosed with Type-2 diabetes?",
                "expected_response": "At least 6 months",
                "response": "",
                "priority": "high"
            }
        ]
    }
    
    # Create the AI prompt
    ai_prompt = f"""You are an expert clinical research coordinator. Convert this ClinicalTrials.gov study data into our specific format.

**EXTERNAL STUDY DATA:**
```json
{json.dumps(external_study, indent=2)}
```

**TARGET FORMAT (example):**
```json
{json.dumps(sample_study, indent=2)}
```

**CONVERSION INSTRUCTIONS:**
1. **ID**: Create from NCT ID like "imported-nct-{nct_id.lower().replace('nct', '')}"
2. **Category**: Choose from: Endocrinology, Cardiology, Oncology, Rheumatology, Neurology, General Medicine, etc.
3. **Description**: 1-2 sentence summary of what the study does
4. **Purpose**: Patient-friendly explanation of what the study tests
5. **Participant Commitment**: Estimate time/visits from available data
6. **Key Procedures**: Extract from eligibility criteria and study description (3-6 items)
7. **Contact Info**: Create 1-2 line summary with location, enrollment info, contact details, timeline
8. **Criteria**: Convert eligibility text into interview questions
   - Extract ALL meaningful criteria from eligibility_criteria text
   - Create natural conversation questions using APPROPRIATE QUESTION TYPES
   - Use IDs like "IMP001", "IMP002", etc.

**QUESTION DESIGN APPROACH:**
- Act like a normal doctor having a conversation with a patient
- Ask natural, conversational questions that a healthcare provider would ask
- Questions should cover the full scope of each criterion, not just part of it
- Avoid overly simple yes/no questions when more detail is needed for proper assessment

**PRIORITY ASSIGNMENT RULES (CRITICAL - CREATE MIXTURE):**
- **HIGH priority**: Core medical requirements that absolutely disqualify
  - Age limits, primary diagnosis, serious safety exclusions (pregnancy, active infections)
  - Example: "Age 18-75", "Diagnosed with diabetes", "No active hepatitis"
  
- **MEDIUM priority**: Important but not immediately disqualifying
  - Specific lab values, medication stability, general health status
  - Example: "HbA1c 7.0-10.5%", "Stable medications for 3 months", "BMI 25-40"
  
- **LOW priority**: Nice-to-have or administrative requirements
  - Study commitment, consent willingness, travel ability, previous trial participation
  - Example: "Available for all visits", "Willing to sign consent", "No trials in past 30 days"

**IMPORTANT:**
- MUST create a realistic mixture: ~40% high, ~40% medium, ~20% low priorities
- Extract as many criteria as possible from the eligibility_criteria field
- Questions should be natural and conversational, like a doctor would ask
- Questions should cover the full scope of each criterion when needed
- Avoid overly medical jargon - make it patient-friendly

Return ONLY the JSON object, no markdown or explanation."""

    try:
        # Call OpenAI GPT-4o
        client = openai.OpenAI()
        
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system", 
                    "content": "You are an expert clinical research coordinator who converts clinical trial data into structured interview formats. Always return valid JSON."
                },
                {
                    "role": "user", 
                    "content": ai_prompt
                }
            ],
            temperature=0.3,
            max_tokens=3000
        )
        
        ai_response = response.choices[0].message.content
        logger.info(f"AI response received for study {nct_id}")
        
        # Parse the AI response
        try:
            # Clean up the response (remove any markdown formatting)
            clean_response = ai_response.strip()
            if clean_response.startswith('```json'):
                clean_response = clean_response[7:]
            if clean_response.endswith('```'):
                clean_response = clean_response[:-3]
            clean_response = clean_response.strip()
            
            converted_study = json.loads(clean_response)
            
            # Validate and ensure required fields
            if not converted_study.get('id'):
                converted_study['id'] = study_id
            
            # Ensure all required trial fields are present
            if 'trial' not in converted_study:
                converted_study['trial'] = {}
            
            trial = converted_study['trial']
            trial['protocol_version'] = f"imported-{datetime.now().strftime('%Y%m%d')}"
            trial['last_amended'] = datetime.now().strftime('%Y-%m-%d')
            trial['nct_id'] = nct_id
            
            # Ensure all required fields have defaults
            if 'title' not in trial:
                trial['title'] = external_study.get('title', 'Imported Study')
            if 'category' not in trial:
                trial['category'] = 'General Medicine'
            if 'description' not in trial:
                trial['description'] = 'Imported clinical trial study'
            if 'phase' not in trial:
                trial['phase'] = external_study.get('phase', 'N/A')
            if 'sponsor' not in trial:
                trial['sponsor'] = external_study.get('sponsor', 'Not specified')
            
            # Ensure overview section exists
            if 'overview' not in converted_study:
                converted_study['overview'] = {}
            
            overview = converted_study['overview']
            if 'purpose' not in overview:
                overview['purpose'] = 'Study purpose not specified'
            if 'participant_commitment' not in overview:
                overview['participant_commitment'] = 'Time commitment not specified'
            if 'key_procedures' not in overview:
                overview['key_procedures'] = ['Standard procedures']
            
            logger.info(f"AI conversion successful for study {nct_id}")
            return converted_study
            
        except json.JSONDecodeError as e:
            logger.error(f"AI response was not valid JSON: {e}")
            logger.error(f"AI response: {ai_response[:500]}...")
            raise Exception("AI returned invalid JSON")
            
    except Exception as e:
        logger.error(f"AI conversion failed for study {nct_id}: {e}")
        raise

async def save_imported_study(study: dict) -> bool:
    """Save imported study to local studies file"""
    try:
        
        # Use current file directory to find data directory
        current_dir = Path(__file__).parent.parent
        studies_file = current_dir / "data" / "study_eligibility_data.json"
        
        # Load existing studies
        if studies_file.exists():
            with open(studies_file, 'r', encoding='utf-8') as f:
                studies_data = json.load(f)
        else:
            studies_data = {"studies": [], "meta": {"schema_version": "eligibility-json/2.0-multi-study"}}
        
        # Check if study already exists (by NCT ID)
        existing_study_index = None
        for i, existing_study in enumerate(studies_data['studies']):
            if existing_study.get('trial', {}).get('nct_id') == study['trial']['nct_id']:
                existing_study_index = i
                break
        
        if existing_study_index is not None:
            # Update existing study
            studies_data['studies'][existing_study_index] = study
            logger.info(f"Updated existing study: {study['id']}")
        else:
            # Add new imported study at the top (beginning of the list)
            studies_data['studies'].insert(0, study)
            logger.info(f"Added new study at top: {study['id']}")
        
        # Update metadata
        studies_data['meta']['total_studies'] = len(studies_data['studies'])
        studies_data['meta']['generated_utc'] = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
        
        # Save back to file
        with open(studies_file, 'w', encoding='utf-8') as f:
            json.dump(studies_data, f, indent=2, ensure_ascii=False)
        
        return True
        
    except Exception as e:
        logger.error(f"Error saving imported study: {e}")
        return False 