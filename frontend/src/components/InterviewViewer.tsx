import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, MessageSquare, Download, ChevronLeft, Eye } from 'lucide-react';
import { ConversationChat } from './ConversationChat';
import { EligibilityResults } from './EligibilityResults';

interface InterviewData {
  participant_interview_info: {
    participant_id: string;
    session_id: string;
    study_name: string;
    status: string;
    interview_status: string;
    Eligibility?: {
      eligible: boolean;
      score: number;
      summary: string;
    } | null;
    date_and_time: string;
    download_timestamp: string;
  };
  conversation: {
    metadata: any;
    conversation: Array<{
      id: string;
      type: 'agent' | 'user';
      content: string;
      timestamp: string;
    }>;
    summary: any;
  } | null;
  evaluation: {
    eligibility_result: any;
    evaluation_timestamp: string;
  } | null;
}

const InterviewViewer: React.FC = () => {
  const { participant_id } = useParams<{ participant_id: string }>();
  const navigate = useNavigate();
  const [interviewData, setInterviewData] = useState<InterviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadThemePreference();
    if (participant_id) {
      loadInterviewData(participant_id);
    }
  }, [participant_id]);

  const loadThemePreference = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE}/api/theme/preferences`);
      if (response.ok) {
        const data = await response.json();
        setIsDarkMode(data.is_dark_mode);
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    }
  };

  const loadInterviewData = async (participantId: string) => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE}/api/download/interview/${participantId}`);
      
      if (response.ok) {
        const data = await response.json();
        setInterviewData(data);
        console.log('✅ Loaded interview data for viewing:', data);
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        setError(`Failed to load interview data: ${errorData.detail}`);
      }
    } catch (error) {
      console.error('Error loading interview data:', error);
      setError('Failed to load interview data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/');
  };

  const downloadInterviewData = () => {
    if (!interviewData) return;
    
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `interview_${interviewData.participant_interview_info.participant_id}_${currentDate}.json`;
    
    const blob = new Blob([JSON.stringify(interviewData, null, 2)], {
      type: 'application/json'
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className={`min-h-screen transition-all duration-500 ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'}`}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4 ${
              isDarkMode ? 'border-blue-400' : 'border-indigo-600'
            }`}></div>
            <p className={`text-lg font-medium ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>Loading interview data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !interviewData) {
    return (
      <div className={`min-h-screen transition-all duration-500 ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'}`}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center max-w-md mx-4">
            <AlertCircle className={`h-16 w-16 mx-auto mb-4 ${
              isDarkMode ? 'text-red-400' : 'text-red-500'
            }`} />
            <h2 className={`text-2xl font-bold mb-2 ${
              isDarkMode ? 'text-gray-200' : 'text-gray-800'
            }`}>Interview Not Found</h2>
            <p className={`text-lg mb-6 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>{error}</p>
            <button
              onClick={handleBackToDashboard}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const messages = interviewData.conversation?.conversation.map(msg => ({
    id: msg.id,
    type: msg.type,
    content: msg.content,
    timestamp: msg.timestamp,
    requires_response: false
  })) || [];

  const mockSession = {
    session_id: interviewData.participant_interview_info.session_id,
    participant_id: interviewData.participant_interview_info.participant_id,
    created_at: interviewData.participant_interview_info.date_and_time
  };

  const eligibilityResult = interviewData.evaluation?.eligibility_result || null;

  return (
    <div className={`min-h-screen transition-all duration-500 ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'}`}>
      {/* Header with view indicator */}
      <div className={`fixed top-0 left-0 right-0 z-40 backdrop-blur-md border-b transition-all duration-500 ${
        isDarkMode 
          ? 'bg-gray-800/50 border-gray-700/50' 
          : 'bg-white/70 border-white/20'
      }`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left-aligned Title with Logo */}
            <div className="flex items-center space-x-4">
              <div className={`relative p-3 rounded-2xl backdrop-blur-md border transition-all duration-500 hover:scale-105 ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-purple-600/10 border-blue-500/20' 
                  : 'bg-gradient-to-br from-indigo-50/80 via-purple-50/60 to-pink-50/80 border-indigo-200/30'
              }`}>
                {/* Decorative micro circles */}
                <div className={`absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full ${
                  isDarkMode ? 'bg-blue-400/40' : 'bg-indigo-400/40'
                }`} />
                <div className={`absolute bottom-0.5 left-0.5 w-1 h-1 rounded-full ${
                  isDarkMode ? 'bg-purple-400/40' : 'bg-purple-400/40'
                }`} />
                
                <Eye className={`h-8 w-8 ${
                  isDarkMode ? 'text-blue-400/70' : 'text-indigo-500/70'
                }`} />
              </div>
              
              <div>
                <h1 className={`text-3xl font-black mb-1 ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-clip-text text-transparent' 
                    : 'text-gray-900'
                } drop-shadow-lg`}>
                  Interview Viewer
                </h1>
                <p className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Participant: {interviewData.participant_interview_info.participant_id}
                </p>
              </div>
            </div>
            
            {/* Download Button Only */}
            <div className="flex items-center space-x-4">
              
              {/* Enhanced Download Button */}
              <button
                onClick={downloadInterviewData}
                className={`relative flex items-center space-x-3 px-6 py-3 rounded-2xl transition-all duration-500 hover:scale-110 hover:-translate-y-1 transform hover:shadow-xl hover:rotate-1 group/btn border backdrop-blur-xl ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-purple-600/95 via-pink-500/85 to-purple-600/95 hover:from-purple-500/100 hover:via-pink-400/95 hover:to-purple-500/100 text-purple-50 border-purple-300/80 hover:border-pink-200/95 shadow-lg shadow-purple-400/60' 
                    : 'bg-gradient-to-br from-purple-400/95 via-pink-500/90 to-purple-400/95 hover:from-purple-500/100 hover:via-pink-600/100 hover:to-purple-500/100 text-white border-purple-600/85 hover:border-pink-600/100 shadow-lg shadow-purple-500/70'
                }`}
              >
                {/* Enhanced glittering sparkles */}
                <div className="absolute top-1 right-2 w-1.5 h-1.5 bg-purple-300 rounded-full animate-bounce opacity-80 shadow-md shadow-purple-300/60" style={{ animationDelay: '0ms' }}></div>
                <div className="absolute top-1 left-2 w-1 h-1 bg-pink-400 rounded-full animate-bounce opacity-70 shadow-md shadow-pink-400/60" style={{ animationDelay: '100ms' }}></div>
                <div className="absolute bottom-1 right-4 w-1 h-1 bg-purple-400 rounded-full animate-bounce opacity-60 shadow-md shadow-purple-400/60" style={{ animationDelay: '200ms' }}></div>
                
                {/* Enhanced shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-300/50 via-pink-300/60 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-600 skew-x-12 transform-gpu rounded-2xl"></div>
                
                {/* Breathing glow layers */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/25 via-pink-400/30 to-purple-500/25 blur-lg opacity-70 transition-opacity duration-1000" style={{
                  animation: 'breathe 3s ease-in-out infinite'
                }}></div>
                
                <Download className={`h-5 w-5 transition-transform duration-300 group-hover/btn:scale-105 group-hover/btn:rotate-3 relative z-10 ${
                  isDarkMode ? 'text-purple-100' : 'text-white'
                }`} />
                <span className={`font-bold text-sm relative z-10 tracking-wide ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-purple-100 via-pink-100 to-purple-100 bg-clip-text text-transparent drop-shadow-lg'
                    : 'text-white font-bold drop-shadow-md'
                }`}>
                  Download Interview
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main layout - exact replica of interview UI */}
      <div className="flex h-screen pt-20">
        {/* Enhanced Conversation Sidebar */}
        <div className="w-[28rem]">
          <div className={`h-full backdrop-blur-xl border-r transition-all duration-500 shadow-2xl ${
            isDarkMode 
              ? 'bg-gray-800/30 border-gray-700/50 shadow-black/20' 
              : 'bg-white/70 border-white/20 shadow-indigo-500/10'
          }`}>
            <div className={`p-4 border-b backdrop-blur-sm ${
              isDarkMode ? 'border-gray-700/50 bg-gray-800/20' : 'border-white/20 bg-white/20'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`relative p-2 rounded-xl backdrop-blur-md border transition-all duration-500 hover:scale-105 ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-purple-600/10 border-blue-500/20' 
                    : 'bg-gradient-to-br from-indigo-50/80 via-purple-50/60 to-pink-50/80 border-indigo-200/30'
                }`}>
                  <div className={`absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full ${
                    isDarkMode ? 'bg-blue-400/40' : 'bg-indigo-400/40'
                  }`} />
                  <div className={`absolute bottom-0.5 left-0.5 w-1 h-1 rounded-full ${
                    isDarkMode ? 'bg-purple-400/40' : 'bg-purple-400/40'
                  }`} />
                  
                  <MessageSquare className={`h-5 w-5 ${
                    isDarkMode ? 'text-blue-400/70' : 'text-indigo-500/70'
                  }`} />
                </div>
                
                <div className="flex flex-col space-y-1">
                  <h3 className={`font-bold text-lg bg-gradient-to-r drop-shadow-lg transition-all duration-500 ${
                    isDarkMode 
                      ? 'from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent' 
                      : 'from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent'
                  }`}>
                    Conversation
                  </h3>
                  
                  <div className="flex space-x-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-blue-400/50' : 'bg-blue-400/70'}`}></div>
                    <div className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-indigo-400/50' : 'bg-indigo-400/70'}`}></div>
                    <div className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-purple-400/50' : 'bg-purple-400/70'}`}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden relative" style={{ height: 'calc(100vh - 220px)' }}>
              <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-5 ${
                isDarkMode ? 'bg-blue-500' : 'bg-indigo-500'
              }`} />
              <div className={`absolute bottom-0 left-0 w-24 h-24 rounded-full blur-2xl opacity-5 ${
                isDarkMode ? 'bg-purple-500' : 'bg-purple-500'
              }`} />
              
              <ConversationChat 
                messages={messages} 
                session={mockSession}
                isDarkMode={isDarkMode}
                onDownload={downloadInterviewData}
              />
            </div>
          </div>
        </div>

        {/* Back to Dashboard Card */}
        <div className="flex-shrink-0 w-48 flex flex-col items-center justify-start pt-8 px-4">
          <div className="group/card relative w-full overflow-hidden rounded-3xl backdrop-blur-2xl border-2 shadow-2xl transition-all duration-700 hover:scale-[1.12] hover:-translate-y-4 cursor-pointer">
            <div className={`absolute -inset-1 bg-gradient-to-r rounded-3xl blur-sm opacity-60 group-hover/card:opacity-100 transition duration-1000 ${
              isDarkMode 
                ? 'from-purple-600 via-pink-600 to-purple-600' 
                : 'from-purple-500 via-pink-500 to-purple-500'
            }`}></div>
            
            <div className={`absolute inset-0 bg-gradient-to-br opacity-70 transition-all duration-700 group-hover/card:opacity-90 rounded-3xl ${
              isDarkMode 
                ? 'from-gray-800/90 via-purple-800/60 to-gray-800/90' 
                : 'from-white/95 via-purple-50/85 to-white/95'
            }`}></div>
            
            <button
              onClick={handleBackToDashboard}
              className="relative w-full p-6 rounded-3xl transition-all duration-700"
            >
              <div className="relative z-10 text-center">
                <div className={`flex items-center justify-center space-x-2 mb-4 ${
                  isDarkMode ? 'text-purple-300' : 'text-purple-700'
                }`}>
                  <ChevronLeft className="w-6 h-6 group-hover/card:scale-125 group-hover/card:-translate-x-2 transition-all duration-500 drop-shadow-lg" />
                  <div className={`w-10 h-1 rounded-full transition-all duration-500 group-hover/card:w-16 shadow-lg ${
                    isDarkMode ? 'bg-purple-400/80 shadow-purple-400/40' : 'bg-purple-500/80 shadow-purple-500/40'
                  }`}></div>
                </div>
                
                <h3 className={`font-black text-xl mb-2 bg-gradient-to-r bg-clip-text text-transparent transition-all duration-500 group-hover/card:scale-110 drop-shadow-lg ${
                  isDarkMode 
                    ? 'from-purple-300 via-pink-300 to-purple-300' 
                    : 'from-purple-700 via-pink-700 to-purple-700'
                }`}>
                  Back to
                </h3>
                <p className={`text-base font-bold transition-all duration-500 group-hover/card:scale-105 ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-clip-text text-transparent' 
                    : 'bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-clip-text text-transparent'
                } drop-shadow-sm`}>
                  Dashboard
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="min-h-full flex flex-col">
            {/* Interview Summary Section - Styled like Evaluation */}
            <div className={`p-8 transition-all duration-500 ${
              isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50'
            }`}>
              <div className={`relative backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden border max-w-6xl mx-auto transition-all duration-700 ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-gray-800/60 via-gray-700/40 to-gray-800/60 border-gray-700/30' 
                  : 'bg-gradient-to-br from-white/80 via-white/70 to-white/80 border-gray-200/30'
              }`}>
                {/* Floating sparkles for main container */}
                <div className="absolute top-4 right-4 w-2 h-2 bg-indigo-400 rounded-full animate-bounce opacity-60" style={{ animationDelay: '0ms' }}></div>
                <div className="absolute top-12 right-16 w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce opacity-50" style={{ animationDelay: '150ms' }}></div>
                <div className="absolute top-8 left-6 w-1 h-1 bg-indigo-300 rounded-full animate-bounce opacity-40" style={{ animationDelay: '300ms' }}></div>
                <div className="absolute top-20 left-12 w-2.5 h-2.5 bg-purple-300 rounded-full animate-bounce opacity-55" style={{ animationDelay: '450ms' }}></div>
                
                {/* Floating decorative rings */}
                <div className="absolute -top-8 -right-8 w-24 h-24 border border-indigo-300/20 rounded-full opacity-30 transition-transform duration-500 hover:scale-110"></div>
                <div className="absolute -bottom-12 -left-12 w-32 h-32 border border-purple-300/15 rounded-full opacity-25 transition-transform duration-700 hover:scale-125"></div>
                
                {/* Shimmer effect */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-indigo-200/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-1000 skew-x-12 transform-gpu"></div>
                
                {/* Elegant Header */}
                <div className={`relative p-8 border-b ${
                  isDarkMode 
                    ? 'border-gray-700/30 bg-gradient-to-r from-slate-800/50 via-gray-800/50 to-slate-800/50' 
                    : 'border-gray-200/30 bg-gradient-to-r from-slate-50/80 via-white/80 to-slate-50/80'
                }`}>
                  <div className="text-center">
                    <h2 className={`text-4xl font-black mb-4 bg-gradient-to-r bg-clip-text text-transparent drop-shadow-lg ${
                      isDarkMode 
                        ? 'from-blue-400 via-indigo-400 to-purple-400' 
                        : 'from-indigo-600 via-purple-600 to-pink-600'
                    }`}>
                      Interview Summary
                    </h2>
                    <p className="text-lg bg-gradient-to-r from-gray-600 via-gray-500 to-gray-600 bg-clip-text text-transparent font-medium">
                      Comprehensive interview session overview
                    </p>
                  </div>
                </div>
                
                                 {/* Enhanced Summary Stats with Glass Effect */}
                 <div className="p-8">
                   {/* Status Card - Prominent Position */}
                   <div className={`relative p-6 rounded-2xl backdrop-blur-2xl border shadow-lg transition-all duration-300 hover:scale-[1.005] group mb-8 ${
                     interviewData.participant_interview_info.status === 'Completed'
                       ? isDarkMode 
                         ? 'bg-gradient-to-br from-emerald-800/60 via-emerald-700/40 to-emerald-800/60 border-emerald-500/30 shadow-emerald-500/20' 
                         : 'bg-gradient-to-br from-emerald-50/80 via-emerald-100/70 to-emerald-50/80 border-emerald-200/60 shadow-emerald-200/50'
                       : interviewData.participant_interview_info.status === 'In Progress'
                         ? isDarkMode 
                           ? 'bg-gradient-to-br from-blue-800/60 via-blue-700/40 to-blue-800/60 border-blue-500/30 shadow-blue-500/20' 
                           : 'bg-gradient-to-br from-blue-50/80 via-blue-100/70 to-blue-50/80 border-blue-200/60 shadow-blue-200/50'
                         : isDarkMode 
                           ? 'bg-gradient-to-br from-amber-800/60 via-amber-700/40 to-amber-800/60 border-amber-500/30 shadow-amber-500/20' 
                           : 'bg-gradient-to-br from-amber-50/80 via-amber-100/70 to-amber-50/80 border-amber-200/60 shadow-amber-200/50'
                   }`}>
                     {/* Floating sparkles */}
                     <div className={`absolute top-2 right-2 w-1.5 h-1.5 ${
                       interviewData.participant_interview_info.status === 'Completed' ? 'bg-emerald-400' : 
                       interviewData.participant_interview_info.status === 'In Progress' ? 'bg-blue-400' : 'bg-amber-400'
                     } rounded-full animate-bounce opacity-60`} style={{ animationDelay: '0ms' }}></div>
                     <div className={`absolute top-3 right-6 w-1 h-1 ${
                       interviewData.participant_interview_info.status === 'Completed' ? 'bg-emerald-300' : 
                       interviewData.participant_interview_info.status === 'In Progress' ? 'bg-blue-300' : 'bg-amber-300'
                     } rounded-full animate-bounce opacity-50`} style={{ animationDelay: '150ms' }}></div>
                     <div className={`absolute top-5 left-3 w-1.5 h-1.5 ${
                       interviewData.participant_interview_info.status === 'Completed' ? 'bg-emerald-500' : 
                       interviewData.participant_interview_info.status === 'In Progress' ? 'bg-blue-500' : 'bg-amber-500'
                     } rounded-full animate-bounce opacity-40`} style={{ animationDelay: '300ms' }}></div>
                     <div className={`absolute top-1 left-8 w-1 h-1 ${
                       interviewData.participant_interview_info.status === 'Completed' ? 'bg-emerald-400' : 
                       interviewData.participant_interview_info.status === 'In Progress' ? 'bg-blue-400' : 'bg-amber-400'
                     } rounded-full animate-bounce opacity-55`} style={{ animationDelay: '450ms' }}></div>
                     
                     {/* Floating rings */}
                     <div className={`absolute -top-4 -right-4 w-12 h-12 border ${
                       interviewData.participant_interview_info.status === 'Completed' ? 'border-emerald-300/20' : 
                       interviewData.participant_interview_info.status === 'In Progress' ? 'border-blue-300/20' : 'border-amber-300/20'
                     } rounded-full opacity-30 transition-transform duration-500 group-hover:scale-110`}></div>
                     
                     {/* Shimmer effect */}
                     <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${
                       interviewData.participant_interview_info.status === 'Completed' ? 'via-emerald-200/20' : 
                       interviewData.participant_interview_info.status === 'In Progress' ? 'via-blue-200/20' : 'via-amber-200/20'
                     } to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 skew-x-12 transform-gpu rounded-2xl`}></div>
                     
                     <div className="relative text-center">
                       <h3 className={`text-2xl font-black mb-3 ${
                         interviewData.participant_interview_info.status === 'Completed'
                           ? isDarkMode ? 'text-emerald-300' : 'text-emerald-700'
                           : interviewData.participant_interview_info.status === 'In Progress'
                             ? isDarkMode ? 'text-blue-300' : 'text-blue-700'
                             : isDarkMode ? 'text-amber-300' : 'text-amber-700'
                       }`}>
                         Interview Status
                       </h3>
                       <div className={`text-3xl font-bold mb-2 ${
                         interviewData.participant_interview_info.status === 'Completed'
                           ? isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                           : interviewData.participant_interview_info.status === 'In Progress'
                             ? isDarkMode ? 'text-blue-400' : 'text-blue-600'
                             : isDarkMode ? 'text-amber-400' : 'text-amber-600'
                       }`}>
                         {interviewData.participant_interview_info.status === 'Completed' ? '✅' : 
                          interviewData.participant_interview_info.status === 'In Progress' ? '🔄' : '⚠️'} {interviewData.participant_interview_info.status}
                       </div>
                       <p className={`text-sm font-medium ${
                         isDarkMode ? 'text-gray-400' : 'text-gray-600'
                       }`}>
                         {interviewData.participant_interview_info.status === 'Completed' ? 'Interview completed successfully' :
                          interviewData.participant_interview_info.status === 'In Progress' ? 'Interview in progress' :
                          interviewData.participant_interview_info.status === 'Paused' ? 'Interview paused' :
                          interviewData.participant_interview_info.status === 'Abandoned' ? 'Study changed' :
                          interviewData.participant_interview_info.status === 'Interrupted' ? 'Page refreshed' :
                          interviewData.participant_interview_info.status === 'Incomplete' ? 'Consent not given' :
                          'Interview status'}
                       </p>
                     </div>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Study Card */}
                    <div className={`relative p-6 rounded-xl backdrop-blur-2xl border transition-all duration-300 hover:scale-[1.02] shadow-lg group ${
                      isDarkMode 
                        ? 'bg-gradient-to-br from-blue-800/60 via-blue-700/40 to-blue-800/60 border-blue-500/30 shadow-blue-500/20' 
                        : 'bg-gradient-to-br from-blue-50/80 via-blue-100/70 to-blue-50/80 border-blue-200/60 shadow-blue-200/50'
                    }`}>
                      {/* Floating sparkles */}
                      <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce opacity-60" style={{ animationDelay: '0ms' }}></div>
                      <div className="absolute top-3 right-6 w-1 h-1 bg-blue-300 rounded-full animate-bounce opacity-50" style={{ animationDelay: '150ms' }}></div>
                      <div className="absolute top-5 left-3 w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce opacity-40" style={{ animationDelay: '300ms' }}></div>
                      <div className="absolute top-1 left-8 w-1 h-1 bg-blue-400 rounded-full animate-bounce opacity-55" style={{ animationDelay: '450ms' }}></div>
                      
                      {/* Floating rings */}
                      <div className="absolute -top-4 -right-4 w-12 h-12 border border-blue-300/20 rounded-full opacity-30 transition-transform duration-500 group-hover:scale-110"></div>
                      
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-200/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 skew-x-12 transform-gpu rounded-xl"></div>
                      
                      <div className="relative text-center">
                        <div className="font-bold bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 bg-clip-text text-transparent mb-2 text-xs uppercase tracking-wider">
                          Study
                        </div>
                        <div className="text-lg font-black bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 bg-clip-text text-transparent">
                          {interviewData.participant_interview_info.study_name}
                        </div>
                      </div>
                    </div>
                    
                    {/* Messages Card */}
                    <div className={`relative p-6 rounded-xl backdrop-blur-2xl border transition-all duration-300 hover:scale-[1.02] shadow-lg group ${
                      isDarkMode 
                        ? 'bg-gradient-to-br from-purple-800/60 via-purple-700/40 to-purple-800/60 border-purple-500/30 shadow-purple-500/20' 
                        : 'bg-gradient-to-br from-purple-50/80 via-purple-100/70 to-purple-50/80 border-purple-200/60 shadow-purple-200/50'
                    }`}>
                      {/* Floating sparkles */}
                      <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce opacity-60" style={{ animationDelay: '0ms' }}></div>
                      <div className="absolute top-3 right-6 w-1 h-1 bg-purple-300 rounded-full animate-bounce opacity-50" style={{ animationDelay: '150ms' }}></div>
                      <div className="absolute top-5 left-3 w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce opacity-40" style={{ animationDelay: '300ms' }}></div>
                      <div className="absolute top-1 left-8 w-1 h-1 bg-purple-400 rounded-full animate-bounce opacity-55" style={{ animationDelay: '450ms' }}></div>
                      
                      {/* Floating rings */}
                      <div className="absolute -top-4 -right-4 w-12 h-12 border border-purple-300/20 rounded-full opacity-30 transition-transform duration-500 group-hover:scale-110"></div>
                      
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-200/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 skew-x-12 transform-gpu rounded-xl"></div>
                      
                      <div className="relative text-center">
                        <div className="font-bold bg-gradient-to-r from-purple-500 via-purple-400 to-purple-500 bg-clip-text text-transparent mb-2 text-xs uppercase tracking-wider">
                          Messages
                        </div>
                        <div className="text-lg font-black bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 bg-clip-text text-transparent">
                          {messages.length} total
                        </div>
                      </div>
                    </div>
                    
                    {/* Date Card */}
                    <div className={`relative p-6 rounded-xl backdrop-blur-2xl border transition-all duration-300 hover:scale-[1.02] shadow-lg group ${
                      isDarkMode 
                        ? 'bg-gradient-to-br from-amber-800/60 via-amber-700/40 to-amber-800/60 border-amber-500/30 shadow-amber-500/20' 
                        : 'bg-gradient-to-br from-amber-50/80 via-amber-100/70 to-amber-50/80 border-amber-200/60 shadow-amber-200/50'
                    }`}>
                      {/* Floating sparkles */}
                      <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce opacity-60" style={{ animationDelay: '0ms' }}></div>
                      <div className="absolute top-3 right-6 w-1 h-1 bg-amber-300 rounded-full animate-bounce opacity-50" style={{ animationDelay: '150ms' }}></div>
                      <div className="absolute top-5 left-3 w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce opacity-40" style={{ animationDelay: '300ms' }}></div>
                      <div className="absolute top-1 left-8 w-1 h-1 bg-amber-400 rounded-full animate-bounce opacity-55" style={{ animationDelay: '450ms' }}></div>
                      
                      {/* Floating rings */}
                      <div className="absolute -top-4 -right-4 w-12 h-12 border border-amber-300/20 rounded-full opacity-30 transition-transform duration-500 group-hover:scale-110"></div>
                      
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-200/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 skew-x-12 transform-gpu rounded-xl"></div>
                      
                                             <div className="relative text-center">
                         <div className="font-bold bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 bg-clip-text text-transparent mb-2 text-xs uppercase tracking-wider">
                           Date and Time
                         </div>
                         <div className="text-lg font-black bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 bg-clip-text text-transparent">
                           {new Date(interviewData.participant_interview_info.date_and_time).toLocaleString()}
                         </div>
                       </div>
                    </div>
                  </div>
                  
                  {/* Eligibility Section - If available */}
                  {interviewData.participant_interview_info.Eligibility && (
                    <div className={`relative p-6 rounded-2xl backdrop-blur-2xl border shadow-lg transition-all duration-300 hover:scale-[1.005] group ${
                      interviewData.participant_interview_info.Eligibility.eligible
                        ? isDarkMode 
                          ? 'bg-gradient-to-br from-emerald-800/60 via-emerald-700/40 to-emerald-800/60 border-emerald-500/30 shadow-emerald-500/20' 
                          : 'bg-gradient-to-br from-emerald-50/80 via-emerald-100/70 to-emerald-50/80 border-emerald-200/60 shadow-emerald-200/50'
                        : isDarkMode 
                          ? 'bg-gradient-to-br from-red-800/60 via-red-700/40 to-red-800/60 border-red-500/30 shadow-red-500/20' 
                          : 'bg-gradient-to-br from-red-50/80 via-red-100/70 to-red-50/80 border-red-200/60 shadow-red-200/50'
                    }`}>
                      {/* Floating sparkles */}
                      <div className={`absolute top-2 right-2 w-1.5 h-1.5 ${
                        interviewData.participant_interview_info.Eligibility.eligible ? 'bg-emerald-400' : 'bg-red-400'
                      } rounded-full animate-bounce opacity-60`} style={{ animationDelay: '0ms' }}></div>
                      <div className={`absolute top-3 right-6 w-1 h-1 ${
                        interviewData.participant_interview_info.Eligibility.eligible ? 'bg-emerald-300' : 'bg-red-300'
                      } rounded-full animate-bounce opacity-50`} style={{ animationDelay: '150ms' }}></div>
                      <div className={`absolute top-5 left-3 w-1.5 h-1.5 ${
                        interviewData.participant_interview_info.Eligibility.eligible ? 'bg-emerald-500' : 'bg-red-500'
                      } rounded-full animate-bounce opacity-40`} style={{ animationDelay: '300ms' }}></div>
                      <div className={`absolute top-1 left-8 w-1 h-1 ${
                        interviewData.participant_interview_info.Eligibility.eligible ? 'bg-emerald-400' : 'bg-red-400'
                      } rounded-full animate-bounce opacity-55`} style={{ animationDelay: '450ms' }}></div>
                      
                      {/* Floating rings */}
                      <div className={`absolute -top-4 -right-4 w-12 h-12 border ${
                        interviewData.participant_interview_info.Eligibility.eligible ? 'border-emerald-300/20' : 'border-red-300/20'
                      } rounded-full opacity-30 transition-transform duration-500 group-hover:scale-110`}></div>
                      
                      {/* Shimmer effect */}
                      <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${
                        interviewData.participant_interview_info.Eligibility.eligible ? 'via-emerald-200/20' : 'via-red-200/20'
                      } to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 skew-x-12 transform-gpu rounded-2xl`}></div>
                      
                      <div className="relative text-center">
                        <h3 className={`text-2xl font-black mb-3 ${
                          interviewData.participant_interview_info.Eligibility.eligible
                            ? isDarkMode ? 'text-emerald-300' : 'text-emerald-700'
                            : isDarkMode ? 'text-red-300' : 'text-red-700'
                        }`}>
                          Eligibility: {interviewData.participant_interview_info.Eligibility.eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
                        </h3>
                        <div className={`text-5xl font-bold mb-2 ${
                          interviewData.participant_interview_info.Eligibility.score >= 70 
                            ? isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                            : interviewData.participant_interview_info.Eligibility.score >= 50
                              ? isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                              : isDarkMode ? 'text-red-400' : 'text-red-600'
                        }`}>
                          {interviewData.participant_interview_info.Eligibility.score}%
                        </div>
                        <p className={`text-sm font-medium ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Compatibility Score
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {eligibilityResult && (
              <div className="flex-shrink-0">
                <EligibilityResults 
                  eligibilityResult={eligibilityResult}
                  session={mockSession}
                  isDarkMode={isDarkMode}
                  onDownload={downloadInterviewData}
                  onRestart={() => {}}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewViewer; 