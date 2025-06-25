export interface Message {
  id: string;
  type: 'agent' | 'user';
  content: string;
  timestamp: string;
}

export interface SessionData {
  session_id: string;
  participant_id: string;
}

export type ConversationState = 
  | 'not_started' 
  | 'starting' 
  | 'consent' 
  | 'questioning' 
  | 'completed';

export type ButtonState = 
  | 'not_started'
  | 'starting'
  | 'agent_speaking'
  | 'ready_to_speak'
  | 'recording'
  | 'transcription_while_speaking'
  | 'transcription_ready'
  | 'completed';

export interface ButtonConfig {
  primary: {
    action: () => void;
    icon: any;
    text: string;
    color: string;
  };
  secondary: Array<{
    action: () => void;
    icon: any;
    text: string;
    color: string;
  }>;
  disabled: boolean;
}

export interface EligibilityResult {
  participant_id: string;
  eligible: boolean;
  score: number;
  evaluation_timestamp: string;
  criteria_met: Array<{
    meets_criteria: boolean;
    priority: 'high' | 'medium';
    criteria_text: string;
    participant_response: string;
    reasoning: string;
    confidence: number;
  }>;
}

export interface InterviewState {
  // Session state
  session: SessionData | null;
  messages: Message[];
  isConnected: boolean;
  connectionError: string | null;

  // Recording state
  isRecording: boolean;
  isAgentSpeaking: boolean;
  recordingTime: number;
  waitingForUser: boolean;

  // Interview state
  interviewStarted: boolean;
  interviewCompleted: boolean;
  eligibilityResult: EligibilityResult | null;
  lastAgentMessage: string;

  // Enhanced conversation state
  conversationState: ConversationState;
  userHasResponded: boolean;
  showTranscriptionConfirm: boolean;
  lastTranscription: string;
  canInterruptSpeech: boolean;
} 