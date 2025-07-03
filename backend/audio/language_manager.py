import logging
from typing import List, Dict

logger = logging.getLogger(__name__)

class LanguageManager:
    """Service for managing languages, mappings, and validation"""
    
    def __init__(self):
        # Supported languages - Indian languages + Top 15 World languages
        self.supported_languages = [
            # Indian languages
            "english", "hindi", "bengali", "telugu", "marathi", 
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
            "urdu": "ur-IN",  # Use India variant as supported by Google Cloud STT
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
        
        # Language-specific confidence thresholds for STT
        self.confidence_thresholds = {
            "en-US": 0.20,  # More lenient for Indian accents in English
            "en-IN": 0.20,  # Indian English baseline
            "ur-IN": 0.4,   # Urdu needs higher confidence
            "ar-XA": 0.35,  # Arabic needs higher confidence  
            "bn-IN": 0.35,  # Bengali needs higher confidence
            "ta-IN": 0.35,  # Tamil needs higher confidence
            "te-IN": 0.35,  # Telugu needs higher confidence
            "kn-IN": 0.35,  # Kannada needs higher confidence
            "gu-IN": 0.35,  # Gujarati needs higher confidence
            "mr-IN": 0.35,  # Marathi needs higher confidence
        }
        
        # Languages that support latest_short model (limited set)
        self.latest_short_supported = [
            "en-US", "en-GB", "es-ES", "fr-FR", "de-DE", "it-IT", 
            "ja-JP", "ko-KR", "pt-BR", "ru-RU", "hi-IN", "zh-CN"
        ]
    
    def is_language_supported(self, language: str) -> bool:
        """Check if a language is supported"""
        return language.lower() in self.supported_languages
    
    def get_language_display_name(self, language_code: str) -> str:
        """Get display name for a language code"""
        return self.language_mapping.get(language_code.lower(), language_code)
    
    def get_google_language_code(self, language: str) -> str:
        """Get Google STT language code for a language"""
        return self.google_language_mapping.get(language.lower(), "en-US")
    
    def get_confidence_threshold(self, google_language_code: str) -> float:
        """Get confidence threshold for a Google language code"""
        return self.confidence_thresholds.get(google_language_code, 0.25)
    
    def supports_latest_short_model(self, google_language_code: str) -> bool:
        """Check if language supports Google's latest_short model"""
        return google_language_code in self.latest_short_supported
    
    def get_stt_language_config(self, language: str) -> Dict:
        """
        Get complete STT configuration for a language
        
        Args:
            language: Language code (e.g., 'english', 'hindi')
            
        Returns:
            dict: STT configuration including primary language, alternatives, model, etc.
        """
        current_language = language.lower()
        target_language_code = self.get_google_language_code(current_language)
        
        if current_language == "english":
            # When English is selected, use US English as primary for speed, Indian English as alternative
            primary_language = "en-US"
            alternative_languages = ["en-IN"]  # Indian English for accent recognition
        elif current_language == "hindi":
            # When Hindi is selected, use Hindi as primary for speed, Indian English as alternative
            primary_language = "hi-IN"
            alternative_languages = ["en-IN"]  # Indian English for accent recognition
        elif current_language == "urdu":
            # Special handling for Urdu: use Hindi as alternative since they share phonetics
            primary_language = target_language_code  # ur-IN
            alternative_languages = ["hi-IN", "en-US"]  # Hindi and English as alternatives
        else:
            # When non-English is selected, use that language as primary and English as fallback
            primary_language = target_language_code
            alternative_languages = ["en-US"]  # Both US and Indian English
        
        # Use appropriate model based on language support
        model_to_use = "latest_short" if self.supports_latest_short_model(primary_language) else "default"
        
        return {
            "primary_language": primary_language,
            "alternative_languages": alternative_languages,
            "model": model_to_use,
            "confidence_threshold": self.get_confidence_threshold(primary_language)
        }
    
    def get_supported_languages_list(self) -> List[Dict[str, str]]:
        """Get list of supported languages for API responses"""
        return [
            {"code": code, "name": self.get_language_display_name(code)}
            for code in self.supported_languages
        ]
    
    def validate_and_normalize_language(self, language: str) -> str:
        """
        Validate and normalize a language code
        
        Args:
            language: Language code to validate
            
        Returns:
            str: Normalized language code, defaults to 'english' if invalid
        """
        normalized = language.lower()
        if normalized not in self.supported_languages:
            logger.warning(f"Unsupported language: {language}. Defaulting to English.")
            return "english"
        return normalized 