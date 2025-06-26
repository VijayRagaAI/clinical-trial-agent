import { useState, useEffect, useRef } from 'react';
import { apiService, AudioRecorder, AudioPlayer } from '../services/api';
import { InterviewState, ConversationState, SessionData, Message, EligibilityResult } from '../types/interview';

export const useVoiceInterview = () => {
  // Session state
  const [session, setSession] = useState<SessionData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [waitingForUser, setWaitingForUser] = useState(false);

  // Interview state
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewCompleted, setInterviewCompleted] = useState(false);
  const [eligibilityResult, setEligibilityResult] = useState<EligibilityResult | null>(null);
  const [lastAgentMessage, setLastAgentMessage] = useState<string>('');

  // Enhanced conversation state
  const [conversationState, setConversationState] = useState<ConversationState>('not_started');
  const [userHasResponded, setUserHasResponded] = useState(false);
  const [showTranscriptionConfirm, setShowTranscriptionConfirm] = useState(false);
  const [lastTranscription, setLastTranscription] = useState<string>('');
  const [canInterruptSpeech, setCanInterruptSpeech] = useState(false);
  const [awaitingSubmission, setAwaitingSubmission] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState(0);

  // Question tracking
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(0);

  // Refs for services
  const wsRef = useRef<WebSocket | null>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const audioPlayerRef = useRef<AudioPlayer | null>(null);

  // Timer for recording
  useEffect(() => {
    let interval: number;
    if (isRecording) {
      interval = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Initialize audio services
  useEffect(() => {
    audioRecorderRef.current = new AudioRecorder();
    audioPlayerRef.current = new AudioPlayer();

    audioRecorderRef.current.initialize().catch(error => {
      console.error('Failed to initialize audio:', error);
      setConnectionError('Microphone access required for voice interview');
    });

    return () => {
      audioRecorderRef.current?.cleanup();
      audioPlayerRef.current?.stop();
      wsRef.current?.close();
    };
  }, []);

  const handleWebSocketMessage = async (data: any) => {
    switch (data.type) {
      case 'agent_message':
        const agentMessage: Message = {
          id: `agent-${Date.now()}`,
          type: 'agent',
          content: data.content,
          timestamp: data.timestamp
        };
        
        setMessages(prev => [...prev, agentMessage]);
        setLastAgentMessage(data.content);
        setIsAgentSpeaking(true);
        setCanInterruptSpeech(true);
        
        // Clear processing state when agent responds
        setIsProcessing(false);
        
        // Determine conversation state and question number from content
        if (data.content.toLowerCase().includes('consent') || data.content.toLowerCase().includes('proceed')) {
          setConversationState('consent');
          setCurrentQuestionNumber(0);
          setAwaitingSubmission(false);
          setIsEvaluating(false);
          if (data.total_questions !== undefined) {
            setTotalQuestions(data.total_questions);
          }
        } else if (data.evaluating) {
          setConversationState('questioning');
          setAwaitingSubmission(false);
          setIsEvaluating(true);
          // Clear transcription during evaluation
          setShowTranscriptionConfirm(false);
          setUserHasResponded(false);
          setLastTranscription('');
        } else if (data.content.toLowerCase().includes('thank you for completing') || data.is_final) {
          setConversationState('completed');
          setAwaitingSubmission(false);
          setIsEvaluating(false);
          setWaitingForUser(false);
          setShowTranscriptionConfirm(false);
          setUserHasResponded(false);
        } else if (data.awaiting_submission) {
          setConversationState('questioning');
          setAwaitingSubmission(true);
          setIsEvaluating(false);
          if (data.question_number !== undefined) {
            setCurrentQuestionNumber(data.question_number);
          }
          if (data.total_questions !== undefined) {
            setTotalQuestions(data.total_questions);
          }
        } else if (data.requires_response) {
          setConversationState('questioning');
          setAwaitingSubmission(false);
          setIsEvaluating(false);
          // Use question number from backend if provided (this is the source of truth)
          if (data.question_number !== undefined) {
            setCurrentQuestionNumber(data.question_number);
          }
          if (data.total_questions !== undefined) {
            setTotalQuestions(data.total_questions);
          }
        }
        
        // Play audio if available
        if (data.audio && audioPlayerRef.current) {
          try {
            await audioPlayerRef.current.playBase64Audio(data.audio);
          } catch (error) {
            console.error('Audio playback failed:', error);
          } finally {
            setIsAgentSpeaking(false);
            setCanInterruptSpeech(false);
            
            // After agent finishes speaking, set appropriate state
            if (data.requires_response || data.awaiting_submission) {
              setWaitingForUser(true);
            }
          }
        } else {
          setIsAgentSpeaking(false);
          setCanInterruptSpeech(false);
          
          if (data.requires_response || data.awaiting_submission) {
            setWaitingForUser(true);
          }
        }
        
        if (data.is_final) {
          setInterviewCompleted(true);
          setConversationState('completed');
        }
        break;
        
      case 'user_message':
        const userMessage: Message = {
          id: `user-${Date.now()}`,
          type: 'user',
          content: data.content,
          timestamp: data.timestamp
        };
        setMessages(prev => [...prev, userMessage]);
        
        // Show transcription unless we're evaluating or processing
        if (!isEvaluating && !isProcessing) {
          setLastTranscription(data.content);
          setUserHasResponded(true);
          setShowTranscriptionConfirm(true);
        }
        
        // Set processing state after user message
        setIsProcessing(true);
        
        setWaitingForUser(false);
        break;
        
      case 'interview_complete':
        setInterviewCompleted(true);
        setEligibilityResult(data.eligibility);
        setWaitingForUser(false);
        setShowTranscriptionConfirm(false);
        setIsEvaluating(false);
        setConversationState('completed');
        break;
        
      case 'error':
        setConnectionError(data.content);
        setWaitingForUser(true);
        break;
        
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const startInterview = async () => {
    try {
      setConnectionError(null);
      setConversationState('starting');
      
      const newSession = await apiService.startSession({
        participant_name: 'Anonymous',
      });
      
      setSession(newSession);
      setInterviewStarted(true);
      
      const ws = apiService.createWebSocketConnection(newSession.session_id);
      wsRef.current = ws;
      
      ws.onopen = () => {
        setIsConnected(true);
        setConversationState('consent');
        console.log('WebSocket connected');
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('Connection lost. Please refresh the page.');
        setConversationState('not_started');
      };
      
      ws.onclose = () => {
        setIsConnected(false);
        console.log('WebSocket disconnected');
      };
      
    } catch (error) {
      console.error('Failed to start interview:', error);
      setConnectionError('Failed to start interview. Please check your connection.');
      setConversationState('not_started');
    }
  };

  const stopAgentSpeaking = () => {
    if (audioPlayerRef.current && isAgentSpeaking) {
      audioPlayerRef.current.stop();
      setIsAgentSpeaking(false);
      setCanInterruptSpeech(false);
      setWaitingForUser(true);
    }
  };

  const startRecording = async () => {
    if (!audioRecorderRef.current || !wsRef.current) return;
    
    try {
      // Stop any ongoing audio playback first
      if (isAgentSpeaking && audioPlayerRef.current) {
        audioPlayerRef.current.stop();
        setIsAgentSpeaking(false);
        setCanInterruptSpeech(false);
      }
      
      await audioRecorderRef.current.startRecording();
      setIsRecording(true);
      setShowTranscriptionConfirm(false);
      
      wsRef.current.send(JSON.stringify({
        type: 'start_recording'
      }));
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      setConnectionError('Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = async () => {
    if (!isRecording || !audioRecorderRef.current || !wsRef.current) return;
    
    try {
      const audioBase64 = await audioRecorderRef.current.stopRecording();
      setIsRecording(false);
      
      // Set processing state immediately after recording stops
      setIsProcessing(true);
      
      wsRef.current.send(JSON.stringify({
        type: 'audio_data',
        audio: audioBase64
      }));
      
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setConnectionError('Failed to process recording. Please try again.');
      setWaitingForUser(true);
    }
  };

  const repeatCurrentQuestion = () => {
    if (wsRef.current) {
      // Stop any ongoing audio first
      if (isAgentSpeaking && audioPlayerRef.current) {
        audioPlayerRef.current.stop();
        setIsAgentSpeaking(false);
        setCanInterruptSpeech(false);
      }
      
      // Clear UI states
      setShowTranscriptionConfirm(false);
      setUserHasResponded(false);
      setWaitingForUser(false);
      setLastTranscription('');
      
      wsRef.current.send(JSON.stringify({
        type: 'text_message',
        content: 'Could you please repeat that question?'
      }));
    }
  };

  const repeatLastQuestion = () => {
    if (wsRef.current && currentQuestionNumber > 1) {
      // Stop any ongoing audio first
      if (isAgentSpeaking && audioPlayerRef.current) {
        audioPlayerRef.current.stop();
        setIsAgentSpeaking(false);
        setCanInterruptSpeech(false);
      }
      
      // Remove the last user message if transcription is showing
      if (showTranscriptionConfirm) {
        setMessages(prev => prev.slice(0, -1));
      }
      
      // Clear UI states
      setShowTranscriptionConfirm(false);
      setUserHasResponded(false);
      setWaitingForUser(false);
      setLastTranscription('');
      
      // Send request to go back to previous question
      wsRef.current.send(JSON.stringify({
        type: 'text_message',
        content: 'Could you please repeat the previous question? I want to try answering it again.'
      }));
    }
  };

  const submitResponse = () => {
    if (wsRef.current && awaitingSubmission) {
      // Stop any ongoing audio first
      if (isAgentSpeaking && audioPlayerRef.current) {
        audioPlayerRef.current.stop();
        setIsAgentSpeaking(false);
        setCanInterruptSpeech(false);
      }
      
      // Immediately set evaluation state for instant UI feedback
      setIsEvaluating(true);
      setAwaitingSubmission(false);
      setShowTranscriptionConfirm(false);
      setUserHasResponded(false);
      setWaitingForUser(false);
      setLastTranscription('');
      
      wsRef.current.send(JSON.stringify({
        type: 'text_message',
        content: 'Submit my response and complete the interview.'
      }));
    }
  };

  const hearInstructionAgain = () => {
    if (wsRef.current) {
      // Stop any ongoing audio first
      if (isAgentSpeaking && audioPlayerRef.current) {
        audioPlayerRef.current.stop();
        setIsAgentSpeaking(false);
        setCanInterruptSpeech(false);
      }
      
      // Clear UI states
      setShowTranscriptionConfirm(false);
      setUserHasResponded(false);
      setWaitingForUser(false);
      setLastTranscription('');
      
      wsRef.current.send(JSON.stringify({
        type: 'text_message',
        content: 'Hear instruction again.'
      }));
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    if (connectionError) return "Connection error - please check your setup";
    if (conversationState === 'not_started') return "Ready to begin your clinical trial screening";
    if (conversationState === 'starting') return "Starting interview...";
    if (isEvaluating) return "Evaluating your responses...";
    if (isProcessing) return "Processing...";
    if (conversationState === 'completed') return "Interview completed successfully";
    if (isAgentSpeaking) return "MedBot is speaking...";
    if (isRecording) return "Recording your response...";
    if (showTranscriptionConfirm) return "Please confirm your response";
    if (waitingForUser) return "Your turn to speak";
    return "Processing your response...";
  };

  // Helper to determine if "Repeat Last Question" should be available  
  const canRepeatLastQuestion = () => {
    return currentQuestionNumber > 1 && !awaitingSubmission;
  };

  return {
    // State
    session,
    messages,
    isConnected,
    connectionError,
    isRecording,
    isAgentSpeaking,
    recordingTime,
    waitingForUser,
    interviewStarted,
    interviewCompleted,
    eligibilityResult,
    lastAgentMessage,
    conversationState,
    userHasResponded,
    showTranscriptionConfirm,
    lastTranscription,
    canInterruptSpeech,
    currentQuestionNumber,
    totalQuestions,
    awaitingSubmission,
    isEvaluating,
    isProcessing,
    
    // Actions
    startInterview,
    stopAgentSpeaking,
    startRecording,
    stopRecording,
    repeatCurrentQuestion,
    repeatLastQuestion,
    submitResponse,
    hearInstructionAgain,
    
    // Helpers
    formatTime,
    getStatusText,
    canRepeatLastQuestion
  };
}; 