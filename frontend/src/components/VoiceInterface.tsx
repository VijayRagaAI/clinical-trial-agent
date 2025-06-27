import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, RotateCcw, CheckCircle, RefreshCw, Play, Square, Send, Moon, Sun, ChevronDown, Settings, Globe, VolumeX, Palette, FileText } from 'lucide-react';
import { ButtonConfig, ButtonState } from '../types/interview';
import { Study } from '../types/interview';
import { StudySelector } from './StudySelector';

interface Language {
  code: string;
  name: string;
}

interface Voice {
  id: string;
  name: string;
  category: string;
  description: string;
}

interface VoiceInterfaceProps {
  // State
  conversationState: string;
  isAgentSpeaking: boolean;
  canInterruptSpeech: boolean;
  isRecording: boolean;
  recordingTime: number;
  waitingForUser: boolean;
  userHasResponded: boolean;
  showTranscriptionConfirm: boolean;
  lastTranscription: string;
  connectionError: string | null;
  currentQuestionNumber: number;
  totalQuestions: number;
  awaitingSubmission: boolean;
  isEvaluating: boolean;
  isProcessing: boolean;
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  onRestart: () => void;
  
  // Study selection
  selectedStudy: Study | null;
  onStudySelect: (study: Study) => void;
  
  // Actions
  startInterview: (studyId: string) => void;
  stopAgentSpeaking: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  repeatCurrentQuestion: () => void;
  repeatLastQuestion: () => void;
  submitResponse: () => void;
  hearInstructionAgain: () => void;
  
  // Helpers
  formatTime: (seconds: number) => string;
  getStatusText: () => string;
  canRepeatLastQuestion: () => boolean;
}

export const VoiceInterface: React.FC<VoiceInterfaceProps> = ({
  conversationState,
  isAgentSpeaking,
  canInterruptSpeech,
  isRecording,
  recordingTime,
  waitingForUser,
  userHasResponded,
  showTranscriptionConfirm,
  lastTranscription,
  connectionError,
  currentQuestionNumber,
  totalQuestions,
  awaitingSubmission,
  isEvaluating,
  isProcessing,
  isDarkMode,
  setIsDarkMode,
  onRestart,
  selectedStudy,
  onStudySelect,
  startInterview,
  stopAgentSpeaking,
  startRecording,
  stopRecording,
  repeatCurrentQuestion,
  repeatLastQuestion,
  submitResponse,
  hearInstructionAgain,
  formatTime,
  getStatusText,
  canRepeatLastQuestion
}) => {
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(20).fill(0));
  const [showSettings, setShowSettings] = useState(false);
  const [showStudySelector, setShowStudySelector] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [selectedVoice, setSelectedVoice] = useState('onyx');
  const [selectedSpeed, setSelectedSpeed] = useState(1.0);
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
  const [availableVoices, setAvailableVoices] = useState<Voice[]>([]);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);

  // Load available languages and voices on component mount
  useEffect(() => {
    loadLanguagesAndVoices();
  }, []);

  const loadLanguagesAndVoices = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      // Fetch from real backend APIs
      const [languagesResponse, voicesResponse, settingsResponse] = await Promise.all([
        fetch(`${API_BASE}/api/audio/languages`),
        fetch(`${API_BASE}/api/audio/voices`),
        fetch(`${API_BASE}/api/audio/settings`)
      ]);

      if (languagesResponse.ok && voicesResponse.ok) {
        const languagesData = await languagesResponse.json();
        const voicesData = await voicesResponse.json();
        
        setAvailableLanguages(languagesData.languages);
        setAvailableVoices(voicesData.voices);

        // Load current settings if available
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          setSelectedLanguage(settingsData.output_language);
          setSelectedVoice(settingsData.voice);
          setSelectedSpeed(settingsData.speed || 1.0);
        }
      } else {
        throw new Error('Failed to fetch languages and voices');
      }
    } catch (error) {
      console.error('Failed to load languages and voices:', error);
      
      // Fallback to mock data if backend is unavailable
      const mockLanguages: Language[] = [
        // Indian languages
        { code: 'english', name: 'English' },
        { code: 'hindi', name: 'Hindi' },
        { code: 'bhojpuri', name: 'Bhojpuri' },
        { code: 'bengali', name: 'Bengali' },
        { code: 'telugu', name: 'Telugu' },
        { code: 'marathi', name: 'Marathi' },
        { code: 'tamil', name: 'Tamil' },
        { code: 'gujarati', name: 'Gujarati' },
        { code: 'urdu', name: 'Urdu' },
        { code: 'kannada', name: 'Kannada' },
        // World languages
        { code: 'mandarin', name: 'Chinese (Mandarin)' },
        { code: 'spanish', name: 'Spanish' },
        { code: 'french', name: 'French' },
        { code: 'arabic', name: 'Arabic' },
        { code: 'portuguese', name: 'Portuguese' },
        { code: 'russian', name: 'Russian' },
        { code: 'japanese', name: 'Japanese' },
        { code: 'german', name: 'German' },
        { code: 'korean', name: 'Korean' },
        { code: 'italian', name: 'Italian' },
        { code: 'turkish', name: 'Turkish' },
        { code: 'vietnamese', name: 'Vietnamese' },
        { code: 'thai', name: 'Thai' },
        { code: 'indonesian', name: 'Indonesian' },
        { code: 'dutch', name: 'Dutch' }
      ];

      const mockVoices: Voice[] = [
        // Professional voices
        { id: 'onyx', name: 'Onyx', category: 'professional', description: 'Deep, authoritative voice' },
        { id: 'echo', name: 'Echo', category: 'professional', description: 'Clear, crisp voice' },
        { id: 'alloy', name: 'Alloy', category: 'professional', description: 'Balanced, trustworthy voice' },
        // Warm voices
        { id: 'shimmer', name: 'Shimmer', category: 'warm', description: 'Soft, gentle voice' },
        { id: 'nova', name: 'Nova', category: 'warm', description: 'Bright, friendly voice' },
        { id: 'fable', name: 'Fable', category: 'warm', description: 'Expressive, engaging voice' }
      ];

      setAvailableLanguages(mockLanguages);
      setAvailableVoices(mockVoices);
    }
  };

  const playVoicePreview = async (voiceId: string) => {
    if (playingVoice) return; // Don't allow multiple previews at once
    
    setPlayingVoice(voiceId);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      // Sample text for voice preview
      const previewText = selectedLanguage === 'english' 
        ? "Hello, this is a preview of my voice. How does this sound to you?"
        : "Hello, this is a preview of my voice. How does this sound to you?"; // Backend will translate this

      // Call real backend API for voice preview
      const response = await fetch(`${API_BASE}/api/audio/voice-preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: previewText,
          voice: voiceId,
          language: selectedLanguage,
          speed: selectedSpeed
        })
      });

      if (response.ok) {
        const data = await response.json();
        await playAudioBase64(data.audio);
      } else {
        const errorText = await response.text();
        console.error('Voice preview failed:', errorText);
        // Fallback: Simulate voice preview
        console.log(`Playing preview for voice: ${voiceId} in ${selectedLanguage} at ${selectedSpeed}x speed`);
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate audio playback
      }
    } catch (error) {
      console.error('Voice preview failed:', error);
      // Fallback: Simulate voice preview
      await new Promise(resolve => setTimeout(resolve, 1500));
    } finally {
      setPlayingVoice(null);
    }
  };

  const playAudioBase64 = async (audioBase64: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        const audioBlob = base64ToBlob(audioBase64, 'audio/mpeg');
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          reject(new Error('Audio playback failed'));
        };
        
        audio.play();
      } catch (error) {
        reject(error);
      }
    });
  };

  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  const saveSettings = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      // Save to real backend
      const response = await fetch(`${API_BASE}/api/audio/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          output_language: selectedLanguage,
          voice: selectedVoice,
          speed: selectedSpeed
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Settings saved successfully:', data);
        setShowSettings(false);
        
        // Show success message (you could add a toast notification here)
        console.log(`✅ Settings updated: ${selectedLanguage} language with ${selectedVoice} voice at ${selectedSpeed}x speed`);
      } else {
        const errorText = await response.text();
        console.error('Failed to save settings:', errorText);
        throw new Error(`Failed to save settings: ${errorText}`);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      // You could show an error notification here
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to save settings: ${errorMessage}`);
    }
  };

  // Animate audio levels
  useEffect(() => {
    if (isRecording || isAgentSpeaking) {
      const interval = setInterval(() => {
        setAudioLevels(prev => prev.map(() => Math.random() * 100));
      }, 100);
      return () => clearInterval(interval);
    } else {
      setAudioLevels(Array(20).fill(0));
    }
  }, [isRecording, isAgentSpeaking]);

  const getButtonConfiguration = (): ButtonConfig => {
    // State 1: Evaluating responses (highest priority)
    if (isEvaluating) {
      return {
        primary: { action: () => {}, icon: Volume2, text: "Evaluating...", color: "blue" },
        secondary: [],
        disabled: true
      };
    }

    // State 2: Processing user response (high priority)
    if (isProcessing) {
      return {
        primary: { action: () => {}, icon: Volume2, text: "Processing...", color: "processing" },
        secondary: [],
        disabled: true
      };
    }

    // State 3: Not started
    if (conversationState === 'not_started') {
      return {
        primary: { 
          action: () => {
            if (!selectedStudy) {
              alert('Please select a study first');
              return;
            }
            startInterview(selectedStudy.id);
          }, 
          icon: Play, 
          text: selectedStudy ? "Start Interview" : "Select Study First", 
          color: "start" 
        },
        secondary: [],
        disabled: !!connectionError || !selectedStudy
      };
    }

    // State 4: Starting/Connecting
    if (conversationState === 'starting') {
      return {
        primary: { action: () => {}, icon: Volume2, text: "Connecting...", color: "connecting" },
        secondary: [],
        disabled: true
      };
    }

    // State 5: Agent speaking (can be interrupted)
    if (isAgentSpeaking && canInterruptSpeech) {
      const secondaryButtons = [];
      
      // For criteria questions and consent, show repeat buttons
      if (conversationState === 'questioning') {
        if (awaitingSubmission) {
          secondaryButtons.push({ action: submitResponse, icon: Send, text: "Submit Response", color: "green" });
          secondaryButtons.push({ action: repeatLastQuestion, icon: RefreshCw, text: "Repeat Last Question", color: "purple" });
          secondaryButtons.push({ action: hearInstructionAgain, icon: RotateCcw, text: "Hear Instruction Again", color: "amber" });
      } else {
          if (currentQuestionNumber > 1) {
            secondaryButtons.push({ action: repeatLastQuestion, icon: RefreshCw, text: "Repeat Last Question", color: "purple" });
          }
          secondaryButtons.push({ action: repeatCurrentQuestion, icon: RotateCcw, text: "Repeat Current Question", color: "amber" });
        }
      } else if (conversationState === 'consent') {
        // During consent, only show repeat current question
        secondaryButtons.push({ action: repeatCurrentQuestion, icon: RotateCcw, text: "Repeat Current Question", color: "amber" });
      }
      
        return {
          primary: { action: stopAgentSpeaking, icon: Square, text: "Skip Speaking", color: "amber" },
        secondary: secondaryButtons,
          disabled: false
        };
    }

    // State 6: Recording
    if (isRecording) {
      return {
        primary: { action: stopRecording, icon: MicOff, text: "Stop Recording", color: "red" },
        secondary: [],
        disabled: false
      };
    }

    // State 7: Transcription shown (agent finished speaking)
    if (showTranscriptionConfirm && lastTranscription && !isAgentSpeaking) {
      const secondaryButtons = [];
      
      // For criteria questions and consent, show repeat buttons
      if (conversationState === 'questioning') {
        if (awaitingSubmission) {
          secondaryButtons.push({ action: submitResponse, icon: Send, text: "Submit Response", color: "green" });
          secondaryButtons.push({ action: repeatLastQuestion, icon: RefreshCw, text: "Repeat Last Question", color: "purple" });
          secondaryButtons.push({ action: hearInstructionAgain, icon: RotateCcw, text: "Hear Instruction Again", color: "amber" });
        } else {
          if (currentQuestionNumber > 1) {
            secondaryButtons.push({ action: repeatLastQuestion, icon: RefreshCw, text: "Repeat Last Question", color: "purple" });
          }
          secondaryButtons.push({ action: repeatCurrentQuestion, icon: RotateCcw, text: "Repeat Current Question", color: "amber" });
        }
      } else if (conversationState === 'consent') {
        // During consent, only show repeat current question
        secondaryButtons.push({ action: repeatCurrentQuestion, icon: RotateCcw, text: "Repeat Current Question", color: "amber" });
      }
      
      return {
        primary: { action: startRecording, icon: Mic, text: "Start Speaking", color: "blue" },
        secondary: secondaryButtons,
        disabled: false
      };
    }

    // State 8: Ready to speak (after skip or initial)
    if (waitingForUser && !userHasResponded) {
      const secondaryButtons = [];
      
      // For criteria questions and consent, show repeat buttons
      if (conversationState === 'questioning') {
        if (awaitingSubmission) {
          secondaryButtons.push({ action: submitResponse, icon: Send, text: "Submit Response", color: "green" });
          secondaryButtons.push({ action: repeatLastQuestion, icon: RefreshCw, text: "Repeat Last Question", color: "purple" });
          secondaryButtons.push({ action: hearInstructionAgain, icon: RotateCcw, text: "Hear Instruction Again", color: "amber" });
        } else {
          if (currentQuestionNumber > 1) {
            secondaryButtons.push({ action: repeatLastQuestion, icon: RefreshCw, text: "Repeat Last Question", color: "purple" });
          }
          secondaryButtons.push({ action: repeatCurrentQuestion, icon: RotateCcw, text: "Repeat Current Question", color: "amber" });
        }
      } else if (conversationState === 'consent') {
        // During consent, only show repeat current question
        secondaryButtons.push({ action: repeatCurrentQuestion, icon: RotateCcw, text: "Repeat Current Question", color: "amber" });
      }
      
      return {
        primary: { action: startRecording, icon: Mic, text: "Start Speaking", color: "blue" },
        secondary: secondaryButtons,
        disabled: false
      };
    }

      // State 9: Interview completed - New Interview button with start animation
    if (conversationState === 'completed') {
      return {
      primary: { action: onRestart, icon: RotateCcw, text: "🔄 New Interview", color: "restart" },
      secondary: [
        { action: () => {
          // Smooth scroll to results
          setTimeout(() => {
            const resultsElement = document.querySelector('[data-results-section]');
            if (resultsElement) {
              resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 300);
        }, icon: ChevronDown, text: "View Results", color: "blue" }
      ],
      disabled: false
      };
    }

    // Default: Processing
    return {
      primary: { action: () => {}, icon: Volume2, text: "Processing...", color: "processing" },
      secondary: [],
      disabled: true
    };
  };

  const getButtonColorClasses = (color: string, isPrimary: boolean = false) => {
    const colors = {
      green: isPrimary 
        ? 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:via-emerald-600 hover:to-emerald-700 shadow-emerald-500/25 hover:shadow-emerald-500/40' 
        : 'bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/20 hover:shadow-emerald-500/30',
      start: isPrimary 
        ? 'bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 hover:from-pink-500 hover:via-purple-600 hover:to-indigo-700 shadow-purple-500/30 hover:shadow-purple-500/50 animate-breathing hover:animate-none' 
        : 'bg-gradient-to-br from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 shadow-purple-500/20 hover:shadow-purple-500/30',
      connecting: isPrimary 
        ? 'bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-500 hover:via-blue-600 hover:to-indigo-700 shadow-blue-500/30 hover:shadow-blue-500/50 animate-pulse' 
        : 'bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-blue-500/20 hover:shadow-blue-500/30',
      processing: isPrimary 
        ? 'bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 hover:from-blue-500 hover:via-indigo-600 hover:to-purple-700 shadow-indigo-500/30 hover:shadow-indigo-500/50 animate-pulse' 
        : 'bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-indigo-500/20 hover:shadow-indigo-500/30',
      blue: isPrimary 
        ? 'bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600 hover:from-blue-500 hover:via-blue-600 hover:to-indigo-700 shadow-blue-500/25 hover:shadow-blue-500/40'
        : 'bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-blue-500/20 hover:shadow-blue-500/30',
      red: isPrimary 
        ? 'bg-gradient-to-br from-red-400 via-red-500 to-red-600 hover:from-red-500 hover:via-red-600 hover:to-red-700 shadow-red-500/25 hover:shadow-red-500/40'
        : 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-500/20 hover:shadow-red-500/30',
      amber: isPrimary 
        ? 'bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600 hover:from-amber-500 hover:via-orange-600 hover:to-orange-700 shadow-orange-500/25 hover:shadow-orange-500/40'
        : 'bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-orange-500/20 hover:shadow-orange-500/30',
      purple: isPrimary 
        ? 'bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-600 hover:to-purple-700 shadow-purple-500/25 hover:shadow-purple-500/40'
        : 'bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-purple-500/20 hover:shadow-purple-500/30',
      restart: isPrimary 
        ? 'bg-gradient-to-br from-purple-400 via-pink-500 to-indigo-600 hover:from-purple-500 hover:via-pink-600 hover:to-indigo-700 shadow-purple-500/30 hover:shadow-purple-500/50 animate-breathing hover:animate-none' 
        : 'bg-gradient-to-br from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-purple-500/20 hover:shadow-purple-500/30',
      gray: 'bg-gradient-to-br from-gray-400 to-gray-500 shadow-gray-400/20'
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  const getProgressPercentage = () => {
    if (conversationState === 'consent') return 0;
    if (isEvaluating || conversationState === 'completed') return 100;
    return Math.round((currentQuestionNumber / totalQuestions) * 100);
  };

  const buttonConfig = getButtonConfiguration();

  return (
    <div className={`min-h-screen transition-all duration-500 ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'}`}>
      {/* Settings Panel - Top Controls */}
      <div className="absolute top-6 right-6 z-10 flex space-x-3">
        {/* Study Selection */}
        <div className="relative group">
          <button
            onClick={() => setShowStudySelector(!showStudySelector)}
            className={`relative px-4 py-3 rounded-xl backdrop-blur-md border transition-all duration-300 hover:scale-105 ${
              isDarkMode 
                ? 'bg-gray-800/70 border-gray-600/70 text-emerald-400 hover:bg-gray-700/80 hover:border-emerald-400/60' 
                : 'bg-white/70 border-white/40 text-emerald-600 hover:bg-white/90 hover:border-emerald-300/60'
            } ${showStudySelector ? 'ring-2 ring-emerald-400 scale-105 shadow-lg shadow-emerald-500/20' : 'shadow-md'}`}
          >
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
              <span className="text-sm font-semibold">Study</span>
            </div>
            
            {/* Study Badge */}
            <div className={`absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-xs font-bold border ${
              isDarkMode 
                ? 'bg-emerald-500 text-white border-emerald-400' 
                : 'bg-emerald-600 text-white border-emerald-500'
            } animate-pulse`}>
              {selectedStudy ? (() => {
                // Generate consistent icon based on category
                const hash = selectedStudy.category.split('').reduce((a, b) => {
                  a = ((a << 5) - a) + b.charCodeAt(0);
                  return a & a;
                }, 0);
                const iconIndex = Math.abs(hash) % 8;
                const icons = ['🧬', '🩺', '❤️', '🦴', '🧠', '👁️', '🫁', '💊'];
                return icons[iconIndex];
              })() : '🧬'}
            </div>
          </button>
          
          {/* Study Tooltip */}
          <div className={`absolute top-full mt-2 left-1/2 transform -translate-x-1/2 text-xs font-medium whitespace-nowrap ${
            isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
          }`}>
            Select Study
          </div>
        </div>

        {/* Language & Voice Settings */}
        <div className="relative group">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`relative px-4 py-3 rounded-xl backdrop-blur-md border transition-all duration-300 hover:scale-105 ${
              isDarkMode 
                ? 'bg-gray-800/70 border-gray-600/70 text-indigo-400 hover:bg-gray-700/80 hover:border-indigo-400/60' 
                : 'bg-white/70 border-white/40 text-indigo-600 hover:bg-white/90 hover:border-indigo-300/60'
            } ${showSettings ? 'ring-2 ring-indigo-400 scale-105 shadow-lg shadow-indigo-500/20' : 'shadow-md'}`}
          >
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
              <span className="text-sm font-semibold">Settings</span>
            </div>
            
            {/* Language Badge */}
            <div className={`absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-xs font-bold border ${
              isDarkMode 
                ? 'bg-indigo-500 text-white border-indigo-400' 
                : 'bg-indigo-600 text-white border-indigo-500'
            } animate-pulse`}>
              {selectedLanguage === 'english' ? 'EN' : 
               selectedLanguage === 'hindi' ? 'HI' : 
               selectedLanguage === 'spanish' ? 'ES' : 
               selectedLanguage === 'french' ? 'FR' : 
               selectedLanguage === 'mandarin' ? 'ZH' : 
               selectedLanguage === 'arabic' ? 'AR' : 
               selectedLanguage === 'japanese' ? 'JA' : 
               selectedLanguage === 'korean' ? 'KO' : 
               selectedLanguage === 'russian' ? 'RU' : 
               selectedLanguage === 'german' ? 'DE' : 
               selectedLanguage === 'tamil' ? 'TA' : 
               selectedLanguage === 'bengali' ? 'BN' : 
               selectedLanguage === 'telugu' ? 'TE' : 
               selectedLanguage === 'urdu' ? 'UR' : 
               selectedLanguage.slice(0, 2).toUpperCase()}
            </div>
          </button>
          
          {/* Settings Tooltip */}
          <div className={`absolute top-full mt-2 left-1/2 transform -translate-x-1/2 text-xs font-medium whitespace-nowrap ${
            isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
          }`}>
            Language & Voice
          </div>
        </div>

        {/* Theme Settings */}
        <div className="relative group">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`relative px-4 py-3 rounded-xl backdrop-blur-md border transition-all duration-300 hover:scale-105 shadow-md ${
              isDarkMode 
                ? 'bg-gray-800/70 border-gray-600/70 text-amber-400 hover:bg-gray-700/80 hover:border-amber-400/60' 
                : 'bg-white/70 border-white/40 text-orange-600 hover:bg-white/90 hover:border-orange-300/60'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Palette className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
              <span className="text-sm font-semibold">Theme</span>
            </div>
            
            {/* Theme Mode Indicator */}
            <div className={`absolute -top-1 -right-1 p-1 rounded-full ${
              isDarkMode 
                ? 'bg-amber-500 text-amber-900' 
                : 'bg-orange-500 text-orange-100'
            }`}>
              {isDarkMode ? (
                <Moon className="h-3 w-3" />
              ) : (
                <Sun className="h-3 w-3" />
              )}
            </div>
          </button>
          
          {/* Theme Tooltip */}
          <div className={`absolute top-full mt-2 left-1/2 transform -translate-x-1/2 text-xs font-medium whitespace-nowrap ${
            isDarkMode ? 'text-amber-400' : 'text-orange-600'
          }`}>
            {isDarkMode ? 'Switch to Light' : 'Switch to Dark'}
          </div>
        </div>
      </div>

      {/* Settings Panel Overlay */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-20 flex items-center justify-center p-4">
          <div className={`w-full max-w-md backdrop-blur-xl rounded-3xl shadow-2xl border p-6 transition-all duration-500 ${
            isDarkMode 
              ? 'bg-gray-800/90 border-gray-700/50' 
              : 'bg-white/90 border-white/20'
          }`}>
            {/* Settings Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100'}`}>
                  <Settings className={`h-5 w-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Voice Settings
                </h3>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className={`p-2 rounded-full transition-colors ${
                  isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                ✕
              </button>
            </div>

            {/* Language Selection */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-2">
                <Globe className={`h-4 w-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <label className={`text-sm font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  Output Language
                </label>
              </div>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className={`w-full p-3 rounded-xl border transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-700/50 border-gray-600 text-white focus:ring-2 focus:ring-blue-400' 
                    : 'bg-white/70 border-gray-200 text-gray-900 focus:ring-2 focus:ring-blue-500'
                } focus:outline-none`}
              >
                {availableLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Enhanced Speech Speed Control */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Volume2 className={`h-4 w-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                  <label className={`text-sm font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                    Speech Speed
                  </label>
                </div>
                <div className={`px-3 py-1.5 rounded-full border ${
                  isDarkMode 
                    ? 'bg-green-900/30 border-green-700 text-green-300' 
                    : 'bg-green-100 border-green-300 text-green-700'
                } font-mono font-bold`}>
                  {selectedSpeed}x
                </div>
              </div>
              
              {/* Enhanced Slider */}
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="range"
                    min="0.25"
                    max="2.0"
                    step="0.25"
                    value={selectedSpeed}
                    onChange={(e) => setSelectedSpeed(parseFloat(e.target.value))}
                    className={`w-full h-3 rounded-lg appearance-none cursor-pointer transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-600 slider-thumb-dark' 
                        : 'bg-gray-200 slider-thumb-light'
                    }`}
                    style={{
                      background: `linear-gradient(to right, ${
                        isDarkMode ? '#10b981' : '#059669'
                      } 0%, ${
                        isDarkMode ? '#10b981' : '#059669'
                      } ${((selectedSpeed - 0.25) / (2.0 - 0.25)) * 100}%, ${
                        isDarkMode ? '#4b5563' : '#e5e7eb'
                      } ${((selectedSpeed - 0.25) / (2.0 - 0.25)) * 100}%, ${
                        isDarkMode ? '#4b5563' : '#e5e7eb'
                      } 100%)`
                    }}
                  />
                  
                  {/* Speed Indicator Line */}
                  <div 
                    className={`absolute top-1/2 w-0.5 h-6 -translate-y-1/2 transition-all duration-300 ${
                      isDarkMode ? 'bg-green-400' : 'bg-green-600'
                    }`}
                    style={{
                      left: `${((selectedSpeed - 0.25) / (2.0 - 0.25)) * 100}%`,
                      transform: 'translateX(-50%) translateY(-50%)'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Voice Selection - Two Column Layout */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-2">
                <Volume2 className={`h-4 w-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                <label className={`text-sm font-semibold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                  Voice Selection
                </label>
              </div>
              
              {/* Two Column Voice Layout */}
              <div className="grid grid-cols-2 gap-4">
                {/* Professional Voices Column */}
                <div className={`p-4 rounded-xl border ${
                  isDarkMode 
                    ? 'bg-gray-700/20 border-gray-600/50' 
                    : 'bg-gray-50/50 border-gray-200/50'
                }`}>
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-lg">🏢</span>
                    <h4 className={`font-semibold text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Professional
                    </h4>
                  </div>
                  
                  <div className="space-y-3">
                    {availableVoices
                      .filter(voice => voice.category === 'professional')
                      .map((voice) => (
                      <div
                        key={voice.id}
                        className={`p-3 rounded-lg border transition-all duration-300 cursor-pointer ${
                          selectedVoice === voice.id
                            ? isDarkMode
                              ? 'bg-purple-900/40 border-purple-500 ring-1 ring-purple-400'
                              : 'bg-purple-50 border-purple-300 ring-1 ring-purple-500'
                            : isDarkMode
                            ? 'bg-gray-800/30 border-gray-600 hover:bg-gray-700/30'
                            : 'bg-white/70 border-gray-200 hover:bg-white/90'
                        }`}
                        onClick={() => setSelectedVoice(voice.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className={`font-medium text-sm ${
                              selectedVoice === voice.id
                                ? isDarkMode ? 'text-purple-300' : 'text-purple-700'
                                : isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              {voice.name}
                            </div>
                            <div className={`text-xs mt-1 ${
                              selectedVoice === voice.id
                                ? isDarkMode ? 'text-purple-400' : 'text-purple-600'
                                : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {voice.description}
                            </div>
                          </div>
                          
                          {/* Voice Preview Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              playVoicePreview(voice.id);
                            }}
                            disabled={playingVoice !== null}
                            className={`p-1.5 rounded-full transition-all duration-200 ml-2 ${
                              playingVoice === voice.id
                                ? 'bg-green-500 text-white animate-pulse'
                                : playingVoice !== null
                                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                : isDarkMode
                                ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            }`}
                          >
                            {playingVoice === voice.id ? (
                              <VolumeX className="h-3 w-3" />
                            ) : (
                              <Play className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Warm Voices Column */}
                <div className={`p-4 rounded-xl border ${
                  isDarkMode 
                    ? 'bg-gray-700/20 border-gray-600/50' 
                    : 'bg-gray-50/50 border-gray-200/50'
                }`}>
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-lg">💫</span>
                    <h4 className={`font-semibold text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Warm
                    </h4>
                  </div>
                  
                  <div className="space-y-3">
                    {availableVoices
                      .filter(voice => voice.category === 'warm')
                      .map((voice) => (
                      <div
                        key={voice.id}
                        className={`p-3 rounded-lg border transition-all duration-300 cursor-pointer ${
                          selectedVoice === voice.id
                            ? isDarkMode
                              ? 'bg-purple-900/40 border-purple-500 ring-1 ring-purple-400'
                              : 'bg-purple-50 border-purple-300 ring-1 ring-purple-500'
                            : isDarkMode
                            ? 'bg-gray-800/30 border-gray-600 hover:bg-gray-700/30'
                            : 'bg-white/70 border-gray-200 hover:bg-white/90'
                        }`}
                        onClick={() => setSelectedVoice(voice.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className={`font-medium text-sm ${
                              selectedVoice === voice.id
                                ? isDarkMode ? 'text-purple-300' : 'text-purple-700'
                                : isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              {voice.name}
                            </div>
                            <div className={`text-xs mt-1 ${
                              selectedVoice === voice.id
                                ? isDarkMode ? 'text-purple-400' : 'text-purple-600'
                                : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {voice.description}
                            </div>
                          </div>
                          
                          {/* Voice Preview Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              playVoicePreview(voice.id);
                            }}
                            disabled={playingVoice !== null}
                            className={`p-1.5 rounded-full transition-all duration-200 ml-2 ${
                              playingVoice === voice.id
                                ? 'bg-green-500 text-white animate-pulse'
                                : playingVoice !== null
                                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                : isDarkMode
                                ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            }`}
                          >
                            {playingVoice === voice.id ? (
                              <VolumeX className="h-3 w-3" />
                            ) : (
                              <Play className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Voice Preview Status */}
              {playingVoice && (
                <div className={`text-xs text-center ${isDarkMode ? 'text-green-400' : 'text-green-600'} animate-pulse`}>
                  🎵 Playing preview for {availableVoices.find(v => v.id === playingVoice)?.name} at {selectedSpeed}x speed...
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => setShowSettings(false)}
                className={`flex-1 p-3 rounded-xl transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={saveSettings}
                className="flex-1 p-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 hover:scale-105"
              >
                Save Settings
              </button>
            </div>

            {/* Settings Info */}
            <div className={`mt-4 text-xs text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              💡 Changes will apply to future conversations
            </div>
          </div>
        </div>
      )}

      {/* Study Selector */}
      <StudySelector
        isOpen={showStudySelector}
        onClose={() => setShowStudySelector(false)}
        selectedStudy={selectedStudy}
        onStudySelect={onStudySelect}
        isDarkMode={isDarkMode}
      />

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Glass Morphism Card */}
        <div className={`backdrop-blur-xl rounded-3xl shadow-2xl border p-8 mb-8 transition-all duration-500 ${
          isDarkMode 
            ? 'bg-gray-800/30 border-gray-700/50 shadow-black/20' 
            : 'bg-white/70 border-white/20 shadow-indigo-500/10'
        }`}>
      <div className="text-center space-y-8">
            {/* Status with Beautiful Enhanced Typography */}
            <div className="space-y-4">
              <div className="relative">
                {/* Background glow effect */}
                <div className={`absolute inset-0 blur-xl opacity-20 ${
                  connectionError ? 'bg-red-500' :
                  isRecording ? 'bg-red-500' : 
                  isAgentSpeaking ? 'bg-blue-500' : 
                  conversationState === 'completed' ? 'bg-emerald-500' :
                  conversationState === 'not_started' ? 'bg-indigo-500' :
                  showTranscriptionConfirm ? 'bg-purple-500' :
                  'bg-blue-500'
                }`} />
                
                <div className={`relative text-2xl font-bold tracking-tight transition-all duration-500 ${
                  connectionError ? 'text-red-500 drop-shadow-lg' :
                  isRecording ? 'bg-gradient-to-r from-red-500 via-red-400 to-orange-500 bg-clip-text text-transparent drop-shadow-lg' : 
                  isAgentSpeaking ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent drop-shadow-lg' : 
                  conversationState === 'completed' ? 'bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 bg-clip-text text-transparent drop-shadow-lg' :
                  conversationState === 'not_started' ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-lg' :
                  conversationState === 'starting' ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent drop-shadow-lg animate-pulse' :
                  isEvaluating ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent drop-shadow-lg' :
                  isProcessing ? 'bg-gradient-to-r from-gray-600 via-blue-500 to-indigo-500 bg-clip-text text-transparent drop-shadow-lg' :
                  showTranscriptionConfirm ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 bg-clip-text text-transparent drop-shadow-lg' :
                  waitingForUser ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 bg-clip-text text-transparent drop-shadow-lg' :
                  isDarkMode ? 'bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent drop-shadow-lg' : 
                  'bg-gradient-to-r from-gray-700 via-gray-600 to-gray-800 bg-clip-text text-transparent drop-shadow-lg'
                } ${
                  (isRecording || isAgentSpeaking || conversationState === 'starting') ? 'animate-pulse' : ''
          }`}>
            {getStatusText()}
          </div>
                
                {/* Decorative elements for specific states */}
                                 {conversationState === 'not_started' && (
                   <div className="flex justify-center mt-2">
                     <div className="flex space-x-1">
                       <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0ms'} as React.CSSProperties}></div>
                       <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '150ms'} as React.CSSProperties}></div>
                       <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '300ms'} as React.CSSProperties}></div>
                     </div>
                   </div>
                 )}
                 
          {isRecording && (
                   <div className="flex justify-center mt-2">
                     <div className="flex space-x-1">
                       <div className="w-1 h-1 bg-red-400 rounded-full animate-ping" style={{animationDelay: '0ms'} as React.CSSProperties}></div>
                       <div className="w-1 h-1 bg-orange-400 rounded-full animate-ping" style={{animationDelay: '100ms'} as React.CSSProperties}></div>
                       <div className="w-1 h-1 bg-red-400 rounded-full animate-ping" style={{animationDelay: '200ms'} as React.CSSProperties}></div>
                     </div>
                   </div>
                 )}
                 
                 {isAgentSpeaking && (
                   <div className="flex justify-center mt-2">
                     <div className="flex space-x-1">
                       <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0ms'} as React.CSSProperties}></div>
                       <div className="w-1 h-1 bg-indigo-400 rounded-full animate-pulse" style={{animationDelay: '200ms'} as React.CSSProperties}></div>
                       <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '400ms'} as React.CSSProperties}></div>
                     </div>
                   </div>
                 )}
                
                                 {conversationState === 'starting' && (
                   <div className="flex justify-center mt-2">
                     <div className="flex space-x-1">
                       <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" style={{animationDelay: '0ms'} as React.CSSProperties}></div>
                       <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping" style={{animationDelay: '200ms'} as React.CSSProperties}></div>
                       <div className="w-2 h-2 bg-indigo-400 rounded-full animate-ping" style={{animationDelay: '400ms'} as React.CSSProperties}></div>
                     </div>
                   </div>
                 )}
                 
                 {isProcessing && (
                   <div className="flex justify-center mt-2">
                     <div className="flex space-x-1">
                       <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0ms'} as React.CSSProperties}></div>
                       <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" style={{animationDelay: '100ms'} as React.CSSProperties}></div>
                       <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '200ms'} as React.CSSProperties}></div>
                       <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" style={{animationDelay: '300ms'} as React.CSSProperties}></div>
                       <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '400ms'} as React.CSSProperties}></div>
                     </div>
            </div>
          )}
                 
                 {conversationState === 'completed' && (
                  <div className="flex justify-center mt-2">
                    <div className="flex space-x-1">
                      <div className="text-emerald-400 animate-bounce" style={{animationDelay: '0ms'} as React.CSSProperties}>🎉</div>
                      <div className="text-emerald-400 animate-bounce" style={{animationDelay: '200ms'} as React.CSSProperties}>✨</div>
                      <div className="text-emerald-400 animate-bounce" style={{animationDelay: '400ms'} as React.CSSProperties}>🎯</div>
          </div>
        </div>
                )}
              </div>
              
              {isRecording && (
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500 blur-xl opacity-30 animate-pulse"></div>
                  <div className="relative bg-gradient-to-r from-red-500 via-orange-500 to-red-600 bg-clip-text text-transparent font-mono text-4xl font-bold animate-pulse drop-shadow-2xl">
                    🔴 {formatTime(recordingTime)}
                  </div>
                  <div className="text-red-400 text-sm font-medium mt-1 animate-pulse">Recording in progress...</div>
                </div>
              )}

              {/* Circular Progress */}
              {totalQuestions > 0 && conversationState !== 'not_started' && (
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative w-32 h-32">
                    {/* Background Circle */}
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        stroke={isDarkMode ? '#374151' : '#e5e7eb'}
                        strokeWidth="8"
                        fill="none"
                        className="opacity-30"
                      />
                      {/* Progress Circle */}
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        stroke={
                          conversationState === 'completed' ? '#10b981' :
                          isEvaluating ? '#3b82f6' :
                          '#6366f1'
                        }
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 50}`}
                        strokeDashoffset={`${2 * Math.PI * 50 * (1 - getProgressPercentage() / 100)}`}
                        className="transition-all duration-1000 ease-out"
                        style={{
                          filter: 'drop-shadow(0 0 6px currentColor)',
                        }}
                      />
                    </svg>
                    
                    {/* Center Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className={`text-2xl font-bold ${
                        conversationState === 'completed' ? 'text-emerald-600' :
                        isEvaluating ? 'text-blue-600' :
                        conversationState === 'consent' ? 'text-indigo-600' :
                        isDarkMode ? 'text-blue-400' : 'text-indigo-700'
                      }`}>
                        {getProgressPercentage()}%
                      </div>
                      <div className={`text-xs font-semibold ${
                        conversationState === 'consent' ? 'text-indigo-500' :
                        isEvaluating ? 'text-blue-500' :
                        conversationState === 'completed' ? 'text-emerald-500' :
                        isDarkMode ? 'text-blue-400' : 'text-indigo-600'
                      }`}>
                        {conversationState === 'consent' ? '✨ Starting' : 
                         isEvaluating ? '🔍 Evaluating' :
                         conversationState === 'completed' ? '🎉 Complete!' :
                         `📝 ${currentQuestionNumber}/${totalQuestions}`}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Audio Visualizer */}
            <div className="relative">
              {/* Waveform Visualizer */}
              <div className="flex justify-center items-end space-x-1 h-32">
                {audioLevels.map((level, i) => (
            <div
              key={i}
                    className={`w-3 rounded-full transition-all duration-200 relative ${
                      isRecording ? 'bg-gradient-to-t from-red-500 via-red-400 to-red-300' :
                      isAgentSpeaking ? 'bg-gradient-to-t from-blue-500 via-blue-400 to-blue-300' :
                      isDarkMode ? 'bg-gradient-to-t from-gray-600 to-gray-500' : 'bg-gradient-to-t from-gray-300 to-gray-200'
              }`}
              style={{
                      height: (isRecording || isAgentSpeaking) ? `${level * 0.8 + 20}px` : '20px',
                      animationDelay: `${i * 50}ms`,
                      filter: (isRecording || isAgentSpeaking) ? 'drop-shadow(0 0 4px currentColor)' : 'none'
                    }}
                  >
                    {/* Glow effect */}
                    {(isRecording || isAgentSpeaking) && (
                      <div className="absolute inset-0 rounded-full bg-current opacity-20 animate-pulse" />
                    )}
                  </div>
          ))}
        </div>

              {/* Audio Activity Ring */}
              {(isRecording || isAgentSpeaking) && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className={`w-48 h-48 rounded-full border-2 animate-ping ${
                    isRecording ? 'border-red-400/30' : 'border-blue-400/30'
                  }`} />
                  <div className={`absolute w-40 h-40 rounded-full border animate-pulse ${
                    isRecording ? 'border-red-400/50' : 'border-blue-400/50'
                  }`} />
                </div>
              )}
            </div>

            {/* Enhanced Button System */}
            <div className="space-y-8">
              {/* Primary Button with Floating Effect */}
          <div className="flex justify-center">
                <div className="relative">
                  {/* Enhanced Button Glow Ring for Special States */}
                                     {(conversationState === 'not_started') && (
                     <>
                       <div className="absolute inset-0 rounded-full animate-gentle-pulse bg-pink-400/30" style={{ padding: '2rem' }} />
                       <div className="absolute inset-0 rounded-full animate-gentle-pulse bg-purple-400/20" style={{ padding: '1.5rem', animationDelay: '1s' } as React.CSSProperties} />
                       <div className="absolute inset-0 rounded-full animate-gentle-pulse bg-indigo-400/20" style={{ padding: '1rem', animationDelay: '2s' } as React.CSSProperties} />
                     </>
                   )}
                  
                  {(conversationState === 'completed') && (
                    <>
                      <div className="absolute inset-0 rounded-full animate-gentle-pulse bg-purple-400/30" style={{ padding: '2rem' }} />
                      <div className="absolute inset-0 rounded-full animate-gentle-pulse bg-pink-400/20" style={{ padding: '1.5rem', animationDelay: '1s' } as React.CSSProperties} />
                      <div className="absolute inset-0 rounded-full animate-gentle-pulse bg-indigo-400/20" style={{ padding: '1rem', animationDelay: '2s' } as React.CSSProperties} />
                    </>
                  )}
                  
                  {(conversationState === 'starting') && (
                    <>
                      <div className="absolute inset-0 rounded-full animate-ping bg-cyan-400/30" style={{ padding: '2rem' }} />
                      <div className="absolute inset-0 rounded-full animate-pulse bg-blue-400/20" style={{ padding: '1.5rem' }} />
                      <div className="absolute inset-0 rounded-full animate-ping bg-indigo-400/20" style={{ padding: '1rem', animationDelay: '0.3s' } as React.CSSProperties} />
                    </>
                  )}
                  
                  {isProcessing && (
                    <>
                      <div className="absolute inset-0 rounded-full animate-ping bg-blue-400/30" style={{ padding: '2rem' }} />
                      <div className="absolute inset-0 rounded-full animate-pulse bg-indigo-400/20" style={{ padding: '1.5rem' }} />
                      <div className="absolute inset-0 rounded-full animate-ping bg-purple-400/20" style={{ padding: '1rem', animationDelay: '0.4s' } as React.CSSProperties} />
                    </>
                  )}
                  
                  {/* Standard Button Glow Ring */}
                  {(isRecording || isAgentSpeaking) && !isProcessing && conversationState !== 'starting' && (
                    <div className={`absolute inset-0 rounded-full animate-ping ${
                      isRecording ? 'bg-red-400/20' : 'bg-blue-400/20'
                    }`} style={{ padding: '1rem' }} />
                  )}
                  
            <button
              onClick={buttonConfig.primary.action}
              disabled={buttonConfig.disabled}
                    className={`relative p-8 rounded-full transition-all duration-500 transform hover:scale-110 active:scale-95 text-white backdrop-blur-sm ${
                      getButtonColorClasses(buttonConfig.primary.color, true)
                    } disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed hover:shadow-2xl group`}
                    style={{
                      boxShadow: buttonConfig.disabled ? '' : '0 20px 40px -12px rgba(0,0,0,0.25)',
                    }}
                  >
                    <buttonConfig.primary.icon className="h-12 w-12 transition-transform duration-300 group-hover:scale-110" />
                    
                    {/* Button Inner Glow */}
                    <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          </div>
              </div>

              {/* Primary Button Label with Enhanced Typography */}
              <div className="relative">
                {/* Special gradient text for key states */}
                                 {conversationState === 'not_started' && (
                   <>
                     <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 blur-lg opacity-30"></div>
                     <div className="relative text-xl font-bold tracking-wide bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent drop-shadow-lg">
                       🚀 {buttonConfig.primary.text}
                     </div>
                   </>
                 )}
                
                {conversationState === 'starting' && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 blur-lg opacity-30 animate-pulse"></div>
                    <div className="relative text-xl font-bold tracking-wide bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent drop-shadow-lg animate-pulse">
                      🔄 {buttonConfig.primary.text}
                    </div>
                  </>
                )}
                
                {isProcessing && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 blur-lg opacity-30 animate-pulse"></div>
                    <div className="relative text-xl font-bold tracking-wide bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent drop-shadow-lg animate-pulse">
                      ⚡ {buttonConfig.primary.text}
                    </div>
                  </>
                )}
                
                {/* Special gradient text for completed state */}
                {conversationState === 'completed' && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 blur-lg opacity-30"></div>
                    <div className="relative text-xl font-bold tracking-wide bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 bg-clip-text text-transparent drop-shadow-lg">
                      🔄 {buttonConfig.primary.text}
                    </div>
                  </>
                )}
                
                {/* Standard text styling for other states */}
                {conversationState !== 'not_started' && conversationState !== 'starting' && !isProcessing && conversationState !== 'completed' && (
                  <div className={`text-xl font-semibold tracking-wide ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
            {buttonConfig.primary.text}
                  </div>
                )}
          </div>

              {/* Floating Secondary Buttons */}
          {buttonConfig.secondary.length > 0 && (
                <div className="flex justify-center items-center space-x-6">
              {buttonConfig.secondary.map((btn, index) => (
                    <div key={index} className="group flex flex-col items-center space-y-2">
                <button
                  onClick={btn.action}
                        className={`p-4 rounded-full transition-all duration-300 transform hover:scale-110 active:scale-95 text-white backdrop-blur-sm hover:shadow-xl ${
                    getButtonColorClasses(btn.color)
                        } group relative overflow-hidden`}
                  title={btn.text}
                >
                        <btn.icon className="h-6 w-6 relative z-10 transition-transform duration-300 group-hover:scale-110" />
                        
                        {/* Floating effect background */}
                        <div className="absolute inset-0 bg-white/10 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300" />
                </button>
                      
                      {/* Floating Label */}
                      <div className={`text-sm font-medium opacity-70 group-hover:opacity-100 transition-all duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {btn.text}
                      </div>
            </div>
              ))}
            </div>
          )}
        </div>

            {/* Enhanced Transcription Display */}
            {lastTranscription && showTranscriptionConfirm && !isEvaluating && !isProcessing && (
              <div className={`backdrop-blur-md rounded-2xl p-6 max-w-2xl mx-auto border transition-all duration-500 hover:scale-[1.02] ${
                isDarkMode 
                  ? 'bg-blue-900/30 border-blue-700/50 shadow-blue-500/10' 
                  : 'bg-blue-50/70 border-blue-200/50 shadow-blue-500/10'
              }`}>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Volume2 className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} animate-pulse`} />
                    <h4 className={`text-sm font-bold tracking-wide bg-gradient-to-r ${
                      isDarkMode 
                        ? 'from-blue-400 via-blue-300 to-indigo-400 bg-clip-text text-transparent' 
                        : 'from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent'
                    }`}>
                      💬 Your last response was:
                    </h4>
                  </div>
                  
                  <div className={`text-lg leading-relaxed italic ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    "{lastTranscription}"
                  </div>
                  
                  <div className={`text-xs flex items-center space-x-1 ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    <CheckCircle className="h-4 w-4 animate-pulse" />
                    <span className="font-medium">✨ Is this correct? Use the above buttons or Start Speaking to correct it.</span>
                  </div>
            </div>
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}; 