import React from 'react';
import { Mic, MicOff, Volume2, RotateCcw, CheckCircle, RefreshCw, Play, Square, Send } from 'lucide-react';
import { ButtonConfig, ButtonState } from '../types/interview';

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
  
  // Actions
  startInterview: () => void;
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
        primary: { action: () => {}, icon: Volume2, text: "Processing...", color: "gray" },
        secondary: [],
        disabled: true
      };
    }

    // State 3: Not started
    if (conversationState === 'not_started') {
      return {
        primary: { action: startInterview, icon: Play, text: "Start Interview", color: "green" },
        secondary: [],
        disabled: !!connectionError
      };
    }

    // State 4: Starting/Connecting
    if (conversationState === 'starting') {
      return {
        primary: { action: () => {}, icon: Volume2, text: "Connecting...", color: "gray" },
        secondary: [],
        disabled: true
      };
    }

    // State 5: Agent speaking (can be interrupted)
    if (isAgentSpeaking && canInterruptSpeech) {
      const secondaryButtons = [];
      
      // For criteria questions, always show repeat buttons
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
      
      // For criteria questions, always show repeat buttons
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
      
      // For criteria questions, always show repeat buttons
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
      }
      
      return {
        primary: { action: startRecording, icon: Mic, text: "Start Speaking", color: "blue" },
        secondary: secondaryButtons,
        disabled: false
      };
    }

    // State 9: Interview completed
    if (conversationState === 'completed') {
      return {
        primary: { action: () => {}, icon: CheckCircle, text: "Interview Complete", color: "green" },
        secondary: [],
        disabled: true
      };
    }

    // Default: Processing
    return {
      primary: { action: () => {}, icon: Volume2, text: "Processing...", color: "gray" },
      secondary: [],
      disabled: true
    };
  };

  const getButtonColorClasses = (color: string) => {
    const colors = {
      green: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-green-200',
      blue: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-200',
      red: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-200',
      amber: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-200',
      purple: 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-purple-200',
      gray: 'bg-gray-400'
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  const buttonConfig = getButtonConfiguration();

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8 border border-gray-100">
      <div className="text-center space-y-8">
        {/* Status */}
        <div className="space-y-3">
          <div className={`text-xl font-semibold ${
            connectionError ? 'text-red-600' :
            isRecording ? 'text-red-600' : 
            isAgentSpeaking ? 'text-blue-600' : 
            conversationState === 'completed' ? 'text-green-600' :
            showTranscriptionConfirm ? 'text-purple-600' :
            'text-gray-700'
          }`}>
            {getStatusText()}
          </div>
          {isRecording && (
            <div className="text-red-500 font-mono text-2xl font-bold">
              {formatTime(recordingTime)}
            </div>
          )}
          {/* Progress Bar */}
          {totalQuestions > 0 && conversationState !== 'not_started' && (
            <div className="w-full max-w-md mx-auto">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>
                  {conversationState === 'consent' ? 'Getting consent' : 
                   isEvaluating ? 'Evaluating responses' :
                   conversationState === 'completed' ? 'Complete!' :
                   `Question ${currentQuestionNumber} of ${totalQuestions}`}
                </span>
                <span>
                  {conversationState === 'consent' ? '0%' :
                   (isEvaluating || conversationState === 'completed') ? '100%' :
                   `${Math.round((currentQuestionNumber / totalQuestions) * 100)}%`}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    conversationState === 'completed' ? 'bg-green-500' :
                    isEvaluating ? 'bg-blue-500' :
                    'bg-blue-400'
                  }`}
                  style={{ 
                    width: conversationState === 'consent' ? '0%' :
                           (isEvaluating || conversationState === 'completed') ? '100%' :
                           `${Math.round((currentQuestionNumber / totalQuestions) * 100)}%`
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Audio Visualizer */}
        <div className="flex justify-center items-end space-x-1 h-24">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className={`w-2 rounded-full transition-all duration-300 ${
                isRecording ? 'bg-gradient-to-t from-red-500 to-red-300 animate-pulse' :
                isAgentSpeaking ? 'bg-gradient-to-t from-blue-500 to-blue-300 animate-pulse' :
                'bg-gradient-to-t from-gray-300 to-gray-200'
              }`}
              style={{
                height: (isRecording || isAgentSpeaking)
                  ? `${Math.random() * 60 + 15}px` 
                  : '16px',
                animationDelay: `${i * 50}ms`
              }}
            />
          ))}
        </div>

        {/* Button System */}
        <div className="space-y-6">
          {/* Primary Button */}
          <div className="flex justify-center">
            <button
              onClick={buttonConfig.primary.action}
              disabled={buttonConfig.disabled}
              className={`p-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-2xl text-white ${
                getButtonColorClasses(buttonConfig.primary.color)
              } disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed`}
            >
              <buttonConfig.primary.icon className="h-10 w-10" />
            </button>
          </div>

          {/* Primary Button Label */}
          <div className="text-lg font-medium text-gray-700">
            {buttonConfig.primary.text}
          </div>

          {/* Secondary Buttons */}
          {buttonConfig.secondary.length > 0 && (
            <div className="flex justify-center space-x-4">
              {buttonConfig.secondary.map((btn, index) => (
                <button
                  key={index}
                  onClick={btn.action}
                  className={`p-4 rounded-full transition-all duration-300 transform hover:scale-105 shadow-xl text-white ${
                    getButtonColorClasses(btn.color)
                  }`}
                  title={btn.text}
                >
                  <btn.icon className="h-6 w-6" />
                </button>
              ))}
            </div>
          )}

          {/* Secondary Button Labels */}
          {buttonConfig.secondary.length > 0 && (
            <div className="flex justify-center space-x-8 text-sm text-gray-600">
              {buttonConfig.secondary.map((btn, index) => (
                <div key={index}>{btn.text}</div>
              ))}
            </div>
          )}
        </div>

        {/* Transcription Display */}
        {lastTranscription && showTranscriptionConfirm && !isEvaluating && !isProcessing && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-2xl mx-auto">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Your last response was:</h4>
            <div className="text-gray-700 italic text-lg">"{lastTranscription}"</div>
            <div className="text-xs text-blue-600 mt-2">
              Is this correct? Use the buttons above to proceed or correct.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 