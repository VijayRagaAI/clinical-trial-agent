import base64
import logging
import os
from typing import Optional
import httpx
from .language_manager import LanguageManager
from .audio_utils import AudioUtils

logger = logging.getLogger(__name__)

# Deepgram language code mapping
LANGUAGE_MAP = {
    "english": "en-US",
    "hindi": "hi",
    "spanish": "es",
    "french": "fr-FR",
    "german": "de",
    "italian": "it",
    "portuguese": "pt-BR",
    "russian": "ru",
    "japanese": "ja",
    "korean": "ko",
    "mandarin": "zh-CN",
    "arabic": "ar",
    "dutch": "nl",
    "turkish": "tr",
    "vietnamese": "vi",
    "thai": "th",
    "indonesian": "id",
    "bengali": "bn",
    "telugu": "te",
    "marathi": "mr",
    "tamil": "ta",
    "gujarati": "gu",
    "urdu": "ur",
    "kannada": "kn",
}

class STTService:
    """Speech-to-Text service using Deepgram Nova-2"""

    def __init__(self, language_manager: LanguageManager):
        self.language_manager = language_manager
        self.api_key = os.getenv("DEEPGRAM_API_KEY", "")
        self.output_language = os.getenv("OUTPUT_LANGUAGE", "english").lower()
        self.output_language = self.language_manager.validate_and_normalize_language(self.output_language)

        if self.api_key:
            logger.info("Deepgram Speech-to-Text credentials configured")
        else:
            logger.warning("DEEPGRAM_API_KEY not found")

        logger.info(f"STT Service initialized with output language: {self.output_language}")

    async def speech_to_text(self, audio_data: str, target_language: Optional[str] = None) -> str:
        if not AudioUtils.validate_audio_format(audio_data):
            logger.warning("Invalid audio format provided")
            return "Invalid audio format."

        current_language = target_language or self.output_language

        if not self.language_manager.is_language_supported(current_language):
            logger.warning(f"Target language {current_language} not supported")
            return "Language not supported."

        return await self._deepgram_speech_to_text(audio_data, current_language)

    async def _deepgram_speech_to_text(self, audio_data: str, current_language: str) -> str:
        if not self.api_key:
            raise Exception("Deepgram API key not configured")

        try:
            audio_bytes = AudioUtils.base64_to_bytes(audio_data)

            is_valid, error_msg = AudioUtils.check_audio_duration(audio_bytes)
            if not is_valid:
                return error_msg

            lang_code = LANGUAGE_MAP.get(current_language, "en-US")

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.deepgram.com/v1/listen",
                    params={
                        "model": "nova-2",
                        "language": lang_code,
                        "smart_format": "false",
                        "punctuate": "false",
                    },
                    headers={
                        "Authorization": f"Token {self.api_key}",
                        "Content-Type": "audio/webm;codecs=opus",
                    },
                    content=audio_bytes,
                    timeout=30.0,
                )

            if response.status_code != 200:
                logger.error(f"Deepgram STT error: {response.status_code} {response.text}")
                return "Ambiguous sound."

            data = response.json()
            channels = data.get("results", {}).get("channels", [])
            if not channels:
                return "Ambiguous sound."

            alternatives = channels[0].get("alternatives", [])
            if not alternatives:
                return "Ambiguous sound."

            transcript = alternatives[0].get("transcript", "").strip()
            confidence = alternatives[0].get("confidence", 0)

            if not transcript or confidence < 0.2:
                logger.info(f"Low confidence: {confidence:.2f}, transcript: '{transcript}'")
                return "Ambiguous sound."

            logger.info(f"STT success: confidence={confidence:.2f}, transcript='{transcript}'")
            return transcript

        except Exception as e:
            logger.error(f"Deepgram Speech-to-text error: {e}")
            return "Ambiguous sound."

    def set_output_language(self, language: str) -> bool:
        normalized = self.language_manager.validate_and_normalize_language(language)
        self.output_language = normalized
        logger.info(f"STT output language changed to: {self.output_language}")
        return True

    def get_supported_languages(self) -> list:
        return self.language_manager.get_supported_languages_list()
