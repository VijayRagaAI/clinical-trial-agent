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

export interface Study {
  id: string;
  title: string;
  category: string;
  description: string;
  phase: string;
  sponsor: string;
  nct_id: string;
  purpose: string;
  commitment: string;
  procedures: string[];
  // Additional properties from JSON data
  protocol_version?: string;
  last_amended?: string;
  key_procedures?: string[];
  criteria?: Array<{
    id: string;
    text: string;
    question: string;
    expected_response: string;
    response: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export interface EligibilityResult {
  participant_id: string;
  eligible: boolean;
  score: number;
  evaluation_timestamp: string;
  criteria_met: Array<{
    meets_criteria: boolean;
    priority: 'high' | 'medium'| 'low';
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

// Admin Dashboard Types
export interface AdminInterview {
  id: string;
  participant_name: string;
  participant_id: string;
  session_id: string;
  study_id: string;
  study_name: string;
  date: string;
  status: 'Completed' | 'In Progress' | 'Abandoned' | 'Paused' | 'Interrupted';
  total_messages: number;
  eligibility_result?: {
    eligible: boolean;
    score: number;
  } | null;
}

export interface AdminInterviewsResponse {
  interviews: AdminInterview[];
  total_count: number;
  completed_count: number;
  in_progress_count: number;
  abandoned_count: number;
} 