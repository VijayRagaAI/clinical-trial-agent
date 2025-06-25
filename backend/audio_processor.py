import asyncio
import base64
import io
import logging
import os
import tempfile
import wave
from typing import Optional

import numpy as np
import whisper
from gtts import gTTS
import pygame

logger = logging.getLogger(__name__)

class AudioProcessor:
    def __init__(self):
        # Initialize pygame mixer for audio playback
        pygame.mixer.init()
        
        # Initialize Whisper model
        self.whisper_model = whisper.load_model("base")
    
    async def speech_to_text(self, audio_data: str) -> str:
        """Convert base64 encoded audio to text using Whisper"""
        try:
            # Decode base64 audio data
            audio_bytes = base64.b64decode(audio_data)
            
            # Create temporary file for audio
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
                temp_file.write(audio_bytes)
                temp_file.flush()
                
                # Use Whisper for transcription
                result = self.whisper_model.transcribe(temp_file.name)
                transcript = result["text"]
                
                # Clean up temporary file
                os.unlink(temp_file.name)
                
                logger.info(f"Transcribed: {transcript[:100]}...")
                return transcript.strip()
                
        except Exception as e:
            logger.error(f"Speech-to-text error: {e}")
            return ""
    
    async def text_to_speech(self, text: str, use_openai: bool = False) -> str:
        """Convert text to speech and return base64 encoded audio"""
        try:
            # Always use Google TTS since we don't have OpenAI
            return await self._google_tts(text)
        except Exception as e:
            logger.error(f"Text-to-speech error: {e}")
            return ""
    
    async def _google_tts(self, text: str) -> str:
        """Generate speech using Google TTS"""
        try:
            # Create gTTS object
            tts = gTTS(text=text, lang="en", slow=False)
            
            # Save to bytes buffer
            audio_buffer = io.BytesIO()
            tts.write_to_fp(audio_buffer)
            audio_buffer.seek(0)
            
            # Convert to base64
            audio_base64 = base64.b64encode(audio_buffer.read()).decode('utf-8')
            
            logger.info(f"Generated Google TTS for: {text[:50]}...")
            return audio_base64
            
        except Exception as e:
            logger.error(f"Google TTS error: {e}")
            raise
    
    def play_audio_locally(self, audio_base64: str):
        """Play audio locally (for testing)"""
        try:
            audio_bytes = base64.b64decode(audio_base64)
            
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as temp_file:
                temp_file.write(audio_bytes)
                temp_file.flush()
                
                pygame.mixer.music.load(temp_file.name)
                pygame.mixer.music.play()
                
                # Wait for playback to finish
                while pygame.mixer.music.get_busy():
                    pygame.time.Clock().tick(10)
                
                os.unlink(temp_file.name)
                
        except Exception as e:
            logger.error(f"Audio playback error: {e}")
    
    async def convert_webm_to_wav(self, webm_data: bytes) -> bytes:
        """Convert WebM audio to WAV format (basic implementation)"""
        # For now, assume the audio is already in a compatible format
        # You can add pydub conversion here if needed
        return webm_data
    
    def validate_audio_format(self, audio_data: str) -> bool:
        """Validate that audio data is in correct format"""
        try:
            audio_bytes = base64.b64decode(audio_data)
            # Basic validation - check if it's not empty and has reasonable size
            return len(audio_bytes) > 1000  # At least 1KB
        except Exception:
            return False

