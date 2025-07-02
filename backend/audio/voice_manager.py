import logging
from typing import Dict, List, Optional
from .tts_service import TTSService
from .language_manager import LanguageManager
from .translation_service import TranslationService

logger = logging.getLogger(__name__)

class VoiceManager:
    """Service for managing voices, previews, and voice-related operations"""
    
    def __init__(self, tts_service: TTSService, language_manager: LanguageManager, translation_service: TranslationService):
        self.tts_service = tts_service
        self.language_manager = language_manager
        self.translation_service = translation_service
        
        # Google TTS voice mapping (moved from TTSService)
        self.voice_mapping = {
            "english": {
                "neural2": {"male": "en-US-Neural2-D", "female": "en-US-Neural2-F"},
                "wavenet": {"male": "en-US-Wavenet-D", "female": "en-US-Wavenet-F"},
                "standard": {"male": "en-US-Standard-D", "female": "en-US-Standard-F"}
            },
            "hindi": {
                "neural2": {"male": "hi-IN-Neural2-B", "female": "hi-IN-Neural2-A"},
                "wavenet": {"male": "hi-IN-Wavenet-B", "female": "hi-IN-Wavenet-A"},
                "standard": {"male": "hi-IN-Standard-B", "female": "hi-IN-Standard-A"}
            },
            "spanish": {
                "neural2": {"male": "es-ES-Neural2-B", "female": "es-ES-Neural2-A"},
                "wavenet": {"male": "es-ES-Wavenet-B", "female": "es-ES-Wavenet-A"},
                "standard": {"male": "es-ES-Standard-B", "female": "es-ES-Standard-A"}
            },
            "french": {
                "neural2": {"male": "fr-FR-Neural2-B", "female": "fr-FR-Neural2-A"},
                "wavenet": {"male": "fr-FR-Wavenet-B", "female": "fr-FR-Wavenet-A"},
                "standard": {"male": "fr-FR-Standard-B", "female": "fr-FR-Standard-A"}
            },
            "german": {
                "neural2": {"male": "de-DE-Neural2-B", "female": "de-DE-Neural2-A"},
                "wavenet": {"male": "de-DE-Wavenet-B", "female": "de-DE-Wavenet-A"},
                "standard": {"male": "de-DE-Standard-B", "female": "de-DE-Standard-A"}
            },
            "italian": {
                "neural2": {"male": "it-IT-Neural2-C", "female": "it-IT-Neural2-A"},
                "wavenet": {"male": "it-IT-Wavenet-C", "female": "it-IT-Wavenet-A"},
                "standard": {"male": "it-IT-Standard-C", "female": "it-IT-Standard-A"}
            },
            "portuguese": {
                "neural2": {"male": "pt-BR-Neural2-B", "female": "pt-BR-Neural2-A"},
                "wavenet": {"male": "pt-BR-Wavenet-B", "female": "pt-BR-Wavenet-A"},
                "standard": {"male": "pt-BR-Standard-B", "female": "pt-BR-Standard-A"}
            },
            "russian": {
                "neural2": {"male": "ru-RU-Neural2-B", "female": "ru-RU-Neural2-A"},
                "wavenet": {"male": "ru-RU-Wavenet-B", "female": "ru-RU-Wavenet-A"},
                "standard": {"male": "ru-RU-Standard-B", "female": "ru-RU-Standard-A"}
            },
            "japanese": {
                "neural2": {"male": "ja-JP-Neural2-C", "female": "ja-JP-Neural2-A"},
                "wavenet": {"male": "ja-JP-Wavenet-C", "female": "ja-JP-Wavenet-A"},
                "standard": {"male": "ja-JP-Standard-C", "female": "ja-JP-Standard-A"}
            },
            "korean": {
                "neural2": {"male": "ko-KR-Neural2-C", "female": "ko-KR-Neural2-A"},
                "wavenet": {"male": "ko-KR-Wavenet-C", "female": "ko-KR-Wavenet-A"},
                "standard": {"male": "ko-KR-Standard-C", "female": "ko-KR-Standard-A"}
            },
            "mandarin": {
                "neural2": {"male": "zh-CN-Neural2-B", "female": "zh-CN-Neural2-A"},
                "wavenet": {"male": "zh-CN-Wavenet-B", "female": "zh-CN-Wavenet-A"},
                "standard": {"male": "zh-CN-Standard-B", "female": "zh-CN-Standard-A"}
            },
            "arabic": {
                "neural2": {"male": "ar-XA-Neural2-B", "female": "ar-XA-Neural2-A"},
                "wavenet": {"male": "ar-XA-Wavenet-B", "female": "ar-XA-Wavenet-A"},
                "standard": {"male": "ar-XA-Standard-B", "female": "ar-XA-Standard-A"}
            },
            "dutch": {
                "neural2": {"male": "nl-NL-Neural2-B", "female": "nl-NL-Neural2-A"},
                "wavenet": {"male": "nl-NL-Wavenet-B", "female": "nl-NL-Wavenet-A"},
                "standard": {"male": "nl-NL-Standard-B", "female": "nl-NL-Standard-A"}
            },
            "turkish": {
                "neural2": {"male": "tr-TR-Neural2-B", "female": "tr-TR-Neural2-A"},
                "wavenet": {"male": "tr-TR-Wavenet-B", "female": "tr-TR-Wavenet-A"},
                "standard": {"male": "tr-TR-Standard-B", "female": "tr-TR-Standard-A"}
            },
            "vietnamese": {
                "neural2": {"male": "vi-VN-Neural2-B", "female": "vi-VN-Neural2-A"},
                "wavenet": {"male": "vi-VN-Wavenet-B", "female": "vi-VN-Wavenet-A"},
                "standard": {"male": "vi-VN-Standard-B", "female": "vi-VN-Standard-A"}
            },
            "thai": {
                "neural2": {"male": "th-TH-Neural2-B", "female": "th-TH-Neural2-A"},
                "wavenet": {"male": "th-TH-Wavenet-B", "female": "th-TH-Wavenet-A"},
                "standard": {"male": "th-TH-Standard-B", "female": "th-TH-Standard-A"}
            },
            "indonesian": {
                "neural2": {"male": "id-ID-Neural2-B", "female": "id-ID-Neural2-A"},
                "wavenet": {"male": "id-ID-Wavenet-B", "female": "id-ID-Wavenet-A"},
                "standard": {"male": "id-ID-Standard-B", "female": "id-ID-Standard-A"}
            },
            "bengali": {
                "neural2": {"male": "bn-IN-Neural2-B", "female": "bn-IN-Neural2-A"},
                "wavenet": {"male": "bn-IN-Wavenet-B", "female": "bn-IN-Wavenet-A"},
                "standard": {"male": "bn-IN-Standard-B", "female": "bn-IN-Standard-A"}
            },
            "telugu": {
                "neural2": {"male": "te-IN-Neural2-B", "female": "te-IN-Neural2-A"},
                "wavenet": {"male": "te-IN-Wavenet-B", "female": "te-IN-Wavenet-A"},
                "standard": {"male": "te-IN-Standard-B", "female": "te-IN-Standard-A"}
            },
            "marathi": {
                "neural2": {"male": "mr-IN-Neural2-B", "female": "mr-IN-Neural2-A"},
                "wavenet": {"male": "mr-IN-Wavenet-B", "female": "mr-IN-Wavenet-A"},
                "standard": {"male": "mr-IN-Standard-B", "female": "mr-IN-Standard-A"}
            },
            "tamil": {
                "neural2": {"male": "ta-IN-Neural2-B", "female": "ta-IN-Neural2-A"},
                "wavenet": {"male": "ta-IN-Wavenet-B", "female": "ta-IN-Wavenet-A"},
                "standard": {"male": "ta-IN-Standard-B", "female": "ta-IN-Standard-A"}
            },
            "gujarati": {
                "neural2": {"male": "gu-IN-Neural2-B", "female": "gu-IN-Neural2-A"},
                "wavenet": {"male": "gu-IN-Wavenet-B", "female": "gu-IN-Wavenet-A"},
                "standard": {"male": "gu-IN-Standard-B", "female": "gu-IN-Standard-A"}
            },
            "urdu": {
                "neural2": {"male": "ur-IN-Neural2-B", "female": "ur-IN-Neural2-A"},
                "wavenet": {"male": "ur-IN-Wavenet-B", "female": "ur-IN-Wavenet-A"},
                "standard": {"male": "ur-IN-Standard-B", "female": "ur-IN-Standard-A"}
            },
            "kannada": {
                "neural2": {"male": "kn-IN-Neural2-B", "female": "kn-IN-Neural2-A"},
                "wavenet": {"male": "kn-IN-Wavenet-B", "female": "kn-IN-Wavenet-A"},
                "standard": {"male": "kn-IN-Standard-B", "female": "kn-IN-Standard-A"}
            }
        }
        
        # Voice name mappings for friendly names
        self.voice_names = {
            # English voices
            "en-US-Neural2-D": "Marcus", "en-US-Neural2-F": "Emma",
            "en-US-Neural2-A": "Alice", "en-US-Neural2-C": "Charlotte",
            "en-US-Neural2-E": "Elizabeth", "en-US-Neural2-G": "Grace",
            "en-US-Neural2-H": "Henry", "en-US-Neural2-I": "Isabella",
            "en-US-Neural2-J": "James",
            # Hindi voices  
            "hi-IN-Neural2-A": "Priya", "hi-IN-Neural2-B": "Arjun",
            "hi-IN-Neural2-C": "Chandra", "hi-IN-Neural2-D": "Deepak",
            # Spanish voices
            "es-ES-Neural2-A": "Sofia", "es-ES-Neural2-B": "Diego",
            "es-ES-Neural2-C": "Carmen", "es-ES-Neural2-F": "Fernando",
            # French voices
            "fr-FR-Neural2-A": "Amélie", "fr-FR-Neural2-B": "Bernard",
            "fr-FR-Neural2-C": "Céline", "fr-FR-Neural2-D": "Didier",
            # German voices
            "de-DE-Neural2-A": "Anna", "de-DE-Neural2-B": "Bernd", 
            "de-DE-Neural2-C": "Claudia", "de-DE-Neural2-F": "Friedrich",
            # Italian voices
            "it-IT-Neural2-A": "Alessandra", "it-IT-Neural2-C": "Carlo",
            # Arabic voices
            "ar-XA-Neural2-A": "Layla", "ar-XA-Neural2-B": "Omar",
            "ar-XA-Neural2-C": "Zahra", "ar-XA-Neural2-D": "Hassan",
        }
        
        logger.info("Voice Manager initialized")
    
    def get_available_voices(self, language: Optional[str] = None) -> Dict[str, List[Dict]]:
        """
        Get available voices for a language using Google Cloud TTS API
        
        Args:
            language: Language code, uses TTS service default if not provided
            
        Returns:
            dict: Voices grouped by gender {"male": [...], "female": [...]}
        """
        target_language = language or self.tts_service.output_language
        
        # Validate language
        if not self.language_manager.is_language_supported(target_language):
            logger.warning(f"Language {target_language} not supported for voice listing")
            return {"male": [], "female": []}
        
        try:
            from google.cloud import texttospeech
            
            # Initialize client
            client = texttospeech.TextToSpeechClient()
            
            # Get Google language code using LanguageManager
            language_code = self.language_manager.get_google_language_code(target_language)
            
            # List all available voices from Google Cloud TTS
            voices_request = texttospeech.ListVoicesRequest(language_code=language_code)
            voices_response = client.list_voices(request=voices_request)
            
            # Collect all voices by model and gender
            all_voices = {"male": {}, "female": {}}
            
            for voice in voices_response.voices:
                # Skip voices that don't match our target language
                if not voice.language_codes or language_code not in voice.language_codes:
                    continue
                
                # Determine model type from voice name
                voice_name = voice.name
                model = "standard"  # default
                if "Neural2" in voice_name:
                    model = "neural2"
                elif "Wavenet" in voice_name:
                    model = "wavenet"
                elif "Standard" in voice_name:
                    model = "standard"
                
                # Determine gender
                gender = "female" if voice.ssml_gender == texttospeech.SsmlVoiceGender.FEMALE else "male"
                
                voice_data = {
                    "id": voice_name,
                    "name": self.get_voice_friendly_name(voice_name),
                    "model": model,
                    "gender": gender,
                    "language": target_language,
                    "language_code": language_code,
                    "natural_sample_rate": voice.natural_sample_rate_hertz
                }
                
                # Group by model and gender
                if model not in all_voices[gender]:
                    all_voices[gender][model] = []
                all_voices[gender][model].append(voice_data)
            
            # Apply smart filtering: max 2 voices per gender per model
            result = {"male": [], "female": []}
            
            for gender in ["male", "female"]:
                for model in ["neural2", "wavenet", "standard"]:
                    if model in all_voices[gender]:
                        model_voices = all_voices[gender][model]
                        # Select most variant voices (max 2 per gender per model)
                        selected_voices = self._select_variant_voices(model_voices, max_count=2)
                        result[gender].extend(selected_voices)
            
            logger.info(f"Filtered to {len(result['male']) + len(result['female'])} voices for {target_language}")
            logger.info(f"Voice counts by model: neural2={len([v for v in result['male'] + result['female'] if v['model'] == 'neural2'])}, "
                       f"wavenet={len([v for v in result['male'] + result['female'] if v['model'] == 'wavenet'])}, "
                       f"standard={len([v for v in result['male'] + result['female'] if v['model'] == 'standard'])}")
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting voices from Google Cloud TTS: {e}")
            # Use hardcoded mapping as backup
            if target_language in self.voice_mapping:
                logger.warning(f"Using fallback hardcoded voices for {target_language}")
                return self._get_fallback_voices(target_language)
            else:
                return {"male": [], "female": []}
    
    def get_available_models(self) -> List[Dict]:
        """Get available TTS models"""
        return self.tts_service.get_available_models()
    
    async def generate_voice_preview(self, voice_id: str, text: Optional[str] = None, 
                                   language: Optional[str] = None, speed: float = 1.0) -> str:
        """
        Generate a preview audio for a specific voice
        
        Args:
            voice_id: Voice ID to preview
            text: Preview text, uses default if not provided
            language: Language for preview, uses TTS service default if not provided
            speed: Speaking speed for preview
            
        Returns:
            str: Base64 encoded audio or empty string on error
        """
        target_language = language or self.tts_service.output_language
        preview_text = text or "Hello, this is a preview of my voice. How does this sound to you?"
        
        try:
            # Translate preview text if needed
            if target_language != "english":
                # Detect gender from voice for gender-aware translation
                gender = self.translation_service.detect_gender_from_voice_id(voice_id)
                preview_text = self.translation_service.translate_text(preview_text, target_language, gender)
                logger.info(f"Translated preview text for {target_language} with gender {gender}")
            
            # Generate preview using TTS service
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
        """
        Validate if a voice is available for a language
        
        Args:
            voice_id: Voice ID to validate
            language: Language to check against, uses TTS service default if not provided
            
        Returns:
            bool: True if voice is valid for the language
        """
        target_language = language or self.tts_service.output_language
        
        try:
            available_voices = self.get_available_voices(target_language)
            all_voices = available_voices.get("male", []) + available_voices.get("female", [])
            
            # Check if voice ID exists in available voices
            voice_ids = [voice.get("id") for voice in all_voices]
            is_valid = voice_id in voice_ids
            
            if not is_valid:
                logger.warning(f"Voice {voice_id} not available for language {target_language}")
            
            return is_valid
            
        except Exception as e:
            logger.error(f"Error validating voice {voice_id}: {e}")
            return False
    
    def get_voice_info(self, voice_id: str) -> Optional[Dict]:
        """
        Get detailed information about a specific voice
        
        Args:
            voice_id: Voice ID to get info for
            
        Returns:
            dict: Voice information or None if not found
        """
        try:
            # Search across all supported languages
            for language in self.language_manager.supported_languages:
                voices = self.get_available_voices(language)
                all_voices = voices.get("male", []) + voices.get("female", [])
                
                for voice in all_voices:
                    if voice.get("id") == voice_id:
                        # Add language info to voice data
                        voice_info = voice.copy()
                        voice_info["supported_language"] = language
                        voice_info["language_display_name"] = self.language_manager.get_language_display_name(language)
                        return voice_info
            
            logger.warning(f"Voice {voice_id} not found in any language")
            return None
            
        except Exception as e:
            logger.error(f"Error getting voice info for {voice_id}: {e}")
            return None
    
    def get_voices_by_gender(self, gender: str, language: Optional[str] = None) -> List[Dict]:
        """
        Get voices filtered by gender
        
        Args:
            gender: 'male' or 'female'
            language: Language to filter by, uses TTS service default if not provided
            
        Returns:
            list: List of voices for the specified gender
        """
        target_language = language or self.tts_service.output_language
        
        if gender.lower() not in ["male", "female"]:
            logger.warning(f"Invalid gender filter: {gender}")
            return []
        
        try:
            voices = self.get_available_voices(target_language)
            return voices.get(gender.lower(), [])
            
        except Exception as e:
            logger.error(f"Error getting {gender} voices for {target_language}: {e}")
            return []
    
    def get_voices_by_model(self, model: str, language: Optional[str] = None) -> List[Dict]:
        """
        Get voices filtered by TTS model
        
        Args:
            model: TTS model name (e.g., 'neural2', 'wavenet', 'standard')
            language: Language to filter by, uses TTS service default if not provided
            
        Returns:
            list: List of voices for the specified model
        """
        target_language = language or self.tts_service.output_language
        
        try:
            voices = self.get_available_voices(target_language)
            all_voices = voices.get("male", []) + voices.get("female", [])
            
            # Filter by model
            model_voices = [voice for voice in all_voices if voice.get("model") == model]
            
            logger.info(f"Found {len(model_voices)} voices for model {model} in {target_language}")
            return model_voices
            
        except Exception as e:
            logger.error(f"Error getting {model} voices for {target_language}: {e}")
            return []
    
    def get_default_voice(self, language: Optional[str] = None, gender: str = "female") -> Optional[str]:
        """
        Get a default voice ID for a language and gender
        
        Args:
            language: Language to get default voice for, uses TTS service default if not provided
            gender: Preferred gender ('male' or 'female')
            
        Returns:
            str: Voice ID or None if no suitable voice found
        """
        target_language = language or self.tts_service.output_language
        
        try:
            voices = self.get_voices_by_gender(gender, target_language)
            
            if not voices:
                # Fallback to opposite gender if preferred gender not available
                fallback_gender = "male" if gender == "female" else "female"
                voices = self.get_voices_by_gender(fallback_gender, target_language)
                logger.info(f"No {gender} voices found, using {fallback_gender} voices as fallback")
            
            if voices:
                # Prefer neural2 model, fallback to first available
                neural2_voices = [v for v in voices if v.get("model") == "neural2"]
                default_voice = neural2_voices[0] if neural2_voices else voices[0]
                
                voice_id = default_voice.get("id")
                logger.info(f"Selected default voice {voice_id} for {target_language} ({gender})")
                return voice_id
            
            logger.warning(f"No voices available for {target_language}")
            return None
            
        except Exception as e:
            logger.error(f"Error getting default voice for {target_language}: {e}")
            return None
    
    def get_voice_friendly_name(self, voice_id: str) -> str:
        """Extract a friendly name from voice ID"""
        # If we have a friendly name, use it
        if voice_id in self.voice_names:
            return self.voice_names[voice_id]
        
        # Otherwise, extract a meaningful name from the voice ID
        # Format is usually: xx-XX-Model-Letter (e.g., en-US-Neural2-D)
        parts = voice_id.split('-')
        if len(parts) >= 4:
            model = parts[2]  # Neural2, Wavenet, Standard
            letter = parts[3]  # A, B, C, D, etc.
            return f"{model}-{letter}"
        else:
            return voice_id.split('-')[-1]
    
    def _select_variant_voices(self, voices, max_count=2):
        """Select most variant voices from a list using smart criteria"""
        if len(voices) <= max_count:
            return voices
        
        # Sort voices for consistent selection
        voices = sorted(voices, key=lambda v: v["id"])
        
        if max_count == 1:
            # Pick the one with highest sample rate
            return [max(voices, key=lambda v: v.get("natural_sample_rate", 0))]
        
        if max_count == 2:
            # Strategy: Pick voices with maximum letter distance
            # e.g., prefer A and F over A and B
            
            def get_voice_letter(voice_id):
                """Extract the letter from voice ID (e.g., 'A' from 'en-US-Neural2-A')"""
                parts = voice_id.split('-')
                if len(parts) >= 4:
                    suffix = parts[-1]
                    # Handle different suffix formats
                    if len(suffix) == 1 and suffix.isalpha():
                        return suffix.upper()
                    # For longer suffixes, use first character or hash-based approach
                    return chr(65 + (hash(suffix) % 26))  # Convert to A-Z range
                return 'A'
            
            # Add letter information
            for voice in voices:
                voice['_letter'] = get_voice_letter(voice['id'])
            
            # Try to pick voices with maximum letter distance
            selected = []
            
            # First, pick voice with highest sample rate
            best_quality = max(voices, key=lambda v: v.get("natural_sample_rate", 0))
            selected.append(best_quality)
            
            # Second, pick voice with most different letter and different sample rate
            remaining = [v for v in voices if v['id'] != best_quality['id']]
            if remaining:
                best_letter = best_quality['_letter']
                
                # Calculate letter distance (A=0, B=1, etc.)
                def letter_distance(letter1, letter2):
                    try:
                        return abs(ord(letter1.upper()) - ord(letter2.upper()))
                    except (TypeError, AttributeError):
                        # Fallback if letters are not single characters
                        return abs(hash(str(letter1)) % 26 - hash(str(letter2)) % 26)
                
                # Pick voice with maximum letter distance
                most_different = max(remaining, 
                    key=lambda v: (
                        letter_distance(best_letter, v['_letter']),
                        abs(v.get("natural_sample_rate", 0) - best_quality.get("natural_sample_rate", 0))
                    ))
                selected.append(most_different)
            
            # Remove temporary data
            for voice in voices:
                voice.pop('_letter', None)
            
            return selected
        
        # For max_count > 2, pick evenly distributed voices
        step = len(voices) // max_count
        return [voices[i * step] for i in range(max_count)]

    def _get_fallback_voices(self, target_lang: str) -> Dict[str, List[Dict]]:
        """Fallback method using hardcoded voices when API fails"""
        if target_lang not in self.voice_mapping:
            return {"male": [], "female": []}
            
        lang_voices = self.voice_mapping[target_lang]
        result = {"male": [], "female": []}
        
        for model in ["neural2", "wavenet", "standard"]:
            if model in lang_voices:
                for gender in ["male", "female"]:
                    if gender in lang_voices[model]:
                        voice_id = lang_voices[model][gender]
                        
                        result[gender].append({
                            "id": voice_id,
                            "name": self.get_voice_friendly_name(voice_id),
                            "model": model,
                            "gender": gender,
                            "language": target_lang
                        })
        
        return result 