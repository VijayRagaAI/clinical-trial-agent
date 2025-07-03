import React, { useState, useEffect } from 'react';
import { X, Settings, Globe, Mic, Volume2, CheckCircle, Play, VolumeX, Languages, Cpu, Users, Zap, Crown, Diamond, Rocket } from 'lucide-react';
import { apiService, AudioPlayer } from '../services/api';

interface GoogleTTSModel {
  id: string;
  name: string;
  speed: string;
  quality: string;
  voiceCount: number;
  icon: string;
}

interface GoogleVoice {
  id: string;
  name: string;
  gender: 'male' | 'female';
  model: string;
  language: string;
  style?: string;
  description?: string;
  language_code?: string;
  natural_sample_rate?: number;
  characteristics?: {
    category: string;
    tone: string;
    pitch: string;
    personality: string;
  };
}

interface GoogleTTSSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  selectedLanguage: string;
  selectedModel: string;
  selectedVoice: string;
  selectedSpeed: number;
  onLanguageChange: (language: string) => void;
  onModelChange: (model: string) => void;
  onVoiceChange: (voice: string) => void;
  onSpeedChange: (speed: number) => void;
  onSave: () => void;
}

const GOOGLE_TTS_MODELS: GoogleTTSModel[] = [
  {
    id: 'neural2',
    name: 'Quantum',
    speed: 'Fastest',
    quality: 'Optimal Balance',
    voiceCount: 0, // Dynamic from backend
    icon: '👑'
  },
  {
    id: 'wavenet',
    name: 'Crystal',
    speed: 'Slower',
    quality: 'Premium Quality',
    voiceCount: 0, // Dynamic from backend
    icon: '💎'
  },
  {
    id: 'standard',
    name: 'Lightning',
    speed: 'Ultra Fast',
    quality: 'Fastest Speed',
    voiceCount: 0, // Dynamic from backend
    icon: '🚀'
  }
];

// Minimal fallback data - should be replaced by backend API
const GOOGLE_VOICES: Record<string, GoogleVoice[]> = {};

// Human-friendly voice names mapping for each language (2 female, 2 male per language)
const VOICE_NAME_MAPPING: Record<string, {female: string[], male: string[]}> = {
  'english': { female: ['Emily', 'Sarah'], male: ['James', 'Michael'] },
  'hindi': { female: ['Priya', 'Chandani'], male: ['Arjun', 'Rohan'] },
  'spanish': { female: ['Sofia', 'Carmen'], male: ['Diego', 'Carlos'] },
  'french': { female: ['Marie', 'Camille'], male: ['Pierre', 'Antoine'] },
  'german': { female: ['Anna', 'Lena'], male: ['Max', 'Stefan'] },
  'italian': { female: ['Giulia', 'Francesca'], male: ['Marco', 'Alessandro'] },
  'portuguese': { female: ['Ana', 'Beatriz'], male: ['João', 'Pedro'] },
  'russian': { female: ['Anastasia', 'Katya'], male: ['Dmitri', 'Alexei'] },
  'japanese': { female: ['Yuki', 'Sakura'], male: ['Hiroshi', 'Takeshi'] },
  'korean': { female: ['Minji', 'Seoyeon'], male: ['Minho', 'Jaehyun'] },
  'mandarin': { female: ['Wei Lin', 'Xiu Mei'], male: ['Li Wei', 'Chen Ming'] },
  'arabic': { female: ['Fatima', 'Aisha'], male: ['Omar', 'Ahmed'] },
  'dutch': { female: ['Emma', 'Sophie'], male: ['Lars', 'Daan'] },
  'turkish': { female: ['Elif', 'Zeynep'], male: ['Emre', 'Mehmet'] },
  'vietnamese': { female: ['Linh', 'Mai'], male: ['Duc', 'Nam'] },
  'thai': { female: ['Siriporn', 'Ploy'], male: ['Somchai', 'Niran'] },
  'indonesian': { female: ['Sari', 'Indira'], male: ['Budi', 'Ravi'] },
  'tamil': { female: ['Lakshmi', 'Meera'], male: ['Ravi', 'Karthik'] },
  'bengali': { female: ['Rima', 'Ishita'], male: ['Arjun', 'Rahul'] },
  'telugu': { female: ['Swathi', 'Ananya'], male: ['Vikram', 'Ravi'] },
  'marathi': { female: ['Priyanka', 'Neha'], male: ['Amit', 'Suresh'] },
  'gujarati': { female: ['Kavya', 'Diya'], male: ['Jay', 'Nirav'] },
  'urdu': { female: ['Zara', 'Ayesha'], male: ['Hassan', 'Ali'] },
  'kannada': { female: ['Deepika', 'Shruthi'], male: ['Arun', 'Kiran'] }
};

const SUPPORTED_LANGUAGES = [
  { code: 'english', name: '🇺🇸 English', flag: '🇺🇸' },
  { code: 'hindi', name: '🇮🇳 Hindi (हिंदी)', flag: '🇮🇳' },
  { code: 'spanish', name: '🇪🇸 Spanish (Español)', flag: '🇪🇸' },
  { code: 'french', name: '🇫🇷 French (Français)', flag: '🇫🇷' },
  { code: 'german', name: '🇩🇪 German (Deutsch)', flag: '🇩🇪' },
  { code: 'italian', name: '🇮🇹 Italian (Italiano)', flag: '🇮🇹' },
  { code: 'portuguese', name: '🇧🇷 Portuguese (Português)', flag: '🇧🇷' },
  { code: 'russian', name: '🇷🇺 Russian (Русский)', flag: '🇷🇺' },
  { code: 'japanese', name: '🇯🇵 Japanese (日本語)', flag: '🇯🇵' },
  { code: 'korean', name: '🇰🇷 Korean (한국어)', flag: '🇰🇷' },
  { code: 'mandarin', name: '🇨🇳 Chinese (中文)', flag: '🇨🇳' },
  { code: 'arabic', name: '🇸🇦 Arabic (العربية)', flag: '🇸🇦' },
  { code: 'dutch', name: '🇳🇱 Dutch (Nederlands)', flag: '🇳🇱' },
  { code: 'turkish', name: '🇹🇷 Turkish (Türkçe)', flag: '🇹🇷' },
  { code: 'vietnamese', name: '🇻🇳 Vietnamese (Tiếng Việt)', flag: '🇻🇳' },
  { code: 'thai', name: '🇹🇭 Thai (ไทย)', flag: '🇹🇭' },
  { code: 'indonesian', name: '🇮🇩 Indonesian (Bahasa)', flag: '🇮🇩' },
  { code: 'tamil', name: '🇮🇳 Tamil (தமிழ்)', flag: '🇮🇳' },
  { code: 'bengali', name: '🇧🇩 Bengali (বাংলা)', flag: '🇧🇩' },
  { code: 'telugu', name: '🇮🇳 Telugu (తెలుగు)', flag: '🇮🇳' },
  { code: 'marathi', name: '🇮🇳 Marathi (मराठी)', flag: '🇮🇳' },
  { code: 'gujarati', name: '🇮🇳 Gujarati (ગુજરાતી)', flag: '🇮🇳' },
  { code: 'urdu', name: '🇵🇰 Urdu (اردو)', flag: '🇵🇰' },
  { code: 'kannada', name: '🇮🇳 Kannada (ಕನ್ನಡ)', flag: '🇮🇳' }
];

// Function to get human-friendly voice name
const getHumanVoiceName = (voice: GoogleVoice, language: string, voiceIndex: number): string => {
  const languageMapping = VOICE_NAME_MAPPING[language];
  if (!languageMapping) {
    // Fallback to technical name if language mapping doesn't exist
    return voice.name || voice.id;
  }
  
  const genderNames = voice.gender === 'female' ? languageMapping.female : languageMapping.male;
  if (!genderNames || genderNames.length === 0) {
    // Fallback to technical name if no names for this gender
    return voice.name || voice.id;
  }
  
  // Use modulo to cycle through available names
  const nameIndex = voiceIndex % genderNames.length;
  return genderNames[nameIndex];
};

// Function to get all voices with human names for display
const getVoicesWithHumanNames = (voices: GoogleVoice[], language: string): (GoogleVoice & { humanName: string })[] => {
  const femaleVoices = voices.filter(v => v.gender === 'female');
  const maleVoices = voices.filter(v => v.gender === 'male');
  
  const enhancedVoices: (GoogleVoice & { humanName: string })[] = [];
  
  // Add female voices with human names
  femaleVoices.forEach((voice, index) => {
    enhancedVoices.push({
      ...voice,
      humanName: getHumanVoiceName(voice, language, index)
    });
  });
  
  // Add male voices with human names
  maleVoices.forEach((voice, index) => {
    enhancedVoices.push({
      ...voice,
      humanName: getHumanVoiceName(voice, language, index)
    });
  });
  
  return enhancedVoices;
};

export const GoogleTTSSettings: React.FC<GoogleTTSSettingsProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  selectedLanguage,
  selectedModel,
  selectedVoice,
  selectedSpeed,
  onLanguageChange,
  onModelChange,
  onVoiceChange,
  onSpeedChange,
  onSave
}) => {
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<GoogleTTSModel[]>(GOOGLE_TTS_MODELS);
  const [availableLanguages, setAvailableLanguages] = useState(SUPPORTED_LANGUAGES);
  const [availableVoices, setAvailableVoices] = useState<Record<string, GoogleVoice[]>>({});
  const [loading, setLoading] = useState(false);
  const [audioPlayer] = useState(new AudioPlayer());
  const [previewText, setPreviewText] = useState<string>("Hello, this is your selected voice speaking. I will guide you.");
  
  // Load data from backend when component opens
  useEffect(() => {
    if (isOpen) {
      console.log(`🚀 Component opened - Initial state: language=${selectedLanguage}, model=${selectedModel}, voice=${selectedVoice}`);
      loadBackendData();
    }
  }, [isOpen]);

  // Load voices when language or model changes
  useEffect(() => {
    if (isOpen && selectedLanguage) {
      console.log(`🔄 Loading voices for language: ${selectedLanguage}, current model: ${selectedModel}, current voice: ${selectedVoice}`);
      loadVoicesForLanguage(selectedLanguage);
    }
  }, [isOpen, selectedLanguage, selectedModel]);

  // Note: Removed delayed selection useEffect - now handled by main voice selection logic

  // Note: Removed language change useEffect - voice selection now only happens after voices are loaded

  // Handle voice selection when voices become available (initial load or language change)
  useEffect(() => {
    if (isOpen && selectedLanguage && availableVoices[selectedLanguage] && availableVoices[selectedLanguage].length > 0) {
      const voices = availableVoices[selectedLanguage] || [];
      console.log(`🎯 Voices loaded for ${selectedLanguage}: ${voices.length} voices available`);
      
      // Always try to select optimal model/voice when voices are available
      // This handles both initial selection and language changes
      const currentModelVoices = voices.filter(v => v.model === selectedModel);
      
      // Force reselection in these cases:
      // 1. No model or voice selected (initial state)
      // 2. Current model has no voices for this language
      // 3. No voice selected for current model
      const needsSelection = !selectedModel || !selectedVoice || currentModelVoices.length === 0 || 
                           !currentModelVoices.some(v => v.id === selectedVoice);
      
      if (needsSelection) {
        console.log(`🎯 Voice selection needed for ${selectedLanguage} - model: ${selectedModel}, voice: ${selectedVoice}, needsSelection: ${needsSelection}`);
        selectOptimalModelAndVoice(true); // Force selection to get best available
      } else {
        console.log(`✅ Current selection valid for ${selectedLanguage} - model: ${selectedModel}, voice: ${selectedVoice}`);
      }
    }
  }, [availableVoices[selectedLanguage]]); // Trigger when voices for current language change

  // When model changes manually, auto-select a default voice for that model
  useEffect(() => {
    if (isOpen && selectedLanguage && selectedModel && availableVoices[selectedLanguage]) {
      const voices = availableVoices[selectedLanguage] || [];
      selectDefaultVoice(selectedModel, selectedVoice, voices);
    }
  }, [selectedModel]); // Only trigger when model changes

  // Translate preview text when language or voice changes
  useEffect(() => {
    if (isOpen && selectedLanguage) {
      translatePreviewText();
    }
  }, [isOpen, selectedLanguage, selectedVoice]);

  const loadBackendData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading models and settings from backend...');
      
      // Load models and current settings
      const [modelsResponse, settingsResponse] = await Promise.all([
        apiService.getGoogleTTSModels(),
        apiService.getGoogleTTSSettings()
      ]);
      
      console.log('📥 Models response:', modelsResponse);
      console.log('📥 Settings response:', settingsResponse);
      
      if (modelsResponse && modelsResponse.models) {
        console.log('✅ Loaded models from backend:', modelsResponse.models);
        // Merge backend data with our custom names and keep our creative naming
        const enhancedModels = modelsResponse.models.map((backendModel: any) => {
          const staticModel = GOOGLE_TTS_MODELS.find(m => m.id === backendModel.id);
          return staticModel ? { ...backendModel, ...staticModel } : backendModel;
        });
        setAvailableModels(enhancedModels);
      } else {
        console.warn('⚠️ No models in backend response, using static fallback');
      }
      
      // Update current settings if different
      if (settingsResponse.model && settingsResponse.model !== selectedModel) {
        onModelChange(settingsResponse.model);
      }
      if (settingsResponse.voice && settingsResponse.voice !== selectedVoice) {
        onVoiceChange(settingsResponse.voice);
      }
      if (settingsResponse.speed && settingsResponse.speed !== selectedSpeed) {
        onSpeedChange(settingsResponse.speed);
      }
      if (settingsResponse.output_language && settingsResponse.output_language !== selectedLanguage) {
        onLanguageChange(settingsResponse.output_language);
      }
      
    } catch (error) {
      console.error('❌ Failed to load backend data:', error);
      console.log('🔄 Using static fallback models - backend APIs need to be implemented');
    } finally {
      setLoading(false);
    }
  };

  const loadVoicesForLanguage = async (language: string) => {
    try {
      console.log('🔄 Loading voices from backend for language:', language);
      const response = await apiService.getGoogleTTSVoices(language);
      console.log('📥 Backend response:', response);
      
      if (response && response.voices) {
        console.log('🔍 Raw voices data:', response.voices);
        console.log('🔍 Male voices:', response.voices.male);
        console.log('🔍 Female voices:', response.voices.female);
        
        const maleVoices = response.voices.male || [];
        const femaleVoices = response.voices.female || [];
        
        const loadedVoices = [
          ...maleVoices.map((v: any) => ({ ...v, gender: 'male' })),
          ...femaleVoices.map((v: any) => ({ ...v, gender: 'female' }))
        ];
        console.log('✅ Loaded voices:', loadedVoices);
        console.log('📊 Voice count by model:', {
          neural2: loadedVoices.filter(v => v.model === 'neural2').length,
          wavenet: loadedVoices.filter(v => v.model === 'wavenet').length,
          standard: loadedVoices.filter(v => v.model === 'standard').length
        });
        
        setAvailableVoices(prev => ({
          ...prev,
          [language]: loadedVoices
        }));
      } else {
        console.warn('⚠️ No voices in backend response');
        setAvailableVoices(prev => ({
          ...prev,
          [language]: []
        }));
      }
    } catch (error) {
      console.error('❌ Failed to load voices from backend:', error);
      console.log('🔄 Using empty fallback - backend API needs to be implemented');
      // Use empty array instead of hardcoded data
      setAvailableVoices(prev => ({
        ...prev,
        [language]: GOOGLE_VOICES[language] || []
      }));
    }
  };

  const selectOptimalModelAndVoice = (forceReselection = false) => {
    const voices = availableVoices[selectedLanguage] || [];
    console.log(`🎯 selectOptimalModelAndVoice called: language=${selectedLanguage}, forceReselection=${forceReselection}, availableVoices=${voices.length}`);
    
    // Model priority: neural2 (quantum-default) -> wavenet (crystal) -> standard (lightning)
    const modelPriority = ['neural2', 'wavenet', 'standard'];
    
    let selectedModelToUse = selectedModel;
    let voiceToUse = selectedVoice;
    
    console.log(`🎯 Current state: model=${selectedModel}, voice=${selectedVoice}`);
    
    // Check if current model has voices available
    const currentModelVoices = voices.filter(v => v.model === selectedModel);
    console.log(`🎯 Current model voices: ${currentModelVoices.length}`);
    
    // Find the best available model for the current language
    let bestAvailableModel = null;
    for (const model of modelPriority) {
      const modelVoices = voices.filter(v => v.model === model);
      if (modelVoices.length > 0) {
        bestAvailableModel = model;
        console.log(`✅ Best available model for ${selectedLanguage}: ${model} (${modelVoices.length} voices)`);
        break;
      }
    }
    
    // Auto-select model if:
    // 1. No model is currently selected 
    // 2. Current model has no voices (fallback case)
    // 3. Force reselection (when language changes, always try to pick the best model)
    // 4. Current model is not the best available (upgrade to better model)
    const shouldFallback = !selectedModel || selectedModel === '' || currentModelVoices.length === 0 || 
                          forceReselection || (bestAvailableModel && bestAvailableModel !== selectedModel);
    
    console.log(`🎯 Fallback decision: shouldFallback=${shouldFallback}, bestAvailableModel=${bestAvailableModel}`);
    console.log(`🎯 Fallback reasons: noModel=${!selectedModel || selectedModel === ''}, noVoices=${currentModelVoices.length === 0}, forceReselection=${forceReselection}, betterModel=${bestAvailableModel && bestAvailableModel !== selectedModel}`);
    
    if (shouldFallback && bestAvailableModel) {
      selectedModelToUse = bestAvailableModel;
      
      // Log model change reasons with specific messaging
      if (selectedModelToUse !== selectedModel) {
        if (!selectedModel || selectedModel === '') {
          console.log(`🔄 Initial model selection: ${selectedModelToUse} for ${selectedLanguage}`);
        } else if (currentModelVoices.length === 0) {
          const modelName = selectedModel === 'neural2' ? 'Quantum-default (neural2)' : 
                           selectedModel === 'wavenet' ? 'Crystal (wavenet)' : 'Lightning (standard)';
          const newModelName = selectedModelToUse === 'neural2' ? 'Quantum-default (neural2)' : 
                              selectedModelToUse === 'wavenet' ? 'Crystal (wavenet)' : 'Lightning (standard)';
          console.log(`🔄 ${modelName} has 0 voices for ${selectedLanguage}, falling back to ${newModelName}`);
        } else if (forceReselection) {
          const currentModelName = selectedModel === 'neural2' ? 'Quantum-default' : 
                                  selectedModel === 'wavenet' ? 'Crystal' : 'Lightning';
          const newModelName = selectedModelToUse === 'neural2' ? 'Quantum-default' : 
                              selectedModelToUse === 'wavenet' ? 'Crystal' : 'Lightning';
          console.log(`🔄 Language changed to ${selectedLanguage}: upgrading from ${currentModelName} to ${newModelName} (best available)`);
        } else {
          console.log(`🔄 Upgrading to better model: ${selectedModelToUse} for ${selectedLanguage}`);
        }
        // Update the model selection
        onModelChange(selectedModelToUse);
      }
    } else if (!bestAvailableModel) {
      console.warn(`⚠️ No voices available for any model in ${selectedLanguage}`);
      return; // Don't change anything if no voices are available
    }
    
    // Auto-select voice if needed (using the potentially updated model)
    selectDefaultVoice(selectedModelToUse, voiceToUse, voices);
  };

  const selectDefaultVoice = (modelToUse: string, currentVoice: string, voices: GoogleVoice[]) => {
    // Select default voice for the model if no voice selected or voice not available in current model
    const modelVoices = voices.filter(v => v.model === modelToUse);
    const currentVoiceAvailable = modelVoices.some(v => v.id === currentVoice);
    
    if (modelVoices.length > 0 && (!currentVoice || !currentVoiceAvailable)) {
      // First try to find a female voice (top preference)
      const femaleVoices = modelVoices.filter(v => v.gender === 'female');
      const maleVoices = modelVoices.filter(v => v.gender === 'male');
      
      let defaultVoice;
      if (femaleVoices.length > 0) {
        // Prefer first female voice (typically highest quality)
        defaultVoice = femaleVoices[0];
        console.log(`🎤 Auto-selected top female voice: ${defaultVoice.name}`);
      } else if (maleVoices.length > 0) {
        // Fallback to first male voice
        defaultVoice = maleVoices[0];
        console.log(`🎤 Auto-selected male voice: ${defaultVoice.name}`);
      } else {
        // Fallback to any available voice
        defaultVoice = modelVoices[0];
        console.log(`🎤 Auto-selected voice: ${defaultVoice.name}`);
      }
      
      if (defaultVoice.id !== currentVoice) {
        onVoiceChange(defaultVoice.id);
      }
    }
  };

  // Helper function to detect gender from voice ID
  const detectGenderFromVoiceId = (voiceId: string): string => {
    if (!voiceId) return "neutral";
    
    // Google TTS convention: voices ending with 'A' are typically female, others are male
    // Examples: hi-IN-Neural2-A (female), hi-IN-Neural2-B (male)
    const lastChar = voiceId.split('-').pop()?.charAt(0)?.toUpperCase();
    
    if (lastChar === 'A') {
      return "female";
    } else if (lastChar && /[B-Z]/.test(lastChar)) {
      return "male";
    }
    
    return "neutral";
  };

  const translatePreviewText = async () => {
    try {
      const originalText = "Hello, this is your selected voice speaking. I will guide you.";
      
      if (selectedLanguage === 'english') {
        setPreviewText(originalText);
        return;
      }

      // Get the gender of the selected voice with fallback detection
      const allCurrentVoices = availableVoices[selectedLanguage] || GOOGLE_VOICES[selectedLanguage] || [];
      const selectedVoiceData = allCurrentVoices.find(v => v.id === selectedVoice);
      let voiceGender = selectedVoiceData?.gender || "neutral";
      
      // Fallback: detect gender from voice ID if not found in data
      if (voiceGender === "neutral" && selectedVoice) {
        voiceGender = detectGenderFromVoiceId(selectedVoice);
      }

      console.log('🔄 Translating preview text:', {
        originalText,
        selectedLanguage,
        selectedVoice,
        voiceGender,
        selectedVoiceData: (selectedVoiceData as any)?.humanName,
        detectedFromId: voiceGender
      });

      // Call backend to translate the text with gender awareness
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE_URL}/api/audio/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: originalText,
          target_language: selectedLanguage,
          gender: voiceGender
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Translation successful:', data.translated_text);
        setPreviewText(data.translated_text || originalText);
      } else {
        console.error('❌ Translation response not ok:', response.status);
        // Fallback to original text if translation fails
        setPreviewText(originalText);
      }
    } catch (error) {
      console.error('Translation failed:', error);
      // Fallback to original text
      setPreviewText("Hello, this is your selected voice speaking. I will guide you.");
    }
  };
  
  const currentVoices = availableVoices[selectedLanguage] || GOOGLE_VOICES[selectedLanguage] || [];
  const enhancedVoices = getVoicesWithHumanNames(currentVoices, selectedLanguage);
  const maleVoices = enhancedVoices.filter(v => v.gender === 'male' && v.model === selectedModel);
  const femaleVoices = enhancedVoices.filter(v => v.gender === 'female' && v.model === selectedModel);
  
  // Debug UI state
  console.log('🎨 UI Render State:', {
    selectedLanguage,
    selectedModel,
    allAvailableVoices: availableVoices,
    currentLanguageVoices: availableVoices[selectedLanguage]?.length || 0,
    currentVoices: currentVoices.length,
    maleVoices: maleVoices.length,
    femaleVoices: femaleVoices.length,
    voicesByModel: {
      neural2: currentVoices.filter(v => v.model === 'neural2').length,
      wavenet: currentVoices.filter(v => v.model === 'wavenet').length,
      standard: currentVoices.filter(v => v.model === 'standard').length
    }
  });
  
  const selectedVoiceData = enhancedVoices.find(v => v.id === selectedVoice);
  const selectedModelData = availableModels.find(m => m.id === selectedModel);

  const playVoicePreview = async (voiceId: string) => {
    if (playingVoice) return;
    
    setPlayingVoice(voiceId);
    try {
      // Stop any currently playing audio
      audioPlayer.stop();
      
      // Get the gender of the voice being previewed with fallback detection
      const voiceData = currentVoices.find(v => v.id === voiceId);
      let voiceGender = voiceData?.gender || "neutral";
      
      // Fallback: detect gender from voice ID if not found in data
      if (voiceGender === "neutral" && voiceId) {
        voiceGender = detectGenderFromVoiceId(voiceId);
      }
      
      // Generate preview from backend with selected language and gender at 1x speed (STEP 3 always 1x)
      const shortPreviewText = "Hello, I will guide you.";
      const response = await apiService.generateGoogleVoicePreview(voiceId, shortPreviewText, selectedLanguage, voiceGender, 1.0);
      if (response.audio) {
        await audioPlayer.playBase64Audio(response.audio);
      }
    } catch (error) {
      console.error('Voice preview failed:', error);
    } finally {
      setPlayingVoice(null);
    }
  };

  const playFullPreview = async () => {
    if (playingVoice || !selectedVoice) return;
    
    setPlayingVoice(selectedVoice);
    try {
      // Stop any currently playing audio
      audioPlayer.stop();
      
      // Get the gender of the selected voice with fallback detection
      const selectedVoiceData = enhancedVoices.find(v => v.id === selectedVoice);
      let voiceGender = selectedVoiceData?.gender || "neutral";
      
      // Fallback: detect gender from voice ID if not found in data
      if (voiceGender === "neutral" && selectedVoice) {
        voiceGender = detectGenderFromVoiceId(selectedVoice);
      }
      
      // Use the translated preview text with the selected voice name
      const fullPreviewText = previewText.replace('your selected voice', selectedVoiceData?.humanName || 'your selected voice');
      const response = await apiService.generateGoogleVoicePreview(selectedVoice, fullPreviewText, selectedLanguage, voiceGender, selectedSpeed);
      if (response.audio) {
        await audioPlayer.playBase64Audio(response.audio);
      }
    } catch (error) {
      console.error('Full preview failed:', error);
    } finally {
      setPlayingVoice(null);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Save settings to backend
      await apiService.updateGoogleTTSSettings({
        model: selectedModel,
        voice: selectedVoice,
        speed: selectedSpeed,
        output_language: selectedLanguage
      });
      
      // Call parent save handler
      onSave();
      
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 flex items-center justify-center p-4">
      <div className={`w-full max-w-6xl max-h-[95vh] backdrop-blur-xl rounded-3xl shadow-2xl border transition-all duration-500 overflow-hidden ${
        isDarkMode 
          ? 'bg-gray-800/90 border-gray-700/50' 
          : 'bg-white/90 border-white/20'
      }`}>
        
        {/* Enhanced magical background effects - Indigo/Purple theme */}
        <div className={`absolute inset-0 bg-gradient-to-br opacity-8 transition-all duration-700 rounded-3xl ${
          isDarkMode ? 'from-indigo-500/20 to-purple-500/15' : 'from-indigo-400/15 to-purple-400/15'
        }`}></div>
        <div className={`absolute inset-0 bg-gradient-to-tr opacity-0 hover:opacity-10 transition-all duration-700 rounded-3xl ${
          isDarkMode ? 'from-purple-500/20 to-indigo-500/20' : 'from-purple-400/15 to-indigo-400/15'
        }`}></div>
        
        {/* Floating sparkles - Indigo/Purple theme */}
        <div className="absolute top-4 right-6 w-2 h-2 bg-indigo-400/40 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
        <div className="absolute top-8 right-12 w-1.5 h-1.5 bg-purple-400/30 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
        <div className="absolute bottom-8 left-6 w-2.5 h-2.5 bg-indigo-300/25 rounded-full animate-bounce" style={{animationDelay: '0.6s'}}></div>
        <div className="absolute bottom-4 right-8 w-1 h-1 bg-purple-300/20 rounded-full animate-bounce" style={{animationDelay: '0.9s'}}></div>
        
        {/* Floating decorative rings */}
        <div className="absolute -top-16 -right-16 w-64 h-64 border border-indigo-300/10 rounded-full animate-pulse"></div>
        <div className="absolute -bottom-12 -left-12 w-48 h-48 border border-purple-300/10 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
        
        {/* Enhanced shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-300/10 to-transparent transform -skew-x-12 -translate-x-full animate-shimmer rounded-3xl"></div>
        
        {/* Premium glow effect */}
        <div className={`absolute inset-0 rounded-3xl opacity-0 hover:opacity-30 transition-all duration-700 blur-xl ${
          isDarkMode ? 'bg-indigo-400/20' : 'bg-indigo-400/15'
        }`}></div>
        <div className="overflow-y-auto max-h-[95vh] custom-scrollbar p-8">
          
          {/* Enhanced Header - Indigo/Purple theme */}
          <div className={`relative flex items-center justify-between mb-8 p-6 rounded-2xl backdrop-blur-sm border ${
            isDarkMode 
              ? 'bg-gradient-to-r from-indigo-600/10 via-purple-600/5 to-indigo-600/10 border-indigo-700/10' 
              : 'bg-gradient-to-r from-indigo-50/30 via-purple-50/20 to-indigo-50/30 border-indigo-200/10'
          }`}>
            <div className="absolute top-2 right-8 w-1.5 h-1.5 bg-indigo-400/40 rounded-full animate-bounce"></div>
            <div className="absolute bottom-2 left-8 w-1 h-1 bg-purple-400/30 rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
            
            <div className="flex items-center space-x-4">
              <div className={`relative p-3 rounded-xl backdrop-blur-md border shadow-lg transition-all duration-500 ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-indigo-600/30 via-purple-600/20 to-indigo-600/30 border-indigo-500/40' 
                  : 'bg-gradient-to-br from-indigo-100/90 via-purple-100/70 to-indigo-100/90 border-indigo-300/40'
              }`}>
                <div className={`absolute top-1 right-1 w-2 h-2 rounded-full animate-pulse ${
                  isDarkMode ? 'bg-indigo-400/60' : 'bg-indigo-500/60'
                }`}></div>
                <Settings className={`h-6 w-6 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
              </div>
              
              <div>
                <h3 className={`text-2xl font-black bg-gradient-to-r bg-clip-text text-transparent transition-all duration-500 ${
                  isDarkMode 
                    ? 'from-indigo-400 via-purple-400 to-indigo-400' 
                    : 'from-indigo-600 via-purple-600 to-indigo-600'
                } drop-shadow-lg`}>
                  Voice & Language Settings
                </h3>
                <p className={`text-sm mt-1 transition-all duration-500 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Customize your interview experience
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className={`group relative p-3 rounded-2xl transition-all duration-500 hover:scale-110 hover:rotate-90 backdrop-blur-md border ${
                isDarkMode 
                  ? 'bg-gray-700/50 hover:bg-red-600/30 border-gray-600/50 hover:border-red-500/50' 
                  : 'bg-white/70 hover:bg-red-100/70 border-gray-300/50 hover:border-red-300/50'
              } hover:shadow-2xl hover:shadow-red-500/30`}
            >
              <X className={`h-6 w-6 transition-all duration-300 ${
                isDarkMode ? 'text-gray-300 group-hover:text-red-300' : 'text-gray-600 group-hover:text-red-600'
              }`} />
              <div className="absolute inset-0 bg-red-400/0 group-hover:bg-red-400/20 rounded-2xl transition-all duration-500"></div>
            </button>
          </div>

          {/* Language Selection - Indigo/Purple theme */}
          <div className={`relative p-6 rounded-2xl backdrop-blur-sm border shadow-lg mb-6 ${
            isDarkMode 
              ? 'bg-gray-700/10 border-gray-600/10' 
              : 'bg-white/15 border-gray-200/10'
          }`}>
            <div className="absolute top-3 right-3 w-2 h-2 bg-indigo-400/40 rounded-full animate-pulse"></div>
            
            <div className="flex items-center space-x-4 mb-4">
              <div className={`relative p-4 rounded-2xl transition-all duration-500 shadow-xl group ${
                isDarkMode ? 'bg-gradient-to-br from-indigo-600/30 to-purple-600/20 border border-indigo-400/30' : 'bg-gradient-to-br from-indigo-100/90 to-purple-100/70 border border-indigo-300/40'
              }`}>
                <div className={`absolute top-1 right-1 w-2 h-2 rounded-full animate-pulse ${
                  isDarkMode ? 'bg-indigo-400/60' : 'bg-indigo-500/60'
                }`}></div>
                <Languages className={`h-7 w-7 ${isDarkMode ? 'text-indigo-300' : 'text-indigo-600'} drop-shadow-lg transition-transform duration-500 group-hover:rotate-12`} />
              </div>
              <div>
                <h4 className={`text-xl font-black bg-gradient-to-r bg-clip-text text-transparent ${
                  isDarkMode 
                    ? 'from-indigo-400 via-purple-400 to-indigo-400' 
                    : 'from-indigo-600 via-purple-600 to-indigo-600'
                } drop-shadow-lg`}>
                  Language Selection
                </h4>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-indigo-300/70' : 'text-indigo-600/70'}`}>
                  Choose your preferred language
                </p>
              </div>
            </div>
            
            <select
              value={selectedLanguage}
              onChange={(e) => onLanguageChange(e.target.value)}
              className={`w-full p-5 rounded-2xl border-2 backdrop-blur-xl transition-all duration-500 hover:scale-105 shadow-xl hover:shadow-2xl text-lg font-bold ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-gray-700/80 via-gray-600/70 to-gray-700/80 border-blue-400/60 text-white focus:ring-4 focus:ring-blue-400/40 hover:border-purple-400/80' 
                  : 'bg-gradient-to-br from-white/90 via-gray-50/80 to-white/90 border-blue-500/60 text-gray-900 focus:ring-4 focus:ring-blue-500/40 hover:border-purple-500/80'
              } focus:outline-none focus:border-indigo-500/80`}
            >
              {availableLanguages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Model Selection - Indigo/Purple theme */}
          <div className={`relative p-6 rounded-2xl backdrop-blur-sm border shadow-lg mb-6 ${
            isDarkMode 
              ? 'bg-gray-700/10 border-gray-600/10' 
              : 'bg-white/15 border-gray-200/10'
          }`}>
            <div className="absolute top-3 right-3 w-2 h-2 bg-purple-400/40 rounded-full animate-pulse"></div>
            
            <div className="flex items-center space-x-4 mb-6">
              <div className={`relative p-4 rounded-2xl transition-all duration-500 shadow-xl group ${
                isDarkMode ? 'bg-gradient-to-br from-purple-600/30 to-indigo-600/20 border border-purple-400/30' : 'bg-gradient-to-br from-purple-100/90 to-indigo-100/70 border border-purple-300/40'
              }`}>
                <div className={`absolute top-1 right-1 w-2 h-2 rounded-full animate-pulse ${
                  isDarkMode ? 'bg-purple-400/60' : 'bg-purple-500/60'
                }`}></div>
                <Cpu className={`h-7 w-7 ${isDarkMode ? 'text-purple-300' : 'text-purple-600'} drop-shadow-lg transition-transform duration-500 group-hover:rotate-12`} />
              </div>
                              <div>
                <h4 className={`text-xl font-black bg-gradient-to-r bg-clip-text text-transparent ${
                  isDarkMode 
                    ? 'from-purple-400 via-indigo-400 to-purple-400' 
                    : 'from-purple-600 via-indigo-600 to-purple-600'
                } drop-shadow-lg`}>
                  AI Model Selection
                </h4>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-indigo-300/70' : 'text-indigo-600/70'}`}>
                  Choose quality vs speed balance
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {availableModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => onModelChange(model.id)}
                  className={`relative p-5 rounded-2xl border transition-all duration-500 hover:scale-102 hover:-translate-y-1 group overflow-hidden ${
                    selectedModel === model.id
                      ? isDarkMode
                        ? 'bg-gradient-to-br from-indigo-600/40 via-purple-600/30 to-indigo-600/40 border-indigo-400/70 shadow-xl shadow-indigo-500/30'
                        : 'bg-gradient-to-br from-indigo-200/90 via-purple-200/80 to-indigo-200/90 border-indigo-400/70 shadow-xl shadow-indigo-400/30'
                      : isDarkMode
                        ? 'bg-gradient-to-br from-indigo-700/30 via-purple-700/25 to-indigo-700/30 border-indigo-600/40 hover:border-indigo-400/60 hover:shadow-lg hover:shadow-indigo-500/20'
                        : 'bg-gradient-to-br from-indigo-50/90 via-purple-50/80 to-indigo-50/90 border-indigo-200/50 hover:border-indigo-300/60 hover:shadow-lg hover:shadow-indigo-300/20'
                  }`}
                >
                  {/* Subtle selected glow effect */}
                  {selectedModel === model.id && (
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/8 via-purple-400/4 to-indigo-400/8 rounded-2xl animate-pulse"></div>
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-all duration-500 rounded-2xl from-indigo-400/20 to-purple-400/15"></div>
                  
                  <div className="relative space-y-4">
                    {/* Enhanced header with better selected indicators */}
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-xl transition-all duration-300 ${
                        selectedModel === model.id
                          ? isDarkMode ? 'bg-indigo-500/30 shadow-md' : 'bg-indigo-300/80 shadow-md'
                          : isDarkMode ? 'bg-indigo-600/20' : 'bg-indigo-100/60'
                      }`}>
                        {model.icon === '👑' && <Crown className={`h-7 w-7 transition-all duration-300 ${selectedModel === model.id ? 'text-yellow-400 drop-shadow-md' : isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />}
                        {model.icon === '💎' && <Diamond className={`h-7 w-7 transition-all duration-300 ${selectedModel === model.id ? 'text-blue-400 drop-shadow-md' : isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />}
                        {model.icon === '🚀' && <Rocket className={`h-7 w-7 transition-all duration-300 ${selectedModel === model.id ? 'text-orange-400 drop-shadow-md' : isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />}
                      </div>
                      
                      {/* Simplified Selected Badge */}
                      {selectedModel === model.id && (
                        <div className="flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full animate-pulse ${
                            isDarkMode ? 'bg-indigo-400' : 'bg-indigo-600'
                          }`}></div>
                          <span className={`text-xs font-bold ${
                            isDarkMode ? 'text-indigo-300' : 'text-indigo-700'
                          }`}>
                            SELECTED
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Model name and feature */}
                    <div className="text-center space-y-1">
                      <span className={`text-lg font-black block ${
                        selectedModel === model.id
                          ? isDarkMode ? 'text-indigo-300' : 'text-indigo-700'
                          : isDarkMode ? 'text-indigo-300' : 'text-indigo-700'
                      }`}>
                        {model.name}
                      </span>
                      <span className={`text-sm font-semibold block ${
                        selectedModel === model.id
                          ? isDarkMode ? 'text-purple-300/90' : 'text-purple-700/90'
                          : isDarkMode ? 'text-purple-400/70' : 'text-purple-600/70'
                      }`}>
                        {model.quality}
                      </span>
                    </div>
                    
                    {/* Enhanced Stats grid */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className={`p-3 rounded-lg border transition-all duration-300 ${
                        selectedModel === model.id
                          ? isDarkMode ? 'bg-indigo-600/25 border-indigo-400/30 shadow-sm' : 'bg-indigo-100/70 border-indigo-400/40 shadow-sm'
                          : isDarkMode ? 'bg-indigo-600/15 border-indigo-500/20' : 'bg-indigo-100/40 border-indigo-300/25'
                      }`}>
                        <div className="flex items-center space-x-2">
                          <Zap className={`h-4 w-4 ${selectedModel === model.id ? 'text-yellow-400' : isDarkMode ? 'text-indigo-400' : 'text-indigo-500'}`} />
                          <span className="font-bold">Speed</span>
                        </div>
                        <span className={`text-xs ${selectedModel === model.id ? isDarkMode ? 'text-indigo-300' : 'text-indigo-700' : isDarkMode ? 'text-indigo-300' : 'text-indigo-600'}`}>
                          {model.speed}
                        </span>
                      </div>
                      <div className={`p-3 rounded-lg border transition-all duration-300 ${
                        selectedModel === model.id
                          ? isDarkMode ? 'bg-purple-600/25 border-purple-400/30 shadow-sm' : 'bg-purple-100/70 border-purple-400/40 shadow-sm'
                          : isDarkMode ? 'bg-purple-600/15 border-purple-500/20' : 'bg-purple-100/40 border-purple-300/25'
                      }`}>
                        <div className="flex items-center space-x-2">
                          <Users className={`h-4 w-4 ${selectedModel === model.id ? 'text-green-400' : isDarkMode ? 'text-purple-400' : 'text-purple-500'}`} />
                          <span className="font-bold">Voices</span>
                        </div>
                        <span className={`text-xs ${selectedModel === model.id ? isDarkMode ? 'text-purple-300' : 'text-purple-700' : isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
                          {currentVoices.filter(v => v.model === model.id).length} available
                        </span>
                      </div>
                    </div>
                    
                    {/* Select Button - Only show when not selected */}
                    {selectedModel !== model.id && (
                      <div className="flex justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onModelChange(model.id);
                          }}
                          className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg border ${
                            isDarkMode
                              ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/30 text-indigo-300 hover:from-indigo-500/40 hover:to-purple-500/40 border-indigo-400/30'
                              : 'bg-gradient-to-r from-indigo-200/80 to-purple-200/80 text-indigo-700 hover:from-indigo-300/90 hover:to-purple-300/90 border-indigo-300/40'
                          }`}
                        >
                          Select Model
                        </button>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Voice Selection - Indigo/Purple theme */}
          <div className={`relative p-6 rounded-2xl backdrop-blur-sm border shadow-lg mb-6 ${
            isDarkMode 
              ? 'bg-gray-700/10 border-gray-600/10' 
              : 'bg-white/15 border-gray-200/10'
          }`}>
            <div className="absolute top-3 right-3 w-2 h-2 bg-indigo-400/40 rounded-full animate-pulse"></div>
            
            <div className="flex items-center space-x-4 mb-6">
              <div className={`relative p-4 rounded-2xl transition-all duration-500 shadow-xl group ${
                isDarkMode ? 'bg-gradient-to-br from-indigo-600/30 to-purple-600/20 border border-indigo-400/30' : 'bg-gradient-to-br from-indigo-100/90 to-purple-100/70 border border-indigo-300/40'
              }`}>
                <div className={`absolute top-1 right-1 w-2 h-2 rounded-full animate-pulse ${
                  isDarkMode ? 'bg-indigo-400/60' : 'bg-indigo-500/60'
                }`}></div>
                <Users className={`h-7 w-7 ${isDarkMode ? 'text-indigo-300' : 'text-indigo-600'} drop-shadow-lg transition-transform duration-500 group-hover:rotate-12`} />
              </div>
              <div>
                <h4 className={`text-xl font-black bg-gradient-to-r bg-clip-text text-transparent ${
                  isDarkMode 
                    ? 'from-indigo-400 via-purple-400 to-indigo-400' 
                    : 'from-indigo-600 via-purple-600 to-indigo-600'
                } drop-shadow-lg`}>
                  Voice Selection
                </h4>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-indigo-300/70' : 'text-indigo-600/70'}`}>
                  Pick your ideal voice personality
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Male Voices - Indigo/Purple theme */}
              <div className={`relative p-6 rounded-2xl backdrop-blur-sm border shadow-lg ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-indigo-600/10 via-purple-600/5 to-indigo-600/10 border-indigo-500/20' 
                  : 'bg-gradient-to-br from-indigo-50/80 via-purple-50/60 to-indigo-50/80 border-indigo-200/30'
              }`}>
                <div className="absolute top-3 right-3 w-2 h-2 bg-indigo-400/40 rounded-full animate-pulse"></div>
                
                <div className="flex items-center space-x-4 mb-6">
                  <div className={`p-4 rounded-2xl transition-all duration-500 shadow-lg ${
                    isDarkMode ? 'bg-gradient-to-br from-indigo-600/30 to-blue-600/20 border border-indigo-400/30' : 'bg-gradient-to-br from-indigo-100/90 to-blue-100/70 border border-indigo-300/40'
                  }`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isDarkMode ? 'bg-indigo-500/30' : 'bg-indigo-200/80'
                    }`}>
                      <Users className={`h-6 w-6 ${isDarkMode ? 'text-indigo-300' : 'text-indigo-600'}`} />
                    </div>
                  </div>
                  <div>
                    <h5 className={`text-xl font-black bg-gradient-to-r bg-clip-text text-transparent ${
                      isDarkMode ? 'from-indigo-400 to-blue-400' : 'from-indigo-600 to-blue-600'
                    }`}>
                      MALE VOICES
                    </h5>
                    <p className={`text-sm ${isDarkMode ? 'text-indigo-300/70' : 'text-indigo-600/70'}`}>
                      {maleVoices.length} available
                    </p>
                  </div>
                </div>
                
                {maleVoices.length > 0 ? (
                  <div className="space-y-4">
                    {maleVoices
                      .map((voice) => (
                      <div
                        key={voice.id}
                        onClick={() => onVoiceChange(voice.id)}
                        className={`group relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-500 hover:scale-102 hover:-translate-y-1 ${
                          selectedVoice === voice.id
                            ? isDarkMode
                              ? 'bg-gradient-to-br from-indigo-600/40 via-purple-600/30 to-indigo-600/40 border-indigo-400/80 shadow-lg shadow-indigo-500/40'
                              : 'bg-gradient-to-br from-indigo-100/95 via-purple-100/80 to-indigo-100/95 border-indigo-300/80 shadow-lg shadow-indigo-300/40'
                            : isDarkMode
                              ? 'bg-gradient-to-br from-gray-700/30 via-gray-600/20 to-gray-700/30 border-gray-500/40 hover:border-indigo-400/60'
                              : 'bg-gradient-to-br from-white/80 via-white/70 to-white/80 border-gray-200/50 hover:border-indigo-300/60'
                        } overflow-hidden`}
                      >
                        {/* Selected indicator */}
                        {selectedVoice === voice.id && (
                          <div className="absolute top-3 right-3 flex items-center space-x-1">
                            <div className={`w-2 h-2 rounded-full animate-pulse ${
                              isDarkMode ? 'bg-indigo-400' : 'bg-indigo-600'
                            }`}></div>
                            <span className={`text-xs font-bold ${
                              isDarkMode ? 'text-indigo-300' : 'text-indigo-700'
                            }`}>
                              SELECTED
                            </span>
                          </div>
                        )}
                        
                        <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-all duration-500 rounded-2xl from-indigo-400/20 to-purple-400/15"></div>
                        
                        <div className="relative space-y-4">
                          <div className="flex items-center space-x-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                              selectedVoice === voice.id
                                ? isDarkMode ? 'bg-gradient-to-br from-indigo-500/40 to-blue-500/30 border-2 border-indigo-400/60 shadow-lg' : 'bg-gradient-to-br from-indigo-200/90 to-blue-200/80 border-2 border-indigo-300/80 shadow-lg'
                                : isDarkMode ? 'bg-gradient-to-br from-indigo-500/20 to-blue-500/15' : 'bg-gradient-to-br from-indigo-100/80 to-blue-100/60'
                            }`}>
                              <Mic className={`h-7 w-7 ${
                                selectedVoice === voice.id
                                  ? isDarkMode ? 'text-indigo-300' : 'text-indigo-700'
                                  : isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
                              }`} />
                            </div>
                                                          <div className="flex-1">
                              <h6 className={`text-xl font-black ${
                                selectedVoice === voice.id
                                  ? isDarkMode ? 'text-indigo-300' : 'text-indigo-700'
                                  : isDarkMode ? 'text-indigo-300' : 'text-indigo-700'
                              }`}>
                                {voice.humanName}
                              </h6>
                            </div>
                          </div>
                          
                          <div className="flex space-x-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                playVoicePreview(voice.id);
                              }}
                              disabled={playingVoice !== null && playingVoice !== voice.id}
                              className={`flex-1 p-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg ${
                                playingVoice === voice.id
                                  ? 'bg-gradient-to-r from-blue-400/70 to-indigo-400/70 text-blue-800 shadow-blue-400/15'
                                  : playingVoice !== null
                                    ? 'bg-gray-400/50 text-gray-300 cursor-not-allowed'
                                    : isDarkMode
                                      ? 'bg-gradient-to-r from-indigo-600/30 to-blue-600/30 text-indigo-300 hover:from-indigo-500/40 hover:to-blue-500/40 border border-indigo-400/30'
                                      : 'bg-gradient-to-r from-indigo-200/80 to-blue-200/80 text-indigo-700 hover:from-indigo-300/90 hover:to-blue-300/90 border border-indigo-300/40'
                              }`}
                            >
                              <div className="flex items-center justify-center space-x-2">
                                {playingVoice === voice.id ? (
                                  <>
                                    <Volume2 className="h-4 w-4" />
                                    <span>🎵 Speaking...</span>
                                  </>
                                ) : (
                                  <>
                                    <Play className="h-4 w-4" />
                                    <span>Preview</span>
                                  </>
                                )}
                              </div>
                            </button>
                            
                            {selectedVoice !== voice.id && (
                              <button
                                onClick={() => onVoiceChange(voice.id)}
                                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg border ${
                                  isDarkMode
                                    ? 'bg-gradient-to-r from-indigo-600/30 to-blue-600/30 text-indigo-300 hover:from-indigo-500/40 hover:to-blue-500/40 border-indigo-400/30'
                                    : 'bg-gradient-to-r from-indigo-200/80 to-blue-200/80 text-indigo-700 hover:from-indigo-300/90 hover:to-blue-300/90 border-indigo-300/40'
                                }`}
                              >
                                Select
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`p-6 rounded-xl text-center border-2 border-dashed ${
                    isDarkMode 
                      ? 'bg-gray-600/20 border-gray-500/30 text-gray-400' 
                      : 'bg-gray-100/50 border-gray-300/40 text-gray-500'
                  }`}>
                    <span className="text-3xl mb-2 block">🚫</span>
                    <p className="font-medium">No male voices available</p>
                    <p className="text-sm opacity-70">Try a different model or language</p>
                  </div>
                )}
              </div>
              
              {/* Female Voices - Purple/Indigo theme */}
              <div className={`relative p-6 rounded-2xl backdrop-blur-sm border shadow-lg ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-purple-600/10 via-indigo-600/5 to-purple-600/10 border-purple-500/20' 
                  : 'bg-gradient-to-br from-purple-50/80 via-indigo-50/60 to-purple-50/80 border-purple-200/30'
              }`}>
                <div className="absolute top-3 right-3 w-2 h-2 bg-purple-400/40 rounded-full animate-pulse"></div>
                
                <div className="flex items-center space-x-4 mb-6">
                  <div className={`p-4 rounded-2xl transition-all duration-500 shadow-lg ${
                    isDarkMode ? 'bg-gradient-to-br from-purple-600/30 to-pink-600/20 border border-purple-400/30' : 'bg-gradient-to-br from-purple-100/90 to-pink-100/70 border border-purple-300/40'
                  }`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isDarkMode ? 'bg-purple-500/30' : 'bg-purple-200/80'
                    }`}>
                      <Users className={`h-6 w-6 ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`} />
                    </div>
                  </div>
                  <div>
                    <h5 className={`text-xl font-black bg-gradient-to-r bg-clip-text text-transparent ${
                      isDarkMode ? 'from-purple-400 to-pink-400' : 'from-purple-600 to-pink-600'
                    }`}>
                      FEMALE VOICES
                    </h5>
                    <p className={`text-sm ${isDarkMode ? 'text-purple-300/70' : 'text-purple-600/70'}`}>
                      {femaleVoices.length} available
                    </p>
                  </div>
                </div>
                
                {femaleVoices.length > 0 ? (
                  <div className="space-y-4">
                    {femaleVoices
                      .map((voice) => (
                      <div
                        key={voice.id}
                        onClick={() => onVoiceChange(voice.id)}
                        className={`group relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-500 hover:scale-102 hover:-translate-y-1 ${
                          selectedVoice === voice.id
                            ? isDarkMode
                              ? 'bg-gradient-to-br from-purple-600/40 via-indigo-600/30 to-purple-600/40 border-purple-400/80 shadow-lg shadow-purple-500/40'
                              : 'bg-gradient-to-br from-purple-100/95 via-indigo-100/80 to-purple-100/95 border-purple-300/80 shadow-lg shadow-purple-300/40'
                            : isDarkMode
                              ? 'bg-gradient-to-br from-gray-700/30 via-gray-600/20 to-gray-700/30 border-gray-500/40 hover:border-purple-400/60'
                              : 'bg-gradient-to-br from-white/80 via-white/70 to-white/80 border-gray-200/50 hover:border-purple-300/60'
                        } overflow-hidden`}
                      >
                        {/* Selected indicator */}
                        {selectedVoice === voice.id && (
                          <div className="absolute top-3 right-3 flex items-center space-x-1">
                            <div className={`w-2 h-2 rounded-full animate-pulse ${
                              isDarkMode ? 'bg-purple-400' : 'bg-purple-600'
                            }`}></div>
                            <span className={`text-xs font-bold ${
                              isDarkMode ? 'text-purple-300' : 'text-purple-700'
                            }`}>
                              SELECTED
                            </span>
                          </div>
                        )}
                        
                        <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-all duration-500 rounded-2xl from-purple-400/20 to-indigo-400/15"></div>
                        
                        <div className="relative space-y-4">
                          <div className="flex items-center space-x-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                              selectedVoice === voice.id
                                ? isDarkMode ? 'bg-gradient-to-br from-purple-500/40 to-pink-500/30 border-2 border-purple-400/60 shadow-lg' : 'bg-gradient-to-br from-purple-200/90 to-pink-200/80 border-2 border-purple-300/80 shadow-lg'
                                : isDarkMode ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/15' : 'bg-gradient-to-br from-purple-100/80 to-pink-100/60'
                            }`}>
                              <Mic className={`h-7 w-7 ${
                                selectedVoice === voice.id
                                  ? isDarkMode ? 'text-purple-300' : 'text-purple-700'
                                  : isDarkMode ? 'text-purple-400' : 'text-purple-600'
                              }`} />
                            </div>
                                                          <div className="flex-1">
                              <h6 className={`text-xl font-black ${
                                selectedVoice === voice.id
                                  ? isDarkMode ? 'text-purple-300' : 'text-purple-700'
                                  : isDarkMode ? 'text-purple-300' : 'text-purple-700'
                              }`}>
                                {voice.humanName}
                              </h6>
                            </div>
                          </div>
                          
                          <div className="flex space-x-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                playVoicePreview(voice.id);
                              }}
                              disabled={playingVoice !== null && playingVoice !== voice.id}
                              className={`flex-1 p-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg ${
                                playingVoice === voice.id
                                  ? 'bg-gradient-to-r from-blue-400/70 to-indigo-400/70 text-blue-800 shadow-blue-400/15'
                                  : playingVoice !== null
                                    ? 'bg-gray-400/50 text-gray-300 cursor-not-allowed'
                                    : isDarkMode
                                      ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-purple-300 hover:from-purple-500/40 hover:to-pink-500/40 border border-purple-400/30'
                                      : 'bg-gradient-to-r from-purple-200/80 to-pink-200/80 text-purple-700 hover:from-purple-300/90 hover:to-pink-300/90 border border-purple-300/40'
                              }`}
                            >
                              <div className="flex items-center justify-center space-x-2">
                                {playingVoice === voice.id ? (
                                  <>
                                    <Volume2 className="h-4 w-4" />
                                    <span>🎵 Speaking...</span>
                                  </>
                                ) : (
                                  <>
                                    <Play className="h-4 w-4" />
                                    <span>Preview</span>
                                  </>
                                )}
                              </div>
                            </button>
                            
                            {selectedVoice !== voice.id && (
                              <button
                                onClick={() => onVoiceChange(voice.id)}
                                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg border ${
                                  isDarkMode
                                    ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-purple-300 hover:from-purple-500/40 hover:to-pink-500/40 border-purple-400/30'
                                    : 'bg-gradient-to-r from-purple-200/80 to-pink-200/80 text-purple-700 hover:from-purple-300/90 hover:to-pink-300/90 border-purple-300/40'
                                }`}
                              >
                                Select
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`p-6 rounded-xl text-center border-2 border-dashed ${
                    isDarkMode 
                      ? 'bg-gray-600/20 border-gray-500/30 text-gray-400' 
                      : 'bg-gray-100/50 border-gray-300/40 text-gray-500'
                  }`}>
                    <span className="text-3xl mb-2 block">🚫</span>
                    <p className="font-medium">No female voices available</p>
                    <p className="text-sm opacity-70">Try a different model or language</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Speed Control - Indigo/Purple theme */}
          <div className={`relative p-6 rounded-2xl backdrop-blur-sm border shadow-lg mb-6 ${
            isDarkMode 
              ? 'bg-gray-700/10 border-gray-600/10' 
              : 'bg-white/15 border-gray-200/10'
          }`}>
            <div className="absolute top-3 right-3 w-2 h-2 bg-indigo-400/40 rounded-full animate-pulse"></div>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className={`relative p-4 rounded-2xl transition-all duration-500 shadow-xl group ${
                  isDarkMode ? 'bg-gradient-to-br from-indigo-600/30 to-purple-600/20 border border-indigo-400/30' : 'bg-gradient-to-br from-indigo-100/90 to-purple-100/70 border border-indigo-300/40'
                }`}>
                  <div className={`absolute top-1 right-1 w-2 h-2 rounded-full animate-pulse ${
                    isDarkMode ? 'bg-indigo-400/60' : 'bg-indigo-500/60'
                  }`}></div>
                  <Zap className={`h-7 w-7 ${isDarkMode ? 'text-indigo-300' : 'text-indigo-600'} drop-shadow-lg transition-transform duration-500 group-hover:rotate-12`} />
                </div>
                <div>
                  <h4 className={`text-xl font-black bg-gradient-to-r bg-clip-text text-transparent ${
                    isDarkMode 
                      ? 'from-indigo-400 via-purple-400 to-indigo-400' 
                      : 'from-indigo-600 via-purple-600 to-indigo-600'
                  } drop-shadow-lg`}>
                    Speaking Speed
                  </h4>
                  <p className={`text-sm mt-1 ${isDarkMode ? 'text-indigo-300/70' : 'text-indigo-600/70'}`}>
                    Adjust playback tempo
                  </p>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-full border backdrop-blur-sm shadow-lg transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-indigo-600/40 to-purple-600/40 border-indigo-400/50 text-indigo-300' 
                  : 'bg-gradient-to-r from-indigo-100 to-purple-100 border-indigo-300/50 text-indigo-700'
              } font-mono font-bold`}>
                {selectedSpeed}x
              </div>
            </div>
            
            <div className="space-y-4">
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.25"
                value={selectedSpeed}
                onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                className={`w-full h-4 rounded-lg appearance-none cursor-pointer transition-all duration-300 ${
                  isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                }`}
                style={{
                  background: `linear-gradient(to right, ${
                    isDarkMode ? '#6366f1' : '#4f46e5'
                  } 0%, ${
                    isDarkMode ? '#6366f1' : '#4f46e5'
                  } ${((selectedSpeed - 0.5) / (2.0 - 0.5)) * 100}%, ${
                    isDarkMode ? '#4b5563' : '#e5e7eb'
                  } ${((selectedSpeed - 0.5) / (2.0 - 0.5)) * 100}%, ${
                    isDarkMode ? '#4b5563' : '#e5e7eb'
                  } 100%)`
                }}
              />
              
              <div className="flex justify-between text-xs font-bold px-2">
                {[0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0].map((speed) => (
                  <span
                    key={speed}
                    className={`transition-all duration-300 px-2 py-1 rounded-lg cursor-pointer ${
                      selectedSpeed === speed
                        ? isDarkMode
                          ? 'text-indigo-300 bg-indigo-600/20 border border-indigo-400/40'
                          : 'text-indigo-700 bg-indigo-100 border border-indigo-300/60'
                        : isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-600'
                    }`}
                    onClick={() => onSpeedChange(speed)}
                  >
                    {speed}x
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Preview Section - Enhanced Design */}
          <div className={`relative p-6 rounded-2xl backdrop-blur-sm border shadow-lg mb-6 ${
            isDarkMode 
              ? 'bg-gray-700/10 border-gray-600/10' 
              : 'bg-white/15 border-gray-200/10'
          }`}>
            {/* Floating sparkles */}
            <div className="absolute top-3 right-3 w-2 h-2 bg-indigo-400/40 rounded-full animate-pulse"></div>
            
            <div className="flex items-center space-x-4 mb-6">
              <div className={`relative p-4 rounded-2xl transition-all duration-500 shadow-xl group ${
                isDarkMode ? 'bg-gradient-to-br from-indigo-600/30 to-purple-600/20 border border-indigo-400/30' : 'bg-gradient-to-br from-indigo-100/90 to-purple-100/70 border border-indigo-300/40'
              }`}>
                <div className={`absolute top-1 right-1 w-2 h-2 rounded-full animate-pulse ${
                  isDarkMode ? 'bg-indigo-400/60' : 'bg-indigo-500/60'
                }`}></div>
                <Volume2 className={`h-7 w-7 ${isDarkMode ? 'text-indigo-300' : 'text-indigo-600'} drop-shadow-lg transition-transform duration-500 group-hover:rotate-12`} />
              </div>
              <div>
                <h4 className={`text-xl font-black bg-gradient-to-r bg-clip-text text-transparent ${
                  isDarkMode 
                    ? 'from-indigo-400 via-purple-400 to-indigo-400' 
                    : 'from-indigo-600 via-purple-600 to-indigo-600'
                } drop-shadow-lg`}>
                  Voice Preview
                </h4>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-indigo-300/70' : 'text-indigo-600/70'}`}>
                  Test your complete setup
                </p>
              </div>
            </div>
            
            <div className={`p-6 rounded-xl border ${
              isDarkMode ? 'bg-indigo-600/20 border-indigo-500/30' : 'bg-indigo-100/80 border-indigo-200/40'
            }`}>
              <div className={`text-center font-semibold ${
                isDarkMode ? 'text-indigo-300' : 'text-indigo-700'
              }`}>
                🎵 Selected: {(selectedVoiceData as any)?.humanName || 'No voice selected'} ({selectedModelData?.name}) - {availableLanguages.find(l => l.code === selectedLanguage)?.name} at {selectedSpeed}x speed
              </div>
              
              <div className={`mt-3 p-3 rounded-lg italic text-center ${
                isDarkMode ? 'bg-gray-600/30 text-gray-300' : 'bg-white/50 text-gray-600'
              }`}>
                "{previewText.replace('your selected voice', (selectedVoiceData as any)?.humanName || 'your selected voice')}"
              </div>
              
              <div className="mt-4 flex justify-center">
                <button
                  onClick={playFullPreview}
                  disabled={!selectedVoice || playingVoice !== null}
                  className={`group relative px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg border ${
                    playingVoice === selectedVoice
                      ? 'bg-gradient-to-r from-blue-400/70 to-indigo-400/70 text-blue-800 shadow-blue-400/15'
                      : playingVoice !== null || !selectedVoice
                        ? 'bg-gray-400/50 text-gray-300 cursor-not-allowed border-gray-400/30'
                        : isDarkMode
                          ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/30 text-indigo-300 hover:from-indigo-500/40 hover:to-purple-500/40 border border-indigo-400/30'
                          : 'bg-gradient-to-r from-indigo-200/80 to-purple-200/80 text-indigo-700 hover:from-indigo-300/90 hover:to-purple-300/90 border border-indigo-300/40'
                  }`}
                >
                  <span className="relative z-10 flex items-center justify-center space-x-3">
                    {playingVoice === selectedVoice ? (
                      <>
                        <Volume2 className="h-5 w-5" />
                        <span>🎵 Speaking, please wait...</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5" />
                        <span>🎧 Listen to Preview</span>
                      </>
                    )}
                  </span>
                  
                  {/* Subtle glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/0 via-indigo-400/10 to-indigo-400/0 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className={`group relative flex-1 p-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg border ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-gray-600/30 to-gray-700/30 text-gray-300 hover:from-gray-500/40 hover:to-gray-600/40 border-gray-500/30' 
                  : 'bg-gradient-to-r from-gray-200/80 to-gray-300/80 text-gray-700 hover:from-gray-300/90 hover:to-gray-400/90 border-gray-300/40'
              }`}
            >
              <span className="relative z-10 flex items-center justify-center space-x-2">
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </span>
              {/* Subtle glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-gray-400/0 via-gray-400/10 to-gray-400/0 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
            </button>
            
            <button
              onClick={handleSave}
              disabled={loading}
              className={`group relative flex-1 p-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg border ${
                loading 
                  ? 'opacity-50 cursor-not-allowed bg-gray-400/50 text-gray-300 border-gray-400/30'
                  : isDarkMode
                    ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/30 text-indigo-300 hover:from-indigo-500/40 hover:to-purple-500/40 border-indigo-400/30'
                    : 'bg-gradient-to-r from-indigo-200/80 to-purple-200/80 text-indigo-700 hover:from-indigo-300/90 hover:to-purple-300/90 border-indigo-300/40'
              }`}
            >
              <span className="relative z-10 flex items-center justify-center space-x-2">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-300/30 border-t-gray-300 rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Save Settings</span>
                  </>
                )}
              </span>
              
              {/* Subtle glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/0 via-indigo-400/10 to-indigo-400/0 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 