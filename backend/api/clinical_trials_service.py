import requests
import asyncio
from typing import Dict, List, Optional
import json
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

class ClinicalTrialsAPI:
    """Service for interacting with ClinicalTrials.gov API"""
    
    def __init__(self):
        # Modern ClinicalTrials.gov API base URL
        self.base_url = "https://clinicaltrials.gov/api"
        # Fallback to classic API URL if modern doesn't work
        self.classic_url = "https://ClinicalTrials.gov/api/query"
        
    async def search_studies(self, query: str, max_results: int = 20) -> Dict:
        """
        Search for clinical trials using ClinicalTrials.gov API
        
        Args:
            query: Search term (e.g., "diabetes", "cancer")
            max_results: Maximum number of results to return
            
        Returns:
            Dict containing search results
        """
        try:
            # Use modern API
            return await self._search_modern_api(query, max_results)
            
        except Exception as e:
            logger.error(f"Error searching clinical trials: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to search clinical trials: {str(e)}")
    
    async def _search_modern_api(self, query: str, max_results: int) -> Dict:
        """Use the modern API v2 endpoint"""
        try:
            # Modern API endpoint
            url = f"{self.base_url}/v2/studies"
            params = {
                "query.cond": query,
                "pageSize": min(max_results, 100),  # API limits to 1000 but we'll be conservative
                "format": "json"
            }
            
            logger.info(f"Making modern API request to: {url}")
            logger.info(f"Request params: {params}")
            
            response = requests.get(url, params=params, timeout=15)
            logger.info(f"API response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"Modern API response keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
                
                if isinstance(data, dict) and 'studies' in data:
                    studies = data.get('studies', [])
                    logger.info(f"Found {len(studies)} studies in modern API response")
                    
                    # Transform modern API response to our standardized format
                    return self._transform_modern_response(data)
                else:
                    logger.warning(f"Unexpected modern API response structure")
                    raise HTTPException(status_code=500, detail="Unexpected API response format")
            else:
                logger.error(f"Modern API failed with status {response.status_code}: {response.text[:500]}")
                raise HTTPException(status_code=503, detail="ClinicalTrials.gov API is currently unavailable")
                
        except requests.RequestException as e:
            logger.error(f"Modern API request failed: {e}")
            raise HTTPException(status_code=503, detail="ClinicalTrials.gov API is currently unavailable")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Modern API unexpected error: {e}")
            raise HTTPException(status_code=500, detail="Failed to process search results")

    def _transform_modern_response(self, data: Dict) -> Dict:
        """Transform modern API v2 response to standardized format"""
        try:
            studies = data.get('studies', [])
            
            logger.info(f"Transforming {len(studies)} studies from modern API response")
            
            transformed_studies = []
            
            for i, study_data in enumerate(studies):
                try:
                    protocol_section = study_data.get('protocolSection', {})
                    
                    # Extract basic information from camelCase structure
                    identification = protocol_section.get('identificationModule', {})
                    status = protocol_section.get('statusModule', {})
                    design = protocol_section.get('designModule', {})
                    conditions = protocol_section.get('conditionsModule', {})
                    description = protocol_section.get('descriptionModule', {})
                    eligibility = protocol_section.get('eligibilityModule', {})
                    
                    # Debug logging for first study
                    if i == 0:
                        logger.info(f"Sample modern study structure - nctId: {identification.get('nctId')}")
                        logger.info(f"Sample modern study structure - briefTitle: {identification.get('briefTitle')}")
                        logger.info(f"Sample identification keys: {list(identification.keys())}")
                    
                    # Get title with fallbacks
                    title = identification.get('briefTitle', '') or identification.get('officialTitle', '') or 'Untitled Study'
                    nct_id = identification.get('nctId', f'Unknown-{i}')
                    
                    # Handle phase extraction
                    phase = 'N/A'
                    phase_list = design.get('phases', [])
                    if isinstance(phase_list, list) and phase_list:
                        phase = phase_list[0]
                    
                    # Handle conditions
                    study_conditions = []
                    condition_list = conditions.get('conditions', [])
                    if isinstance(condition_list, list):
                        study_conditions = condition_list
                    
                    # Get description
                    brief_summary = description.get('briefSummary', '') or description.get('detailedDescription', '') or ''
                    
                    # Get status
                    overall_status = status.get('overallStatus', 'Unknown')
                    
                    # Get study type
                    study_type = design.get('studyType', 'Unknown')
                    
                    # Get enrollment
                    enrollment_info = design.get('enrollmentInfo', {})
                    enrollment = enrollment_info.get('count', 0) if isinstance(enrollment_info, dict) else 0
                    
                    # Get dates
                    start_date_struct = status.get('startDateStruct', {})
                    start_date = start_date_struct.get('date', '') if isinstance(start_date_struct, dict) else ''
                    
                    completion_date_struct = status.get('primaryCompletionDateStruct', {})
                    primary_completion_date = completion_date_struct.get('date', '') if isinstance(completion_date_struct, dict) else ''
                    
                    last_update_struct = status.get('lastUpdatePostDateStruct', {})
                    last_update = last_update_struct.get('date', '') if isinstance(last_update_struct, dict) else ''
                    
                    study_first_struct = status.get('studyFirstPostDateStruct', {})
                    study_first_posted = study_first_struct.get('date', '') if isinstance(study_first_struct, dict) else ''
                    
                    # Build standardized study object
                    transformed_study = {
                        "nct_id": nct_id,
                        "title": title,
                        "official_title": identification.get('officialTitle', ''),
                        "status": overall_status,
                        "phase": phase,
                        "conditions": study_conditions,
                        "brief_summary": brief_summary,
                        "detailed_description": description.get('detailedDescription', ''),
                        "study_type": study_type,
                        "enrollment": enrollment,
                        "start_date": start_date,
                        "primary_completion_date": primary_completion_date,
                        "last_update": last_update,
                        "study_first_posted": study_first_posted,
                        "min_age": eligibility.get('minimumAge', ''),
                        "max_age": eligibility.get('maximumAge', ''),
                        "gender": eligibility.get('sex', ''),
                        "healthy_volunteers": eligibility.get('healthyVolunteers', ''),
                        "eligibility_criteria": eligibility.get('eligibilityCriteria', '')
                    }
                    
                    transformed_studies.append(transformed_study)
                    
                except Exception as study_error:
                    logger.warning(f"Error processing modern API study {i}: {study_error}")
                    # Continue with next study instead of failing completely
                    continue
            
            logger.info(f"Successfully transformed {len(transformed_studies)} studies from modern API")
            
            # For modern API, we don't have a total count in the response, so use the number of returned studies
            return {
                "total_count": len(transformed_studies),
                "studies": transformed_studies,
                "source": "ClinicalTrials.gov v2"
            }
            
        except Exception as e:
            logger.error(f"Error transforming modern API response: {e}")
            return {
                "total_count": 0,
                "studies": [],
                "source": "ClinicalTrials.gov v2",
                "error": str(e)
            }
    
    async def _search_classic_api(self, query: str, max_results: int) -> Dict:
        """Use the classic API format that we know works"""
        try:
            url = f"{self.classic_url}/full_studies"
            
            # Format search expression for multiple fields
            search_expr = f"AREA[Condition]{query} OR AREA[OfficialTitle]{query} OR AREA[BriefTitle]{query}"
            
            params = {
                "expr": search_expr,
                "min_rnk": 1,
                "max_rnk": min(max_results, 100),  # API limits to 100 per request
                "fmt": "JSON"
            }
            
            logger.info(f"Making API request to: {url}")
            logger.info(f"Search expression: {search_expr}")
            logger.info(f"Request params: {params}")
            
            response = requests.get(url, params=params, timeout=15)
            logger.info(f"API response status: {response.status_code}")
            
            response.raise_for_status()
            
            data = response.json()
            logger.info(f"Raw API response keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
            
            # Log sample of response structure for debugging
            if isinstance(data, dict):
                full_studies_response = data.get('FullStudiesResponse', {})
                studies_found = full_studies_response.get('NStudiesFound', 0)
                studies_returned = len(full_studies_response.get('FullStudies', []))
                logger.info(f"Studies found: {studies_found}, Studies returned: {studies_returned}")
                
                if studies_returned > 0:
                    # Log first study structure
                    first_study = full_studies_response.get('FullStudies', [])[0]
                    logger.info(f"First study keys: {list(first_study.keys()) if isinstance(first_study, dict) else 'Not a dict'}")
            
            # Transform to standardized format
            return self._transform_classic_response(data)
            
        except requests.RequestException as e:
            logger.error(f"API request failed: {e}")
            raise HTTPException(status_code=503, detail="ClinicalTrials.gov API is currently unavailable")
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            raise HTTPException(status_code=500, detail="Failed to process search results")
    
    def _transform_classic_response(self, data: Dict) -> Dict:
        """Transform classic API response to standardized format"""
        try:
            full_studies = data.get('FullStudiesResponse', {})
            studies = full_studies.get('FullStudies', [])
            
            logger.info(f"Transforming {len(studies)} studies from API response")
            
            transformed_studies = []
            
            for i, study_data in enumerate(studies):
                try:
                    study = study_data.get('Study', {})
                    protocol_section = study.get('ProtocolSection', {})
                    
                    # Extract basic information
                    identification = protocol_section.get('IdentificationModule', {})
                    status = protocol_section.get('StatusModule', {})
                    design = protocol_section.get('DesignModule', {})
                    conditions = protocol_section.get('ConditionsModule', {})
                    description = protocol_section.get('DescriptionModule', {})
                    eligibility = protocol_section.get('EligibilityModule', {})
                    
                    # Debug logging for first study
                    if i == 0:
                        logger.info(f"Sample study structure - NCTId: {identification.get('NCTId')}")
                        logger.info(f"Sample study structure - BriefTitle: {identification.get('BriefTitle')}")
                        logger.info(f"Sample study structure - OfficialTitle: {identification.get('OfficialTitle')}")
                        logger.info(f"Sample identification keys: {list(identification.keys())}")
                    
                    # Get title with fallbacks
                    title = identification.get('BriefTitle', '') or identification.get('OfficialTitle', '') or 'Untitled Study'
                    nct_id = identification.get('NCTId', f'Unknown-{i}')
                    
                    # Handle phase extraction more carefully
                    phase = 'N/A'
                    phase_list = design.get('PhaseList', {})
                    if isinstance(phase_list, dict) and 'Phase' in phase_list:
                        phases = phase_list['Phase']
                        if isinstance(phases, list) and phases:
                            phase = phases[0]
                        elif isinstance(phases, str):
                            phase = phases
                    
                    # Handle conditions more carefully
                    study_conditions = []
                    condition_list = conditions.get('ConditionList', {})
                    if isinstance(condition_list, dict) and 'Condition' in condition_list:
                        conds = condition_list['Condition']
                        if isinstance(conds, list):
                            study_conditions = conds
                        elif isinstance(conds, str):
                            study_conditions = [conds]
                    
                    # Get description with fallbacks
                    brief_summary = description.get('BriefSummary', '') or description.get('DetailedDescription', '') or ''
                    
                    # Build standardized study object
                    transformed_study = {
                        "nct_id": nct_id,
                        "title": title,
                        "official_title": identification.get('OfficialTitle', ''),
                        "status": status.get('OverallStatus', 'Unknown'),
                        "phase": phase,
                        "conditions": study_conditions,
                        "brief_summary": brief_summary,
                        "detailed_description": description.get('DetailedDescription', ''),
                        "study_type": design.get('StudyType', 'Unknown'),
                        "enrollment": design.get('EnrollmentInfo', {}).get('EnrollmentCount', 0),
                        "start_date": status.get('StartDateStruct', {}).get('StartDate', ''),
                        "primary_completion_date": status.get('PrimaryCompletionDateStruct', {}).get('PrimaryCompletionDate', ''),
                        "last_update": status.get('LastUpdatePostDateStruct', {}).get('LastUpdatePostDate', ''),
                        "study_first_posted": status.get('StudyFirstPostDateStruct', {}).get('StudyFirstPostDate', ''),
                        "min_age": eligibility.get('MinimumAge', ''),
                        "max_age": eligibility.get('MaximumAge', ''),
                        "gender": eligibility.get('Gender', ''),
                        "healthy_volunteers": eligibility.get('HealthyVolunteers', ''),
                        "eligibility_criteria": eligibility.get('EligibilityCriteria', '')
                    }
                    
                    transformed_studies.append(transformed_study)
                    
                except Exception as study_error:
                    logger.warning(f"Error processing study {i}: {study_error}")
                    # Continue with next study instead of failing completely
                    continue
            
            logger.info(f"Successfully transformed {len(transformed_studies)} studies")
            
            return {
                "total_count": full_studies.get('NStudiesFound', len(transformed_studies)),
                "studies": transformed_studies,
                "source": "ClinicalTrials.gov"
            }
            
        except Exception as e:
            logger.error(f"Error transforming response: {e}")
            # Log the raw data structure for debugging
            logger.error(f"Raw data keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
            return {
                "total_count": 0,
                "studies": [],
                "source": "ClinicalTrials.gov",
                "error": str(e)
            }
    
    async def get_study_details(self, nct_id: str) -> Dict:
        """
        Get detailed information for a specific study
        
        Args:
            nct_id: NCT identifier (e.g., "NCT04320615")
            
        Returns:
            Dict containing detailed study information
        """
        try:
            url = f"{self.base_url}/v2/studies"
            params = {
                "query.id": nct_id,
                "pageSize": 1,
                "format": "json"
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            transformed = self._transform_modern_response(data)
            
            if transformed['studies']:
                return transformed['studies'][0]
            else:
                raise HTTPException(status_code=404, detail=f"Study {nct_id} not found")
                
        except requests.RequestException as e:
            logger.error(f"Failed to fetch study {nct_id}: {e}")
            raise HTTPException(status_code=503, detail="ClinicalTrials.gov API is currently unavailable")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Unexpected error fetching study {nct_id}: {e}")
            raise HTTPException(status_code=500, detail="Failed to fetch study details")

# Initialize the service
clinical_trials_service = ClinicalTrialsAPI() 