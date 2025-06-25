import React from 'react';
import { Volume2 } from 'lucide-react';
import { Message, SessionData } from '../types/interview';

interface ConversationChatProps {
  messages: Message[];
  session: SessionData | null;
}

export const ConversationChat: React.FC<ConversationChatProps> = ({ messages, session }) => {
  return (
    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
        <h3 className="text-xl font-semibold text-gray-900">Interview Conversation</h3>
        {session && (
          <p className="text-sm text-gray-500 mt-1">Session ID: {session.participant_id}</p>
        )}
      </div>
      
      <div className="p-6 max-h-96 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <Volume2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">Interview conversation will appear here</p>
            <p className="text-sm text-gray-400 mt-2">Start the interview to begin</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'agent' ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-6 py-4 rounded-2xl shadow-sm ${
                  message.type === 'agent'
                    ? 'bg-blue-50 text-gray-900 border border-blue-200'
                    : 'bg-gray-100 text-gray-900 border border-gray-200'
                }`}
              >
                <div className={`text-xs font-medium mb-2 ${
                  message.type === 'agent' ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  {message.type === 'agent' ? '🤖 MedBot' : '👤 You'}
                </div>
                <p className="text-sm leading-relaxed">{message.content}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}; 