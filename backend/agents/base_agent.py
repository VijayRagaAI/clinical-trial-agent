import logging
from abc import ABC, abstractmethod
from typing import Dict, Optional
from models import ParticipantSession

logger = logging.getLogger(__name__)

class BaseAgent(ABC):
    """Abstract base class for all conversation agents"""
    
    def __init__(self, session: ParticipantSession, study_id: str, trial_criteria: list, trial_info: dict):
        self.session = session
        self.study_id = study_id
        self.trial_criteria = trial_criteria
        self.trial_info = trial_info
        self.logger = logging.getLogger(self.__class__.__name__)
    
    @abstractmethod
    async def can_handle(self, conversation_state: str, user_input: str) -> bool:
        """
        Determine if this agent can handle the current conversation state and user input.
        
        Args:
            conversation_state: Current conversation state (e.g., "waiting_consent", "asking_questions")
            user_input: User's message/input
            
        Returns:
            bool: True if this agent can handle the current situation
        """
        pass
    
    @abstractmethod
    async def process_input(self, user_input: str) -> Dict:
        """
        Process the user input and return a response.
        
        Args:
            user_input: User's message/input
            
        Returns:
            Dict: Response dict with keys like "content", "requires_response", "is_final", etc.
        """
        pass
    
    @abstractmethod
    async def get_initial_message(self) -> Optional[Dict]:
        """
        Get the initial message for this agent when it first takes control.
        
        Returns:
            Optional[Dict]: Initial message dict or None if no initial message needed
        """
        pass
    
    def get_supported_states(self) -> list:
        """
        Get list of conversation states this agent supports.
        Override this in subclasses to specify supported states.
        
        Returns:
            list: List of supported conversation state strings
        """
        return []
    
    def _create_response(self, content: str, requires_response: bool = True, 
                        is_final: bool = False, **kwargs) -> Dict:
        """
        Helper method to create standardized response dictionaries.
        
        Args:
            content: Response message content
            requires_response: Whether the response requires user input
            is_final: Whether this is the final message
            **kwargs: Additional response fields
            
        Returns:
            Dict: Standardized response dictionary
        """
        response = {
            "content": content,
            "requires_response": requires_response,
            "is_final": is_final,
            "total_questions": len(self.trial_criteria)
        }
        
        # Add any additional fields
        response.update(kwargs)
        
        return response 