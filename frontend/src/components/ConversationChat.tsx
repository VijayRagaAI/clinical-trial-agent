import React from 'react';
import { Volume2, Download } from 'lucide-react';
import { Message, SessionData } from '../types/interview';

// Add breathing animation styles
const breathingStyles = `
  @keyframes breathe {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.8; }
  }
`;

interface ConversationChatProps {
  messages: Message[];
  session: SessionData | null;
  isDarkMode: boolean;
  onDownload: () => void;
}

export const ConversationChat: React.FC<ConversationChatProps> = ({ messages, session, isDarkMode, onDownload }) => {
  return (
    <div className="relative h-full">
      <style>{breathingStyles}</style>
      {/* Independent Scrollable Chat Area */}
      <div 
        className={`p-4 space-y-2 ${
          messages.length === 0 ? 'flex items-center justify-center' : ''
        }`}
        style={{
          height: messages.length > 0 ? 'calc(100% - 125px)' : '100%',
          overflowY: 'scroll',
          overflowX: 'hidden'
        }}
      >
        {messages.length === 0 ? (
          <div className={`text-center py-16 relative ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {/* Enhanced decorative background */}
            <div className={`absolute inset-0 rounded-3xl ${
              isDarkMode ? 'bg-gradient-to-br from-blue-800/60 via-indigo-700/40 to-purple-800/60' : 'bg-gradient-to-br from-indigo-50/80 via-purple-50/70 to-pink-50/80'
            }`} />
            <div className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20 ${
              isDarkMode ? 'bg-blue-500' : 'bg-indigo-500'
            }`} />
            <div className={`absolute bottom-0 left-0 w-16 h-16 rounded-full blur-2xl opacity-15 ${
              isDarkMode ? 'bg-purple-500' : 'bg-purple-500'
            }`} />
            
            {/* Floating sparkles */}
            <div className="absolute top-8 right-12 w-2 h-2 bg-indigo-400 rounded-full animate-bounce opacity-60" style={{ animationDelay: '0ms' }}></div>
            <div className="absolute top-16 right-20 w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce opacity-50" style={{ animationDelay: '150ms' }}></div>
            <div className="absolute top-12 left-16 w-1 h-1 bg-blue-400 rounded-full animate-bounce opacity-40" style={{ animationDelay: '300ms' }}></div>
            <div className="absolute top-24 left-24 w-2.5 h-2.5 bg-indigo-300 rounded-full animate-bounce opacity-55" style={{ animationDelay: '450ms' }}></div>
            
            <div className="relative">
              <div className={`relative p-6 rounded-2xl mb-6 mx-auto w-fit backdrop-blur-2xl border transition-all duration-300 hover:scale-[1.1] hover:-translate-y-2 group ${
                isDarkMode ? 'bg-gradient-to-br from-blue-800/60 via-blue-700/40 to-blue-800/60 border-blue-500/30' : 'bg-gradient-to-br from-indigo-100/80 via-indigo-200/70 to-indigo-100/80 border-indigo-200/50'
              }`}>
                {/* Icon sparkles */}
                <div className="absolute top-2 right-2 w-1 h-1 bg-blue-400 rounded-full animate-bounce opacity-60" style={{ animationDelay: '0ms' }}></div>
                <div className="absolute top-3 left-3 w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce opacity-50" style={{ animationDelay: '200ms' }}></div>
                
                {/* Floating ring */}
                <div className="absolute -top-4 -right-4 w-16 h-16 border border-indigo-300/20 rounded-full opacity-30 transition-transform duration-500 group-hover:scale-110"></div>
                
                <Volume2 className={`h-20 w-20 ${isDarkMode ? 'text-blue-400/70' : 'text-indigo-500/70'}`} />
              </div>
              <h4 className={`text-2xl font-black mb-3 tracking-tight drop-shadow-lg ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent'
                  : 'text-gray-900'
              }`}>
                💬 Chat History
              </h4>
              <p className={`text-base font-bold mb-2 ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-gray-400 via-gray-300 to-gray-400 bg-clip-text text-transparent'
                  : 'text-gray-700'
              }`}>
                Your conversation will appear here
              </p>
              <p className={`text-sm font-medium ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-gray-400 via-gray-300 to-gray-400 bg-clip-text text-transparent'
                  : 'text-gray-600'
              }`}>
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
                className={`relative max-w-xl px-4 py-3 rounded-2xl backdrop-blur-2xl shadow-md transition-all duration-300 hover:scale-[1.005] hover:shadow-lg group ${
                  message.type === 'agent'
                    ? isDarkMode 
                      ? 'bg-gradient-to-br from-blue-800/60 via-blue-700/40 to-blue-800/60 text-blue-50 border border-blue-500/40' 
                      : 'bg-gradient-to-br from-blue-50/80 via-blue-100/70 to-blue-50/80 text-blue-950 border border-blue-200/70'
                    : isDarkMode 
                      ? 'bg-gradient-to-br from-purple-800/60 via-purple-700/40 to-purple-800/60 text-purple-50 border border-purple-500/40'
                      : 'bg-gradient-to-br from-purple-50/80 via-purple-100/70 to-purple-50/80 text-purple-950 border border-purple-200/70'
                }`}
              >
                {/* Floating sparkles */}
                <div className={`absolute top-2 right-2 w-1.5 h-1.5 ${message.type === 'agent' ? 'bg-blue-400' : 'bg-purple-400'} rounded-full animate-bounce opacity-60`} style={{ animationDelay: '0ms' }}></div>
                <div className={`absolute top-3 right-6 w-1 h-1 ${message.type === 'agent' ? 'bg-blue-300' : 'bg-purple-300'} rounded-full animate-bounce opacity-50`} style={{ animationDelay: '150ms' }}></div>
                <div className={`absolute top-5 left-3 w-1.5 h-1.5 ${message.type === 'agent' ? 'bg-blue-500' : 'bg-purple-500'} rounded-full animate-bounce opacity-40`} style={{ animationDelay: '300ms' }}></div>
                <div className={`absolute top-1 left-8 w-1 h-1 ${message.type === 'agent' ? 'bg-blue-400' : 'bg-purple-400'} rounded-full animate-bounce opacity-55`} style={{ animationDelay: '450ms' }}></div>
                
                {/* Floating rings */}
                <div className={`absolute -top-4 -right-4 w-12 h-12 border ${message.type === 'agent' ? 'border-blue-300/20' : 'border-purple-300/20'} rounded-full opacity-30 transition-transform duration-500 group-hover:scale-110`}></div>
                
                {/* Shimmer effect */}
                <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${message.type === 'agent' ? 'via-blue-200/20' : 'via-purple-200/20'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 skew-x-12 transform-gpu rounded-2xl`}></div>
                {/* Enhanced message glow effect */}
                <div className={`absolute inset-0 rounded-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-300 ${
                  message.type === 'agent'
                    ? 'bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600'
                    : 'bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600'
                }`} />
                
                <div className="relative">
                  <div className="text-sm font-bold mb-2 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`text-lg ${
                        message.type === 'agent' ? '🤖' : '👤'
                      }`}></span>
                      <span className={`font-black tracking-wide ${
                        isDarkMode
                          ? `bg-gradient-to-r ${
                              message.type === 'agent' 
                                ? 'from-blue-400 via-blue-300 to-blue-400' 
                                : 'from-purple-400 via-purple-300 to-purple-400'
                            } bg-clip-text text-transparent`
                          : message.type === 'agent' 
                            ? 'text-blue-900' 
                            : 'text-purple-900'
                      }`}>
                        {message.type === 'agent' ? 'MedBot' : 'You'}
                      </span>
                    </div>
                    <div className={`w-2 h-2 rounded-full animate-pulse ${
                      message.type === 'agent' 
                        ? isDarkMode ? 'bg-blue-400' : 'bg-blue-500'
                        : isDarkMode ? 'bg-purple-400' : 'bg-purple-500'
                    }`} />
                  </div>
                  
                  <p className={`text-sm leading-relaxed font-medium mb-2 ${
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
           className={`absolute bottom-0 left-0 right-0 px-6 py-4 border-t backdrop-blur-md ${
             isDarkMode ? 'border-gray-700/50 bg-gradient-to-r from-gray-800/20 to-gray-700/10' : 'border-white/30 bg-gradient-to-r from-white/20 to-indigo-50/20'
           }`}
           style={{ height: '125px' }}
         >
           {/* Decorative elements */}
           <div className={`absolute left-0 top-0 w-full h-0.5 bg-gradient-to-r ${
             isDarkMode ? 'from-blue-500/30 via-indigo-500/30 to-purple-500/30' : 'from-blue-400/40 via-indigo-400/40 to-purple-400/40'
           }`} />
           
           <div className="flex flex-col space-y-1">
             {/* Statistics Cards - Inline */}
                            <div className="flex items-center justify-center space-x-2">
                {/* Total Messages */}
                <div className={`relative flex flex-col items-center px-2 py-1 rounded-md backdrop-blur-2xl border transition-all duration-300 hover:scale-[1.02] shadow-lg group ${
                  isDarkMode ? 'bg-gradient-to-br from-slate-800/60 via-slate-700/40 to-slate-800/60 border-slate-500/30' : 'bg-gradient-to-br from-slate-100/80 via-slate-200/70 to-slate-100/80 border-slate-200/50'
                }`}>
                  {/* Floating sparkles */}
                  <div className="absolute top-1 right-1 w-1 h-1 bg-slate-400 rounded-full animate-bounce opacity-40" style={{ animationDelay: '0ms' }}></div>
                  <div className="absolute top-2 left-1 w-0.5 h-0.5 bg-slate-300 rounded-full animate-bounce opacity-30" style={{ animationDelay: '300ms' }}></div>
                  
                  {/* Floating ring */}
                  <div className="absolute -top-2 -right-2 w-6 h-6 border border-slate-300/10 rounded-full opacity-20 transition-transform duration-500 group-hover:scale-105"></div>
                  
                  {/* Subtle shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-200/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 skew-x-12 transform-gpu rounded-md"></div>
                  
                  <span className={`text-xs font-bold uppercase tracking-wider ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}>Total</span>
                  <span className={`text-xl font-black ${
                    isDarkMode 
                      ? 'bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-clip-text text-transparent'
                      : 'text-slate-900'
                  }`}>
                    {messages.length}
                  </span>
                </div>
               
                {/* Agent Messages */}
                <div className={`relative flex flex-col items-center px-2 py-1 rounded-md backdrop-blur-2xl border transition-all duration-300 hover:scale-[1.02] shadow-lg group ${
                  isDarkMode ? 'bg-gradient-to-br from-blue-800/60 via-blue-700/40 to-blue-800/60 border-blue-500/30' : 'bg-gradient-to-br from-blue-100/80 via-blue-200/70 to-blue-100/80 border-blue-200/50'
                }`}>
                  {/* Floating sparkles */}
                  <div className="absolute top-1 right-1 w-1 h-1 bg-blue-400 rounded-full animate-bounce opacity-40" style={{ animationDelay: '0ms' }}></div>
                  <div className="absolute top-2 left-1 w-0.5 h-0.5 bg-blue-300 rounded-full animate-bounce opacity-30" style={{ animationDelay: '300ms' }}></div>
                  
                  {/* Floating ring */}
                  <div className="absolute -top-2 -right-2 w-6 h-6 border border-blue-300/10 rounded-full opacity-20 transition-transform duration-500 group-hover:scale-105"></div>
                  
                  {/* Subtle shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-200/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 skew-x-12 transform-gpu rounded-md"></div>
                  
                  <span className={`text-xs font-bold uppercase tracking-wider ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-500'
                  }`}>MedBot</span>
                  <span className={`text-xl font-black ${
                    isDarkMode 
                      ? 'bg-gradient-to-r from-blue-300 via-blue-200 to-blue-300 bg-clip-text text-transparent'
                      : 'text-blue-900'
                  }`}>
                    {messages.filter(m => m.type === 'agent').length}
                  </span>
                </div>
               
                {/* User Messages */}
                <div className={`relative flex flex-col items-center px-3 py-2 rounded-lg backdrop-blur-2xl border transition-all duration-300 hover:scale-[1.02] shadow-lg group ${
                  isDarkMode ? 'bg-gradient-to-br from-purple-800/60 via-purple-700/40 to-purple-800/60 border-purple-500/30' : 'bg-gradient-to-br from-purple-100/80 via-purple-200/70 to-purple-100/80 border-purple-200/50'
                }`}>
                  {/* Floating sparkles */}
                  <div className="absolute top-1 right-1 w-1 h-1 bg-purple-400 rounded-full animate-bounce opacity-40" style={{ animationDelay: '0ms' }}></div>
                  <div className="absolute top-2 left-1 w-0.5 h-0.5 bg-purple-300 rounded-full animate-bounce opacity-30" style={{ animationDelay: '300ms' }}></div>
                  
                  {/* Floating ring */}
                  <div className="absolute -top-2 -right-2 w-6 h-6 border border-purple-300/10 rounded-full opacity-20 transition-transform duration-500 group-hover:scale-105"></div>
                  
                  {/* Subtle shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-200/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 skew-x-12 transform-gpu rounded-md"></div>
                  
                  <span className={`text-xs font-bold uppercase tracking-wider ${
                    isDarkMode ? 'text-purple-400' : 'text-purple-500'
                  }`}>You</span>
                  <span className={`text-xl font-black ${
                    isDarkMode 
                      ? 'bg-gradient-to-r from-purple-300 via-purple-200 to-purple-300 bg-clip-text text-transparent'
                      : 'text-purple-900'
                  }`}>
                    {messages.filter(m => m.type === 'user').length}
                  </span>
                </div>
             </div>
             
             {/* Download Button - Very compact */}
             <div className="flex justify-center">
               <button
                 onClick={onDownload}
                 className={`relative flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-500 hover:scale-[1.1] hover:-translate-y-1 transform hover:shadow-xl hover:rotate-1 group/btn border ${
                   isDarkMode 
                     ? 'bg-gradient-to-br from-purple-600/95 via-pink-500/85 to-purple-600/95 hover:from-purple-500/100 hover:via-pink-400/95 hover:to-purple-500/100 text-purple-50 border-purple-300/80 hover:border-pink-200/95 shadow-lg shadow-purple-400/60' 
                     : 'bg-gradient-to-br from-purple-400/95 via-pink-500/90 to-purple-400/95 hover:from-purple-500/100 hover:via-pink-600/100 hover:to-purple-500/100 text-white border-purple-600/85 hover:border-pink-600/100 shadow-lg shadow-purple-500/70'
                 }`}
               >
                 {/* Enhanced glittering sparkles */}
                 <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-purple-300 rounded-full animate-bounce opacity-80 shadow-md shadow-purple-300/60" style={{ animationDelay: '0ms' }}></div>
                 <div className="absolute top-1 left-1 w-1 h-1 bg-pink-400 rounded-full animate-bounce opacity-70 shadow-md shadow-pink-400/60" style={{ animationDelay: '100ms' }}></div>
                 <div className="absolute bottom-1 right-3 w-1 h-1 bg-purple-400 rounded-full animate-bounce opacity-60 shadow-md shadow-purple-400/60" style={{ animationDelay: '200ms' }}></div>
                 <div className="absolute top-2 right-5 w-1.5 h-1.5 bg-pink-300 rounded-full animate-bounce opacity-75 shadow-md shadow-pink-300/60" style={{ animationDelay: '300ms' }}></div>
                 <div className="absolute bottom-2 left-3 w-1 h-1 bg-purple-500 rounded-full animate-bounce opacity-65 shadow-md shadow-purple-500/60" style={{ animationDelay: '400ms' }}></div>
                 <div className="absolute top-1 left-6 w-1 h-1 bg-pink-500 rounded-full animate-bounce opacity-55 shadow-md shadow-pink-500/60" style={{ animationDelay: '500ms' }}></div>
                 
                 {/* Glittering floating rings */}
                 <div className="absolute -top-2 -right-2 w-8 h-8 border border-purple-300/30 rounded-full opacity-40 transition-transform duration-500 group-hover/btn:scale-110 animate-spin" style={{ animationDuration: '8s' }}></div>
                 <div className="absolute -bottom-1 -left-1 w-6 h-6 border border-pink-300/25 rounded-full opacity-35 transition-transform duration-600 group-hover/btn:scale-115 animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }}></div>
                 
                 {/* Enhanced shimmer effect */}
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-300/50 via-pink-300/60 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-600 skew-x-12 transform-gpu rounded-xl"></div>
                 
                 {/* Breathing glow layers */}
                 <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/25 via-pink-400/30 to-purple-500/25 blur-lg opacity-70 transition-opacity duration-1000" style={{
                   animation: 'breathe 3s ease-in-out infinite'
                 }}></div>
                 <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-400/20 via-pink-300/25 to-purple-400/20 blur-xl opacity-50 transition-opacity duration-1500" style={{
                   animation: 'breathe 4s ease-in-out infinite reverse'
                 }}></div>
                 <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600/15 via-pink-500/20 to-purple-600/15 blur-2xl opacity-40 transition-opacity duration-2000" style={{
                   animation: 'breathe 5s ease-in-out infinite'
                 }}></div>
                 
                 <Download className={`h-4 w-4 transition-transform duration-300 group-hover/btn:scale-105 group-hover/btn:rotate-3 relative z-10 ${
                   isDarkMode ? 'text-purple-100' : 'text-white'
                 }`} />
                 <span className={`font-bold text-sm relative z-10 tracking-wide ${
                   isDarkMode 
                     ? 'bg-gradient-to-r from-purple-100 via-pink-100 to-purple-100 bg-clip-text text-transparent drop-shadow-lg'
                     : 'text-white font-bold drop-shadow-md'
                 }`}>
                   Download Chat Data
                 </span>
               </button>
             </div>
           </div>
         </div>
       )}
    </div>
  );
}; 