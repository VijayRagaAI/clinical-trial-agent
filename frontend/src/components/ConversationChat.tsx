import React from 'react';
import { Volume2, Download } from 'lucide-react';
import { Message, SessionData } from '../types/interview';

interface ConversationChatProps {
  messages: Message[];
  session: SessionData | null;
  isDarkMode: boolean;
  onDownload: () => void;
}

export const ConversationChat: React.FC<ConversationChatProps> = ({ messages, session, isDarkMode, onDownload }) => {
  return (
    <div className="relative h-full">
      {/* Independent Scrollable Chat Area */}
      <div 
        className={`p-6 space-y-4 ${
          messages.length === 0 ? 'flex items-center justify-center' : ''
        }`}
        style={{
          height: messages.length > 0 ? 'calc(100% - 60px)' : '100%',
          overflowY: 'scroll',
          overflowX: 'hidden'
        }}
      >
        {messages.length === 0 ? (
          <div className={`text-center py-16 relative ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {/* Enhanced decorative background */}
            <div className={`absolute inset-0 rounded-3xl ${
              isDarkMode ? 'bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-purple-600/10' : 'bg-gradient-to-br from-indigo-50/80 via-purple-50/60 to-pink-50/80'
            }`} />
            <div className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20 ${
              isDarkMode ? 'bg-blue-500' : 'bg-indigo-500'
            }`} />
            <div className={`absolute bottom-0 left-0 w-16 h-16 rounded-full blur-2xl opacity-15 ${
              isDarkMode ? 'bg-purple-500' : 'bg-purple-500'
            }`} />
            
            <div className="relative">
              <div className={`p-6 rounded-2xl mb-6 mx-auto w-fit backdrop-blur-md border transition-all duration-300 hover:scale-105 ${
                isDarkMode ? 'bg-blue-600/20 border-blue-500/30' : 'bg-indigo-100/70 border-indigo-200/50'
              }`}>
                <Volume2 className={`h-20 w-20 ${isDarkMode ? 'text-blue-400/70' : 'text-indigo-500/70'}`} />
              </div>
              <h4 className="text-2xl font-bold bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent mb-3 tracking-tight">
                💬 Chat History
              </h4>
              <p className={`text-base font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Your conversation will appear here
              </p>
              <p className={`text-sm opacity-70 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                ✨ Start the interview to begin your medical screening chat
              </p>
            </div>
          </div>
        ) :
          messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'agent' ? 'justify-start' : 'justify-end'} animate-in slide-in-from-bottom-2 duration-300`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className={`max-w-xl px-6 py-5 rounded-3xl backdrop-blur-md shadow-lg transition-all duration-400 hover:scale-[1.02] hover:shadow-2xl relative group ${
                  message.type === 'agent'
                    ? isDarkMode 
                      ? 'bg-gradient-to-br from-blue-600/25 via-blue-600/15 to-blue-700/10 text-blue-50 border border-blue-500/40 hover:border-blue-400/60' 
                      : 'bg-gradient-to-br from-blue-50 via-blue-100/70 to-blue-150/50 text-blue-950 border border-blue-200/70 hover:border-blue-300/90'
                    : isDarkMode 
                      ? 'bg-gradient-to-br from-purple-600/25 via-purple-600/15 to-purple-700/10 text-purple-50 border border-purple-500/40 hover:border-purple-400/60'
                      : 'bg-gradient-to-br from-purple-50 via-purple-100/70 to-purple-150/50 text-purple-950 border border-purple-200/70 hover:border-purple-300/90'
                }`}
              >
                {/* Enhanced message glow effect */}
                <div className={`absolute inset-0 rounded-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-300 ${
                  message.type === 'agent'
                    ? 'bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600'
                    : 'bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600'
                }`} />
                
                <div className="relative">
                  <div className={`text-sm font-bold mb-4 flex items-center justify-between ${
                    message.type === 'agent' 
                      ? isDarkMode ? 'text-blue-200' : 'text-blue-700'
                      : isDarkMode ? 'text-purple-200' : 'text-purple-700'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <span className={`text-lg ${
                        message.type === 'agent' ? '🤖' : '👤'
                      }`}></span>
                      <span className="font-black tracking-wide">
                        {message.type === 'agent' ? 'MedBot' : 'You'}
                      </span>
                    </div>
                    <div className={`w-2 h-2 rounded-full animate-pulse ${
                      message.type === 'agent' 
                        ? isDarkMode ? 'bg-blue-400' : 'bg-blue-500'
                        : isDarkMode ? 'bg-purple-400' : 'bg-purple-500'
                    }`} />
                  </div>
                  
                  <p className={`text-base leading-relaxed font-medium mb-4 ${
                    isDarkMode ? 'text-gray-100' : 'text-gray-800'
                  }`}>
                    {message.content}
                  </p>
                  
                  <div className="flex justify-between items-center">
                    <div className={`text-xs font-semibold flex items-center space-x-1 opacity-75 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      <span>🕒</span>
                      <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex space-x-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        message.type === 'agent' 
                          ? isDarkMode ? 'bg-blue-400/60' : 'bg-blue-500/60'
                          : isDarkMode ? 'bg-purple-400/60' : 'bg-purple-500/60'
                      }`} />
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        message.type === 'agent' 
                          ? isDarkMode ? 'bg-blue-400/40' : 'bg-blue-500/40'
                          : isDarkMode ? 'bg-purple-400/40' : 'bg-purple-500/40'
                      }`} />
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        message.type === 'agent' 
                          ? isDarkMode ? 'bg-blue-400/20' : 'bg-blue-500/20'
                          : isDarkMode ? 'bg-purple-400/20' : 'bg-purple-500/20'
                      }`} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        }
      </div>
      
             {/* Enhanced message statistics with download button - absolutely positioned at bottom */}
       {messages.length > 0 && (
         <div 
           className={`absolute bottom-0 left-0 right-0 px-4 py-3 border-t backdrop-blur-md ${
             isDarkMode ? 'border-gray-700/50 bg-gradient-to-r from-gray-800/20 to-gray-700/10' : 'border-white/30 bg-gradient-to-r from-white/20 to-indigo-50/20'
           }`}
           style={{ height: '60px' }}
         >
           {/* Decorative elements */}
           <div className={`absolute left-0 top-0 w-full h-0.5 bg-gradient-to-r ${
             isDarkMode ? 'from-blue-500/30 via-indigo-500/30 to-purple-500/30' : 'from-blue-400/40 via-indigo-400/40 to-purple-400/40'
           }`} />
           
           <div className="flex items-center justify-between">
             {/* Download Button */}
             <div className="relative group">
               {/* Tooltip positioned above */}
               <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none ${
                 isDarkMode 
                   ? 'bg-gradient-to-r from-blue-600/95 to-indigo-600/95 text-blue-100 border border-blue-400/50 shadow-lg shadow-blue-500/20' 
                   : 'bg-gradient-to-r from-indigo-100/98 to-purple-100/98 text-indigo-800 border border-indigo-300/70 shadow-lg shadow-indigo-500/20'
               }`}>
                 💾 Export JSON
                 {/* Arrow pointing down */}
                 <div className={`absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 rotate-45 ${
                   isDarkMode ? 'bg-blue-600/95 border-r border-b border-blue-400/50' : 'bg-indigo-100/98 border-r border-b border-indigo-300/70'
                 }`} />
               </div>
               
               <button
                 onClick={onDownload}
                 className={`p-2.5 rounded-xl transition-all duration-300 hover:scale-110 transform hover:shadow-lg hover:rotate-2 ${
                   isDarkMode 
                     ? 'bg-gradient-to-br from-blue-600/25 via-blue-600/15 to-indigo-600/25 hover:from-blue-600/35 hover:via-blue-600/25 hover:to-indigo-600/35 text-blue-300 border border-blue-400/40 hover:border-blue-300/60' 
                     : 'bg-gradient-to-br from-indigo-100/80 via-indigo-50/60 to-purple-100/80 hover:from-indigo-200/90 hover:via-indigo-100/70 hover:to-purple-200/90 text-indigo-700 border border-indigo-300/60 hover:border-indigo-400/80'
                 }`}
               >
                 <Download className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
               </button>
             </div>
             
             {/* Statistics */}
             <div className="flex items-center space-x-3">
               <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full backdrop-blur-sm ${
                 isDarkMode ? 'bg-blue-600/20 border border-blue-500/30' : 'bg-blue-100/50 border border-blue-200/50'
               }`}>
                 <span className="text-xs">📊</span>
                 <span className={`text-xs font-bold ${
                   isDarkMode ? 'text-blue-300' : 'text-blue-700'
                 }`}>
                   {messages.length} Total
                 </span>
               </div>
               
               <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full backdrop-blur-sm ${
                 isDarkMode ? 'bg-blue-600/15 border border-blue-500/25' : 'bg-blue-50/70 border border-blue-200/40'
               }`}>
                 <span className="text-xs">🤖</span>
                 <span className={`text-xs font-medium ${
                   isDarkMode ? 'text-blue-200' : 'text-blue-600'
                 }`}>
                   {messages.filter(m => m.type === 'agent').length} MedBot
                 </span>
               </div>
               
               <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full backdrop-blur-sm ${
                 isDarkMode ? 'bg-purple-600/15 border border-purple-500/25' : 'bg-purple-50/70 border border-purple-200/40'
               }`}>
                 <span className="text-xs">👤</span>
                 <span className={`text-xs font-medium ${
                   isDarkMode ? 'text-purple-200' : 'text-purple-600'
                 }`}>
                   {messages.filter(m => m.type === 'user').length} You
                 </span>
               </div>
             </div>
           </div>
         </div>
       )}
    </div>
  );
}; 