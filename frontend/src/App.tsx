import React from 'react';
import { Volume2, AlertCircle } from 'lucide-react';
import { useVoiceInterview } from './hooks/useVoiceInterview';
import { VoiceInterface } from './components/VoiceInterface';
import { ConversationChat } from './components/ConversationChat';
import { EligibilityResults } from './components/EligibilityResults';

function App() {
  const interview = useVoiceInterview();

  return (
    <>
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

      {/* Voice Interface Component - Now full screen */}
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
        />

      {/* Results overlay when completed */}
      {interview.eligibilityResult && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40 p-4">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <EligibilityResults eligibilityResult={interview.eligibilityResult} />
          </div>
        </div>
      )}
    </>
  );
}

export default App;