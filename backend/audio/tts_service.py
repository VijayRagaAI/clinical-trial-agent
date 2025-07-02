import asyncio
import base64
import logging
import os
from typing import Optional, Dict, Any, TYPE_CHECKING

# Use TYPE_CHECKING to avoid circular imports
if TYPE_CHECKING:
    from .language_manager import LanguageManager
    from .translation_service import TranslationService

logger = logging.getLogger(__name__)

class TTSService:
    """
    Text-to-Speech service using Google Cloud TTS.
    
    Focused only on TTS synthesis. Delegates to other services:
    - LanguageManager: For language validation and mapping
    - TranslationService: For gender-aware translation
    - VoiceManager: For voice discovery and management
    """
    
    def __init__(self, language_manager: 'LanguageManager' = None, translation_service: 'TranslationService' = None):
        # Store service dependencies
        self.language_manager = language_manager
        self.translation_service = translation_service
        
        # Initialize Google TTS credentials
        self.google_credentials = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        if self.google_credentials:
            logger.info("Google Cloud TTS credentials configured")
        else:
            logger.warning("Google TTS credentials not found")
        
        # TTS Settings
        self.selected_model = os.getenv("GOOGLE_TTS_MODEL", "neural2")
        self.selected_voice = os.getenv("GOOGLE_TTS_VOICE", "en-US-Neural2-F")
        self.selected_speed = float(os.getenv("GOOGLE_TTS_SPEED", "1.0"))
        self.output_language = os.getenv("OUTPUT_LANGUAGE", "english").lower()
        
        # Google TTS model mapping
        self.model_mapping = {
            "neural2": "Neural2",
            "wavenet": "WaveNet", 
            "standard": "Standard"
        }
        
        # Validate output language using LanguageManager
        if self.language_manager:
            self.output_language = self.language_manager.validate_and_normalize_language(self.output_language)
        
        logger.info(f"TTS Service initialized - Model: {self.selected_model}, Voice: {self.selected_voice}")

    async def text_to_speech(self, text: str, speed: float = None, gender_aware_translator=None) -> str:
        """Convert text to speech using Google Cloud TTS"""
        if not self.google_credentials:
            logger.error("Google Cloud TTS credentials not configured")
            return ""
            
        try:
            # Use provided speed or default
            speech_speed = speed if speed is not None else self.selected_speed
            logger.info(f"🎛️ TTS Speed Debug: provided_speed={speed}, saved_speed={self.selected_speed}, using_speed={speech_speed}")
            
            # Translate if needed with gender awareness
            if self.output_language != "english":
                if gender_aware_translator:
                    # Detect gender from selected voice using TranslationService
                    gender = self.translation_service.detect_gender_from_voice_id(self.selected_voice)
                    translated_text = gender_aware_translator(text, self.output_language, gender)
                    logger.info(f"🎭 Interview TTS: Using gender-aware translation ({gender}) for {self.output_language}")
                else:
                    # Use TranslationService directly
                    translated_text = self.translation_service.translate_text(text, self.output_language)
            else:
                translated_text = text
            
            # Import Google TTS
            from google.cloud import texttospeech
            
            client = texttospeech.TextToSpeechClient()
            synthesis_input = texttospeech.SynthesisInput(text=translated_text)
            
            # Get voice based on current settings
            voice_name = self.selected_voice
            
            voice = texttospeech.VoiceSelectionParams(
                name=voice_name,
                language_code='-'.join(voice_name.split('-')[:2])
            )
            
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3,
                speaking_rate=speech_speed,
                effects_profile_id=["telephony-class-application"]
            )
            
            response = client.synthesize_speech(
                input=synthesis_input, 
                voice=voice, 
                audio_config=audio_config
            )
            
            audio_base64 = base64.b64encode(response.audio_content).decode('utf-8')
            logger.info(f"Generated Google TTS: {voice_name} at {speech_speed}x speed")
            return audio_base64
            
        except Exception as e:
            logger.error(f"Google TTS error: {e}")
            return ""

    async def play_voice_preview(self, voice_id: str, text: str = "Hello, this is a voice preview", speed: float = None) -> str:
        """Generate a preview audio for a specific voice"""
        if not self.google_credentials:
            return ""
            
        try:
            from google.cloud import texttospeech
            
            # Use provided speed or fall back to selected speed
            speaking_rate = speed if speed is not None else self.selected_speed
            
            client = texttospeech.TextToSpeechClient()
            synthesis_input = texttospeech.SynthesisInput(text=text)
            
            voice = texttospeech.VoiceSelectionParams(
                name=voice_id,
                language_code='-'.join(voice_id.split('-')[:2])
            )
            
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3,
                speaking_rate=speaking_rate
            )
            
            response = client.synthesize_speech(
                input=synthesis_input, 
                voice=voice, 
                audio_config=audio_config
            )
            
            audio_base64 = base64.b64encode(response.audio_content).decode('utf-8')
            logger.info(f"Generated voice preview for {voice_id} at {speaking_rate}x speed")
            return audio_base64
            
        except Exception as e:
            logger.error(f"Voice preview error: {e}")
            return ""

    def update_settings(self, settings: Dict[str, Any]) -> bool:
        """Update Google TTS settings"""
        try:
            old_speed = self.selected_speed
            if "model" in settings:
                self.selected_model = settings["model"]
            if "voice" in settings:
                self.selected_voice = settings["voice"]
            if "speed" in settings:
                self.selected_speed = max(0.25, min(4.0, float(settings["speed"])))
            if "language" in settings:
                new_language = settings["language"].lower()
                # Validate language using LanguageManager
                if self.language_manager:
                    self.output_language = self.language_manager.validate_and_normalize_language(new_language)
                else:
                    self.output_language = new_language
            
            logger.info(f"🔧 Google TTS settings updated: speed {old_speed} → {self.selected_speed}, voice: {self.selected_voice}, model: {self.selected_model}")
            return True
        except Exception as e:
            logger.error(f"Error updating settings: {e}")
            return False

    def get_available_models(self) -> list:
        """Get available Google TTS models"""
        return [
            {"id": "neural2", "name": "Optimal", "speed": "Fastest", "quality": "High"},
            {"id": "wavenet", "name": "Best Quality", "speed": "Slower", "quality": "Premium"},
            {"id": "standard", "name": "Best Speed", "speed": "Ultra Fast", "quality": "Basic"}
        ] 