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

  // Question tracking for repeat last question functionality
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(0);
  const [isSystemMessage, setIsSystemMessage] = useState(false);
  const [justRepeatedLastQuestion, setJustRepeatedLastQuestion] = useState(false);

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
        
        // Debug logging
        console.log('Agent message received:', {
          content: data.content.slice(0, 100) + '...',
          requires_response: data.requires_response,
          awaiting_submission: data.awaiting_submission,
          question_number: data.question_number,
          is_final: data.is_final
        });

        // Determine conversation state and question number from content
        if (data.content.toLowerCase().includes('consent') || data.content.toLowerCase().includes('proceed')) {
          setConversationState('consent');
          setCurrentQuestionNumber(0);
          setAwaitingSubmission(false);
        } else if (data.content.toLowerCase().includes('thank you for completing') || data.is_final) {
          setConversationState('completed');
          setAwaitingSubmission(false);
        } else if (data.awaiting_submission) {
          console.log('Setting awaiting submission to true');
          setConversationState('questioning');
          setAwaitingSubmission(true);
          if (data.question_number !== undefined) {
            setCurrentQuestionNumber(data.question_number);
          }
        } else if (data.requires_response) {
          setConversationState('questioning');
          setAwaitingSubmission(false);
          // Use question number from backend if provided (this is the source of truth)
          if (data.question_number !== undefined) {
            setCurrentQuestionNumber(data.question_number);
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
        
        // Check if this is a repeat request message
        const isRepeatRequest = data.content.toLowerCase().includes('repeat that question') || 
                               data.content.toLowerCase().includes('repeat the question') ||
                               data.content.toLowerCase().includes('could you please repeat') ||
                               data.content.toLowerCase().includes('repeat the previous question') ||
                               data.content.toLowerCase().includes('previous question') ||
                               data.content.toLowerCase().includes('try answering it again');
        
        // Only show transcription if this is NOT a system message (repeat request)
        if (!isSystemMessage && !isRepeatRequest) {
          setLastTranscription(data.content);
          setUserHasResponded(true);
          setShowTranscriptionConfirm(true);
          // Reset repeat last question mode when user provides a real answer
          setJustRepeatedLastQuestion(false);
        } else {
          // Reset system message flag
          setIsSystemMessage(false);
        }
        
        setWaitingForUser(false);
        break;
        
      case 'interview_complete':
        setInterviewCompleted(true);
        setEligibilityResult(data.eligibility);
        setWaitingForUser(false);
        setShowTranscriptionConfirm(false);
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
      
      // Set conversation state to processing and clear all UI states
      setConversationState('questioning');
      setShowTranscriptionConfirm(false);
      setUserHasResponded(false);
      setWaitingForUser(false);
      setLastTranscription('');
      
      // Mark this as a system message to avoid showing transcription
      setIsSystemMessage(true);
      
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
      
      // Set conversation state to processing and clear all UI states
      setConversationState('questioning');
      setShowTranscriptionConfirm(false);
      setUserHasResponded(false);
      setWaitingForUser(false);
      setLastTranscription('');
      
      // Mark this as a system message to avoid showing transcription
      setIsSystemMessage(true);
      
      // Mark that we just repeated last question (so only show repeat current afterward)
      setJustRepeatedLastQuestion(true);
      
      // Don't manually adjust question number - let backend provide it
      
      // Send request to go back to previous question
      wsRef.current.send(JSON.stringify({
        type: 'text_message',
        content: 'Could you please repeat the previous question? I want to try answering it again.'
      }));
    }
  };

  const submitResponse = () => {
    if (wsRef.current && awaitingSubmission) {
      // Clear states
      setAwaitingSubmission(false);
      setShowTranscriptionConfirm(false);
      setUserHasResponded(false);
      setWaitingForUser(false);
      setLastTranscription('');
      
      // Mark as system message to avoid transcription
      setIsSystemMessage(true);
      
      wsRef.current.send(JSON.stringify({
        type: 'text_message',
        content: 'Submit my response and complete the interview.'
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
    if (isAgentSpeaking) return "MedBot is speaking... (click to skip)";
    if (isRecording) return "Recording your response...";
    if (showTranscriptionConfirm) return "Please confirm your response";
    if (waitingForUser) return "Your turn to speak";
    if (conversationState === 'completed') return "Interview completed successfully";
    return "Processing your response...";
  };

  // Helper to determine if "Repeat Last Question" should be available
  const canRepeatLastQuestion = () => {
    // Only available from question 2 onwards AND not just after repeating last question AND not awaiting submission
    return currentQuestionNumber > 1 && !justRepeatedLastQuestion && !awaitingSubmission;
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
    justRepeatedLastQuestion,
    awaitingSubmission,
    
    // Actions
    startInterview,
    stopAgentSpeaking,
    startRecording,
    stopRecording,
    repeatCurrentQuestion,
    repeatLastQuestion,
    submitResponse,
    
    // Helpers
    formatTime,
    getStatusText,
    canRepeatLastQuestion
  };
}; 