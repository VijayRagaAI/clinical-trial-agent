import asyncio
import base64
import io
import logging
import os
import tempfile
from typing import Optional

import openai
import requests
from tools.google_tts import GoogleTTS

logger = logging.getLogger(__name__)

class AudioProcessor:
    def __init__(self):
        # Initialize OpenAI for translation and Whisper fallback
        self.openai_api_key = os.getenv("personal")
        if self.openai_api_key:
            openai.api_key = self.openai_api_key
        else:
            logger.warning("OPENAI_API_KEY not found in environment variables")
        
        # Initialize Google Speech-to-Text credentials
        self.google_credentials = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        if self.google_credentials:
            logger.info("Google Speech-to-Text credentials configured")
        else:
            logger.warning("Google credentials not found, will use Whisper for all languages")
        
        # Initialize Google TTS
        self.google_tts = GoogleTTS()
        
        # Get output language from environment, default to English
        self.output_language = os.getenv("OUTPUT_LANGUAGE", "english").lower()
        
        # Supported languages - Indian languages + Top 15 World languages
        self.supported_languages = [
            # Existing Indian languages
            "english", "hindi", "bhojpuri", "bengali", "telugu", "marathi", 
            "tamil", "gujarati", "urdu", "kannada",
            # Top 15 World languages
            "mandarin", "spanish", "french", "arabic", "portuguese", 
            "russian", "japanese", "german", "korean", "italian", 
            "turkish", "vietnamese", "thai", "indonesian", "dutch"
        ]
        
        # Language mapping for proper names
        self.language_mapping = {
            # Indian languages
            "english": "English",
            "hindi": "Hindi", 
            "bhojpuri": "Bhojpuri",
            "bengali": "Bengali",
            "telugu": "Telugu", 
            "marathi": "Marathi",
            "tamil": "Tamil",
            "gujarati": "Gujarati",
            "urdu": "Urdu",
            "kannada": "Kannada",
            # World languages
            "mandarin": "Chinese (Mandarin)",
            "spanish": "Spanish",
            "french": "French",
            "arabic": "Arabic",
            "portuguese": "Portuguese",
            "russian": "Russian",
            "japanese": "Japanese",
            "german": "German",
            "korean": "Korean",
            "italian": "Italian",
            "turkish": "Turkish",
            "vietnamese": "Vietnamese",
            "thai": "Thai",
            "indonesian": "Indonesian",
            "dutch": "Dutch"
        }
        
        # Google Speech-to-Text language mapping
        self.google_language_mapping = {
            "english": "en-US",
            "hindi": "hi-IN", 
            "bengali": "bn-IN",
            "telugu": "te-IN",
            "marathi": "mr-IN",
            "tamil": "ta-IN",
            "gujarati": "gu-IN",
            "urdu": "ur-IN",
            "kannada": "kn-IN",
            "mandarin": "zh-CN",
            "spanish": "es-ES",
            "french": "fr-FR",
            "arabic": "ar-XA",
            "portuguese": "pt-BR",
            "russian": "ru-RU",
            "japanese": "ja-JP",
            "german": "de-DE",
            "korean": "ko-KR",
            "italian": "it-IT",
            "turkish": "tr-TR",
            "vietnamese": "vi-VN",
            "thai": "th-TH",
            "indonesian": "id-ID",
            "dutch": "nl-NL"
        }
        
        # Languages NOT supported by Google (fallback to Whisper)
        self.whisper_only_languages = ["bhojpuri"]
        
        if self.output_language not in self.supported_languages:
            logger.warning(f"Unsupported output language: {self.output_language}. Defaulting to English.")
            self.output_language = "english"
        
        logger.info(f"Audio processor initialized with output language: {self.output_language}")
    
    def translate_text(self, text: str, target_language: str, gender: str = "neutral") -> str:
        """Translate text to the target language using OpenAI's API with gender awareness"""
        if not self.openai_api_key:
            logger.error("OpenAI API key not configured")
            return text
            
        target_lang = self.language_mapping.get(target_language.lower(), target_language)
        
        try:
            # Gender-aware instructions for specific languages
            gender_instructions = ""
            logger.info(f"🔄 Gender-aware translation: language={target_language}, gender={gender}")
            
            if gender.lower() in ["male", "female"]:
                if target_language.lower() == "hindi":
                    if gender.lower() == "male":
                        gender_instructions = " The speaker is male, so use masculine verb forms (e.g., 'karunga', 'hoon', 'tha') and masculine adjectives."
                    else:
                        gender_instructions = " The speaker is female, so use feminine verb forms (e.g., 'karungi', 'hoon', 'thi') and feminine adjectives."
                elif target_language.lower() == "spanish":
                    if gender.lower() == "male":
                        gender_instructions = " The speaker is male, so use masculine adjectives and past participles (e.g., 'estoy listo', 'soy contento')."
                    else:
                        gender_instructions = " The speaker is female, so use feminine adjectives and past participles (e.g., 'estoy lista', 'soy contenta')."
                elif target_language.lower() == "french":
                    if gender.lower() == "male":
                        gender_instructions = " The speaker is male, so use masculine adjectives and past participles (e.g., 'je suis content', 'je suis prêt')."
                    else:
                        gender_instructions = " The speaker is female, so use feminine adjectives and past participles (e.g., 'je suis contente', 'je suis prête')."
                elif target_language.lower() == "italian":
                    if gender.lower() == "male":
                        gender_instructions = " The speaker is male, so use masculine adjectives and past participles (e.g., 'sono contento', 'sono pronto')."
                    else:
                        gender_instructions = " The speaker is female, so use feminine adjectives and past participles (e.g., 'sono contenta', 'sono pronta')."
                elif target_language.lower() == "portuguese":
                    if gender.lower() == "male":
                        gender_instructions = " The speaker is male, so use masculine adjectives and past participles (e.g., 'estou contente', 'sou brasileiro')."
                    else:
                        gender_instructions = " The speaker is female, so use feminine adjectives and past participles (e.g., 'estou contente', 'sou brasileira')."
                elif target_language.lower() == "russian":
                    if gender.lower() == "male":
                        gender_instructions = " The speaker is male, so use masculine verb forms and adjectives in past tense and predicative constructions."
                    else:
                        gender_instructions = " The speaker is female, so use feminine verb forms and adjectives in past tense and predicative constructions."
                elif target_language.lower() == "german":
                    if gender.lower() == "male":
                        gender_instructions = " The speaker is male, so use masculine forms when referring to the speaker's profession or status."
                    else:
                        gender_instructions = " The speaker is female, so use feminine forms when referring to the speaker's profession or status."
                elif target_language.lower() in ["urdu", "bengali", "gujarati", "marathi", "tamil", "telugu", "kannada"]:
                    if gender.lower() == "male":
                        gender_instructions = " The speaker is male, so use appropriate masculine verb forms and adjectives according to the language's gender system."
                    else:
                        gender_instructions = " The speaker is female, so use appropriate feminine verb forms and adjectives according to the language's gender system."
            
            # Special instructions for specific languages
            special_instructions = ""
            if target_language.lower() == "english":
                # When translating TO English, detect source language automatically
                special_instructions = " Detect the source language automatically and translate to clear, natural English."
            elif target_language.lower() == "bhojpuri":
                special_instructions = " For Bhojpuri, use proper Bhojpuri language and script."
            elif target_language.lower() == "urdu":
                special_instructions = " For Urdu, use proper Urdu script and vocabulary."
            elif target_language.lower() == "tamil":
                special_instructions = " For Tamil, use proper Tamil script and authentic vocabulary."
            elif target_language.lower() == "kannada":
                special_instructions = " For Kannada, use proper Kannada script and vocabulary."
            elif target_language.lower() == "telugu":
                special_instructions = " For Telugu, use proper Telugu script and vocabulary."
            elif target_language.lower() == "bengali":
                special_instructions = " For Bengali, use proper Bengali script and vocabulary."
            elif target_language.lower() == "marathi":
                special_instructions = " For Marathi, use proper Marathi script and vocabulary."
            elif target_language.lower() == "gujarati":
                special_instructions = " For Gujarati, use proper Gujarati script and vocabulary."
            elif target_language.lower() == "mandarin":
                special_instructions = " For Mandarin Chinese, use proper Simplified Chinese characters and vocabulary."
            elif target_language.lower() == "spanish":
                special_instructions = " For Spanish, use proper Spanish vocabulary and grammar."
            elif target_language.lower() == "french":
                special_instructions = " For French, use proper French vocabulary, grammar, and accents."
            elif target_language.lower() == "arabic":
                special_instructions = " For Arabic, use proper Arabic script (RTL) and vocabulary."
            elif target_language.lower() == "portuguese":
                special_instructions = " For Portuguese, use proper Portuguese vocabulary and grammar."
            elif target_language.lower() == "russian":
                special_instructions = " For Russian, use proper Cyrillic script and vocabulary."
            elif target_language.lower() == "japanese":
                special_instructions = " For Japanese, use proper mix of Hiragana, Katakana, and Kanji as appropriate."
            elif target_language.lower() == "german":
                special_instructions = " For German, use proper German vocabulary and grammar."
            elif target_language.lower() == "korean":
                special_instructions = " For Korean, use proper Hangul script and vocabulary."
            elif target_language.lower() == "italian":
                special_instructions = " For Italian, use proper Italian vocabulary and grammar."
            elif target_language.lower() == "turkish":
                special_instructions = " For Turkish, use proper Turkish vocabulary and grammar."
            elif target_language.lower() == "vietnamese":
                special_instructions = " For Vietnamese, use proper Vietnamese diacritics and vocabulary."
            elif target_language.lower() == "thai":
                special_instructions = " For Thai, use proper Thai script and vocabulary."
            elif target_language.lower() == "indonesian":
                special_instructions = " For Indonesian, use proper Indonesian vocabulary and grammar."
            elif target_language.lower() == "dutch":
                special_instructions = " For Dutch, use proper Dutch vocabulary and grammar."
            
            response = openai.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system", 
                        "content": f"You are a translator. Translate the given text to {target_lang}. Return ONLY the translated text, nothing else.{special_instructions}{gender_instructions}"
                    },
                    {
                        "role": "user", 
                        "content": text
                    }
                ],
                temperature=0
            )
            
            translated_text = response.choices[0].message.content.strip()
            logger.info(f"✅ Translated '{text[:50]}...' to {target_lang} (gender: {gender})")
            logger.info(f"📝 Result: {translated_text}")
            return translated_text
            
        except Exception as e:
            logger.error(f"Translation error: {e}")
            return text
    
    async def speech_to_text(self, audio_data: str) -> str:
        """Convert base64 encoded audio to text using Google STT with Whisper fallback"""
        
        # Check if target language needs Whisper fallback
        if self.output_language in self.whisper_only_languages:
            logger.info(f"Using Whisper for unsupported language: {self.output_language}")
            return await self.whisper_speech_to_text(audio_data)
        
        # Check if target language is supported by Google
        if self.output_language not in self.google_language_mapping:
            logger.warning(f"Target language {self.output_language} not in Google mapping, using Whisper")
            return await self.whisper_speech_to_text(audio_data)
        
        # Try Google Speech-to-Text first
        try:
            return await self.google_speech_to_text(audio_data)
        except Exception as e:
            logger.warning(f"Google STT failed for {self.output_language}, falling back to Whisper: {e}")
            return await self.whisper_speech_to_text(audio_data)

    async def google_speech_to_text(self, audio_data: str) -> str:
        """Google Speech-to-Text with English primary + target language secondary"""
        if not self.google_credentials:
            raise Exception("Google Speech-to-Text credentials not configured")
            
        try:
            # Decode base64 audio data
            audio_bytes = base64.b64decode(audio_data)
            
            # Check audio duration - reject very short clips
            if len(audio_bytes) < 2000:  # Less than ~0.1 seconds of audio
                return "Please speak clearly."
            
            # Google STT setup
            from google.cloud import speech
            client = speech.SpeechClient()
            
            # Simple: English primary, target language secondary
            primary_language = "en-US"  # Always English for medical processing
            target_language_code = self.google_language_mapping[self.output_language]
            
            # Only add target as alternative if it's different from English
            alternative_languages = []
            if self.output_language != "english":
                alternative_languages = [target_language_code]
            
            config = speech.RecognitionConfig(
                encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
                sample_rate_hertz=48000,
                language_code=primary_language,
                alternative_language_codes=alternative_languages,
                
                # Medical optimizations - using standard model for free tier
                use_enhanced=False,  # Stay in free tier, faster response
                enable_automatic_punctuation=True,
                enable_word_confidence=True,
                model="latest_short",  # Optimized for short audio clips
                max_alternatives=1,
                profanity_filter=False,
            )
            
            # Perform recognition
            audio = speech.RecognitionAudio(content=audio_bytes)
            response = client.recognize(config=config, audio=audio)
            
            # Handle results
            if not response.results:
                return "Please speak clearly."
                
            result = response.results[0]
            transcript = result.alternatives[0].transcript.strip()
            confidence = result.alternatives[0].confidence
            
            if not transcript or confidence < 0.15:
                return "Please speak clearly."
            
            # Log confidence for monitoring but don't reject based on it
            logger.info(f"Google STT (en-US + {self.output_language}) - {confidence:.2f} confidence: {transcript[:50]}...")
            
            # Translation if needed (user spoke in native language, we got it transcribed)
            if self.output_language != "english" and transcript:
                return self.translate_text(transcript, "english")
            else:
                return transcript
                
        except Exception as e:
            logger.error(f"Google Speech-to-text error: {e}")
            raise  # Re-raise to trigger Whisper fallback

    async def whisper_speech_to_text(self, audio_data: str) -> str:
        """Whisper fallback implementation for unsupported languages"""
        if not self.openai_api_key:
            return "Error: OpenAI API key not configured for Whisper fallback"
            
        try:
            # Decode base64 audio data
            audio_bytes = base64.b64decode(audio_data)
            
            # Create temporary file for audio
            with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as temp_file:
                temp_file.write(audio_bytes)
                temp_file.flush()
                
                # Transcribe using OpenAI Whisper
                with open(temp_file.name, "rb") as audio_file:
                    transcription = openai.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file,
                        response_format="text"
                    )
                
                # Clean up temporary file
                os.unlink(temp_file.name)
                
                result_text = transcription.strip() if transcription else ""
                
                # Handle empty/gibberish results better
                if not result_text or len(result_text.strip()) < 2:
                    return "I didn't catch that. Can you please repeat that again?"
                
                logger.info(f"Whisper fallback: {result_text[:50]}...")
                
                # If output language is not English, user likely spoke in their native language
                # So we need to translate their input TO English for processing
                if self.output_language != "english" and result_text:
                    english_text = self.translate_text(result_text, "english")
                    logger.info(f"User spoke in {self.output_language}: {result_text[:50]}...")
                    logger.info(f"Translated to English for processing: {english_text[:50]}...")
                    return english_text
                else:
                    logger.info(f"Using original transcribed text (English): {result_text[:50]}...")
                    return result_text
                
        except Exception as e:
            logger.error(f"Whisper fallback error: {e}")
            return f"Error: Speech recognition failed - {str(e)}"
    
    async def text_to_speech(self, text: str, speed: float = 1.0) -> str:
        """Convert text to speech using Google TTS and return base64 encoded audio"""
        try:
            # Use Google TTS for text-to-speech with gender-aware translation
            return await self.google_tts.text_to_speech(text, speed, self.translate_text)
            
        except Exception as e:
            logger.error(f"Text-to-speech error: {e}")
            return ""
    
    def validate_audio_format(self, audio_data: str) -> bool:
        """Validate that audio data is in correct format"""
        try:
            audio_bytes = base64.b64decode(audio_data)
            # Basic validation - check if it's not empty and has reasonable size
            return len(audio_bytes) > 1000  # At least 1KB
        except Exception:
            return False
    
    def get_available_models(self) -> list:
        """Get list of available Google TTS models"""
        return self.google_tts.get_available_models()
    
    def get_available_voices(self, language: str = None) -> dict:
        """Get list of available Google TTS voices for a language"""
        return self.google_tts.get_available_voices(language)
    
    def get_supported_languages(self) -> list:
        """Get list of supported output languages"""
        return [
            # Indian languages
            {"code": "english", "name": "English"},
            {"code": "hindi", "name": "Hindi"},
            {"code": "bhojpuri", "name": "Bhojpuri"},
            {"code": "bengali", "name": "Bengali"},
            {"code": "telugu", "name": "Telugu"},
            {"code": "marathi", "name": "Marathi"},
            {"code": "tamil", "name": "Tamil"},
            {"code": "gujarati", "name": "Gujarati"},
            {"code": "urdu", "name": "Urdu"},
            {"code": "kannada", "name": "Kannada"},
            # World languages
            {"code": "mandarin", "name": "Mandarin Chinese"},
            {"code": "spanish", "name": "Spanish"},
            {"code": "french", "name": "French"},
            {"code": "arabic", "name": "Arabic"},
            {"code": "portuguese", "name": "Portuguese"},
            {"code": "russian", "name": "Russian"},
            {"code": "japanese", "name": "Japanese"},
            {"code": "german", "name": "German"},
            {"code": "korean", "name": "Korean"},
            {"code": "italian", "name": "Italian"},
            {"code": "turkish", "name": "Turkish"},
            {"code": "vietnamese", "name": "Vietnamese"},
            {"code": "thai", "name": "Thai"},
            {"code": "indonesian", "name": "Indonesian"},
            {"code": "dutch", "name": "Dutch"}
        ]
    
    def set_output_language(self, language: str) -> bool:
        """Set the output language for TTS"""
        language = language.lower()
        if language in self.supported_languages:
            self.output_language = language
            # Update Google TTS language as well
            self.google_tts.update_settings({"language": language})
            logger.info(f"Output language changed to: {language}")
            return True
        else:
            logger.warning(f"Unsupported language: {language}")
            return False
    
    def update_google_tts_settings(self, settings: dict) -> bool:
        """Update Google TTS settings"""
        return self.google_tts.update_settings(settings)
    
    async def play_voice_preview(self, voice_id: str, text: str = None, language: str = "english", gender: str = "neutral", speed: float = 1.0) -> str:
        """Generate voice preview using Google TTS"""
        preview_text = text or "Hello, I will guide you."
        
        # Translate the preview text to the selected language if not English
        if language != "english":
            preview_text = self.translate_text(preview_text, language, gender)
        
        return await self.google_tts.play_voice_preview(voice_id, preview_text, speed)

