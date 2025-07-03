import base64
import logging
import os
from typing import Optional
from .language_manager import LanguageManager
from .audio_utils import AudioUtils

logger = logging.getLogger(__name__)

class STTService:
    """Service for Speech-to-Text conversion using Google Cloud STT"""
    
    def __init__(self, language_manager: LanguageManager):
        self.language_manager = language_manager
        
        # Initialize Google Speech-to-Text credentials
        self.google_credentials = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        if self.google_credentials:
            logger.info("Google Speech-to-Text credentials configured")
        else:
            logger.warning("Google credentials not found")
        
        # Get output language from environment, default to English
        self.output_language = os.getenv("OUTPUT_LANGUAGE", "english").lower()
        
        # Validate language
        self.output_language = self.language_manager.validate_and_normalize_language(self.output_language)
        
        logger.info(f"STT Service initialized with output language: {self.output_language}")
    
    async def speech_to_text(self, audio_data: str, target_language: Optional[str] = None) -> str:
        """
        Convert base64 encoded audio to text using Google STT
        
        Args:
            audio_data: Base64 encoded audio data
            target_language: Optional target language, uses service default if not provided
            
        Returns:
            str: Transcribed text or error message
        """
        # Use provided language or service default
        current_language = target_language or self.output_language
        
        # Validate audio format first
        if not AudioUtils.validate_audio_format(audio_data):
            logger.warning("Invalid audio format provided")
            return "Invalid audio format."
        
        # Check if target language is supported by Google
        if not self.language_manager.is_language_supported(current_language):
            logger.warning(f"Target language {current_language} not supported")
            return "Language not supported."
        
        # Use Google Speech-to-Text
        return await self._google_speech_to_text(audio_data, current_language)

    async def _google_speech_to_text(self, audio_data: str, current_language: str) -> str:
        """Google Speech-to-Text with dynamic primary language based on user selection"""
        if not self.google_credentials:
            raise Exception("Google Speech-to-Text credentials not configured")
            
        try:
            # Decode and validate audio data
            audio_bytes = AudioUtils.base64_to_bytes(audio_data)
            
            # Check audio duration
            is_valid, error_msg = AudioUtils.check_audio_duration(audio_bytes)
            if not is_valid:
                return error_msg
            
            # Google STT setup
            from google.cloud import speech
            client = speech.SpeechClient()
            
            # Get language configuration from language manager
            lang_config = self.language_manager.get_stt_language_config(current_language)
            
            # Try multiple sample rates if first attempt fails
            sample_rates = [48000, 16000, 24000, 44100]  # Common rates, prioritize 48kHz
            
            for sample_rate in sample_rates:
                try:
                    config = speech.RecognitionConfig(
                        encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
                        sample_rate_hertz=sample_rate,
                        language_code=lang_config["primary_language"],
                        alternative_language_codes=lang_config["alternative_languages"],
                        
                        # Optimized for speed + accent recognition
                        use_enhanced=True,  # Better for accented speech
                        enable_automatic_punctuation=False,
                        enable_word_confidence=True,
                        model=lang_config["model"],  # Use language-appropriate model
                        max_alternatives=3,  # Get backup for accents
                        profanity_filter=False,
                    )
                    
                    # Perform recognition
                    audio = speech.RecognitionAudio(content=audio_bytes)
                    response = client.recognize(config=config, audio=audio)
                    
                    # Handle results
                    if not response.results:
                        if sample_rate == sample_rates[-1]:  # Last attempt
                            return "Ambiguous sound."
                        continue  # Try next sample rate
                        
                    result = response.results[0]
                    transcript = result.alternatives[0].transcript.strip()
                    confidence = result.alternatives[0].confidence
                    
                    # Check confidence against language-specific thresholds
                    min_confidence = lang_config["confidence_threshold"]
                    
                    # Special fallback for English: if en-US has low confidence, retry with en-IN as primary
                    if (current_language == "english" and lang_config["primary_language"] == "en-US" and 
                        (not transcript or confidence < 0.25)):  # Higher threshold for fallback trigger
                        
                        logger.info(f"en-US low confidence ({confidence:.2f}), transcript: {transcript}, retrying with en-IN as primary")
                        
                        # Retry with en-IN as primary
                        fallback_config = speech.RecognitionConfig(
                            encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
                            sample_rate_hertz=sample_rate,  # Use the working sample rate
                            language_code="en-IN",  # Indian English as primary
                            alternative_language_codes=["en-US"],  # US English as fallback
                            
                            use_enhanced=True,
                            enable_automatic_punctuation=False,
                            enable_word_confidence=True,
                            model="latest_short",  # en-IN supports latest_short
                            max_alternatives=2,
                            profanity_filter=True,
                        )
                        
                        try:
                            fallback_response = client.recognize(config=fallback_config, audio=audio)
                            
                            if fallback_response.results:
                                fallback_result = fallback_response.results[0]
                                fallback_transcript = fallback_result.alternatives[0].transcript.strip()
                                fallback_confidence = fallback_result.alternatives[0].confidence
                                
                                logger.info(f"en-IN fallback: confidence={fallback_confidence:.2f}, transcript='{fallback_transcript}'")
                                
                                # Use fallback result if it's better or original was too poor
                                if fallback_confidence > confidence:
                                    logger.info(f"Using en-IN result (better confidence: {fallback_confidence:.2f} > {confidence:.2f})")
                                    return fallback_transcript
                                elif not transcript and fallback_confidence >= 0.20:
                                    logger.info(f"Using en-IN result (original failed, fallback confidence: {fallback_confidence:.2f})")
                                    return fallback_transcript
                                    
                        except Exception as e:
                            logger.error(f"en-IN fallback failed: {e}")
                    
                    # Check confidence against thresholds
                    if not transcript or confidence < min_confidence:
                        logger.info(f"Low confidence for {lang_config['primary_language']}: {confidence:.2f} < {min_confidence} - '{transcript}'")
                        return "Ambiguous sound."
                    
                    # Success - return transcript
                    logger.info(f"STT success: confidence={confidence:.2f}, transcript='{transcript}'")
                    return transcript
                    
                except Exception as sample_rate_error:
                    if sample_rate == sample_rates[-1]:  # Last attempt
                        raise sample_rate_error
                    continue  # Try next sample rate
                
        except Exception as e:
            logger.error(f"Google Speech-to-text error: {e}")
            return "Ambiguous sound."
    
    def set_output_language(self, language: str) -> bool:
        """
        Set the output language for STT
        
        Args:
            language: Language code to set
            
        Returns:
            bool: True if successful, False otherwise
        """
        normalized_language = self.language_manager.validate_and_normalize_language(language)
        if normalized_language != language.lower():
            logger.warning(f"Language {language} normalized to {normalized_language}")
        
        self.output_language = normalized_language
        logger.info(f"STT output language changed to: {self.output_language}")
        return True
    
    def get_supported_languages(self) -> list:
        """Get list of supported languages for STT"""
        return self.language_manager.get_supported_languages_list() 