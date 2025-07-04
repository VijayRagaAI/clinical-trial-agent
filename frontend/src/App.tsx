import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Volume2, AlertCircle, MessageSquare, Download, ChevronLeft, ChevronRight } from 'lucide-react';

// Add breathing animation styles
const breathingStyles = `
  @keyframes breathe {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.8; }
  }
`;
import { useVoiceInterview } from './hooks/useVoiceInterview';
import { VoiceInterface } from './components/VoiceInterface';
import { ConversationChat } from './components/ConversationChat';
import { EligibilityResults } from './components/EligibilityResults';
import AdminDashboard from './components/AdminDashboard';
import InterviewViewer from './components/InterviewViewer';
import { Study } from './types/interview';
import { getAvailableStudies } from './services/api';
import { ConfirmationModal } from './components/ConfirmationModal';

const InterviewPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const interview = useVoiceInterview();
  const [showConversation, setShowConversation] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedStudy, setSelectedStudy] = useState<Study | null>(null);
  const [participantName, setParticipantName] = useState<string>('');
  
  // Confirmation modal state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isReloading, setIsReloading] = useState(false); // Flag to disable beforeunload
  const [confirmationConfig, setConfirmationConfig] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'warning' | 'danger' | 'info';
    onConfirm: () => void;
    participantInfo?: {
      name: string;
      messageCount: number;
      studyName: string;
      timeElapsed: string;
      interviewStatus: string;
    };
  } | null>(null);

  // Check if interview has started (session exists)
  const hasInterviewStarted = () => {
    return interview.session !== null && interview.conversationState !== 'not_started';
  };

  // Check if user has made any responses
  const hasUserResponded = () => {
    return interview.messages.filter(msg => msg.type === 'user').length > 0;
  };

  // Check if user has moved past consent phase into actual questions
  const hasMovedPastConsent = () => {
    // If conversation state is 'questioning', user has moved past consent
    return interview.conversationState === 'questioning';
  };

  // Calculate time elapsed since first message
  const calculateTimeElapsed = () => {
    if (interview.messages.length === 0) return "0 minutes";
    
    const firstMessage = interview.messages[0];
    const startTime = new Date(firstMessage.timestamp).getTime();
    const now = Date.now();
    const durationMinutes = (now - startTime) / 1000 / 60;
    return `${Math.round(durationMinutes)} minutes`;
  };

  // Save initial interview start with "In Progress" status
  const saveInterviewStart = async () => {
    if (!interview.session || !selectedStudy) {
      console.log('🚫 Cannot save interview start - missing session or study');
      return;
    }

    console.log('🚀 Saving interview start with "In Progress" status');

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      const startData = {
        session_id: interview.session.session_id,
        participant_id: interview.session.participant_id,
        study_id: selectedStudy.id,
        exit_reason: 'interview_started',
        conversation_state: interview.conversationState,
        messages: interview.messages.map(msg => ({
          id: msg.id,
          type: msg.type,
          content: msg.content,
          timestamp: msg.timestamp
        }))
      };

      console.log('📤 Sending interview start data:', startData);

      const response = await fetch(`${API_BASE}/api/interviews/save-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(startData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Interview started and saved with status:', result.interview_status);
      } else {
        console.error('Failed to save interview start:', response.statusText);
      }
    } catch (error) {
      console.error('Error saving interview start:', error);
    }
  };

  // Save interview progress before navigation (update from "In Progress")
  const saveInterviewProgress = async (exitReason: string) => {
    if (!interview.session || !selectedStudy) {
      console.log('🚫 Not saving progress:', {
        hasSession: !!interview.session,
        hasStudy: !!selectedStudy
      });
      return;
    }

    console.log('💾 Updating interview status from "In Progress" with exit reason:', exitReason);

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      const progressData = {
        session_id: interview.session.session_id,
        participant_id: interview.session.participant_id,
        study_id: selectedStudy.id,
        exit_reason: exitReason,
        conversation_state: interview.conversationState,
        messages: interview.messages.map(msg => ({
          id: msg.id,
          type: msg.type,
          content: msg.content,
          timestamp: msg.timestamp
        }))
      };

      console.log('📤 Sending progress update:', progressData);

      const response = await fetch(`${API_BASE}/api/interviews/save-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(progressData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Interview status updated to:', result.interview_status);
      } else {
        console.error('Failed to save interview progress:', response.statusText);
      }
    } catch (error) {
      console.error('Error saving interview progress:', error);
    }
  };

  // Show confirmation modal for navigation
  const showNavigationConfirmation = (exitReason: string, destination: () => void) => {
    if (!interview.session || interview.conversationState === 'completed' || interview.conversationState === 'not_started') {
      destination();
      return;
    }

    // Determine the actual exit reason based on interview state
    const getActualExitReason = (originalReason: string) => {
      const movedPastConsent = hasMovedPastConsent();
      
      // If back to dashboard during consent phase (even if user has replied to consent questions), mark as incomplete
      if (originalReason === 'back_to_dashboard' && !movedPastConsent) {
        return 'consent_abandoned';
      }
      
      // If page refresh during consent phase (even if user has replied to consent questions), mark as incomplete  
      if (originalReason === 'page_refresh' && !movedPastConsent) {
        return 'consent_abandoned';
      }
      
      return originalReason;
    };

    const actualExitReason = getActualExitReason(exitReason);

         const configs = {
       back_to_dashboard: {
         title: "Leave Interview?",
         message: "Your interview is currently in progress. If you leave now, your responses will be saved and you can resume from where you left off later.",
         confirmText: "Save & Go to Dashboard",
         cancelText: "Stay in Interview",
         type: 'warning' as const
       },
       consent_abandoned: {
         title: "Leave Interview?",
         message: "Your interview is currently in progress. If you leave now, your responses will be saved and you can resume from where you left off later.",
         confirmText: "Save & Go to Dashboard",
         cancelText: "Stay in Interview",
         type: 'warning' as const
       },
       page_refresh: {
         title: "Refresh Page?",
         message: "Refreshing the page will interrupt your current interview. Your progress will be saved automatically.",
         confirmText: "Refresh Page",
         cancelText: "Continue Interview",
         type: 'warning' as const
       }
     };

    const config = configs[actualExitReason as keyof typeof configs] || configs.back_to_dashboard;

    // Determine what status the interview will have based on exit reason
    const getStatusByReason = (reason: string) => {
      const statusMap = {
        'interview_started': 'In Progress',
        'interview_completed': 'Completed',
        'consent_abandoned': 'Incomplete',
        'consent_rejected': 'Incomplete',
        'user_initiated': 'Paused',
        'back_to_dashboard': 'Paused',
        'study_change': 'Abandoned',
        'settings_change': 'Paused',
        'page_refresh': 'Interrupted',
        'browser_refresh': 'Interrupted',
        'connection_lost': 'Interrupted',
        'browser_close': 'Interrupted',
        'navigation': 'Interrupted'
      };
      return statusMap[reason as keyof typeof statusMap] || 'Interrupted';
    };

    setConfirmationConfig({
      ...config,
      onConfirm: async () => {
        await saveInterviewProgress(actualExitReason);
        setShowConfirmation(false);
        destination();
      },
      participantInfo: {
        name: interview.session?.participant_id || participantName || 'Anonymous',
        messageCount: interview.messages.length,
        studyName: selectedStudy?.title || 'Unknown Study',
        timeElapsed: calculateTimeElapsed(),
        interviewStatus: getStatusByReason(actualExitReason)
      }
    });

    setShowConfirmation(true);
  };

  // Handle back to dashboard navigation
  const handleBackToDashboard = () => {
    showNavigationConfirmation('back_to_dashboard', () => navigate('/'));
  };

  // Handle study selection with refined logic
  const handleStudySelect = async (study: Study) => {
    // If same study, no change needed
    if (selectedStudy?.id === study.id) {
      return;
    }

    const interviewStarted = hasInterviewStarted();
    const movedPastConsent = hasMovedPastConsent();

    console.log('🔍 Study selection debug:', {
      interviewStarted,
      movedPastConsent,
      conversationState: interview.conversationState,
      sessionExists: !!interview.session
    });

    // Case 1: Before interview start OR after interview complete → just restart
    if (!interviewStarted || interview.conversationState === 'completed') {
      console.log('📝 Case 1: No interview or completed - changing study immediately');
      setSelectedStudy(study);
      await saveStudyPreference(study);
      return;
    }

    // Case 2: After starting but still in consent phase → show modal and save as Incomplete
    if (interviewStarted && !movedPastConsent) {
      console.log('🔄 Case 2: Interview started but still in consent phase - showing modal and saving as Incomplete');
      
      setConfirmationConfig({
        title: "Study Changed",
        message: "Your interview progress has been saved as incomplete. The page will restart with the new study.",
        confirmText: "Close",
        cancelText: "",
        type: 'info' as const,
        onConfirm: async () => {
          // Set flag to prevent browser warning
          setIsReloading(true);
          
          await saveInterviewProgress('consent_abandoned');
          console.log('🔄 Interview abandoned during consent - progress saved as Incomplete');
          setShowConfirmation(false);
          
          setTimeout(() => {
            window.location.reload();
          }, 100);
        },
        participantInfo: {
          name: interview.session?.participant_id || participantName || 'Anonymous',
          messageCount: interview.messages.length,
          studyName: selectedStudy?.title || 'Unknown Study',
          timeElapsed: calculateTimeElapsed(),
          interviewStatus: 'Incomplete'
        }
      });

      // Update study selection immediately (for UI feedback)
      setSelectedStudy(study);
      await saveStudyPreference(study);
      setShowConfirmation(true);
      return;
    }

    // Case 3: After moving past consent phase → show modal + save data when closed
    console.log('💬 Case 3: User has moved past consent phase - showing modal');
    setConfirmationConfig({
      title: "Study Changed",
      message: "Your interview progress has been saved. The page will restart with the new study.",
      confirmText: "Close",
      cancelText: "",
      type: 'info' as const,
      onConfirm: async () => {
        // Set flag to prevent browser warning
        setIsReloading(true);
        
        await saveInterviewProgress('study_change');
        console.log('🔄 Interview abandoned due to study change - progress saved');
        setShowConfirmation(false);
        
        setTimeout(() => {
          window.location.reload();
        }, 100);
      },
      participantInfo: {
        name: interview.session?.participant_id || participantName || 'Anonymous',
        messageCount: interview.messages.length,
        studyName: selectedStudy?.title || 'Unknown Study',
        timeElapsed: calculateTimeElapsed(),
        interviewStatus: 'Abandoned'
      }
    });

    // Update study selection immediately (for UI feedback)
    setSelectedStudy(study);
    await saveStudyPreference(study);
    setShowConfirmation(true);
  };

  // Auto-save interview start when session is created
  useEffect(() => {
    if (interview.session && selectedStudy && interview.conversationState !== 'not_started' && interview.conversationState !== 'completed') {
      // Add small delay to ensure session is fully established
      const timer = setTimeout(() => {
        saveInterviewStart();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [interview.session, selectedStudy, interview.conversationState]);

  // Auto-save interview completion when interview completes (but only for edge cases)
  useEffect(() => {
    if (interview.conversationState === 'completed' && interview.session && selectedStudy) {
      // Skip auto-save for normal completions - backend already handles these
      // Only auto-save in edge cases where backend didn't get to save
      if (interview.eligibilityResult !== null) {
        console.log('🚫 Skipping frontend auto-save for normal completion - backend already saved conversation + evaluation');
      } else {
        console.log('🚫 Skipping auto-save for consent rejection - already saved as Incomplete');
      }
    }
  }, [interview.conversationState, interview.session, selectedStudy, interview.eligibilityResult]);

  // Browser refresh/close detection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Don't show warning if we're intentionally reloading
      if (isReloading) {
        return;
      }
      
      // Show warning if interview has started (has session), regardless of user responses
      if (interview.session && interview.conversationState !== 'completed' && interview.conversationState !== 'not_started') {
        e.preventDefault();
        e.returnValue = 'Your interview progress will be automatically saved, but you may lose connection state.';
        
        // Determine appropriate exit reason based on current state
        const exitReason = hasMovedPastConsent() ? 'page_refresh' : 'consent_abandoned';
        
        // Try to save progress (may not complete due to browser limitations)
        saveInterviewProgress(exitReason).catch(console.error);
        
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [interview.conversationState, interview.messages.length, selectedStudy, isReloading, interview.session]);

  useEffect(() => {
    loadPreferences();
  }, []);

  // Initialize from URL parameters
  useEffect(() => {
    const studyId = searchParams.get('study');
    const participantNameParam = searchParams.get('participant');
    
    if (participantNameParam) {
      setParticipantName(participantNameParam);
    }
    
         if (studyId) {
       // Load study from available studies
       getAvailableStudies().then(response => {
         const study = response.studies.find((s: Study) => s.id === studyId);
         if (study) {
           setSelectedStudy(study);
         }
       });
     }
  }, [searchParams]);

  const loadPreferences = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      // Load theme preference
      const themeResponse = await fetch(`${API_BASE}/api/theme/preferences`);
      if (themeResponse.ok) {
        const themeData = await themeResponse.json();
        setIsDarkMode(themeData.is_dark_mode);
      }
      
      // Load study preference
      const studyResponse = await fetch(`${API_BASE}/api/study/preferences`);
      if (studyResponse.ok) {
        const studyData = await studyResponse.json();
        if (studyData.selected_study && !selectedStudy) {
          setSelectedStudy(studyData.selected_study);
          return; // Exit early if we found a saved preference
        }
      }
      
      // If no saved study preference, auto-select the first available study
      if (!selectedStudy) {
        try {
          const studiesResponse = await getAvailableStudies();
          if (studiesResponse.studies && studiesResponse.studies.length > 0) {
            const firstStudy = studiesResponse.studies[0];
            setSelectedStudy(firstStudy);
            await saveStudyPreference(firstStudy);
            console.log('✅ Auto-selected first available study:', firstStudy.title);
          }
        } catch (error) {
          console.error('Failed to auto-select study:', error);
        }
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };

  const saveStudyPreference = async (study: Study) => {
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
   Question: ${criterion.criteria_question || 'N/A'}
   Expected Response: ${criterion.expected_response || 'N/A'}
   Your Response: "${criterion.participant_response}"
   Result: ${criterion.meets_criteria ? 'MET' : 'NOT MET'}
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
   Question: ${criterion.criteria_question || 'N/A'}
   Expected Response: ${criterion.expected_response || 'N/A'}
   Your Response: "${criterion.participant_response}"
   Result: ${criterion.meets_criteria ? 'MET' : 'NOT MET'}
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
   Question: ${criterion.criteria_question || 'N/A'}
   Expected Response: ${criterion.expected_response || 'N/A'}
   Your Response: "${criterion.participant_response}"
   Result: ${criterion.meets_criteria ? 'MET' : 'NOT MET'}
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

  // Handle explicit consent rejection
  const handleConsentRejection = async () => {
    if (interview.session && selectedStudy) {
      await saveInterviewProgress('consent_rejected');
      console.log('❌ User rejected consent - interview marked as Incomplete');
    }
    window.location.reload();
  };

  // Handle interview completion (legacy function - now only used for edge cases)
  // Normal interview completions are handled by the backend automatically
  const handleInterviewCompletion = async () => {
    if (interview.session && selectedStudy) {
      await saveInterviewProgress('interview_completed');
      console.log('🎉 Interview completed successfully (manual save)');
    }
  };

  const restartInterview = () => {
    window.location.reload();
  };

  return (
    <div className={`min-h-screen transition-all duration-500 ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'}`}>
      <style>{breathingStyles}</style>


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

        {/* Enhanced Back to Dashboard Card - Between Chat and Main Interface */}
        <div className="flex-shrink-0 w-48 flex flex-col items-center justify-start pt-8 px-4">
          {/* Beautiful Enhanced Back to Dashboard Card */}
          <div className="group/card relative w-full overflow-hidden rounded-3xl backdrop-blur-2xl border-2 shadow-2xl transition-all duration-700 hover:scale-[1.12] hover:-translate-y-4 cursor-pointer">
            {/* Special glow ring around the card */}
            <div className={`absolute -inset-1 bg-gradient-to-r rounded-3xl blur-sm opacity-60 group-hover/card:opacity-100 transition duration-1000 ${
              isDarkMode 
                ? 'from-purple-600 via-pink-600 to-purple-600' 
                : 'from-purple-500 via-pink-500 to-purple-500'
            }`} style={{animation: 'breathe 3s ease-in-out infinite'}}></div>
            
            {/* Enhanced magical background layers */}
            <div className={`absolute inset-0 bg-gradient-to-br opacity-70 transition-all duration-700 group-hover/card:opacity-90 rounded-3xl ${
              isDarkMode 
                ? 'from-gray-800/90 via-purple-800/60 to-gray-800/90' 
                : 'from-white/95 via-purple-50/85 to-white/95'
            }`}></div>
            
            {/* Breathing glow layers */}
            <div className={`absolute inset-0 bg-gradient-to-tr rounded-3xl ${
              isDarkMode ? 'from-purple-500/25 via-pink-400/30 to-purple-500/25' : 'from-purple-400/25 via-pink-400/30 to-purple-400/25'
            }`} style={{animation: 'breathe 4s ease-in-out infinite reverse'}}></div>
            <div className={`absolute inset-0 bg-gradient-to-bl rounded-3xl ${
              isDarkMode ? 'from-purple-600/15 via-pink-500/20 to-purple-600/15' : 'from-purple-500/15 via-pink-500/20 to-purple-500/15'
            }`} style={{animation: 'breathe 5s ease-in-out infinite'}}></div>
            
            {/* Enhanced glittering sparkles with purple/pink theme */}
            <div className={`absolute top-3 right-4 w-2.5 h-2.5 rounded-full animate-bounce shadow-lg ${
              isDarkMode ? 'bg-purple-400/80 shadow-purple-400/50' : 'bg-purple-500/80 shadow-purple-500/50'
            }`} style={{animationDelay: '0s'}}></div>
            <div className={`absolute top-6 right-8 w-2 h-2 rounded-full animate-bounce shadow-md ${
              isDarkMode ? 'bg-pink-400/70 shadow-pink-400/40' : 'bg-pink-500/70 shadow-pink-500/40'
            }`} style={{animationDelay: '0.4s'}}></div>
            <div className={`absolute bottom-4 left-4 w-3 h-3 rounded-full animate-bounce shadow-lg ${
              isDarkMode ? 'bg-purple-300/60 shadow-purple-300/30' : 'bg-purple-400/60 shadow-purple-400/30'
            }`} style={{animationDelay: '0.8s'}}></div>
            <div className={`absolute bottom-8 left-8 w-1.5 h-1.5 rounded-full animate-bounce shadow-sm ${
              isDarkMode ? 'bg-pink-500/60 shadow-pink-500/30' : 'bg-pink-600/60 shadow-pink-600/30'
            }`} style={{animationDelay: '1.2s'}}></div>
            <div className={`absolute top-1/2 left-3 w-2 h-2 rounded-full animate-bounce shadow-md ${
              isDarkMode ? 'bg-purple-500/55 shadow-purple-500/30' : 'bg-purple-600/55 shadow-purple-600/30'
            }`} style={{animationDelay: '0.6s'}}></div>
            <div className={`absolute top-2 left-6 w-1.5 h-1.5 rounded-full animate-bounce shadow-md ${
              isDarkMode ? 'bg-pink-300/50 shadow-pink-300/25' : 'bg-pink-400/50 shadow-pink-400/25'
            }`} style={{animationDelay: '1.6s'}}></div>
            
            {/* Floating decorative rings */}
            <div className="absolute top-2 right-2 w-10 h-10 border border-purple-400/30 rounded-full opacity-30 group-hover/card:opacity-60 group-hover/card:scale-110 transition-all duration-500 animate-spin" style={{animationDuration: '8s'}}></div>
            <div className="absolute bottom-2 left-2 w-8 h-8 border border-pink-400/25 rounded-full opacity-25 group-hover/card:opacity-50 group-hover/card:scale-125 transition-all duration-700 animate-spin" style={{animationDelay: '0.2s', animationDuration: '6s', animationDirection: 'reverse'}}></div>
            
            {/* Enhanced border glow */}
            <div className={`absolute inset-0 rounded-3xl border-2 opacity-0 group-hover/card:opacity-100 transition-all duration-500 ${
              isDarkMode ? 'border-purple-400/60' : 'border-purple-500/70'
            }`}></div>
            
            <button
              onClick={handleBackToDashboard}
              className="relative w-full p-6 rounded-3xl transition-all duration-700"
            >
              {/* Content */}
              <div className="relative z-10 text-center">
                {/* Enhanced arrow with line */}
                <div className={`flex items-center justify-center space-x-2 mb-4 ${
                  isDarkMode ? 'text-purple-300' : 'text-purple-700'
                }`}>
                  <ChevronLeft className="w-6 h-6 group-hover/card:scale-125 group-hover/card:-translate-x-2 transition-all duration-500 drop-shadow-lg" />
                  <div className={`w-10 h-1 rounded-full transition-all duration-500 group-hover/card:w-16 shadow-lg ${
                    isDarkMode ? 'bg-purple-400/80 shadow-purple-400/40' : 'bg-purple-500/80 shadow-purple-500/40'
                  }`}></div>
                </div>
                
                {/* Enhanced typography */}
                <h3 className={`font-black text-xl mb-2 bg-gradient-to-r bg-clip-text text-transparent transition-all duration-500 group-hover/card:scale-110 drop-shadow-lg ${
                  isDarkMode 
                    ? 'from-purple-300 via-pink-300 to-purple-300' 
                    : 'from-purple-700 via-pink-700 to-purple-700'
                }`}>
                  Back to
                </h3>
                <p className={`text-base font-bold transition-all duration-500 group-hover/card:scale-105 ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-clip-text text-transparent' 
                    : 'bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-clip-text text-transparent'
                } drop-shadow-sm`}>
                  Dashboard
                </p>
              </div>
              
              {/* Enhanced multiple glow effects */}
              <div className={`absolute inset-0 rounded-3xl blur-lg opacity-0 group-hover/card:opacity-50 transition-all duration-500 ${
                isDarkMode ? 'bg-purple-400/30' : 'bg-purple-500/30'
              }`}></div>
              <div className={`absolute inset-0 rounded-3xl blur-xl opacity-0 group-hover/card:opacity-30 transition-all duration-700 ${
                isDarkMode ? 'bg-pink-400/20' : 'bg-pink-500/20'
              }`}></div>
              
              {/* Enhanced shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover/card:translate-x-full transition-transform duration-1000 rounded-3xl"></div>
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
                eligibilityResult={interview.eligibilityResult}
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
                onConsentRejection={handleConsentRejection}
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

      {/* Confirmation Modal */}
      {showConfirmation && confirmationConfig && (
        <ConfirmationModal
          isOpen={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          onConfirm={confirmationConfig.onConfirm}
          title={confirmationConfig.title}
          message=""
          detailsMessage={confirmationConfig.message}
          confirmText={confirmationConfig.confirmText}
          cancelText={confirmationConfig.cancelText}
          isDarkMode={isDarkMode}
          type={confirmationConfig.type}
          participantInfo={confirmationConfig.participantInfo}
        />
      )}
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/interview" element={<InterviewPage />} />
        <Route path="/interview/view/:participant_id" element={<InterviewViewer />} />
      </Routes>
    </Router>
  );
}

export default App;