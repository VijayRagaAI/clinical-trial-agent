import React, { useState } from 'react';
import { Volume2, AlertCircle, MessageSquare, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { useVoiceInterview } from './hooks/useVoiceInterview';
import { VoiceInterface } from './components/VoiceInterface';
import { ConversationChat } from './components/ConversationChat';
import { EligibilityResults } from './components/EligibilityResults';

function App() {
  const interview = useVoiceInterview();
  const [showConversation, setShowConversation] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const downloadConversation = () => {
    const conversationData = {
      metadata: {
        participant_id: interview.session?.participant_id || 'unknown',
        export_timestamp: new Date().toISOString(),
        export_date: new Date().toLocaleDateString(),
        total_messages: interview.messages.length,
        session_started: new Date().toISOString(),
        conversation_state: interview.conversationState,
        questions_answered: interview.currentQuestionNumber,
        total_questions: interview.totalQuestions
      },
      conversation: interview.messages.map(msg => ({
        id: msg.id,
        timestamp: msg.timestamp,
        time_formatted: new Date(msg.timestamp).toLocaleTimeString(),
        speaker: msg.type === 'agent' ? 'MedBot' : 'User',
        type: msg.type,
        content: msg.content,
        message_length: msg.content.length
      })),
      summary: {
        conversation_duration_approx: interview.messages.length > 0 
          ? `${Math.round((new Date(interview.messages[interview.messages.length - 1].timestamp).getTime() - 
               new Date(interview.messages[0].timestamp).getTime()) / 1000 / 60)} minutes`
          : '0 minutes',
        agent_messages: interview.messages.filter(m => m.type === 'agent').length,
        user_messages: interview.messages.filter(m => m.type === 'user').length
      }
    };
    
    const jsonString = JSON.stringify(conversationData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clinical-trial-conversation-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadResults = () => {
    if (!interview.eligibilityResult) return;
    
    const resultText = `Clinical Trial Eligibility Assessment Results
    
Participant: ${interview.eligibilityResult.participant_id}
Evaluated: ${new Date(interview.eligibilityResult.evaluation_timestamp).toLocaleString()}
Overall Result: ${interview.eligibilityResult.eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
Score: ${interview.eligibilityResult.score}%

Detailed Criteria Assessment:
${interview.eligibilityResult.criteria_met.map((criterion: any, index: number) => `
${index + 1}. ${criterion.criteria_text}
   Result: ${criterion.meets_criteria ? 'MET' : 'NOT MET'}
   Your Response: "${criterion.participant_response}"
   Assessment: ${criterion.reasoning}
   Confidence: ${Math.round(criterion.confidence * 100)}%
`).join('')}`;
    
    const blob = new Blob([resultText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clinical-trial-results-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const restartInterview = () => {
    window.location.reload();
  };

  return (
    <div className={`min-h-screen transition-all duration-500 ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'}`}>
      {/* Error Message - Now floating overlay */}
      {interview.connectionError && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
          <div className="backdrop-blur-md bg-red-900/30 border border-red-700/50 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-red-300">Connection Error</h3>
                <div className="mt-1 text-sm text-red-200">{interview.connectionError}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex h-screen">
        {/* Enhanced Conversation Sidebar */}
        <div className={`transition-all duration-300 ${showConversation ? 'w-[28rem]' : 'w-0'} overflow-hidden`}>
          <div className={`h-full backdrop-blur-xl border-r transition-all duration-500 shadow-2xl ${
            isDarkMode 
              ? 'bg-gray-800/30 border-gray-700/50 shadow-black/20' 
              : 'bg-white/70 border-white/20 shadow-indigo-500/10'
          }`}>
            {/* Compact Conversation Header */}
            <div className={`p-4 border-b backdrop-blur-sm ${
              isDarkMode ? 'border-gray-700/50 bg-gray-800/20' : 'border-white/20 bg-white/20'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  {/* Compact Fancy Logo */}
                  <div className={`relative p-2 rounded-xl backdrop-blur-md border transition-all duration-500 hover:scale-105 ${
                    isDarkMode 
                      ? 'bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-purple-600/10 border-blue-500/20' 
                      : 'bg-gradient-to-br from-indigo-50/80 via-purple-50/60 to-pink-50/80 border-indigo-200/30'
                  }`}>
                    {/* Decorative micro circles */}
                    <div className={`absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full ${
                      isDarkMode ? 'bg-blue-400/40' : 'bg-indigo-400/40'
                    }`} />
                    <div className={`absolute bottom-0.5 left-0.5 w-1 h-1 rounded-full ${
                      isDarkMode ? 'bg-purple-400/40' : 'bg-purple-400/40'
                    }`} />
                    
                    <MessageSquare className={`h-5 w-5 ${
                      isDarkMode ? 'text-blue-400/70' : 'text-indigo-500/70'
                    }`} />
                  </div>
                  
                  <div className="flex flex-col space-y-1">
                    <h3 className={`font-bold text-lg bg-gradient-to-r drop-shadow-lg transition-all duration-500 ${
                      isDarkMode 
                        ? 'from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent' 
                        : 'from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent'
                    }`}>
                      Conversation
                    </h3>
                    
                    {/* Inline blinking dots */}
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0ms'} as React.CSSProperties}></div>
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '150ms'} as React.CSSProperties}></div>
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '300ms'} as React.CSSProperties}></div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowConversation(false)}
                  className={`p-2 rounded-full transition-all duration-300 hover:scale-110 ${
                    isDarkMode 
                      ? 'hover:bg-gray-700/50 text-gray-400 hover:text-gray-300' 
                      : 'hover:bg-gray-100 text-gray-500 hover:text-gray-600'
                  }`}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
              

            </div>

            {/* Enhanced Conversation Content */}
            <div className="flex-1 min-h-0 overflow-hidden relative" style={{ height: 'calc(100vh - 140px)' }}>
              {/* Background decorative elements */}
              <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-5 ${
                isDarkMode ? 'bg-blue-500' : 'bg-indigo-500'
              }`} />
              <div className={`absolute bottom-0 left-0 w-24 h-24 rounded-full blur-2xl opacity-5 ${
                isDarkMode ? 'bg-purple-500' : 'bg-purple-500'
              }`} />
              
              <ConversationChat 
                messages={interview.messages} 
                session={interview.session}
                isDarkMode={isDarkMode}
                onDownload={downloadConversation}
              />
            </div>
          </div>
        </div>

        {/* Conversation Toggle Button (when hidden) */}
        {!showConversation && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
            <button
              onClick={() => setShowConversation(true)}
              className={`p-3 rounded-full backdrop-blur-md border transition-all duration-300 hover:scale-110 ${
                isDarkMode 
                  ? 'bg-gray-800/50 border-gray-700/50 text-blue-400 hover:bg-gray-700/50' 
                  : 'bg-white/50 border-white/20 text-indigo-600 hover:bg-white/70'
              }`}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Main Content Area - Single Scrollable Page */}
        <div className="flex-1 overflow-auto">
          <div className="min-h-full flex flex-col">
            {/* Voice Interface Section */}
            <div className="flex-shrink-0">
              <VoiceInterface
                conversationState={interview.conversationState}
                isAgentSpeaking={interview.isAgentSpeaking}
                canInterruptSpeech={interview.canInterruptSpeech}
                isRecording={interview.isRecording}
                recordingTime={interview.recordingTime}
                waitingForUser={interview.waitingForUser}
                userHasResponded={interview.userHasResponded}
                showTranscriptionConfirm={interview.showTranscriptionConfirm}
                lastTranscription={interview.lastTranscription}
                connectionError={interview.connectionError}
                currentQuestionNumber={interview.currentQuestionNumber}
                totalQuestions={interview.totalQuestions}
                awaitingSubmission={interview.awaitingSubmission}
                isEvaluating={interview.isEvaluating}
                isProcessing={interview.isProcessing}
                startInterview={interview.startInterview}
                stopAgentSpeaking={interview.stopAgentSpeaking}
                startRecording={interview.startRecording}
                stopRecording={interview.stopRecording}
                repeatCurrentQuestion={interview.repeatCurrentQuestion}
                repeatLastQuestion={interview.repeatLastQuestion}
                submitResponse={interview.submitResponse}
                hearInstructionAgain={interview.hearInstructionAgain}
                formatTime={interview.formatTime}
                getStatusText={interview.getStatusText}
                canRepeatLastQuestion={interview.canRepeatLastQuestion}
                isDarkMode={isDarkMode}
                setIsDarkMode={setIsDarkMode}
                onRestart={restartInterview}
              />
            </div>
            
            {/* Evaluation Results Section - Connected below */}
            {interview.eligibilityResult && (
              <div className="flex-shrink-0">
                <EligibilityResults 
                  eligibilityResult={interview.eligibilityResult}
                  isDarkMode={isDarkMode}
                  onDownload={downloadResults}
                  onRestart={restartInterview}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;