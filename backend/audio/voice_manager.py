import logging
from typing import Dict, List, Optional
from .tts_service import TTSService
from .language_manager import LanguageManager
from .translation_service import TranslationService

logger = logging.getLogger(__name__)

# Deepgram Aura voices (English only; translation happens before synthesis)
DEEPGRAM_VOICES = {
    "female": [
        {"id": "aura-asteria-en", "name": "Asteria", "gender": "female", "model": "aura"},
        {"id": "aura-luna-en",    "name": "Luna",    "gender": "female", "model": "aura"},
        {"id": "aura-stella-en",  "name": "Stella",  "gender": "female", "model": "aura"},
        {"id": "aura-athena-en",  "name": "Athena",  "gender": "female", "model": "aura"},
        {"id": "aura-hera-en",    "name": "Hera",    "gender": "female", "model": "aura"},
    ],
    "male": [
        {"id": "aura-orion-en",   "name": "Orion",   "gender": "male", "model": "aura"},
        {"id": "aura-arcas-en",   "name": "Arcas",   "gender": "male", "model": "aura"},
        {"id": "aura-perseus-en", "name": "Perseus", "gender": "male", "model": "aura"},
        {"id": "aura-angus-en",   "name": "Angus",   "gender": "male", "model": "aura"},
        {"id": "aura-orpheus-en", "name": "Orpheus", "gender": "male", "model": "aura"},
        {"id": "aura-helios-en",  "name": "Helios",  "gender": "male", "model": "aura"},
        {"id": "aura-zeus-en",    "name": "Zeus",    "gender": "male", "model": "aura"},
    ],
}

# Add language field to each voice entry
for gender_list in DEEPGRAM_VOICES.values():
    for v in gender_list:
        v["language"] = "english"


class VoiceManager:
    """Manages voices and previews using Deepgram Aura"""

    def __init__(self, tts_service: TTSService, language_manager: LanguageManager, translation_service: TranslationService):
        self.tts_service = tts_service
        self.language_manager = language_manager
        self.translation_service = translation_service
        logger.info("Voice Manager initialized")

    def get_available_voices(self, language: Optional[str] = None) -> Dict[str, List[Dict]]:
        """Return available Deepgram Aura voices grouped by gender.

        Deepgram Aura is English-only; the translation service handles non-English
        text before synthesis, so the same voices are returned for all languages.
        """
        target_language = language or self.tts_service.output_language

        if not self.language_manager.is_language_supported(target_language):
            logger.warning(f"Language {target_language} not supported for voice listing")
            return {"male": [], "female": []}

        return DEEPGRAM_VOICES

    def get_available_models(self) -> List[Dict]:
        """Get available TTS models"""
        return self.tts_service.get_available_models()

    async def generate_voice_preview(self, voice_id: str, text: Optional[str] = None,
                                     language: Optional[str] = None, speed: float = 1.0) -> str:
        """Generate a preview audio clip for a specific voice"""
        target_language = language or self.tts_service.output_language
        preview_text = text or "Hello, this is a preview of my voice. How does this sound to you?"

        try:
            if target_language != "english":
                gender = self.translation_service.detect_gender_from_voice_id(voice_id)
                preview_text = self.translation_service.translate_text(preview_text, target_language, gender)

            audio_base64 = await self.tts_service.play_voice_preview(voice_id, preview_text, speed)

            if audio_base64:
                logger.info(f"Generated voice preview for {voice_id} in {target_language}")
            else:
                logger.warning(f"Failed to generate voice preview for {voice_id}")

            return audio_base64

        except Exception as e:
            logger.error(f"Error generating voice preview for {voice_id}: {e}")
            return ""

    def validate_voice(self, voice_id: str, language: Optional[str] = None) -> bool:
        all_voices = DEEPGRAM_VOICES["male"] + DEEPGRAM_VOICES["female"]
        return any(v["id"] == voice_id for v in all_voices)

    def get_voice_info(self, voice_id: str) -> Optional[Dict]:
        all_voices = DEEPGRAM_VOICES["male"] + DEEPGRAM_VOICES["female"]
        for v in all_voices:
            if v["id"] == voice_id:
                return v.copy()
        return None

    def get_voices_by_gender(self, gender: str, language: Optional[str] = None) -> List[Dict]:
        if gender.lower() not in ("male", "female"):
            return []
        return DEEPGRAM_VOICES.get(gender.lower(), [])

    def get_voices_by_model(self, model: str, language: Optional[str] = None) -> List[Dict]:
        all_voices = DEEPGRAM_VOICES["male"] + DEEPGRAM_VOICES["female"]
        return [v for v in all_voices if v.get("model") == model]

    def get_default_voice(self, language: Optional[str] = None, gender: str = "female") -> Optional[str]:
        voices = self.get_voices_by_gender(gender)
        if not voices:
            fallback = "male" if gender == "female" else "female"
            voices = self.get_voices_by_gender(fallback)
        return voices[0]["id"] if voices else None

    def get_voice_friendly_name(self, voice_id: str) -> str:
        info = self.get_voice_info(voice_id)
        if info:
            return info["name"]
        # Fallback: extract name from "aura-{name}-en"
        parts = voice_id.split("-")
        return parts[1].capitalize() if len(parts) >= 2 else voice_id
