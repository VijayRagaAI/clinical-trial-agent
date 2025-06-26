import React from 'react';
import { Volume2, AlertCircle } from 'lucide-react';
import { useVoiceInterview } from './hooks/useVoiceInterview';
import { VoiceInterface } from './components/VoiceInterface';
import { ConversationChat } from './components/ConversationChat';
import { EligibilityResults } from './components/EligibilityResults';

function App() {
  const interview = useVoiceInterview();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Volume2 className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Clinical Trial Voice Interview</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            AI-powered screening to help determine your eligibility for clinical research studies
          </p>
        </div>

        {/* Error Message */}
        {interview.connectionError && (
          <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4 mb-6 shadow-sm">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Connection Error</h3>
                <div className="mt-2 text-sm text-red-700">{interview.connectionError}</div>
              </div>
            </div>
          </div>
        )}

        {/* Voice Interface Component */}
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
          justRepeatedLastQuestion={interview.justRepeatedLastQuestion}
          awaitingSubmission={interview.awaitingSubmission}
          startInterview={interview.startInterview}
          stopAgentSpeaking={interview.stopAgentSpeaking}
          startRecording={interview.startRecording}
          stopRecording={interview.stopRecording}
          repeatCurrentQuestion={interview.repeatCurrentQuestion}
          repeatLastQuestion={interview.repeatLastQuestion}
          submitResponse={interview.submitResponse}
          formatTime={interview.formatTime}
          getStatusText={interview.getStatusText}
          canRepeatLastQuestion={interview.canRepeatLastQuestion}
        />

        {/* Conversation Chat Component */}
        <ConversationChat
          messages={interview.messages}
          session={interview.session}
        />

        {/* Eligibility Results Component */}
        {interview.eligibilityResult && (
          <EligibilityResults eligibilityResult={interview.eligibilityResult} />
        )}
      </div>
    </div>
  );
}

export default App;