import asyncio
import base64
import io
import logging
import os
import tempfile
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

class GoogleTTS:
    def __init__(self):
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
        
        # Google TTS language to voice mapping
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
        
        # Supported languages for Google TTS
        self.supported_languages = list(self.voice_mapping.keys())
        
        logger.info(f"Google TTS initialized - Model: {self.selected_model}, Voice: {self.selected_voice}")

    def translate_text(self, text: str, target_language: str) -> str:
        """Translate text using OpenAI for languages not supported by Google TTS"""
        import openai
        
        openai_api_key = os.getenv("OPENAI_API_KEY")
        if not openai_api_key:
            logger.error("OpenAI API key not configured for translation")
            return text
            
        try:
            openai.api_key = openai_api_key
            
            response = openai.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": f"Translate to {target_language}. Return ONLY the translated text."},
                    {"role": "user", "content": text}
                ],
                temperature=0
            )
            
            translated_text = response.choices[0].message.content.strip()
            logger.info(f"Translated to {target_language}")
            return translated_text
            
        except Exception as e:
            logger.error(f"Translation error: {e}")
            return text

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
                    # Detect gender from selected voice
                    gender = self._detect_gender_from_voice(self.selected_voice)
                    translated_text = gender_aware_translator(text, self.output_language, gender)
                    logger.info(f"🎭 Interview TTS: Using gender-aware translation ({gender}) for {self.output_language}")
                else:
                    translated_text = self.translate_text(text, self.output_language)
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
                self.output_language = settings["language"].lower()
            
            logger.info(f"🔧 Google TTS settings updated: speed {old_speed} → {self.selected_speed}, voice: {self.selected_voice}, model: {self.selected_model}")
            return True
        except Exception as e:
            logger.error(f"Error updating settings: {e}")
            return False

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

    def get_available_models(self) -> list:
        """Get available Google TTS models"""
        return [
            {"id": "neural2", "name": "Optimal", "speed": "Fastest", "quality": "High"},
            {"id": "wavenet", "name": "Best Quality", "speed": "Slower", "quality": "Premium"},
            {"id": "standard", "name": "Best Speed", "speed": "Ultra Fast", "quality": "Basic"}
        ]
    
    def get_available_voices(self, language: str = None) -> dict:
        """Get available voices for a language using Google Cloud TTS API"""
        target_lang = language or self.output_language
        
        if not self.google_credentials:
            logger.error("Google Cloud TTS credentials not configured")
            return {"male": [], "female": []}
        
        try:
            from google.cloud import texttospeech
            
            # Initialize client
            client = texttospeech.TextToSpeechClient()
            
            # Map language to Google TTS language code
            language_code_mapping = {
                "english": "en-US",
                "hindi": "hi-IN", 
                "spanish": "es-ES",
                "french": "fr-FR",
                "german": "de-DE",
                "italian": "it-IT",
                "portuguese": "pt-BR",
                "russian": "ru-RU",
                "japanese": "ja-JP",
                "korean": "ko-KR",
                "mandarin": "zh-CN",
                "arabic": "ar-XA",
                "dutch": "nl-NL",
                "turkish": "tr-TR",
                "vietnamese": "vi-VN",
                "thai": "th-TH",
                "indonesian": "id-ID",
                "bengali": "bn-IN",
                "telugu": "te-IN",
                "marathi": "mr-IN",
                "tamil": "ta-IN",
                "gujarati": "gu-IN",
                "urdu": "ur-IN",
                "kannada": "kn-IN"
            }
            
            language_code = language_code_mapping.get(target_lang, "en-US")
            
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
                    "name": voice_name,  # Use actual voice ID as name
                    "model": model,
                    "gender": gender,
                    "language": target_lang,
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
            
            logger.info(f"Filtered to {len(result['male']) + len(result['female'])} voices for {target_lang}")
            logger.info(f"Voice counts by model: neural2={len([v for v in result['male'] + result['female'] if v['model'] == 'neural2'])}, "
                       f"wavenet={len([v for v in result['male'] + result['female'] if v['model'] == 'wavenet'])}, "
                       f"standard={len([v for v in result['male'] + result['female'] if v['model'] == 'standard'])}")
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting voices from Google Cloud TTS: {e}")
            # Fallback to hardcoded mapping only on error
            if target_lang in self.voice_mapping:
                logger.warning(f"Using fallback hardcoded voices for {target_lang}")
                return self._get_fallback_voices(target_lang)
            else:
                return {"male": [], "female": []}
    
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

    def _get_fallback_voices(self, target_lang: str) -> dict:
        """Fallback method using hardcoded voices when API fails"""
        lang_voices = self.voice_mapping[target_lang]
        result = {"male": [], "female": []}
        
        for model in ["neural2", "wavenet", "standard"]:
            if model in lang_voices:
                for gender in ["male", "female"]:
                    if gender in lang_voices[model]:
                        voice_id = lang_voices[model][gender]
                        
                        result[gender].append({
                            "id": voice_id,
                            "name": voice_id,  # Use actual voice ID
                            "model": model,
                            "gender": gender,
                            "language": target_lang
                        })
        
        return result

    def _detect_gender_from_voice(self, voice_id: str) -> str:
        """Detect gender from Google TTS voice ID"""
        try:
            # Google TTS voice naming pattern: xx-XX-Model-Letter
            # Generally: A = Female, B/C/D/E/F/G/H/I/J... = Male
            if not voice_id:
                return "neutral"
            
            # Extract the last character/identifier from voice ID
            parts = voice_id.split('-')
            if len(parts) >= 4:
                last_part = parts[-1]  # e.g., "A", "B", "F", etc.
                # Handle complex suffixes like "Algenib", "HD", etc.
                if len(last_part) > 1:
                    # Extract first letter for complex names
                    letter = last_part[0].upper()
                else:
                    letter = last_part.upper()
                
                # A = Female, everything else = Male (B, C, D, F, etc.)
                return "female" if letter == 'A' else "male"
            
            return "neutral"
        except Exception as e:
            logger.warning(f"Could not detect gender from voice {voice_id}: {e}")
            return "neutral"
    
    def _get_voice_name(self, voice_id: str) -> str:
        """Extract a friendly name from voice ID"""
        voice_names = {
            # English voices
            "en-US-Neural2-D": "Marcus",
            "en-US-Neural2-F": "Emma",
            "en-US-Neural2-A": "Alice", 
            "en-US-Neural2-C": "Charlotte",
            "en-US-Neural2-E": "Elizabeth",
            "en-US-Neural2-G": "Grace",
            "en-US-Neural2-H": "Henry",
            "en-US-Neural2-I": "Isabella",
            "en-US-Neural2-J": "James",
            
            # Hindi voices  
            "hi-IN-Neural2-A": "Priya",
            "hi-IN-Neural2-B": "Arjun",
            "hi-IN-Neural2-C": "Chandra",
            "hi-IN-Neural2-D": "Deepak",
            
            # Spanish voices
            "es-ES-Neural2-A": "Sofia",
            "es-ES-Neural2-B": "Diego",
            "es-ES-Neural2-C": "Carmen",
            "es-ES-Neural2-F": "Fernando",
            
            # French voices
            "fr-FR-Neural2-A": "Amélie", 
            "fr-FR-Neural2-B": "Bernard",
            "fr-FR-Neural2-C": "Céline",
            "fr-FR-Neural2-D": "Didier",
            
            # German voices
            "de-DE-Neural2-A": "Anna",
            "de-DE-Neural2-B": "Bernd", 
            "de-DE-Neural2-C": "Claudia",
            "de-DE-Neural2-F": "Friedrich",
            
            # Italian voices
            "it-IT-Neural2-A": "Alessandra",
            "it-IT-Neural2-C": "Carlo",
            
            # Arabic voices
            "ar-XA-Neural2-A": "Layla",
            "ar-XA-Neural2-B": "Omar",
            "ar-XA-Neural2-C": "Zahra",
            "ar-XA-Neural2-D": "Hassan",
            
            # Add more languages as needed...
        }
        
        # If we have a friendly name, use it
        if voice_id in voice_names:
            return voice_names[voice_id]
        
        # Otherwise, extract a meaningful name from the voice ID
        # Format is usually: xx-XX-Model-Letter (e.g., en-US-Neural2-D)
        parts = voice_id.split('-')
        if len(parts) >= 4:
            model = parts[2]  # Neural2, Wavenet, Standard
            letter = parts[3]  # A, B, C, D, etc.
            return f"{model}-{letter}"
        else:
            return voice_id.split('-')[-1]

    def get_supported_languages(self) -> list:
        """Get list of supported languages for Google TTS"""
        return [
            {"code": "english", "name": "English"},
            {"code": "hindi", "name": "Hindi"},
            # Add other supported languages...
        ]

    def is_language_supported(self, language: str) -> bool:
        """Check if a language is supported by Google TTS"""
        return language.lower() in self.supported_languages 