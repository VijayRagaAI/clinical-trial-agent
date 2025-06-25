// API service for communicating with the backend
const API_BASE_URL = 'http://localhost:8000';
const WS_BASE_URL = 'ws://localhost:8000';

export interface SessionData {
  session_id: string;
  status: string;
  participant_id: string;
  created_at: string;
}

export interface StartSessionRequest {
  participant_name?: string;
  participant_email?: string;
}

export interface Message {
  id: string;
  type: 'agent' | 'user';
  content: string;
  timestamp: string;
  requires_response?: boolean;
  is_final?: boolean;
  audio?: string;
}

export interface EligibilityResult {
  session_id: string;
  eligible: boolean;
  score: number;
  criteria_met: any[];
  summary: string;
}

class ApiService {
  private baseUrl: string;
  private wsUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.wsUrl = WS_BASE_URL;
  }

  // Session management
  async startSession(request: StartSessionRequest): Promise<SessionData> {
    const response = await fetch(`${this.baseUrl}/api/sessions/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Failed to start session');
    }

    return response.json();
  }

  async getSession(sessionId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/sessions/${sessionId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get session');
    }

    return response.json();
  }

  async getEligibility(sessionId: string): Promise<EligibilityResult> {
    const response = await fetch(`${this.baseUrl}/api/sessions/${sessionId}/eligibility`);
    
    if (!response.ok) {
      throw new Error('Failed to get eligibility');
    }

    return response.json();
  }

  async getTrialInfo(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/trial-info`);
    
    if (!response.ok) {
      throw new Error('Failed to get trial info');
    }

    return response.json();
  }

  // WebSocket connection
  createWebSocketConnection(sessionId: string): WebSocket {
    const ws = new WebSocket(`${this.wsUrl}/ws/${sessionId}`);
    return ws;
  }

  // Health check
  async healthCheck(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/health`);
    return response.json();
  }
}

// Audio utilities
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async initialize(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
    } catch (error) {
      throw new Error('Failed to access microphone');
    }
  }

  startRecording(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.stream) {
        reject(new Error('Audio stream not initialized'));
        return;
      }

      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstart = () => {
        resolve();
      };

      this.mediaRecorder.onerror = (event) => {
        reject(new Error('Recording failed'));
      };

      this.mediaRecorder.start(100); // Collect data every 100ms
    });
  }

  stopRecording(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          const audioBase64 = await this.blobToBase64(audioBlob);
          resolve(audioBase64);
        } catch (error) {
          reject(error);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }
}

// Audio player for agent responses
export class AudioPlayer {
  private audio: HTMLAudioElement | null = null;

  async playBase64Audio(audioBase64: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const audioBlob = this.base64ToBlob(audioBase64, 'audio/mpeg');
        const audioUrl = URL.createObjectURL(audioBlob);
        
        this.audio = new Audio(audioUrl);
        this.audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        this.audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          reject(new Error('Audio playback failed'));
        };
        
        this.audio.play();
      } catch (error) {
        reject(error);
      }
    });
  }

  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }
  }
}

// Export singleton instance
export const apiService = new ApiService(); 