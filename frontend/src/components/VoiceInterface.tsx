import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, RotateCcw, CheckCircle, RefreshCw, Play, Square, Send, Moon, Sun, ChevronDown, Settings, Globe, VolumeX, Palette, FileText, X } from 'lucide-react';
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
  participantName?: string;
  
  // Study selection
  selectedStudy: Study | null;
  onStudySelect: (study: Study) => void;
  
  // Actions
  startInterview: (studyId: string, participantName?: string) => void;
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
  participantName,
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
  const [selectedVoice, setSelectedVoice] = useState('nova');
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

  // Auto-scroll to results when interview completes
  useEffect(() => {
    if (conversationState === 'completed') {
      const timer = setTimeout(() => {
        const resultsElement = document.querySelector('[data-results-section]');
        if (resultsElement) {
          resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 800); // Slight delay to allow UI to settle

      return () => clearTimeout(timer);
    }
  }, [conversationState]);

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
            startInterview(selectedStudy.id, participantName);
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

    // State 9: Interview completed - Beautiful View Results button only
    if (conversationState === 'completed') {
      return {
        primary: { 
          action: () => {
            // Smooth scroll to results when clicked
            const resultsElement = document.querySelector('[data-results-section]');
            if (resultsElement) {
              resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 
          icon: ChevronDown, 
          text: "✨ View Results", 
          color: "results" 
        },
        secondary: [],
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
      results: isPrimary 
        ? 'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 hover:from-emerald-500 hover:via-teal-600 hover:to-cyan-700 shadow-teal-500/30 hover:shadow-teal-500/50 animate-pulse hover:animate-breathing' 
        : 'bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-teal-500/20 hover:shadow-teal-500/30',
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
    <div className={`relative min-h-screen transition-all duration-500 ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'}`}>
      
      {/* Beautiful Settings Sidebar - Right Side */}
      <div className="absolute right-6 top-8 z-20">
        <div className={`backdrop-blur-xl rounded-3xl shadow-2xl border p-6 transition-all duration-500 hover:scale-105 ${
              isDarkMode 
            ? 'bg-gray-800/40 border-gray-700/30 shadow-black/20' 
            : 'bg-white/80 border-white/20 shadow-indigo-500/10'
        }`}>
          {/* Settings Header */}
          <div className="text-center mb-6">
            <div className={`inline-flex p-3 rounded-2xl backdrop-blur-sm transition-all duration-500 ${
              isDarkMode 
                ? 'bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-purple-600/20 border border-blue-500/30' 
                : 'bg-gradient-to-br from-indigo-50/80 via-purple-50/60 to-pink-50/80 border border-indigo-200/50'
            }`}>
              <Settings className={`h-7 w-7 ${isDarkMode ? 'text-blue-400' : 'text-indigo-600'}`} />
            </div>
            <h3 className={`text-lg font-bold mt-3 ${
              isDarkMode 
                ? 'bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent' 
                : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent'
            }`}>
              Settings
            </h3>
            <div className="flex justify-center mt-2">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0ms'} as React.CSSProperties}></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '150ms'} as React.CSSProperties}></div>
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '300ms'} as React.CSSProperties}></div>
              </div>
          </div>
        </div>

          {/* Enhanced Settings Buttons - Vertical Layout with Study Card Effects */}
          <div className="space-y-6">
            {/* Voice & Language Settings - Now First */}
            <div className="group/card relative overflow-hidden rounded-3xl backdrop-blur-2xl border-2 shadow-2xl transition-all duration-700 hover:scale-[1.08] hover:-translate-y-3 cursor-pointer">
              {/* Magical background layers */}
              <div className={`absolute inset-0 bg-gradient-to-br opacity-60 transition-all duration-700 group-hover/card:opacity-80 rounded-3xl ${
                isDarkMode 
                  ? 'from-indigo-800/60 via-purple-700/40 to-indigo-800/60' 
                  : 'from-indigo-100/80 via-purple-50/70 to-indigo-100/80'
              }`}></div>
              
              {/* Enhanced shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent transform -skew-x-12 -translate-x-full group-hover/card:translate-x-full transition-transform duration-1000 rounded-3xl"></div>
              
              {/* Floating sparkles */}
              <div className="absolute top-4 right-6 w-2 h-2 bg-indigo-400/60 rounded-full animate-bounce shadow-lg shadow-indigo-400/40" style={{animationDelay: '0s'}}></div>
              <div className="absolute bottom-4 left-6 w-1.5 h-1.5 bg-purple-400/50 rounded-full animate-bounce shadow-md shadow-purple-400/60" style={{animationDelay: '0.7s'}}></div>
              <div className="absolute top-1/2 right-8 w-1 h-1 bg-indigo-300/60 rounded-full animate-bounce shadow-sm shadow-indigo-300/50" style={{animationDelay: '1.2s'}}></div>
              <div className="absolute top-6 left-1/2 w-1.5 h-1.5 bg-purple-300/70 rounded-full animate-bounce shadow-md shadow-purple-300/60" style={{animationDelay: '0.3s'}}></div>
              
              {/* Floating decorative rings */}
              <div className="absolute top-3 right-3 w-8 h-8 border border-indigo-400/20 rounded-full opacity-0 group-hover/card:opacity-60 group-hover/card:scale-110 transition-all duration-500"></div>
              <div className="absolute bottom-3 left-3 w-6 h-6 border border-purple-400/30 rounded-full opacity-0 group-hover/card:opacity-50 group-hover/card:scale-125 transition-all duration-700" style={{animationDelay: '0.2s'}}></div>
              
              {/* Enhanced border glow */}
              <div className={`absolute inset-0 rounded-3xl border-2 opacity-0 group-hover/card:opacity-100 transition-all duration-500 ${
                isDarkMode ? 'border-indigo-400/50' : 'border-indigo-500/60'
              }`}></div>
              
          <button
            onClick={() => setShowSettings(!showSettings)}
                className={`relative w-full p-4 rounded-3xl transition-all duration-700 ${
                  showSettings ? 'ring-2 ring-indigo-400/60 scale-105 shadow-lg shadow-indigo-500/20' : ''
                }`}
          >
                <div className="relative z-10 flex flex-col items-center space-y-3">
                  <div className={`relative p-3 rounded-xl transition-all duration-500 group-hover/card:rotate-12 group-hover/card:scale-110 shadow-xl ${
                    isDarkMode ? 'bg-indigo-600/30 shadow-indigo-600/40' : 'bg-indigo-500/30 shadow-indigo-500/40'
                  }`}>
                    <Settings className={`h-6 w-6 ${isDarkMode ? 'text-indigo-300' : 'text-indigo-700'} drop-shadow-lg`} />
            
                    {/* Enhanced Language Badge */}
                    <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-500 group-hover/card:scale-110 group-hover/card:rotate-12 shadow-xl ${
              isDarkMode 
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-indigo-400 shadow-indigo-500/50' 
                        : 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-indigo-500 shadow-indigo-600/50'
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
                  </div>
                  
                  <div className="text-center">
                    <div className={`font-semibold text-sm bg-gradient-to-r bg-clip-text text-transparent transition-all duration-500 ${
                      isDarkMode 
                        ? 'from-indigo-300 via-purple-300 to-indigo-300' 
                        : 'from-indigo-700 via-purple-700 to-indigo-700'
                    } drop-shadow-lg`}>
                      Voice & Language
                    </div>
                    <div className={`text-xs mt-1 font-semibold transition-all duration-500 ${
                      isDarkMode ? 'text-indigo-400/70' : 'text-indigo-600/70'
          }`}>
                      Audio preferences
          </div>
                  </div>
                </div>
              </button>
        </div>

            {/* Study Selection - Now Second */}
            <div className="group/card relative overflow-hidden rounded-3xl backdrop-blur-2xl border-2 shadow-2xl transition-all duration-700 hover:scale-[1.08] hover:-translate-y-3 cursor-pointer">
              {/* Magical background layers */}
              <div className={`absolute inset-0 bg-gradient-to-br opacity-60 transition-all duration-700 group-hover/card:opacity-80 rounded-3xl ${
              isDarkMode 
                  ? 'from-emerald-800/60 via-teal-700/40 to-emerald-800/60' 
                  : 'from-emerald-100/80 via-teal-50/70 to-emerald-100/80'
              }`}></div>
              
              {/* Enhanced shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent transform -skew-x-12 -translate-x-full group-hover/card:translate-x-full transition-transform duration-1000 rounded-3xl"></div>
              
              {/* Floating sparkles */}
              <div className="absolute top-4 right-6 w-2 h-2 bg-emerald-400/60 rounded-full animate-bounce shadow-lg shadow-emerald-400/40" style={{animationDelay: '0.2s'}}></div>
              <div className="absolute bottom-4 left-6 w-1.5 h-1.5 bg-teal-400/50 rounded-full animate-bounce shadow-md shadow-teal-400/60" style={{animationDelay: '0.9s'}}></div>
              <div className="absolute top-1/2 right-8 w-1 h-1 bg-emerald-300/60 rounded-full animate-bounce shadow-sm shadow-emerald-300/50" style={{animationDelay: '1.4s'}}></div>
              <div className="absolute top-6 left-1/2 w-1.5 h-1.5 bg-teal-300/70 rounded-full animate-bounce shadow-md shadow-teal-300/60" style={{animationDelay: '0.5s'}}></div>
              
              {/* Floating decorative rings */}
              <div className="absolute top-3 right-3 w-8 h-8 border border-emerald-400/20 rounded-full opacity-0 group-hover/card:opacity-60 group-hover/card:scale-110 transition-all duration-500"></div>
              <div className="absolute bottom-3 left-3 w-6 h-6 border border-teal-400/30 rounded-full opacity-0 group-hover/card:opacity-50 group-hover/card:scale-125 transition-all duration-700" style={{animationDelay: '0.2s'}}></div>
              
              {/* Enhanced border glow */}
              <div className={`absolute inset-0 rounded-3xl border-2 opacity-0 group-hover/card:opacity-100 transition-all duration-500 ${
                isDarkMode ? 'border-emerald-400/50' : 'border-emerald-500/60'
              }`}></div>
              
              <button
                onClick={() => setShowStudySelector(!showStudySelector)}
                className={`relative w-full p-4 rounded-3xl transition-all duration-700 ${
                  showStudySelector ? 'ring-2 ring-emerald-400/60 scale-105 shadow-lg shadow-emerald-500/20' : ''
            }`}
          >
                <div className="relative z-10 flex flex-col items-center space-y-3">
                  <div className={`relative p-3 rounded-xl transition-all duration-500 group-hover/card:rotate-6 group-hover/card:scale-110 shadow-xl ${
                    isDarkMode ? 'bg-emerald-600/30 shadow-emerald-600/40' : 'bg-emerald-500/30 shadow-emerald-500/40'
                  }`}>
                    <FileText className={`h-6 w-6 ${isDarkMode ? 'text-emerald-300' : 'text-emerald-700'} drop-shadow-lg`} />
                    
                    {/* Enhanced Study Badge */}
                    <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-500 group-hover/card:scale-110 group-hover/card:rotate-6 shadow-xl ${
                      isDarkMode 
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-emerald-400 shadow-emerald-500/50' 
                        : 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-emerald-500 shadow-emerald-600/50'
                    } animate-pulse`}>
                      {selectedStudy ? (() => {
                        const hash = selectedStudy.category.split('').reduce((a, b) => {
                          a = ((a << 5) - a) + b.charCodeAt(0);
                          return a & a;
                        }, 0);
                        const iconIndex = Math.abs(hash) % 8;
                        const icons = ['🧬', '🩺', '❤️', '🦴', '🧠', '👁️', '🫁', '💊'];
                        return icons[iconIndex];
                      })() : '🧬'}
                    </div>
            </div>
            
                  <div className="text-center">
                    <div className={`font-semibold text-sm bg-gradient-to-r bg-clip-text text-transparent transition-all duration-500 ${
              isDarkMode 
                        ? 'from-emerald-300 via-teal-300 to-emerald-300' 
                        : 'from-emerald-700 via-teal-700 to-emerald-700'
                    } drop-shadow-lg`}>
                      Study Selection
                    </div>
                    <div className={`text-xs mt-1 font-semibold transition-all duration-500 ${
                      isDarkMode ? 'text-emerald-400/70' : 'text-emerald-600/70'
                    }`}>
                      Choose your trial
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* Enhanced Theme Support - Copy from Dashboard */}
            <div className="group/card relative overflow-hidden rounded-3xl backdrop-blur-2xl border-2 shadow-2xl transition-all duration-700 hover:scale-[1.08] hover:-translate-y-3 cursor-pointer">
              {/* Magical background layers */}
              <div className={`absolute inset-0 bg-gradient-to-br opacity-60 transition-all duration-700 group-hover/card:opacity-80 rounded-3xl ${
                isDarkMode 
                  ? 'from-amber-800/60 via-orange-700/40 to-amber-800/60' 
                  : 'from-orange-100/80 via-amber-50/70 to-orange-100/80'
              }`}></div>
              
              {/* Enhanced shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent transform -skew-x-12 -translate-x-full group-hover/card:translate-x-full transition-transform duration-1000 rounded-3xl"></div>
              
              {/* Floating sparkles */}
              <div className="absolute top-4 right-6 w-2 h-2 bg-amber-400/60 rounded-full animate-bounce shadow-lg shadow-amber-400/40" style={{animationDelay: '0.3s'}}></div>
              <div className="absolute bottom-4 left-6 w-1.5 h-1.5 bg-orange-400/50 rounded-full animate-bounce shadow-md shadow-orange-400/60" style={{animationDelay: '1.0s'}}></div>
              <div className="absolute top-1/2 right-8 w-1 h-1 bg-amber-300/60 rounded-full animate-bounce shadow-sm shadow-amber-300/50" style={{animationDelay: '1.5s'}}></div>
              <div className="absolute top-6 left-1/2 w-1.5 h-1.5 bg-orange-300/70 rounded-full animate-bounce shadow-md shadow-orange-300/60" style={{animationDelay: '0.6s'}}></div>
              
              {/* Floating decorative rings */}
              <div className="absolute top-3 right-3 w-8 h-8 border border-amber-400/20 rounded-full opacity-0 group-hover/card:opacity-60 group-hover/card:scale-110 transition-all duration-500"></div>
              <div className="absolute bottom-3 left-3 w-6 h-6 border border-orange-400/30 rounded-full opacity-0 group-hover/card:opacity-50 group-hover/card:scale-125 transition-all duration-700" style={{animationDelay: '0.2s'}}></div>
              
              {/* Enhanced border glow */}
              <div className={`absolute inset-0 rounded-3xl border-2 opacity-0 group-hover/card:opacity-100 transition-all duration-500 ${
                isDarkMode ? 'border-amber-400/50' : 'border-orange-500/60'
              }`}></div>
              
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="relative w-full p-4 rounded-3xl transition-all duration-700"
              >
                <div className="relative z-10 flex flex-col items-center space-y-3">
                  <div className={`relative p-3 rounded-xl transition-all duration-500 group-hover/card:rotate-12 group-hover/card:scale-110 shadow-xl ${
                    isDarkMode ? 'bg-amber-600/30 shadow-amber-600/40' : 'bg-orange-500/30 shadow-orange-500/40'
            }`}>
                    <Palette className={`h-6 w-6 ${isDarkMode ? 'text-amber-300' : 'text-orange-700'} drop-shadow-lg`} />
                    
                    {/* Enhanced Theme Badge */}
                    <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-500 group-hover/card:scale-110 group-hover/card:rotate-12 shadow-xl ${
                      isDarkMode 
                        ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border-amber-400 shadow-amber-500/50' 
                        : 'bg-gradient-to-br from-orange-600 to-amber-700 text-white border-orange-500 shadow-orange-600/50'
                    } animate-pulse`}>
              {isDarkMode ? (
                        <Moon className="h-4 w-4" />
              ) : (
                        <Sun className="h-4 w-4" />
              )}
            </div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`font-semibold text-sm bg-gradient-to-r bg-clip-text text-transparent transition-all duration-500 ${
                      isDarkMode 
                        ? 'from-amber-300 via-orange-300 to-amber-300' 
                        : 'from-orange-700 via-amber-700 to-orange-700'
                    } drop-shadow-lg`}>
                      Theme Mode
                    </div>
                    <div className={`text-xs mt-1 font-semibold transition-all duration-500 ${
                      isDarkMode ? 'text-amber-400/70' : 'text-orange-600/70'
          }`}>
                      {isDarkMode ? 'Dark theme' : 'Light theme'}
          </div>
                  </div>
                </div>
              </button>
        </div>
      </div>

          {/* Decorative bottom element */}
          <div className="mt-6 pt-4 border-t border-gray-200/20">
            <div className="flex justify-center">
              <div className={`w-12 h-1 rounded-full ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500' 
                  : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'
              }`} />
            </div>
          </div>
        </div>
      </div>

      {/* Voice Settings Panel Overlay */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-20 flex items-center justify-center p-4">
          <div className={`w-full max-w-5xl max-h-[90vh] backdrop-blur-xl rounded-3xl shadow-2xl border transition-all duration-500 overflow-hidden ${
            isDarkMode 
              ? 'bg-gray-800/90 border-gray-700/50' 
              : 'bg-white/90 border-white/20'
          }`}>
            {/* Scrollable Content Container */}
            <div className="overflow-y-auto max-h-[90vh] custom-scrollbar p-6">
            {/* Enhanced Settings Header */}
            <div className={`relative flex items-center justify-between mb-8 p-6 rounded-2xl backdrop-blur-sm border ${
              isDarkMode 
                ? 'bg-gradient-to-r from-purple-600/20 via-indigo-600/15 to-purple-600/20 border-purple-500/30' 
                : 'bg-gradient-to-r from-purple-50/80 via-indigo-50/60 to-purple-50/80 border-purple-200/30'
            }`}>
              {/* Background sparkles */}
              <div className="absolute top-2 right-8 w-1.5 h-1.5 bg-purple-400/40 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
              <div className="absolute bottom-2 left-8 w-1 h-1 bg-indigo-400/30 rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
              
              <div className="flex items-center space-x-4">
                <div className={`relative p-3 rounded-xl backdrop-blur-md border shadow-lg transition-all duration-500 ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-purple-600/30 via-indigo-600/20 to-purple-600/30 border-purple-500/40' 
                    : 'bg-gradient-to-br from-purple-100/90 via-indigo-100/70 to-purple-100/90 border-purple-300/40'
                }`}>
                  <div className={`absolute top-1 right-1 w-2 h-2 rounded-full animate-pulse ${
                    isDarkMode ? 'bg-purple-400/60' : 'bg-purple-500/60'
                  }`}></div>
                  <Settings className={`h-6 w-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
                
                <div>
                  <h3 className={`text-2xl font-black bg-gradient-to-r bg-clip-text text-transparent transition-all duration-500 ${
                    isDarkMode 
                      ? 'from-purple-400 via-indigo-400 to-purple-400' 
                      : 'from-purple-600 via-indigo-600 to-purple-600'
                  } drop-shadow-lg`}>
                  Voice Settings
                </h3>
                  <p className={`text-sm mt-1 transition-all duration-500 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Customize your audio experience
                  </p>
              </div>
              </div>
              
              <button
                onClick={() => setShowSettings(false)}
                className={`group relative p-3 rounded-2xl transition-all duration-500 hover:scale-110 hover:rotate-90 backdrop-blur-md border ${
                  isDarkMode 
                    ? 'bg-gray-700/50 hover:bg-red-600/30 border-gray-600/50 hover:border-red-500/50' 
                    : 'bg-white/70 hover:bg-red-100/70 border-gray-300/50 hover:border-red-300/50'
                } hover:shadow-2xl hover:shadow-red-500/30`}
              >
                <X className={`h-6 w-6 transition-all duration-300 ${
                  isDarkMode ? 'text-gray-300 group-hover:text-red-300' : 'text-gray-600 group-hover:text-red-600'
                }`} />
                
                {/* Hover glow */}
                <div className="absolute inset-0 bg-red-400/0 group-hover:bg-red-400/20 rounded-2xl transition-all duration-500"></div>
              </button>
            </div>

            {/* Enhanced Language Selection */}
            <div className={`relative p-6 rounded-2xl backdrop-blur-sm border shadow-lg mb-6 ${
              isDarkMode 
                ? 'bg-gray-700/30 border-gray-600/30' 
                : 'bg-white/50 border-gray-200/30'
            }`}>
              <div className="absolute top-3 right-3 w-2 h-2 bg-blue-400/40 rounded-full animate-pulse"></div>
              
              <div className="flex items-center space-x-4 mb-4">
                <div className={`p-3 rounded-xl transition-all duration-500 ${
                  isDarkMode ? 'bg-blue-600/20' : 'bg-blue-100'
                }`}>
                  <Globe className={`h-6 w-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
                <h4 className={`text-lg font-black bg-gradient-to-r bg-clip-text text-transparent ${
                  isDarkMode 
                    ? 'from-blue-400 to-indigo-400' 
                    : 'from-blue-600 to-indigo-600'
                }`}>
                  Select Voice Language
                </h4>
              </div>
              
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className={`w-full p-5 rounded-2xl border-2 backdrop-blur-xl transition-all duration-500 hover:scale-105 shadow-xl hover:shadow-2xl text-lg font-bold ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-gray-700/80 via-gray-600/70 to-gray-700/80 border-blue-400/60 text-white focus:ring-4 focus:ring-blue-400/40 hover:border-purple-400/80 hover:from-gray-600/90 hover:to-gray-500/90' 
                    : 'bg-gradient-to-br from-white/90 via-gray-50/80 to-white/90 border-blue-500/60 text-gray-900 focus:ring-4 focus:ring-blue-500/40 hover:border-purple-500/80 hover:from-white/95 hover:to-gray-50/95'
                } focus:outline-none focus:border-indigo-500/80`}
                style={{
                  textShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.1)'
                }}
              >
                {availableLanguages.map((lang) => (
                  <option 
                    key={lang.code} 
                    value={lang.code}
                    className={`py-3 px-4 font-bold text-base transition-all duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-800 text-gray-200 hover:bg-gradient-to-r hover:from-indigo-700 hover:to-purple-700 hover:text-white' 
                        : 'bg-white text-gray-800 hover:bg-gradient-to-r hover:from-indigo-100 hover:to-purple-100 hover:text-indigo-900'
                    }`}
                  >
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Enhanced Voice Speed Control */}
            <div className={`relative p-6 rounded-2xl backdrop-blur-sm border shadow-lg mb-6 ${
              isDarkMode 
                ? 'bg-gray-700/30 border-gray-600/30' 
                : 'bg-white/50 border-gray-200/30'
            }`}>
              <div className="absolute top-3 right-3 w-2 h-2 bg-emerald-400/40 rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-xl transition-all duration-500 ${
                    isDarkMode ? 'bg-emerald-600/20' : 'bg-emerald-100'
                  }`}>
                    <Volume2 className={`h-6 w-6 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                </div>
                  <h4 className={`text-lg font-black bg-gradient-to-r bg-clip-text text-transparent ${
                  isDarkMode 
                      ? 'from-emerald-400 to-teal-400' 
                      : 'from-emerald-600 to-teal-600'
                  }`}>
                    Set Voice Speed
                  </h4>
                </div>
                <div className={`px-4 py-2 rounded-full border backdrop-blur-sm shadow-lg transition-all duration-300 hover:scale-110 ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-emerald-600/40 to-teal-600/40 border-emerald-400/50 text-emerald-300' 
                    : 'bg-gradient-to-r from-emerald-100 to-teal-100 border-emerald-300/50 text-emerald-700'
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
                    className={`w-full h-4 rounded-lg appearance-none cursor-pointer transition-all duration-300 hover:scale-105 ${
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
                  
                  {/* Enhanced Speed Indicator Line */}
                  <div 
                    className={`absolute top-1/2 w-1 h-8 -translate-y-1/2 transition-all duration-500 rounded-full shadow-lg ${
                      isDarkMode ? 'bg-emerald-400 shadow-emerald-400/50' : 'bg-emerald-600 shadow-emerald-600/50'
                    }`}
                    style={{
                      left: `${((selectedSpeed - 0.25) / (2.0 - 0.25)) * 100}%`,
                      transform: 'translateX(-50%) translateY(-50%)'
                    }}
                  />
                </div>
                
                {/* Speed markers - showing actual functional range */}
                <div className="flex justify-between text-xs font-bold px-2">
                  <span className={`transition-all duration-300 px-2 py-1 rounded-lg ${
                    selectedSpeed === 0.25 
                      ? isDarkMode 
                        ? 'text-emerald-300 bg-emerald-600/20 border border-emerald-400/40' 
                        : 'text-emerald-700 bg-emerald-100 border border-emerald-300/60' 
                      : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>0.25x</span>
                  <span className={`transition-all duration-300 px-2 py-1 rounded-lg ${
                    selectedSpeed === 0.5 
                      ? isDarkMode 
                        ? 'text-emerald-300 bg-emerald-600/20 border border-emerald-400/40' 
                        : 'text-emerald-700 bg-emerald-100 border border-emerald-300/60' 
                      : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>0.5x</span>
                  <span className={`transition-all duration-300 px-2 py-1 rounded-lg ${
                    selectedSpeed === 0.75 
                      ? isDarkMode 
                        ? 'text-emerald-300 bg-emerald-600/20 border border-emerald-400/40' 
                        : 'text-emerald-700 bg-emerald-100 border border-emerald-300/60' 
                      : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>0.75x</span>
                  <span className={`transition-all duration-300 px-2 py-1 rounded-lg ${
                    selectedSpeed === 1.0 
                      ? isDarkMode 
                        ? 'text-emerald-300 bg-emerald-600/20 border border-emerald-400/40' 
                        : 'text-emerald-700 bg-emerald-100 border border-emerald-300/60' 
                      : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>1.0x</span>
                  <span className={`transition-all duration-300 px-2 py-1 rounded-lg ${
                    selectedSpeed === 1.25 
                      ? isDarkMode 
                        ? 'text-emerald-300 bg-emerald-600/20 border border-emerald-400/40' 
                        : 'text-emerald-700 bg-emerald-100 border border-emerald-300/60' 
                      : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>1.25x</span>
                  <span className={`transition-all duration-300 px-2 py-1 rounded-lg ${
                    selectedSpeed === 1.5 
                      ? isDarkMode 
                        ? 'text-emerald-300 bg-emerald-600/20 border border-emerald-400/40' 
                        : 'text-emerald-700 bg-emerald-100 border border-emerald-300/60' 
                      : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>1.5x</span>
                  <span className={`transition-all duration-300 px-2 py-1 rounded-lg ${
                    selectedSpeed === 1.75 
                      ? isDarkMode 
                        ? 'text-emerald-300 bg-emerald-600/20 border border-emerald-400/40' 
                        : 'text-emerald-700 bg-emerald-100 border border-emerald-300/60' 
                      : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>1.75x</span>
                  <span className={`transition-all duration-300 px-2 py-1 rounded-lg ${
                    selectedSpeed === 2.0 
                      ? isDarkMode 
                        ? 'text-emerald-300 bg-emerald-600/20 border border-emerald-400/40' 
                        : 'text-emerald-700 bg-emerald-100 border border-emerald-300/60' 
                      : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>2.0x</span>
                </div>
              </div>
            </div>

            {/* Enhanced Voice Selection */}
            <div className={`relative p-6 rounded-2xl backdrop-blur-sm border shadow-lg mb-6 ${
              isDarkMode 
                ? 'bg-gray-700/30 border-gray-600/30' 
                : 'bg-white/50 border-gray-200/30'
            }`}>
              <div className="absolute top-3 right-3 w-2 h-2 bg-purple-400/40 rounded-full animate-pulse" style={{animationDelay: '0.6s'}}></div>
              
              <div className="flex items-center space-x-4 mb-6">
                <div className={`p-3 rounded-xl transition-all duration-500 ${
                  isDarkMode ? 'bg-purple-600/20' : 'bg-purple-100'
                }`}>
                  <Mic className={`h-6 w-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
                <h4 className={`text-lg font-black bg-gradient-to-r bg-clip-text text-transparent ${
                  isDarkMode 
                    ? 'from-purple-400 to-pink-400' 
                    : 'from-purple-600 to-pink-600'
                }`}>
                  Select Speaking Voice
                </h4>
              </div>
              
              {/* Enhanced Two Column Voice Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Professional Voices Column */}
                <div className={`group relative overflow-hidden rounded-2xl backdrop-blur-sm border shadow-lg transition-all duration-500 ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-gray-800/40 via-gray-700/30 to-gray-800/40 border-gray-600/40' 
                    : 'bg-gradient-to-br from-white/60 via-white/50 to-white/60 border-white/40'
                } p-6`}>
                  {/* Background effects */}
                  <div className={`absolute inset-0 bg-gradient-to-br opacity-5 transition-all duration-700 group-hover:opacity-15 rounded-2xl ${
                    isDarkMode ? 'from-indigo-500/30 to-purple-500/25' : 'from-indigo-400/25 to-purple-400/20'
                  }`}></div>
                  
                  {/* Floating sparkles */}
                  <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-indigo-400/40 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                  <div className="absolute bottom-3 left-3 w-1 h-1 bg-purple-400/30 rounded-full animate-bounce" style={{animationDelay: '0.8s'}}></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`p-2 rounded-lg ${
                        isDarkMode ? 'bg-indigo-600/20' : 'bg-indigo-100'
                      }`}>
                        <span className="text-xl">🏢</span>
                      </div>
                      <h5 className={`font-black text-base bg-gradient-to-r bg-clip-text text-transparent ${
                        isDarkMode 
                          ? 'from-indigo-400 to-purple-400' 
                          : 'from-indigo-600 to-purple-600'
                    }`}>
                      Professional
                      </h5>
                  </div>
                  
                  <div className="space-y-3">
                    {availableVoices
                      .filter(voice => voice.category === 'professional')
                        .map((voice, index) => (
                      <div
                        key={voice.id}
                          className={`group/card relative overflow-hidden rounded-xl border transition-all duration-500 cursor-pointer hover:scale-105 hover:-translate-y-1 ${
                          selectedVoice === voice.id
                            ? isDarkMode
                                ? 'bg-gradient-to-br from-purple-600/30 via-indigo-600/20 to-purple-600/30 border-purple-400/70 shadow-lg shadow-purple-500/30 ring-2 ring-purple-400/50'
                                : 'bg-gradient-to-br from-purple-100/80 via-indigo-100/60 to-purple-100/80 border-purple-300/70 shadow-lg shadow-purple-300/30 ring-2 ring-purple-500/50'
                            : isDarkMode
                              ? 'bg-gradient-to-br from-gray-700/30 via-gray-600/20 to-gray-700/30 border-gray-500/30 hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/20'
                              : 'bg-gradient-to-br from-white/70 via-white/60 to-white/70 border-gray-200/40 hover:border-purple-300/50 hover:shadow-lg hover:shadow-purple-300/20'
                          } p-4`}
                        onClick={() => setSelectedVoice(voice.id)}
                      >
                          {/* Card background effects */}
                          <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover/card:opacity-10 transition-all duration-500 rounded-xl ${
                            selectedVoice === voice.id 
                              ? 'from-purple-400/20 to-indigo-400/15' 
                              : 'from-purple-300/15 to-indigo-300/10'
                          }`}></div>
                          
                          {/* Floating sparkle */}
                          <div className="absolute top-2 right-2 w-1 h-1 bg-purple-400/50 rounded-full animate-pulse" style={{animationDelay: `${index * 0.3}s`}}></div>
                          
                          <div className="relative flex items-center justify-between">
                          <div className="flex-1">
                              <div className={`font-black text-sm transition-all duration-300 ${
                              selectedVoice === voice.id
                                  ? isDarkMode 
                                    ? 'bg-gradient-to-r from-purple-200 via-indigo-200 to-purple-200 bg-clip-text text-transparent' 
                                    : 'bg-gradient-to-r from-purple-800 via-indigo-800 to-purple-800 bg-clip-text text-transparent'
                                  : isDarkMode ? 'text-gray-200' : 'text-gray-800'
                              } drop-shadow-sm`}>
                              {voice.name}
                            </div>
                              <div className={`text-xs mt-1 leading-relaxed ${
                              selectedVoice === voice.id
                                  ? isDarkMode ? 'text-purple-300' : 'text-purple-700'
                                  : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {voice.description}
                            </div>
                          </div>
                          
                            {/* Enhanced Voice Preview Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              playVoicePreview(voice.id);
                            }}
                            disabled={playingVoice !== null}
                              className={`group/btn relative p-2.5 rounded-full transition-all duration-500 ml-3 hover:scale-125 hover:-translate-y-1 backdrop-blur-sm border shadow-lg ${
                              playingVoice === voice.id
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white animate-pulse border-emerald-400/50 shadow-emerald-500/40'
                                : playingVoice !== null
                                  ? 'bg-gray-400/50 text-gray-300 cursor-not-allowed border-gray-400/30'
                                : isDarkMode
                                  ? 'bg-gradient-to-r from-indigo-600/80 to-purple-600/80 text-white border-indigo-400/50 hover:from-indigo-500/90 hover:to-purple-500/90 hover:shadow-indigo-500/40'
                                  : 'bg-gradient-to-r from-indigo-500/90 to-purple-500/90 text-white border-indigo-300/50 hover:from-indigo-600/95 hover:to-purple-600/95 hover:shadow-indigo-300/40'
                            }`}
                          >
                            {playingVoice === voice.id ? (
                                <VolumeX className="h-3.5 w-3.5 group-hover/btn:scale-110 transition-transform duration-300" />
                            ) : (
                                <Play className="h-3.5 w-3.5 group-hover/btn:scale-110 transition-transform duration-300" />
                            )}
                              
                              {/* Button glow */}
                              <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/0 via-purple-400/20 to-indigo-400/0 rounded-full opacity-0 group-hover/btn:opacity-100 transition-all duration-500"></div>
                          </button>
                        </div>
                          
                          {/* Shimmer effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-300/8 to-transparent transform -skew-x-12 -translate-x-full group-hover/card:translate-x-full transition-transform duration-1000 rounded-xl"></div>
                      </div>
                    ))}
                    </div>
                  </div>
                </div>

                {/* Warm Voices Column */}
                <div className={`group relative overflow-hidden rounded-2xl backdrop-blur-sm border shadow-lg transition-all duration-500 ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-gray-800/40 via-gray-700/30 to-gray-800/40 border-gray-600/40' 
                    : 'bg-gradient-to-br from-white/60 via-white/50 to-white/60 border-white/40'
                } p-6`}>
                  {/* Background effects */}
                  <div className={`absolute inset-0 bg-gradient-to-br opacity-5 transition-all duration-700 group-hover:opacity-15 rounded-2xl ${
                    isDarkMode ? 'from-pink-500/30 to-amber-500/25' : 'from-pink-400/25 to-amber-400/20'
                  }`}></div>
                  
                  {/* Floating sparkles */}
                  <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-pink-400/40 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                  <div className="absolute bottom-3 left-3 w-1 h-1 bg-amber-400/30 rounded-full animate-bounce" style={{animationDelay: '1.2s'}}></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`p-2 rounded-lg ${
                        isDarkMode ? 'bg-pink-600/20' : 'bg-pink-100'
                      }`}>
                        <span className="text-xl">💫</span>
                      </div>
                      <h5 className={`font-black text-base bg-gradient-to-r bg-clip-text text-transparent ${
                        isDarkMode 
                          ? 'from-pink-400 to-amber-400' 
                          : 'from-pink-600 to-amber-600'
                    }`}>
                      Warm
                      </h5>
                  </div>
                  
                  <div className="space-y-3">
                    {availableVoices
                      .filter(voice => voice.category === 'warm')
                        .map((voice, index) => (
                      <div
                        key={voice.id}
                          className={`group/card relative overflow-hidden rounded-xl border transition-all duration-500 cursor-pointer hover:scale-105 hover:-translate-y-1 ${
                          selectedVoice === voice.id
                            ? isDarkMode
                                ? 'bg-gradient-to-br from-purple-600/30 via-pink-600/20 to-purple-600/30 border-purple-400/70 shadow-lg shadow-purple-500/30 ring-2 ring-purple-400/50'
                                : 'bg-gradient-to-br from-purple-100/80 via-pink-100/60 to-purple-100/80 border-purple-300/70 shadow-lg shadow-purple-300/30 ring-2 ring-purple-500/50'
                            : isDarkMode
                              ? 'bg-gradient-to-br from-gray-700/30 via-gray-600/20 to-gray-700/30 border-gray-500/30 hover:border-pink-400/50 hover:shadow-lg hover:shadow-pink-500/20'
                              : 'bg-gradient-to-br from-white/70 via-white/60 to-white/70 border-gray-200/40 hover:border-pink-300/50 hover:shadow-lg hover:shadow-pink-300/20'
                          } p-4`}
                        onClick={() => setSelectedVoice(voice.id)}
                      >
                          {/* Card background effects */}
                          <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover/card:opacity-10 transition-all duration-500 rounded-xl ${
                            selectedVoice === voice.id 
                              ? 'from-pink-400/20 to-amber-400/15' 
                              : 'from-pink-300/15 to-amber-300/10'
                          }`}></div>
                          
                          {/* Floating sparkle */}
                          <div className="absolute top-2 right-2 w-1 h-1 bg-pink-400/50 rounded-full animate-pulse" style={{animationDelay: `${index * 0.3 + 0.5}s`}}></div>
                          
                          <div className="relative flex items-center justify-between">
                          <div className="flex-1">
                              <div className={`font-black text-sm transition-all duration-300 ${
                              selectedVoice === voice.id
                                  ? isDarkMode 
                                    ? 'bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 bg-clip-text text-transparent' 
                                    : 'bg-gradient-to-r from-purple-800 via-pink-800 to-purple-800 bg-clip-text text-transparent'
                                  : isDarkMode ? 'text-gray-200' : 'text-gray-800'
                              } drop-shadow-sm`}>
                              {voice.name}
                            </div>
                              <div className={`text-xs mt-1 leading-relaxed ${
                              selectedVoice === voice.id
                                  ? isDarkMode ? 'text-purple-300' : 'text-purple-700'
                                  : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {voice.description}
                            </div>
                          </div>
                          
                            {/* Enhanced Voice Preview Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              playVoicePreview(voice.id);
                            }}
                            disabled={playingVoice !== null}
                              className={`group/btn relative p-2.5 rounded-full transition-all duration-500 ml-3 hover:scale-125 hover:-translate-y-1 backdrop-blur-sm border shadow-lg ${
                              playingVoice === voice.id
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white animate-pulse border-emerald-400/50 shadow-emerald-500/40'
                                : playingVoice !== null
                                  ? 'bg-gray-400/50 text-gray-300 cursor-not-allowed border-gray-400/30'
                                : isDarkMode
                                  ? 'bg-gradient-to-r from-pink-600/80 to-amber-600/80 text-white border-pink-400/50 hover:from-pink-500/90 hover:to-amber-500/90 hover:shadow-pink-500/40'
                                  : 'bg-gradient-to-r from-pink-500/90 to-amber-500/90 text-white border-pink-300/50 hover:from-pink-600/95 hover:to-amber-600/95 hover:shadow-pink-300/40'
                            }`}
                          >
                            {playingVoice === voice.id ? (
                                <VolumeX className="h-3.5 w-3.5 group-hover/btn:scale-110 transition-transform duration-300" />
                            ) : (
                                <Play className="h-3.5 w-3.5 group-hover/btn:scale-110 transition-transform duration-300" />
                            )}
                              
                              {/* Button glow */}
                              <div className="absolute inset-0 bg-gradient-to-r from-pink-400/0 via-amber-400/20 to-pink-400/0 rounded-full opacity-0 group-hover/btn:opacity-100 transition-all duration-500"></div>
                          </button>
                        </div>
                          
                          {/* Shimmer effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-300/8 to-transparent transform -skew-x-12 -translate-x-full group-hover/card:translate-x-full transition-transform duration-1000 rounded-xl"></div>
                      </div>
                    ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Enhanced Voice Preview Status */}
              {playingVoice && (
                <div className={`mt-6 text-center p-3 rounded-xl backdrop-blur-sm border ${
                  isDarkMode 
                    ? 'bg-emerald-600/20 border-emerald-500/30 text-emerald-300' 
                    : 'bg-emerald-100/80 border-emerald-200/40 text-emerald-700'
                } animate-pulse`}>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-lg">🎵</span>
                    <span className="font-semibold">
                      Playing preview for {availableVoices.find(v => v.id === playingVoice)?.name} at {selectedSpeed}x speed, may take a few seconds to speak please wait...
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={() => setShowSettings(false)}
                className={`group relative flex-1 p-4 rounded-2xl font-semibold transition-all duration-500 hover:scale-105 hover:-translate-y-1 backdrop-blur-md border shadow-lg ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-gray-700/80 to-gray-600/80 text-gray-300 border-gray-500/50 hover:from-gray-600/90 hover:to-gray-500/90 hover:border-gray-400/60' 
                    : 'bg-gradient-to-r from-gray-200/80 to-gray-300/80 text-gray-700 border-gray-300/50 hover:from-gray-300/90 hover:to-gray-400/90 hover:border-gray-400/60'
                } hover:shadow-xl`}
              >
                <span className="relative z-10 flex items-center justify-center space-x-2">
                  <X className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                  <span>Cancel</span>
                </span>
                
                {/* Button glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-gray-400/0 via-gray-400/10 to-gray-400/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              </button>
              
              <button
                onClick={saveSettings}
                className="group relative flex-1 p-5 rounded-3xl font-black text-lg transition-all duration-700 hover:scale-[1.15] hover:-translate-y-3 backdrop-blur-xl border-2 shadow-2xl bg-gradient-to-br from-purple-600/90 via-indigo-600/80 via-pink-600/70 to-purple-700/90 hover:from-purple-500/95 hover:via-indigo-500/85 hover:via-pink-500/75 hover:to-purple-600/95 border-purple-400/60 hover:border-pink-400/80 text-white hover:shadow-2xl hover:shadow-purple-500/50 overflow-hidden"
              >
                {/* Magical background layers */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-pink-500/30 via-indigo-500/20 to-purple-500/0 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/0 via-pink-400/20 to-indigo-400/0 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-sm"></div>
                <div className="absolute inset-0 bg-purple-400/0 group-hover:bg-purple-400/15 rounded-3xl blur-lg transition-all duration-700"></div>
                
                {/* Enhanced shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-3xl"></div>
                
                <span className="relative z-10 flex items-center justify-center space-x-3">
                  <CheckCircle className="h-6 w-6 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300 drop-shadow-lg" />
                  <span className="drop-shadow-md">Save Settings</span>
                </span>
                
                {/* Enhanced floating sparkles */}
                <div className="absolute top-3 right-4 w-2 h-2 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 animate-bounce transition-all duration-300 shadow-lg shadow-white/40"></div>
                <div className="absolute bottom-3 left-4 w-1.5 h-1.5 bg-pink-300/90 rounded-full opacity-0 group-hover:opacity-100 animate-bounce transition-all duration-300 shadow-md shadow-pink-300/60" style={{animationDelay: '0.2s'}}></div>
                <div className="absolute top-1/2 left-6 w-1 h-1 bg-indigo-300/80 rounded-full opacity-0 group-hover:opacity-100 animate-bounce transition-all duration-300 shadow-sm shadow-indigo-300/50" style={{animationDelay: '0.4s'}}></div>
                <div className="absolute top-4 left-1/2 w-1.5 h-1.5 bg-purple-300/90 rounded-full opacity-0 group-hover:opacity-100 animate-bounce transition-all duration-300 shadow-md shadow-purple-300/60" style={{animationDelay: '0.1s'}}></div>
                <div className="absolute bottom-4 right-8 w-1 h-1 bg-white/70 rounded-full opacity-0 group-hover:opacity-100 animate-bounce transition-all duration-300 shadow-sm shadow-white/40" style={{animationDelay: '0.5s'}}></div>
                
                {/* Floating rings */}
                <div className="absolute top-2 right-2 w-8 h-8 border border-white/20 rounded-full opacity-0 group-hover:opacity-60 group-hover:scale-110 transition-all duration-500"></div>
                <div className="absolute bottom-2 left-2 w-6 h-6 border border-pink-300/30 rounded-full opacity-0 group-hover:opacity-50 group-hover:scale-125 transition-all duration-700" style={{animationDelay: '0.2s'}}></div>
              </button>
            </div>


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

      {/* Main Container - Adjusted for right sidebar */}
      <div className="max-w-4xl mx-auto px-6 py-8 mr-52">
        {/* Glass Morphism Card */}
        <div className={`relative backdrop-blur-xl rounded-3xl shadow-2xl border p-8 mb-8 transition-all duration-500 hover:scale-[1.02] group/main overflow-hidden ${
          isDarkMode 
            ? 'bg-gray-800/30 border-gray-700/50 shadow-black/20' 
            : 'bg-white/70 border-white/20 shadow-indigo-500/10'
        }`}>
          
          {/* Floating Sparkles */}
          <div className="absolute top-6 right-8 w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-70 animate-bounce" style={{animationDelay: '0s'}}></div>
          <div className="absolute top-12 left-8 w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full opacity-80 animate-bounce" style={{animationDelay: '0.7s'}}></div>
          <div className="absolute bottom-8 right-12 w-1 h-1 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full opacity-90 animate-bounce" style={{animationDelay: '1.4s'}}></div>
          <div className="absolute bottom-16 left-16 w-1.5 h-1.5 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full opacity-75 animate-bounce" style={{animationDelay: '2.1s'}}></div>
          
          {/* Floating Decorative Rings */}
          <div className="absolute top-4 left-4 w-24 h-24 border border-purple-400/20 rounded-full opacity-0 group-hover/main:opacity-60 group-hover/main:scale-110 transition-all duration-700"></div>
          <div className="absolute bottom-4 right-4 w-32 h-32 border border-indigo-400/15 rounded-full opacity-0 group-hover/main:opacity-50 group-hover/main:scale-125 transition-all duration-1000" style={{animationDelay: '0.3s'}}></div>
          
          {/* Shimmer Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover/main:translate-x-full transition-transform duration-1000 rounded-3xl"></div>

      <div className="text-center space-y-8 relative z-10">
            {/* Status with Beautiful Enhanced Typography */}
            <div className="space-y-4">
              <div className="relative group/status">
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
                  <div className="relative w-32 h-32 group/progress">

                    
                    {/* Progress Decorative Ring */}
                    <div className="absolute inset-0 w-full h-full border border-purple-400/20 rounded-full opacity-0 group-hover/progress:opacity-60 group-hover/progress:scale-110 transition-all duration-500"></div>
                    
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
            <div className="relative group/visualizer">

              
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
                <div className="relative group/primary">

                  
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
                        className={`relative p-4 rounded-full transition-all duration-300 transform hover:scale-110 active:scale-95 text-white backdrop-blur-sm hover:shadow-xl ${
                    getButtonColorClasses(btn.color)
                        } group/secondary relative overflow-hidden`}
                  title={btn.text}
                >
                        <btn.icon className="h-6 w-6 relative z-10 transition-transform duration-300 group-hover/secondary:scale-110" />
                        
                        {/* Floating effect background */}
                        <div className="absolute inset-0 bg-white/10 rounded-full scale-0 group-hover/secondary:scale-100 transition-transform duration-300" />
                        
                        {/* Button shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover/secondary:translate-x-full transition-transform duration-500 rounded-full"></div>
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
              <div className={`relative backdrop-blur-md rounded-2xl p-6 max-w-2xl mx-auto border transition-all duration-500 hover:scale-[1.02] group/transcription overflow-hidden ${
                isDarkMode 
                  ? 'bg-blue-900/30 border-blue-700/50 shadow-blue-500/10' 
                  : 'bg-blue-50/70 border-blue-200/50 shadow-blue-500/10'
              }`}>

                
                {/* Transcription Decorative Ring */}
                <div className="absolute top-2 left-2 w-16 h-16 border border-blue-400/20 rounded-full opacity-0 group-hover/transcription:opacity-60 group-hover/transcription:scale-110 transition-all duration-500"></div>
                
                {/* Transcription Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-300/5 to-transparent transform -skew-x-12 -translate-x-full group-hover/transcription:translate-x-full transition-transform duration-1000 rounded-2xl"></div>

                <div className="space-y-3 relative z-10">
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