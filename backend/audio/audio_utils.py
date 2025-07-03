import base64
import logging

logger = logging.getLogger(__name__)

class AudioUtils:
    """Utility functions for audio format handling and validation"""
    
    @staticmethod
    def validate_audio_format(audio_data: str) -> bool:
        """
        Validate that audio data is in correct format
        
        Args:
            audio_data: Base64 encoded audio data
            
        Returns:
            bool: True if valid, False otherwise
        """
        try:
            if not audio_data or len(audio_data) == 0:
                return False
                
            audio_bytes = base64.b64decode(audio_data)
            
            # Check if audio data is reasonable size
            if len(audio_bytes) < 1000:  # At least 1KB
                return False
                
            # Check if audio data is not too large (10MB limit)
            if len(audio_bytes) > 10 * 1024 * 1024:
                return False
                
            # Basic WebM/Opus header check
            if audio_bytes[:4] == b'\x1a\x45\xdf\xa3':  # WebM header
                return True
            elif audio_bytes[:4] == b'OggS':  # Ogg header (Opus can be in Ogg container)
                return True
            else:
                return True  # Allow other formats, let Google STT handle validation
                
        except Exception as e:
            logger.error(f"Audio format validation error: {e}")
            return False
    
    @staticmethod
    def base64_to_bytes(audio_data: str) -> bytes:
        """
        Convert base64 audio data to bytes
        
        Args:
            audio_data: Base64 encoded audio data
            
        Returns:
            bytes: Decoded audio bytes
        """
        try:
            return base64.b64decode(audio_data)
        except Exception as e:
            logger.error(f"Base64 decode error: {e}")
            raise
    
    @staticmethod
    def bytes_to_base64(audio_bytes: bytes) -> str:
        """
        Convert audio bytes to base64 string
        
        Args:
            audio_bytes: Raw audio bytes
            
        Returns:
            str: Base64 encoded audio data
        """
        return base64.b64encode(audio_bytes).decode('utf-8')
    
    @staticmethod
    def check_audio_duration(audio_bytes: bytes) -> tuple[bool, str]:
        """
        Check if audio duration is acceptable
        
        Args:
            audio_bytes: Raw audio bytes
            
        Returns:
            tuple: (is_valid, error_message)
        """
        # Check audio duration - reject very short clips
        if len(audio_bytes) < 1000:  # Less than ~0.1 seconds of audio
            return False, "Audio too short."
        
        # Check if audio is too long (increased limit for better user experience)
        if len(audio_bytes) > 10 * 1024 * 1024:  # 10MB limit
            return False, "Audio too long."
        
        return True, ""
    
    @staticmethod
    def create_blob_from_base64(base64_data: str, mime_type: str) -> bytes:
        """
        Create audio blob from base64 data
        
        Args:
            base64_data: Base64 encoded audio
            mime_type: MIME type of the audio
            
        Returns:
            bytes: Audio blob data
        """
        byte_characters = base64.b64decode(base64_data)
        return byte_characters 