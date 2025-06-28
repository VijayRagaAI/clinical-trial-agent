import React from 'react';
import { AlertTriangle, X, CheckCircle, Clock, User, FileText, Tag } from 'lucide-react';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  detailsMessage?: string;
  confirmText?: string;
  cancelText?: string;
  isDarkMode: boolean;
  type?: 'warning' | 'danger' | 'info';
  participantInfo?: {
    name: string;
    messageCount: number;
    studyName: string;
    timeElapsed: string;
    interviewStatus?: string;
  };
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  detailsMessage,
  confirmText = "Yes, Continue",
  cancelText = "Cancel",
  isDarkMode,
  type = 'warning',
  participantInfo
}) => {
  if (!isOpen) return null;

  const getIconAndColors = () => {
    switch (type) {
      case 'danger':
        return {
          icon: AlertTriangle,
          colors: {
            bg: isDarkMode ? 'from-red-900/80 via-red-800/60 to-red-900/80' : 'from-red-50/90 via-red-100/80 to-red-50/90',
            border: isDarkMode ? 'border-red-700/50' : 'border-red-200/50',
            iconBg: isDarkMode ? 'bg-red-600/20' : 'bg-red-100/80',
            iconColor: isDarkMode ? 'text-red-400' : 'text-red-600',
            confirmButton: isDarkMode 
              ? 'bg-gradient-to-r from-red-600/80 to-red-700/80 hover:from-red-500/90 hover:to-red-600/90 border-red-500/50' 
              : 'bg-gradient-to-r from-red-500/90 to-red-600/90 hover:from-red-600/95 hover:to-red-700/95 border-red-400/50',
          }
        };
      case 'info':
        return {
          icon: CheckCircle,
          colors: {
            bg: isDarkMode ? 'from-blue-900/80 via-blue-800/60 to-blue-900/80' : 'from-blue-50/90 via-blue-100/80 to-blue-50/90',
            border: isDarkMode ? 'border-blue-700/50' : 'border-blue-200/50',
            iconBg: isDarkMode ? 'bg-blue-600/20' : 'bg-blue-100/80',
            iconColor: isDarkMode ? 'text-blue-400' : 'text-blue-600',
            confirmButton: isDarkMode 
              ? 'bg-gradient-to-r from-blue-600/80 to-blue-700/80 hover:from-blue-500/90 hover:to-blue-600/90 border-blue-500/50' 
              : 'bg-gradient-to-r from-blue-500/90 to-blue-600/90 hover:from-blue-600/95 hover:to-blue-700/95 border-blue-400/50',
          }
        };
      default: // warning
        return {
          icon: AlertTriangle,
          colors: {
            bg: isDarkMode ? 'from-amber-900/80 via-amber-800/60 to-amber-900/80' : 'from-amber-50/90 via-amber-100/80 to-amber-50/90',
            border: isDarkMode ? 'border-amber-700/50' : 'border-amber-200/50',
            iconBg: isDarkMode ? 'bg-amber-600/20' : 'bg-amber-100/80',
            iconColor: isDarkMode ? 'text-amber-400' : 'text-amber-600',
            confirmButton: isDarkMode 
              ? 'bg-gradient-to-r from-amber-600/80 to-amber-700/80 hover:from-amber-500/90 hover:to-amber-600/90 border-amber-500/50' 
              : 'bg-gradient-to-r from-amber-500/90 to-amber-600/90 hover:from-amber-600/95 hover:to-amber-700/95 border-amber-400/50',
          }
        };
    }
  };

  const { icon: Icon, colors } = getIconAndColors();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className={`absolute inset-0 backdrop-blur-xl transition-all duration-500 ${
          isDarkMode ? 'bg-black/70' : 'bg-black/50'
        }`}
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div 
        className={`relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl backdrop-blur-2xl border shadow-2xl transform transition-all duration-700 scale-100 animate-in fade-in-0 zoom-in-95 ${
          colors.bg
        } ${colors.border}`}
      >
        {/* Enhanced magical background effects */}
        <div className={`absolute inset-0 bg-gradient-to-br opacity-20 transition-all duration-700 rounded-3xl ${
          type === 'danger' ? 'from-red-500/30 to-red-600/25' :
          type === 'info' ? 'from-blue-500/30 to-blue-600/25' :
          'from-amber-500/30 to-amber-600/25'
        }`}></div>
        
        {/* Floating sparkles */}
        <div className={`absolute top-8 right-12 w-3 h-3 rounded-full animate-bounce shadow-lg ${
          type === 'danger' ? 'bg-red-400/50' :
          type === 'info' ? 'bg-blue-400/50' :
          'bg-amber-400/50'
        }`} style={{animationDelay: '0s'}}></div>
        <div className={`absolute top-16 right-20 w-2 h-2 rounded-full animate-bounce shadow-md ${
          type === 'danger' ? 'bg-red-400/40' :
          type === 'info' ? 'bg-blue-400/40' :
          'bg-amber-400/40'
        }`} style={{animationDelay: '0.3s'}}></div>
        <div className={`absolute bottom-8 left-12 w-2.5 h-2.5 rounded-full animate-bounce shadow-lg ${
          type === 'danger' ? 'bg-red-300/60' :
          type === 'info' ? 'bg-blue-300/60' :
          'bg-amber-300/60'
        }`} style={{animationDelay: '0.6s'}}></div>
        
        {/* Header */}
        <div className={`relative z-10 p-8 border-b ${
          isDarkMode ? 'border-gray-700/30' : 'border-gray-200/30'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-4 rounded-2xl ${colors.iconBg} shadow-lg`}>
                <Icon className={`h-8 w-8 ${colors.iconColor}`} />
              </div>
              <div>
                <h3 className={`text-2xl font-black mb-2 ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-900'
                }`}>
                  {title}
                </h3>
                <p className={`text-lg leading-relaxed ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {message}
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className={`group relative p-3 rounded-2xl transition-all duration-500 hover:scale-110 hover:rotate-90 backdrop-blur-md border ${
                isDarkMode 
                  ? 'bg-gray-700/50 hover:bg-red-600/30 border-gray-600/50 hover:border-red-500/50' 
                  : 'bg-white/70 hover:bg-red-100/70 border-gray-300/50 hover:border-red-300/50'
              } hover:shadow-2xl hover:shadow-red-500/30`}
            >
              <X className={`h-6 w-6 transition-all duration-300 ${
                isDarkMode ? 'text-gray-300 group-hover:text-red-300' : 'text-gray-600 group-hover:text-red-600'
              }`} />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 p-8 space-y-6">
          {detailsMessage && (
            <div className={`p-6 rounded-2xl backdrop-blur-sm border ${
              isDarkMode 
                ? 'bg-gray-800/30 border-gray-700/30' 
                : 'bg-white/50 border-gray-200/30'
            }`}>
              <p className={`text-sm leading-relaxed ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {detailsMessage}
              </p>
            </div>
          )}
          
          {/* Participant Info Section */}
          {participantInfo && (
            <div className={`p-6 rounded-2xl backdrop-blur-sm border ${
              isDarkMode 
                ? 'bg-gray-800/30 border-gray-700/30' 
                : 'bg-white/50 border-gray-200/30'
            }`}>
              <h4 className={`text-lg font-bold mb-4 flex items-center space-x-2 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                <User className="h-5 w-5" />
                <span>Interview Progress</span>
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <User className={`h-4 w-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    <div>
                      <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Participant
                      </p>
                      <p className={`text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {participantInfo.name}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <FileText className={`h-4 w-4 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    <div>
                      <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Study
                      </p>
                      <p className={`text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {participantInfo.studyName}
                      </p>
                    </div>
                  </div>

                  {participantInfo.interviewStatus && (
                    <div className="flex items-center space-x-3">
                      <Tag className={`h-4 w-4 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                      <div>
                        <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Will be marked as
                        </p>
                        <p className={`text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                          {participantInfo.interviewStatus}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className={`h-4 w-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                    <div>
                      <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Messages Exchanged
                      </p>
                      <p className={`text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {participantInfo.messageCount} messages
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Clock className={`h-4 w-4 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                    <div>
                      <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Time Elapsed
                      </p>
                      <p className={`text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {participantInfo.timeElapsed}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className={`group relative flex-1 p-4 rounded-2xl font-semibold transition-all duration-500 hover:scale-105 hover:-translate-y-1 backdrop-blur-md border shadow-lg ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-gray-700/80 to-gray-600/80 text-gray-300 border-gray-500/50 hover:from-gray-600/90 hover:to-gray-500/90 hover:border-gray-400/60' 
                  : 'bg-gradient-to-r from-gray-200/80 to-gray-300/80 text-gray-700 border-gray-300/50 hover:from-gray-300/90 hover:to-gray-400/90 hover:border-gray-400/60'
              } hover:shadow-xl`}
            >
              <span className="relative z-10 flex items-center justify-center space-x-2">
                <X className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                <span>{cancelText}</span>
              </span>
            </button>
            
            <button
              onClick={onConfirm}
              className={`group relative flex-1 p-4 rounded-2xl font-bold text-white transition-all duration-500 hover:scale-105 hover:-translate-y-1 backdrop-blur-md border shadow-lg ${
                colors.confirmButton
              } hover:shadow-xl`}
            >
              <span className="relative z-10 flex items-center justify-center space-x-2">
                <CheckCircle className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                <span>{confirmText}</span>
              </span>
              
              {/* Button glow */}
              <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 ${
                type === 'danger' ? 'bg-gradient-to-r from-red-400/0 via-red-400/20 to-red-400/0' :
                type === 'info' ? 'bg-gradient-to-r from-blue-400/0 via-blue-400/20 to-blue-400/0' :
                'bg-gradient-to-r from-amber-400/0 via-amber-400/20 to-amber-400/0'
              }`}></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};