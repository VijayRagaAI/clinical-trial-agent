import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Volume2, AlertCircle, MessageSquare, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { useVoiceInterview } from './hooks/useVoiceInterview';
import { VoiceInterface } from './components/VoiceInterface';
import { ConversationChat } from './components/ConversationChat';
import { EligibilityResults } from './components/EligibilityResults';
import AdminDashboard from './components/AdminDashboard';
import { Study } from './types/interview';
import { getAvailableStudies } from './services/api';

const InterviewPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const interview = useVoiceInterview();
  const [showConversation, setShowConversation] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedStudy, setSelectedStudy] = useState<Study | null>(null);

  // Get participant name from URL params
  const participantName = searchParams.get('participant');

  // Load saved preferences (study and theme) on component mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        
        // Load theme preference and study preference in parallel
        const [themeResponse, studyResponse] = await Promise.all([
          fetch(`${API_BASE}/api/theme/preferences`),
          fetch(`${API_BASE}/api/study/preferences`)
        ]);
        
        // Load theme preference
        if (themeResponse.ok) {
          const themeData = await themeResponse.json();
          setIsDarkMode(themeData.is_dark_mode);
          console.log('✅ Loaded saved theme preference:', themeData.is_dark_mode ? 'Dark' : 'Light');
        }
        
        // Load study preference
        if (studyResponse.ok) {
          const studyData = await studyResponse.json();
          
          if (studyData.selected_study) {
            setSelectedStudy(studyData.selected_study);
            console.log('✅ Loaded saved study preference:', studyData.selected_study.title);
          } else {
            // Fallback: Load first available study
            const availableStudies = await getAvailableStudies();
            if (availableStudies.studies && availableStudies.studies.length > 0) {
              setSelectedStudy(availableStudies.studies[0]);
              console.log('📋 Loaded first available study:', availableStudies.studies[0].title);
            }
          }
        } else {
          // Fallback: Load first available study if API fails
          const availableStudies = await getAvailableStudies();
          if (availableStudies.studies && availableStudies.studies.length > 0) {
            setSelectedStudy(availableStudies.studies[0]);
            console.log('📋 Loaded first available study:', availableStudies.studies[0].title);
          }
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
        
        // Fallback for study selection
        try {
          const response = await getAvailableStudies();
          if (response.studies && response.studies.length > 0) {
            setSelectedStudy(response.studies[0]);
            console.log('📋 Fallback: Loaded first available study');
          }
        } catch (studyError) {
          console.error('Failed to load fallback study:', studyError);
        }
      }
    };

    loadPreferences();
  }, []);

  // Set participant name from URL parameter if provided
  useEffect(() => {
    if (participantName && interview.session && !interview.session.participant_id) {
      // Update the session with the participant name from URL
      interview.session.participant_id = participantName;
    }
  }, [participantName, interview.session]);

  // Save study preference when it changes
  const handleStudySelect = async (study: Study) => {
    setSelectedStudy(study);
    
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      const response = await fetch(`${API_BASE}/api/study/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          study_id: study.id
        })
      });

      if (response.ok) {
        console.log('✅ Study preference saved:', study.title);
      } else {
        const errorText = await response.text();
        console.error('Failed to save study preference:', errorText);
      }
    } catch (error) {
      console.error('Failed to save study preference:', error);
    }
  };

  // Save theme preference when it changes
  const handleThemeChange = async (newIsDarkMode: boolean) => {
    setIsDarkMode(newIsDarkMode);
    
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      const response = await fetch(`${API_BASE}/api/theme/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_dark_mode: newIsDarkMode
        })
      });

      if (response.ok) {
        console.log('✅ Theme preference saved:', newIsDarkMode ? 'Dark mode' : 'Light mode');
      } else {
        const errorText = await response.text();
        console.error('Failed to save theme preference:', errorText);
      }
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const downloadConversation = async () => {
    if (!interview.session) return;
    
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      // Check if evaluation is completed (data should be saved)
      const isPostEvaluation = interview.conversationState === 'completed' && interview.eligibilityResult;
      
      if (isPostEvaluation) {
        // Try to get saved conversation data (post-evaluation)
        const response = await fetch(
          `${API_BASE}/api/download/conversation/${interview.session.session_id}/${interview.session.participant_id}`
        );
        
        if (response.ok) {
          // Use saved data (backend structure)
          const savedData = await response.json();
          const jsonString = JSON.stringify(savedData, null, 2);
          const blob = new Blob([jsonString], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `clinical-trial-conversation-${interview.session.participant_id}-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          return;
        } else {
          console.warn('Expected saved data not found, using fallback');
        }
      }
      
      // Generate fallback data with SAME STRUCTURE as backend saved data
      console.log('Generating conversation data with backend structure');
      
      // Calculate conversation duration properly
      const calculateDuration = (messages: any[]) => {
        if (messages.length < 2) return "0 minutes";
        
        const startTime = new Date(messages[0].timestamp).getTime();
        const endTime = new Date(messages[messages.length - 1].timestamp).getTime();
        const durationMinutes = (endTime - startTime) / 1000 / 60;
        return `${Math.round(durationMinutes)} minutes`;
      };
      
      // Use EXACT same structure as backend saves
      const conversationData = {
        metadata: {
          participant_id: interview.session.participant_id,  // Consistent ID
          session_id: interview.session.session_id,          // Add session_id
          study_id: selectedStudy?.id || 'unknown',          // Add study_id  
          export_timestamp: new Date().toISOString(),
          total_messages: interview.messages.length,
          conversation_state: interview.conversationState
        },
        conversation: interview.messages.map(msg => ({
          id: msg.id,
          type: msg.type,
          content: msg.content,
          timestamp: msg.timestamp
        })),
        summary: {
          agent_messages: interview.messages.filter(m => m.type === 'agent').length,
          user_messages: interview.messages.filter(m => m.type === 'user').length,
          conversation_duration: calculateDuration(interview.messages)
        }
      };
      
      const jsonString = JSON.stringify(conversationData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clinical-trial-conversation-${interview.session.participant_id}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading conversation:', error);
      alert('Failed to download conversation data. Please try again.');
    }
  };

  const downloadResults = async () => {
    if (!interview.eligibilityResult || !interview.session) return;
    
    try {
      // Try to get saved evaluation data from backend
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(
        `${API_BASE}/api/download/evaluation/${interview.session.session_id}/${interview.session.participant_id}`
      );
      
      if (response.ok) {
        // Use saved data
        const savedData = await response.json();
        const result = savedData.eligibility_result;
        
        const resultText = `Clinical Trial Eligibility Assessment Results

Participant: ${result.participant_id}
Evaluated: ${new Date(result.evaluation_timestamp).toLocaleString()}
Overall Result: ${result.eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
Score: ${result.score}%

Detailed Criteria Assessment:
${result.criteria_met.map((criterion: any, index: number) => `
${index + 1}. ${criterion.criteria_text}
   Result: ${criterion.meets_criteria ? 'MET' : 'NOT MET'}
   Your Response: "${criterion.participant_response}"
   Assessment: ${criterion.reasoning}
   Confidence: ${Math.round(criterion.confidence * 100)}%
`).join('')}

Study Information:
Study ID: ${savedData.study_id}
Session ID: ${savedData.session_id}
Export Date: ${new Date(savedData.export_timestamp).toLocaleString()}`;
        
        const blob = new Blob([resultText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `clinical-trial-results-${result.participant_id}-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Fallback to current implementation if saved data not found
        console.warn('Saved evaluation data not found, generating fresh data');
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
      }
    } catch (error) {
      console.error('Error downloading results:', error);
      // Fallback to current implementation if API fails
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
    }
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
        <div className="w-[28rem]">
          <div className={`h-full backdrop-blur-xl border-r transition-all duration-500 shadow-2xl ${
            isDarkMode 
              ? 'bg-gray-800/30 border-gray-700/50 shadow-black/20' 
              : 'bg-white/70 border-white/20 shadow-indigo-500/10'
          }`}>
            {/* Compact Conversation Header */}
            <div className={`p-4 border-b backdrop-blur-sm ${
              isDarkMode ? 'border-gray-700/50 bg-gray-800/20' : 'border-white/20 bg-white/20'
            }`}>
              <div className="flex items-center space-x-3">
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

        {/* Back to Dashboard Card - Between Chat and Main Interface */}
        <div className="flex-shrink-0 w-48 flex flex-col items-center justify-start pt-8 px-4">
          {/* Beautiful Back to Dashboard Card */}
          <div className="group relative w-full">
            <button
              onClick={() => navigate('/')}
              className={`relative w-full p-6 rounded-3xl backdrop-blur-xl border shadow-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-3 ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-gray-800/90 via-gray-700/80 to-gray-800/90 border-gray-600/40 text-gray-200 hover:from-gray-700/90 hover:via-gray-600/80 hover:to-gray-700/90' 
                  : 'bg-gradient-to-br from-white/90 via-indigo-50/80 to-white/90 border-white/40 text-gray-700 hover:from-white/95 hover:via-indigo-50/90 hover:to-white/95'
              }`}
            >
              {/* Magical background effects */}
              <div className={`absolute inset-0 bg-gradient-to-br opacity-5 transition-opacity duration-500 group-hover:opacity-10 ${
                isDarkMode ? 'from-blue-500 to-purple-600' : 'from-indigo-500 to-purple-600'
              } rounded-3xl`}></div>
              
              {/* Decorative elements */}
              <div className={`absolute top-2 right-2 w-3 h-3 rounded-full animate-pulse ${
                isDarkMode ? 'bg-blue-400/50' : 'bg-indigo-400/50'
              }`}></div>
              <div className={`absolute top-4 right-6 w-2 h-2 rounded-full animate-pulse ${
                isDarkMode ? 'bg-purple-400/40' : 'bg-purple-400/40'
              }`} style={{animationDelay: '0.5s'}}></div>
              <div className={`absolute bottom-3 left-3 w-2.5 h-2.5 rounded-full animate-pulse ${
                isDarkMode ? 'bg-cyan-400/40' : 'bg-cyan-400/40'
              }`} style={{animationDelay: '1s'}}></div>
              
              {/* Content */}
              <div className="relative z-10 text-center">
                <div className={`flex items-center justify-center space-x-2 mb-3 ${
                  isDarkMode ? 'text-blue-400' : 'text-indigo-600'
                }`}>
                  <ChevronLeft className="w-5 h-5 group-hover:scale-110 group-hover:-translate-x-1 transition-all duration-300" />
                  <div className={`w-8 h-0.5 rounded-full transition-all duration-300 group-hover:w-12 ${
                    isDarkMode ? 'bg-blue-400/60' : 'bg-indigo-400/60'
                  }`}></div>
                </div>
                
                <h3 className={`font-bold text-lg mb-1 bg-gradient-to-r bg-clip-text text-transparent transition-all duration-300 group-hover:scale-105 ${
                  isDarkMode 
                    ? 'from-blue-400 via-indigo-400 to-purple-400' 
                    : 'from-indigo-600 via-purple-600 to-pink-600'
                }`}>
                  Back to
                </h3>
                <p className={`text-sm font-semibold ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Dashboard
                </p>
              </div>
              
              {/* Glow effect on hover */}
              <div className={`absolute inset-0 rounded-3xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 ${
                isDarkMode ? 'bg-blue-400/20' : 'bg-indigo-400/20'
              }`}></div>
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-3xl"></div>
            </button>
          </div>


        </div>

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
                participantName={participantName || undefined}
                selectedStudy={selectedStudy}
                onStudySelect={handleStudySelect}
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
                setIsDarkMode={handleThemeChange}
                onRestart={restartInterview}
              />
            </div>
            
            {/* Evaluation Results Section - Connected below */}
            {interview.eligibilityResult && (
              <div className="flex-shrink-0">
                <EligibilityResults 
                  eligibilityResult={interview.eligibilityResult}
                  session={interview.session}
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
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/interview" element={<InterviewPage />} />
      </Routes>
    </Router>
  );
}

export default App;