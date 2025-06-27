import asyncio
import base64
import io
import logging
import os
import tempfile
from typing import Optional

import assemblyai as aai
from elevenlabs import VoiceSettings
from elevenlabs.client import ElevenLabs
import requests

logger = logging.getLogger(__name__)

class AudioProcessor:
    def __init__(self):
        # Initialize AssemblyAI
        self.assembly_api_key = os.getenv("ASSEMBLYAI_API_KEY")
        if self.assembly_api_key:
            aai.settings.api_key = self.assembly_api_key
            self.transcriber = aai.Transcriber()
        else:
            logger.warning("ASSEMBLYAI_API_KEY not found in environment variables")
            self.transcriber = None
        
        # Initialize ElevenLabs
        self.elevenlabs_api_key = os.getenv("ELEVENLABS_API_KEY")
        if self.elevenlabs_api_key:
            self.elevenlabs_client = ElevenLabs(api_key=self.elevenlabs_api_key)
            # Default voice ID (you can change this to any ElevenLabs voice)
            self.voice_id = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")  # Rachel voice
        else:
            logger.warning("ELEVENLABS_API_KEY not found in environment variables")
            self.elevenlabs_client = None
    
    async def speech_to_text(self, audio_data: str) -> str:
        """Convert base64 encoded audio to text using AssemblyAI"""
        if not self.transcriber:
            logger.error("AssemblyAI not configured - missing API key")
            return ""
            
        try:
            # Decode base64 audio data
            audio_bytes = base64.b64decode(audio_data)
            
            # Create temporary file for audio
            with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as temp_file:
                temp_file.write(audio_bytes)
                temp_file.flush()
                
                # Transcribe using AssemblyAI
                config = aai.TranscriptionConfig(
                    speech_model=aai.SpeechModel.nano,  # Fast model for real-time
                    language_detection=True,
                    punctuate=True,
                    format_text=True
                )
                
                transcript = self.transcriber.transcribe(temp_file.name, config=config)
                
                # Clean up temporary file
                os.unlink(temp_file.name)
                
                if transcript.status == aai.TranscriptStatus.error:
                    logger.error(f"AssemblyAI transcription error: {transcript.error}")
                    return ""
                
                result_text = transcript.text or ""
                logger.info(f"Transcribed: {result_text[:100]}...")
                return result_text.strip()
                
        except Exception as e:
            logger.error(f"Speech-to-text error: {e}")
            return ""
    
    async def text_to_speech(self, text: str) -> str:
        """Convert text to speech using ElevenLabs and return base64 encoded audio"""
        if not self.elevenlabs_client:
            logger.error("ElevenLabs not configured - missing API key")
            return ""
            
        try:
            # Generate speech using ElevenLabs
            response = self.elevenlabs_client.text_to_speech.convert(
                voice_id=self.voice_id,
                optimize_streaming_latency="0",
                output_format="mp3_22050_32",
                text=text,
                model_id="eleven_multilingual_v2",  # High quality model
                voice_settings=VoiceSettings(
                    stability=0.71,
                    similarity_boost=0.75,
                    style=0.0,
                    use_speaker_boost=True,
                )
            )
            
            # Convert response to base64
            audio_bytes = b"".join(response)
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            
            logger.info(f"Generated ElevenLabs TTS for: {text[:50]}...")
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
        """Get list of available ElevenLabs voices"""
        if not self.elevenlabs_client:
            return []
            
        try:
            voices = self.elevenlabs_client.voices.get_all()
            return [{"id": voice.voice_id, "name": voice.name} for voice in voices.voices]
        except Exception as e:
            logger.error(f"Error fetching voices: {e}")
            return []

