"""
Audio Settings and TTS API Endpoints
"""

import os
import logging
import base64
import openai
from fastapi import APIRouter, HTTPException, Request
from .models import VoicePreviewRequest

logger = logging.getLogger(__name__)
router = APIRouter()

# Audio processor will be set from main server
audio_processor = None

def set_audio_processor(processor):
    """Set the audio processor from main server"""
    global audio_processor
    audio_processor = processor

@router.get("/languages")
async def get_supported_languages():
    """Get list of supported output languages"""
    try:
        languages = audio_processor.get_supported_languages()
        return {"languages": languages}
    except Exception as e:
        logger.error(f"Error getting languages: {e}")
        raise HTTPException(status_code=500, detail="Failed to get supported languages")

@router.get("/voices")
async def get_available_voices():
    """Get list of available TTS voices"""
    try:
        voices = audio_processor.get_available_voices()
        return {"voices": voices}
    except Exception as e:
        logger.error(f"Error getting voices: {e}")
        raise HTTPException(status_code=500, detail="Failed to get available voices")

@router.post("/voice-preview")
async def generate_voice_preview(request: Request):
    """Generate a voice preview sample"""
    try:
        data = await request.json()
        text = data.get("text", "Hello, this is a preview of my voice.")
        voice = data.get("voice", "nova")
        language = data.get("language", "english")
        speed = float(data.get("speed", 1.0))
        
        # Clamp speed to valid range
        speed = max(0.25, min(4.0, speed))
        
        # Temporarily set the output language for preview
        original_language = audio_processor.output_language
        audio_processor.output_language = language
        
        # Generate preview audio using OpenAI TTS with specified voice and speed
        
        # Translate preview text if needed
        if language != "english":
            preview_text = audio_processor.translate_text(text, language)
        else:
            preview_text = text
            
        response = openai.audio.speech.create(
            model="tts-1",
            voice=voice,
            input=preview_text,
            speed=speed
        )
        
        # Convert to base64
        audio_base64 = base64.b64encode(response.content).decode('utf-8')
        
        # Restore original language
        audio_processor.output_language = original_language
        
        return {"audio": audio_base64}
        
    except Exception as e:
        logger.error(f"Error generating voice preview: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate voice preview")

@router.post("/settings")
async def update_audio_settings(request: Request):
    """Update audio settings (language, voice, and speed)"""
    try:
        data = await request.json()
        output_language = data.get("output_language", "english")
        voice = data.get("voice", "nova")
        speed = float(data.get("speed", 1.0))
        
        # Clamp speed to valid range
        speed = max(0.25, min(2.0, speed))  # Using 2.0 as max per user request
        
        # Validate language
        supported_languages = [lang["code"] for lang in audio_processor.get_supported_languages()]
        if output_language not in supported_languages:
            raise HTTPException(status_code=400, detail=f"Unsupported language: {output_language}")
        
        # Validate voice
        available_voices = [voice_item["id"] for voice_item in audio_processor.get_available_voices()]
        if voice not in available_voices:
            raise HTTPException(status_code=400, detail=f"Unsupported voice: {voice}")
        
        # Update processor settings
        audio_processor.set_output_language(output_language)
        
        # Store preferences
        os.environ["SELECTED_VOICE"] = voice
        os.environ["SELECTED_SPEED"] = str(speed)
        
        logger.info(f"Audio settings updated: language={output_language}, voice={voice}, speed={speed}x")
        
        return {
            "status": "success",
            "settings": {
                "output_language": output_language,
                "voice": voice,
                "speed": speed
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating audio settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to update audio settings")

@router.get("/settings")
async def get_audio_settings():
    """Get current audio settings"""
    try:
        current_language = audio_processor.output_language
        current_voice = os.getenv("SELECTED_VOICE", "nova")
        current_speed = float(os.getenv("SELECTED_SPEED", "1.0"))
        
        return {
            "output_language": current_language,
            "voice": current_voice,
            "speed": current_speed,
            "available_languages": audio_processor.get_supported_languages(),
            "available_voices": audio_processor.get_available_voices()
        }
        
    except Exception as e:
        logger.error(f"Error getting audio settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to get audio settings")

# Google TTS API Endpoints

@router.get("/google-tts/models")
async def get_google_tts_models():
    """Get list of available Google TTS models"""
    try:
        models = audio_processor.get_available_models()
        return {"models": models}
    except Exception as e:
        logger.error(f"Error getting Google TTS models: {e}")
        raise HTTPException(status_code=500, detail="Failed to get Google TTS models")

@router.get("/google-tts/voices")
async def get_google_tts_voices(language: str = "english"):
    """Get list of available Google TTS voices for a language"""
    try:
        voices = audio_processor.get_available_voices(language)
        return {"voices": voices, "language": language}
    except Exception as e:
        logger.error(f"Error getting Google TTS voices: {e}")
        raise HTTPException(status_code=500, detail="Failed to get Google TTS voices")

@router.post("/google-tts-settings")
async def update_google_tts_settings(request: Request):
    """Update Google TTS settings (model, voice, speed, language)"""
    try:
        data = await request.json()
        
        # Extract settings
        model = data.get("model")
        voice = data.get("voice") 
        speed = data.get("speed")
        language = data.get("output_language")
        
        # Validate and prepare settings dict
        settings = {}
        
        if language:
            # Validate language
            supported_languages = [lang["code"] for lang in audio_processor.get_supported_languages()]
            if language not in supported_languages:
                raise HTTPException(status_code=400, detail=f"Unsupported language: {language}")
            settings["language"] = language
            
        if model:
            # Validate model
            available_models = [m["id"] for m in audio_processor.get_available_models()]
            if model not in available_models:
                raise HTTPException(status_code=400, detail=f"Unsupported model: {model}")
            settings["model"] = model
            
        if voice:
            settings["voice"] = voice
            
        if speed is not None:
            # Validate speed range
            speed = float(speed)
            if speed < 0.25 or speed > 4.0:
                raise HTTPException(status_code=400, detail="Speed must be between 0.25 and 4.0")
            settings["speed"] = speed
        
        # Update Google TTS settings
        success = audio_processor.update_google_tts_settings(settings)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update Google TTS settings")
        
        # Store in environment variables for persistence
        if "model" in settings:
            os.environ["GOOGLE_TTS_MODEL"] = settings["model"]
        if "voice" in settings:
            os.environ["GOOGLE_TTS_VOICE"] = settings["voice"]
        if "speed" in settings:
            os.environ["GOOGLE_TTS_SPEED"] = str(settings["speed"])
        if "language" in settings:
            os.environ["OUTPUT_LANGUAGE"] = settings["language"]
        
        logger.info(f"Google TTS settings updated: {settings}")
        
        return {
            "status": "success",
            "settings": settings
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating Google TTS settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to update Google TTS settings")

@router.get("/google-tts-settings")
async def get_google_tts_settings():
    """Get current Google TTS settings"""
    try:
        current_model = os.getenv("GOOGLE_TTS_MODEL", "neural2")
        current_voice = os.getenv("GOOGLE_TTS_VOICE", "en-US-Neural2-F")
        current_speed = float(os.getenv("GOOGLE_TTS_SPEED", "1.0"))
        current_language = os.getenv("OUTPUT_LANGUAGE", "english")
        
        return {
            "model": current_model,
            "voice": current_voice,
            "speed": current_speed,
            "output_language": current_language,
            "available_models": audio_processor.get_available_models(),
            "available_languages": audio_processor.get_supported_languages()
        }
        
    except Exception as e:
        logger.error(f"Error getting Google TTS settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to get Google TTS settings")

@router.post("/google-tts/voice-preview")
async def generate_google_voice_preview(request: Request):
    """Generate a voice preview using Google TTS"""
    try:
        data = await request.json()
        voice_id = data.get("voice_id")
        text = data.get("text", "Hello, I will guide you.")
        language = data.get("language", "english").lower()
        gender = data.get("gender", "neutral").lower()
        speed = data.get("speed", 1.0)
        
        if not voice_id:
            raise HTTPException(status_code=400, detail="voice_id is required")
        
        logger.info(f"🎤 Voice preview request: voice_id={voice_id}, language={language}, gender={gender}, speed={speed}")
        
        # Generate preview audio with language translation, gender awareness, and speed
        audio_base64 = await audio_processor.play_voice_preview(voice_id, text, language, gender, speed)
        
        if not audio_base64:
            raise HTTPException(status_code=500, detail="Failed to generate voice preview")
        
        return {"audio": audio_base64}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating Google voice preview: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate Google voice preview")

@router.post("/translate")
async def translate_text(request: Request):
    """Translate text to specified language"""
    try:
        data = await request.json()
        text = data.get("text")
        target_language = data.get("target_language", "english").lower()
        gender = data.get("gender", "neutral").lower()
        
        if not text:
            raise HTTPException(status_code=400, detail="text is required")
        
        # Use audio processor's translation method with gender awareness
        translated_text = audio_processor.translate_text(text, target_language, gender)
        
        return {"translated_text": translated_text}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error translating text: {e}")
        raise HTTPException(status_code=500, detail="Failed to translate text")

@router.post("/translate")
async def translate_text(request: Request):
    """Translate text to specified language"""
    try:
        data = await request.json()
        text = data.get("text")
        target_language = data.get("target_language", "english").lower()
        gender = data.get("gender", "neutral").lower()
        
        if not text:
            raise HTTPException(status_code=400, detail="text is required")
        
        # Use audio processor's translation method with gender awareness
        translated_text = audio_processor.translate_text(text, target_language, gender)
        
        return {"translated_text": translated_text}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error translating text: {e}")
        raise HTTPException(status_code=500, detail="Failed to translate text") 