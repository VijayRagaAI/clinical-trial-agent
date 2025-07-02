import logging
import os
import openai
from typing import Optional
from .language_manager import LanguageManager

logger = logging.getLogger(__name__)

class TranslationService:
    """Service for text translation using OpenAI with gender awareness"""
    
    def __init__(self, language_manager: LanguageManager):
        self.language_manager = language_manager
        
        # Initialize OpenAI API key for translation
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        if self.openai_api_key:
            openai.api_key = self.openai_api_key
            logger.info("OpenAI API key configured for translation")
        else:
            logger.warning("OPENAI_API_KEY not found in environment variables")
    
    def translate_text(self, text: str, target_language: str, gender: str = "neutral") -> str:
        """
        Translate text to the target language using OpenAI's API with gender awareness
        
        Args:
            text: Text to translate
            target_language: Target language code (e.g., 'english', 'hindi')
            gender: Speaker gender for gender-aware languages ('male', 'female', 'neutral')
            
        Returns:
            str: Translated text or original text if translation fails
        """
        if not self.openai_api_key:
            logger.error("OpenAI API key not configured")
            return text
        
        # Validate target language
        if not self.language_manager.is_language_supported(target_language):
            logger.warning(f"Unsupported target language: {target_language}")
            return text
            
        target_lang = self.language_manager.get_language_display_name(target_language)
        
        try:
            # Build gender-aware instructions for specific languages
            gender_instructions = self._build_gender_instructions(target_language, gender)
            
            # Build language-specific instructions
            special_instructions = self._build_language_instructions(target_language)
            
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
            logger.info(f"Translated text to {target_language} (gender: {gender})")
            return translated_text
            
        except Exception as e:
            logger.error(f"Translation error: {e}")
            return text
    
    def _build_gender_instructions(self, target_language: str, gender: str) -> str:
        """Build gender-aware instructions for specific languages"""
        if gender.lower() not in ["male", "female"]:
            return ""
        
        gender_instructions = ""
        
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
        
        return gender_instructions
    
    def _build_language_instructions(self, target_language: str) -> str:
        """Build language-specific translation instructions"""
        special_instructions = ""
        
        if target_language.lower() == "english":
            # When translating TO English, detect source language automatically
            special_instructions = " Detect the source language automatically and translate to clear, natural English."
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
        
        return special_instructions
    
    def detect_gender_from_voice_id(self, voice_id: str) -> str:
        """
        Detect gender from Google TTS voice ID for gender-aware translation
        
        Args:
            voice_id: Google TTS voice ID (e.g., 'en-US-Neural2-F')
            
        Returns:
            str: 'male', 'female', or 'neutral'
        """
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
    
    def get_supported_languages(self) -> list:
        """Get list of supported languages for translation"""
        return self.language_manager.get_supported_languages_list() 