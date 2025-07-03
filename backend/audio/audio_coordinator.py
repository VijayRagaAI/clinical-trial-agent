import logging
import os
from typing import Optional, Dict, List
from .language_manager import LanguageManager
from .translation_service import TranslationService
from .stt_service import STTService
from .tts_service import TTSService
from .voice_manager import VoiceManager
from .audio_utils import AudioUtils

logger = logging.getLogger(__name__)

class AudioCoordinator:
    """
    Main coordinator that maintains the same API as the original AudioProcessor
    while routing between specialized audio services.
    
    This maintains full backward compatibility with the existing API and frontend.
    """
    
    def __init__(self):
        # Initialize all services with proper dependency injection
        self.language_manager = LanguageManager()
        self.translation_service = TranslationService(self.language_manager)
        self.tts_service = TTSService(self.language_manager, self.translation_service)
        self.stt_service = STTService(self.language_manager)
        self.voice_manager = VoiceManager(self.tts_service, self.language_manager, self.translation_service)
        
        # Get output language from environment, default to English
        self.output_language = os.getenv("OUTPUT_LANGUAGE", "english").lower()
        
        # Validate and normalize language
        self.output_language = self.language_manager.validate_and_normalize_language(self.output_language)
        
        # Sync language settings across services
        self._sync_language_settings()
        
        logger.info(f"Audio coordinator initialized with output language: {self.output_language}")
    
    def _sync_language_settings(self):
        """Sync language settings across all services"""
        try:
            # Update TTS service language
            self.tts_service.update_settings({"language": self.output_language})
            
            # Update STT service language
            self.stt_service.set_output_language(self.output_language)
            
            logger.info(f"Synced language settings to: {self.output_language}")
        except Exception as e:
            logger.error(f"Error syncing language settings: {e}")
    
    # =============================================================================
    # TRANSLATION METHODS (maintain backward compatibility)
    # =============================================================================
    
    def translate_text(self, text: str, target_language: str, gender: str = "neutral") -> str:
        """Translate text to the target language using OpenAI's API with gender awareness"""
        return self.translation_service.translate_text(text, target_language, gender)
    
    # =============================================================================
    # SPEECH-TO-TEXT METHODS (maintain backward compatibility)
    # =============================================================================
    
    async def speech_to_text(self, audio_data: str) -> str:
        """Convert base64 encoded audio to text using Google STT"""
        
        # Use the same language source as TTS for consistency
        current_language = self.tts_service.output_language
        
        # Use STT service
        transcript = await self.stt_service.speech_to_text(audio_data, current_language)
        
        # Translation logic for non-English languages:
        # If user selected non-English language, they likely spoke in that language
        # We need to translate their input TO English for medical processing
        if current_language != "english" and transcript and transcript not in ["Ambiguous sound.", "Language not supported.", "Invalid audio format.", "Audio too short.", "Audio too long."]:
            # User spoke in their native language, translate to English for processing
            english_text = self.translation_service.translate_text(transcript, "english")
            return english_text
        else:
            # User spoke in English or there was an error
            return transcript

    async def google_speech_to_text(self, audio_data: str) -> str:
        """Google Speech-to-Text with dynamic primary language based on user selection"""
        # Delegate to STT service, but maintain backward compatibility
        return await self.speech_to_text(audio_data)
    
    # =============================================================================
    # TEXT-TO-SPEECH METHODS (maintain backward compatibility)  
    # =============================================================================
    
    async def text_to_speech(self, text: str, speed: float = None) -> str:
        """Convert text to speech using Google TTS and return base64 encoded audio"""
        try:
            # Use TTS service with gender-aware translation
            # Detect gender from current voice setting
            gender = self.translation_service.detect_gender_from_voice_id(self.tts_service.selected_voice)
            
            # Define gender-aware translator function for TTS service
            def gender_aware_translator(text: str, target_language: str, gender: str) -> str:
                return self.translation_service.translate_text(text, target_language, gender)
            
            return await self.tts_service.text_to_speech(text, speed, gender_aware_translator)
            
        except Exception as e:
            logger.error(f"Text-to-speech error: {e}")
            return ""
    
    # =============================================================================
    # AUDIO VALIDATION METHODS (maintain backward compatibility)
    # =============================================================================
    
    def validate_audio_format(self, audio_data: str) -> bool:
        """Validate that audio data is in correct format"""
        return AudioUtils.validate_audio_format(audio_data)
    
    # =============================================================================
    # VOICE AND MODEL METHODS (maintain backward compatibility)
    # =============================================================================
    
    def get_available_models(self) -> List[Dict]:
        """Get list of available Google TTS models"""
        return self.voice_manager.get_available_models()
    
    def get_available_voices(self, language: str = None) -> Dict[str, List[Dict]]:
        """Get list of available Google TTS voices for a language"""
        return self.voice_manager.get_available_voices(language)
    
    async def play_voice_preview(self, voice_id: str, text: str = None, language: str = "english", gender: str = "neutral", speed: float = 1.0) -> str:
        """Generate voice preview using Google TTS"""
        return await self.voice_manager.generate_voice_preview(voice_id, text, language, speed)
    
    # =============================================================================
    # LANGUAGE AND SETTINGS METHODS (maintain backward compatibility)
    # =============================================================================
    
    def get_supported_languages(self) -> List[Dict[str, str]]:
        """Get list of supported output languages"""
        return self.language_manager.get_supported_languages_list()
    
    def set_output_language(self, language: str) -> bool:
        """Set the output language for TTS"""
        language = language.lower()
        if self.language_manager.is_language_supported(language):
            self.output_language = language
            # Sync across all services
            self._sync_language_settings()
            logger.info(f"Output language changed to: {language}")
            return True
        else:
            logger.warning(f"Unsupported language: {language}")
            return False
    
    def update_google_tts_settings(self, settings: Dict) -> bool:
        """Update Google TTS settings and sync language"""
        result = self.tts_service.update_settings(settings)
        
        # Sync the language setting to keep all services in sync
        if result and "language" in settings:
            self.output_language = settings["language"].lower()
            # Update STT service to match
            self.stt_service.set_output_language(self.output_language)
            logger.info(f"Synced all services to language: {self.output_language}")
        
        return result
    
    # =============================================================================
    # ADDITIONAL CONVENIENCE METHODS
    # =============================================================================
    
    def get_current_language(self) -> str:
        """Get the current output language"""
        return self.output_language
    
    def get_voice_info(self, voice_id: str) -> Optional[Dict]:
        """Get detailed information about a specific voice"""
        return self.voice_manager.get_voice_info(voice_id)
    
    def validate_voice(self, voice_id: str, language: Optional[str] = None) -> bool:
        """Validate if a voice is available for a language"""
        return self.voice_manager.validate_voice(voice_id, language)
    
    def get_default_voice(self, language: Optional[str] = None, gender: str = "female") -> Optional[str]:
        """Get a default voice ID for a language and gender"""
        return self.voice_manager.get_default_voice(language, gender)
    
    # =============================================================================
    # SERVICE ACCESS METHODS (for advanced usage)
    # =============================================================================
    
    def get_language_manager(self) -> LanguageManager:
        """Get access to the language manager service"""
        return self.language_manager
    
    def get_translation_service(self) -> TranslationService:
        """Get access to the translation service"""
        return self.translation_service
    
    def get_stt_service(self) -> STTService:
        """Get access to the STT service"""
        return self.stt_service
    
    def get_tts_service(self) -> TTSService:
        """Get access to the TTS service"""
        return self.tts_service
    
    def get_voice_manager(self) -> VoiceManager:
        """Get access to the voice manager"""
        return self.voice_manager 