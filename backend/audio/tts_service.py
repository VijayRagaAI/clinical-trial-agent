import base64
import logging
import os
from typing import Optional, Dict, Any, TYPE_CHECKING
import httpx

if TYPE_CHECKING:
    from .language_manager import LanguageManager
    from .translation_service import TranslationService

logger = logging.getLogger(__name__)

DEFAULT_VOICE = "aura-asteria-en"


class TTSService:
    """Text-to-Speech service using Deepgram Aura"""

    def __init__(self, language_manager: 'LanguageManager' = None, translation_service: 'TranslationService' = None):
        self.language_manager = language_manager
        self.translation_service = translation_service

        self.api_key = os.getenv("DEEPGRAM_API_KEY", "")
        if self.api_key:
            logger.info("Deepgram TTS credentials configured")
        else:
            logger.warning("DEEPGRAM_API_KEY not found")

        # Reuse GOOGLE_TTS_* env var names for backward compatibility with settings persistence
        self.selected_model = os.getenv("GOOGLE_TTS_MODEL", "aura")
        self.selected_voice = os.getenv("GOOGLE_TTS_VOICE", DEFAULT_VOICE)
        self.selected_speed = float(os.getenv("GOOGLE_TTS_SPEED", "1.0"))
        self.output_language = os.getenv("OUTPUT_LANGUAGE", "english").lower()

        # Reset if an old Google voice ID is stored
        if not self.selected_voice.startswith("aura-"):
            self.selected_voice = DEFAULT_VOICE

        if self.language_manager:
            self.output_language = self.language_manager.validate_and_normalize_language(self.output_language)

        logger.info(f"TTS Service initialized - Voice: {self.selected_voice}")

    async def text_to_speech(self, text: str, speed: float = None, gender_aware_translator=None) -> str:
        """Convert text to speech using Deepgram Aura"""
        if not self.api_key:
            logger.error("Deepgram TTS API key not configured")
            return ""

        try:
            if self.output_language != "english":
                if gender_aware_translator:
                    gender = self.translation_service.detect_gender_from_voice_id(self.selected_voice)
                    text = gender_aware_translator(text, self.output_language, gender)
                elif self.translation_service:
                    text = self.translation_service.translate_text(text, self.output_language)

            return await self._synthesize(text, self.selected_voice)

        except Exception as e:
            logger.error(f"Deepgram TTS error: {e}")
            return ""

    async def _synthesize(self, text: str, voice: str) -> str:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.deepgram.com/v1/speak",
                params={"model": voice},
                headers={
                    "Authorization": f"Token {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={"text": text},
                timeout=30.0,
            )

        if response.status_code != 200:
            logger.error(f"Deepgram TTS error: {response.status_code} {response.text}")
            return ""

        logger.info(f"Generated Deepgram TTS: {voice}")
        return base64.b64encode(response.content).decode('utf-8')

    async def play_voice_preview(self, voice_id: str, text: str = "Hello, this is a voice preview", speed: float = None) -> str:
        """Generate a preview audio for a specific voice"""
        if not self.api_key:
            return ""

        try:
            return await self._synthesize(text, voice_id)
        except Exception as e:
            logger.error(f"Voice preview error: {e}")
            return ""

    def update_settings(self, settings: Dict[str, Any]) -> bool:
        """Update TTS settings"""
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
                if self.language_manager:
                    self.output_language = self.language_manager.validate_and_normalize_language(new_language)
                else:
                    self.output_language = new_language

            logger.info(f"TTS settings updated: speed {old_speed} → {self.selected_speed}, voice: {self.selected_voice}")
            return True
        except Exception as e:
            logger.error(f"Error updating settings: {e}")
            return False

    def get_available_models(self) -> list:
        """Get available TTS models"""
        return [
            {"id": "aura", "name": "Deepgram Aura", "speed": "Fast", "quality": "High"},
        ]
