import asyncio
import base64
import io
import logging
import os
import tempfile
from typing import Optional

import openai
import requests

logger = logging.getLogger(__name__)

class AudioProcessor:
    def __init__(self):
        # Initialize OpenAI
        self.openai_api_key = os.getenv("personal")
        if self.openai_api_key:
            openai.api_key = self.openai_api_key
        else:
            logger.warning("OPENAI_API_KEY not found in environment variables")
        
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
        
        if self.output_language not in self.supported_languages:
            logger.warning(f"Unsupported output language: {self.output_language}. Defaulting to English.")
            self.output_language = "english"
        
        logger.info(f"Audio processor initialized with output language: {self.output_language}")
    
    def translate_text(self, text: str, target_language: str) -> str:
        """Translate text to the target language using OpenAI's API"""
        if not self.openai_api_key:
            logger.error("OpenAI API key not configured")
            return text
            
        target_lang = self.language_mapping.get(target_language.lower(), target_language)
        
        try:
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
                        "content": f"You are a translator. Translate the given text to {target_lang}. Return ONLY the translated text, nothing else.{special_instructions}"
                    },
                    {
                        "role": "user", 
                        "content": text
                    }
                ],
                temperature=0
            )
            
            translated_text = response.choices[0].message.content.strip()
            logger.info(f"Translated '{text[:50]}...' to {target_lang}")
            return translated_text
            
        except Exception as e:
            logger.error(f"Translation error: {e}")
            return text
    
    async def speech_to_text(self, audio_data: str) -> str:
        """Convert base64 encoded audio to text using OpenAI Whisper"""
        if not self.openai_api_key:
            logger.error("OpenAI API key not configured")
            return ""
            
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
                logger.info(f"Transcribed: {result_text[:100]}...")
                
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
            logger.error(f"Speech-to-text error: {e}")
            return ""
    
    async def text_to_speech(self, text: str, speed: float = 1.0) -> str:
        """Convert text to speech using OpenAI TTS and return base64 encoded audio"""
        if not self.openai_api_key:
            logger.error("OpenAI API key not configured")
            return ""
            
        try:
            # Translate text if output language is not English
            if self.output_language != "english":
                translated_text = self.translate_text(text, self.output_language)
                logger.info(f"Original: {text[:50]}...")
                logger.info(f"Translated to {self.output_language}: {translated_text[:50]}...")
            else:
                translated_text = text
                logger.info(f"Using original text (English): {text[:50]}...")
            
            # Get selected voice from environment or use default
            selected_voice = os.getenv("SELECTED_VOICE", "onyx")
            
            # Get selected speed from environment or use provided speed
            selected_speed = float(os.getenv("SELECTED_SPEED", str(speed)))
            
            # Clamp speed to OpenAI's supported range (0.25 - 4.0)
            selected_speed = max(0.25, min(4.0, selected_speed))
            
            # Generate speech using OpenAI TTS
            response = openai.audio.speech.create(
                model="tts-1",  # Using tts-1 for speed as requested
                voice=selected_voice,  # Use selected voice
                input=translated_text,
                speed=selected_speed  # Add speed parameter
            )
            
            # Convert response to base64
            audio_base64 = base64.b64encode(response.content).decode('utf-8')
            
            logger.info(f"Generated OpenAI TTS in {self.output_language} using voice '{selected_voice}' at {selected_speed}x speed for: {translated_text[:50]}...")
            return audio_base64
            
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
    
    def get_available_voices(self) -> list:
        """Get list of available OpenAI TTS voices with categorization"""
        return [
            # Professional/Clinical voices
            {
                "id": "onyx", 
                "name": "Onyx", 
                "category": "professional",
                "description": "Deep, authoritative voice"
            },
            {
                "id": "echo", 
                "name": "Echo", 
                "category": "professional",
                "description": "Clear, crisp voice"
            },
            {
                "id": "alloy", 
                "name": "Alloy", 
                "category": "professional",
                "description": "Balanced, trustworthy voice"
            },
            # Warm/Compassionate voices
            {
                "id": "shimmer", 
                "name": "Shimmer", 
                "category": "warm",
                "description": "Soft, gentle voice"
            },
            {
                "id": "nova", 
                "name": "Nova", 
                "category": "warm",
                "description": "Bright, friendly voice"
            },
            {
                "id": "fable", 
                "name": "Fable", 
                "category": "warm",
                "description": "Expressive, engaging voice"
            }
        ]
    
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
            logger.info(f"Output language changed to: {language}")
            return True
        else:
            logger.warning(f"Unsupported language: {language}")
            return False

