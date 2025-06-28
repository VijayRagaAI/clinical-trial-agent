import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, FileText, TrendingUp, Download, Target, Brain, Zap } from 'lucide-react';

// Add breathing animation styles
const breathingStyles = `
  @keyframes breathe {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.8; }
  }
`;
import { EligibilityResult, SessionData } from '../types/interview';

interface EligibilityResultsProps {
  eligibilityResult: EligibilityResult;
  session: SessionData | null;
  isDarkMode: boolean;
  onDownload: () => void;
  onRestart: () => void;
}

export const EligibilityResults: React.FC<EligibilityResultsProps> = ({ 
  eligibilityResult, 
  session,
  isDarkMode, 
  onDownload, 
  onRestart 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div 
      data-results-section
      className={`p-6 transition-all duration-500 ${
        isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50'
      }`}>
      <style>{breathingStyles}</style>
      <div className={`relative backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden border max-w-6xl mx-auto transition-all duration-700 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      } ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-800/60 via-gray-700/40 to-gray-800/60 border-gray-700/30' 
          : 'bg-gradient-to-br from-white/80 via-white/70 to-white/80 border-gray-200/30'
      }`}>
        {/* Floating sparkles for main container */}
        <div className="absolute top-4 right-4 w-2 h-2 bg-emerald-400 rounded-full animate-bounce opacity-60" style={{ animationDelay: '0ms' }}></div>
        <div className="absolute top-12 right-16 w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce opacity-50" style={{ animationDelay: '150ms' }}></div>
        <div className="absolute top-8 left-6 w-1 h-1 bg-emerald-300 rounded-full animate-bounce opacity-40" style={{ animationDelay: '300ms' }}></div>
        <div className="absolute top-20 left-12 w-2.5 h-2.5 bg-teal-300 rounded-full animate-bounce opacity-55" style={{ animationDelay: '450ms' }}></div>
        
        {/* Floating decorative rings */}
        <div className="absolute -top-8 -right-8 w-24 h-24 border border-emerald-300/20 rounded-full opacity-30 transition-transform duration-500 hover:scale-110"></div>
        <div className="absolute -bottom-12 -left-12 w-32 h-32 border border-teal-300/15 rounded-full opacity-25 transition-transform duration-700 hover:scale-125"></div>
        
        {/* Shimmer effect */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-emerald-200/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-1000 skew-x-12 transform-gpu"></div>
        {/* Elegant Header */}
        <div className={`relative p-8 border-b ${
          isDarkMode 
            ? 'border-gray-700/30 bg-gradient-to-r from-slate-800/50 via-gray-800/50 to-slate-800/50' 
            : 'border-gray-200/30 bg-gradient-to-r from-slate-50/80 via-white/80 to-slate-50/80'
        }`}>
          <div className="flex items-center justify-center mb-6">
            <div className={`relative p-4 rounded-2xl backdrop-blur-sm transition-all duration-500 ${
              eligibilityResult.eligible 
                ? isDarkMode 
                  ? 'bg-emerald-600/20 border border-emerald-500/30' 
                  : 'bg-emerald-100/70 border border-emerald-200/50'
                : isDarkMode
                  ? 'bg-orange-600/20 border border-orange-500/30'
                  : 'bg-orange-100/70 border border-orange-200/50'
            }`}>
              {eligibilityResult.eligible ? (
                <Target className={`h-12 w-12 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
              ) : (
                <Brain className={`h-12 w-12 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
              )}
              
              {/* Subtle glow effect */}
              <div className={`absolute inset-0 rounded-2xl blur-md opacity-30 ${
                eligibilityResult.eligible ? 'bg-emerald-400' : 'bg-orange-400'
              }`} />
            </div>
          </div>
          
          <div className="text-center">
            <h2 className="text-4xl font-black mb-4 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent drop-shadow-lg">
              Clinical Trial Assessment
            </h2>
            <p className="text-lg bg-gradient-to-r from-gray-600 via-gray-500 to-gray-600 bg-clip-text text-transparent font-medium">
              Comprehensive eligibility evaluation results
            </p>
            
            {/* Participant info */}
            <div className="flex items-center justify-center space-x-6 mt-6">
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-full backdrop-blur-sm ${
                isDarkMode ? 'bg-slate-700/50 border border-slate-600/30' : 'bg-slate-100/70 border border-slate-200/50'
              }`}>
                <span className="text-sm">Participant:</span>
                <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  {eligibilityResult.participant_id}
                </span>
              </div>
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-full backdrop-blur-sm ${
                isDarkMode ? 'bg-slate-700/50 border border-slate-600/30' : 'bg-slate-100/70 border border-slate-200/50'
              }`}>
                <span className="text-sm">Evaluated:</span>
                <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  {new Date(eligibilityResult.evaluation_timestamp).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
      </div>
      
      {/* Elegant Overall Result */}
      <div className={`p-8 border-b ${
        isDarkMode ? 'border-gray-700/30' : 'border-gray-200/30'
      }`}>
        <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
            {/* Result Status */}
            <div className="flex items-center space-x-6">
              <div className={`relative p-6 rounded-2xl backdrop-blur-sm transition-all duration-500 ${
                eligibilityResult.eligible 
                  ? isDarkMode 
                    ? 'bg-emerald-600/10 border border-emerald-500/20' 
                    : 'bg-emerald-50/80 border border-emerald-200/50'
                  : isDarkMode
                    ? 'bg-amber-600/10 border border-amber-500/20'
                    : 'bg-amber-50/80 border border-amber-200/50'
              }`}>
            {eligibilityResult.eligible ? (
                  <CheckCircle className={`h-12 w-12 ${
                    isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                  }`} />
            ) : (
                  <Zap className={`h-12 w-12 ${
                    isDarkMode ? 'text-amber-400' : 'text-amber-600'
                  }`} />
            )}
              </div>
              
            <div>
                <h3 className={`text-3xl font-bold mb-2 ${
                  eligibilityResult.eligible 
                    ? isDarkMode
                      ? 'text-emerald-300'
                      : 'text-emerald-700'
                    : isDarkMode
                      ? 'text-amber-300'
                      : 'text-amber-700'
                }`}>
                  {eligibilityResult.eligible ? 'ELIGIBLE' : 'ASSESSMENT COMPLETE'}
                </h3>
                <p className={`text-lg ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                {eligibilityResult.eligible 
                    ? 'Qualified for the next phase of screening' 
                    : 'Thank you for participating in our assessment'
                }
              </p>
            </div>
          </div>

            {/* Score Display */}
            <div className="text-center">
              <div className={`relative p-6 rounded-2xl backdrop-blur-sm ${
                isDarkMode ? 'bg-slate-700/30 border border-slate-600/30' : 'bg-slate-100/50 border border-slate-200/50'
              }`}>
                <div className={`text-5xl font-bold mb-2 ${
                  eligibilityResult.score >= 70 
                    ? isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                    : eligibilityResult.score >= 50
                      ? isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                      : isDarkMode ? 'text-red-400' : 'text-red-600'
            }`}>
              {eligibilityResult.score}%
                </div>
                <p className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Compatibility Score
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Criteria Analysis */}
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center space-x-3 mb-8">
            <FileText className="h-6 w-6 text-indigo-500" />
            <h4 className="text-2xl font-black bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
              Detailed Assessment
            </h4>
          </div>
          
          {/* Enhanced Summary Stats with Glass Effect */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className={`relative p-6 rounded-xl backdrop-blur-2xl border transition-all duration-300 hover:scale-[1.02] shadow-lg group ${
              isDarkMode 
                ? 'bg-gradient-to-br from-gray-800/60 via-gray-700/40 to-gray-800/60 border-slate-600/40 shadow-black/20' 
                : 'bg-gradient-to-br from-white/80 via-white/70 to-white/80 border-white/40 shadow-slate-200/50'
            }`}>
              {/* Floating sparkles */}
              <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce opacity-60" style={{ animationDelay: '0ms' }}></div>
              <div className="absolute top-3 right-6 w-1 h-1 bg-slate-300 rounded-full animate-bounce opacity-50" style={{ animationDelay: '150ms' }}></div>
              <div className="absolute top-5 left-3 w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce opacity-40" style={{ animationDelay: '300ms' }}></div>
              <div className="absolute top-1 left-8 w-1 h-1 bg-slate-400 rounded-full animate-bounce opacity-55" style={{ animationDelay: '450ms' }}></div>
              
              {/* Floating rings */}
              <div className="absolute -top-4 -right-4 w-12 h-12 border border-slate-300/20 rounded-full opacity-30 transition-transform duration-500 group-hover:scale-110"></div>
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-200/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 skew-x-12 transform-gpu rounded-xl"></div>
              
              <div className="relative">
                <div className="text-3xl font-black mb-2 bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600 bg-clip-text text-transparent">
              {eligibilityResult.criteria_met.length}
              </div>
                <div className="font-bold bg-gradient-to-r from-slate-500 via-slate-400 to-slate-500 bg-clip-text text-transparent">
                Total Criteria
                </div>
              </div>
            </div>
            
            <div className={`relative p-6 rounded-xl backdrop-blur-2xl border transition-all duration-300 hover:scale-[1.02] shadow-lg group ${
              isDarkMode 
                ? 'bg-gradient-to-br from-emerald-800/60 via-emerald-700/40 to-emerald-800/60 border-emerald-500/30 shadow-emerald-500/20' 
                : 'bg-gradient-to-br from-emerald-50/80 via-emerald-100/70 to-emerald-50/80 border-emerald-200/60 shadow-emerald-200/50'
            }`}>
              {/* Floating sparkles */}
              <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce opacity-60" style={{ animationDelay: '0ms' }}></div>
              <div className="absolute top-3 right-6 w-1 h-1 bg-emerald-300 rounded-full animate-bounce opacity-50" style={{ animationDelay: '150ms' }}></div>
              <div className="absolute top-5 left-3 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce opacity-40" style={{ animationDelay: '300ms' }}></div>
              <div className="absolute top-1 left-8 w-1 h-1 bg-emerald-400 rounded-full animate-bounce opacity-55" style={{ animationDelay: '450ms' }}></div>
              
              {/* Floating rings */}
              <div className="absolute -top-4 -right-4 w-12 h-12 border border-emerald-300/20 rounded-full opacity-30 transition-transform duration-500 group-hover:scale-110"></div>
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-200/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 skew-x-12 transform-gpu rounded-xl"></div>
              
              <div className="relative">
                <div className="text-3xl font-black mb-2 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 bg-clip-text text-transparent">
                {eligibilityResult.criteria_met.filter((c: any) => c.meets_criteria).length}
              </div>
                <div className="font-bold bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 bg-clip-text text-transparent">
                Criteria Met
                </div>
          </div>
            </div>
            
            <div className={`relative p-6 rounded-xl backdrop-blur-2xl border transition-all duration-300 hover:scale-[1.02] shadow-lg group ${
              isDarkMode 
                ? 'bg-gradient-to-br from-red-800/60 via-red-700/40 to-red-800/60 border-red-500/30 shadow-red-500/20' 
                : 'bg-gradient-to-br from-red-50/80 via-red-100/70 to-red-50/80 border-red-200/60 shadow-red-200/50'
            }`}>
              {/* Floating sparkles */}
              <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce opacity-60" style={{ animationDelay: '0ms' }}></div>
              <div className="absolute top-3 right-6 w-1 h-1 bg-red-300 rounded-full animate-bounce opacity-50" style={{ animationDelay: '150ms' }}></div>
              <div className="absolute top-5 left-3 w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce opacity-40" style={{ animationDelay: '300ms' }}></div>
              <div className="absolute top-1 left-8 w-1 h-1 bg-red-400 rounded-full animate-bounce opacity-55" style={{ animationDelay: '450ms' }}></div>
              
              {/* Floating rings */}
              <div className="absolute -top-4 -right-4 w-12 h-12 border border-red-300/20 rounded-full opacity-30 transition-transform duration-500 group-hover:scale-110"></div>
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-200/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 skew-x-12 transform-gpu rounded-xl"></div>
              
              <div className="relative">
                <div className="text-3xl font-black mb-2 bg-gradient-to-r from-red-600 via-red-500 to-red-600 bg-clip-text text-transparent">
                {eligibilityResult.criteria_met.filter((c: any) => !c.meets_criteria).length}
              </div>
                <div className="font-bold bg-gradient-to-r from-red-500 via-red-400 to-red-500 bg-clip-text text-transparent">
                Criteria UnMet
                </div>
          </div>
          </div>
        </div>

        {/* Enhanced Card-based Criteria Display */}
        <div className="space-y-3">
              {eligibilityResult.criteria_met.map((criterion: any, index: number) => (
            <div key={index} className={`relative backdrop-blur-2xl rounded-xl p-4 border transition-all duration-300 hover:scale-[1.005] shadow-md group ${
              criterion.meets_criteria 
                ? isDarkMode 
                  ? 'bg-gradient-to-br from-emerald-800/60 via-emerald-700/40 to-emerald-800/60 border-emerald-500/30 shadow-emerald-500/20' 
                  : 'bg-gradient-to-br from-emerald-50/80 via-emerald-100/70 to-emerald-50/80 border-emerald-200/60 shadow-emerald-200/50'
                : isDarkMode
                  ? 'bg-gradient-to-br from-red-800/60 via-red-700/40 to-red-800/60 border-red-500/30 shadow-red-500/20'
                  : 'bg-gradient-to-br from-red-50/80 via-red-100/70 to-red-50/80 border-red-200/60 shadow-red-200/50'
            }`}>
              {/* Floating sparkles */}
              <div className={`absolute top-2 right-2 w-1.5 h-1.5 ${criterion.meets_criteria ? 'bg-emerald-400' : 'bg-red-400'} rounded-full animate-bounce opacity-60`} style={{ animationDelay: '0ms' }}></div>
              <div className={`absolute top-3 right-6 w-1 h-1 ${criterion.meets_criteria ? 'bg-emerald-300' : 'bg-red-300'} rounded-full animate-bounce opacity-50`} style={{ animationDelay: '150ms' }}></div>
              <div className={`absolute top-5 left-3 w-1.5 h-1.5 ${criterion.meets_criteria ? 'bg-emerald-500' : 'bg-red-500'} rounded-full animate-bounce opacity-40`} style={{ animationDelay: '300ms' }}></div>
              <div className={`absolute top-1 left-8 w-1 h-1 ${criterion.meets_criteria ? 'bg-emerald-400' : 'bg-red-400'} rounded-full animate-bounce opacity-55`} style={{ animationDelay: '450ms' }}></div>
              
              {/* Floating rings */}
              <div className={`absolute -top-4 -right-4 w-12 h-12 border ${criterion.meets_criteria ? 'border-emerald-300/20' : 'border-red-300/20'} rounded-full opacity-30 transition-transform duration-500 group-hover:scale-110`}></div>
              
              {/* Shimmer effect */}
              <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${criterion.meets_criteria ? 'via-emerald-200/20' : 'via-red-200/20'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 skew-x-12 transform-gpu rounded-xl`}></div>
              <div className="relative flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-xl ${
                    criterion.meets_criteria 
                      ? isDarkMode ? 'bg-emerald-600/20' : 'bg-emerald-500/20'
                      : isDarkMode ? 'bg-red-600/20' : 'bg-red-500/20'
                  }`}>
                      {criterion.meets_criteria ? (
                      <CheckCircle className={`h-5 w-5 ${
                        isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                      }`} />
                      ) : (
                      <AlertCircle className={`h-5 w-5 ${
                        isDarkMode ? 'text-red-400' : 'text-red-600'
                      }`} />
                      )}
                    </div>
                  
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                      criterion.priority === 'high' 
                      ? isDarkMode 
                        ? 'bg-gradient-to-r from-red-600/20 to-red-700/20 text-red-300 border border-red-500/30'
                        : 'bg-red-100 text-red-800 border border-red-200'
                      : criterion.priority === 'medium'
                        ? isDarkMode
                          ? 'bg-gradient-to-r from-yellow-600/20 to-yellow-700/20 text-yellow-300 border border-yellow-500/30'
                          : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        : isDarkMode
                          ? 'bg-gradient-to-r from-green-600/20 to-green-700/20 text-green-300 border border-green-500/30'
                          : 'bg-green-100 text-green-800 border border-green-200'
                  }`}>
                    {criterion.priority === 'high' ? 'High Priority' : criterion.priority === 'medium' ? 'Medium Priority' : 'Low Priority'}
                    </span>
                </div>
                <div className="flex items-center space-x-2">
                  {/* Criteria Status */}
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                    criterion.meets_criteria 
                      ? isDarkMode 
                        ? 'bg-gradient-to-r from-emerald-600/20 to-emerald-700/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : isDarkMode
                        ? 'bg-gradient-to-r from-red-600/20 to-red-700/20 text-red-300 border border-red-500/30'
                        : 'bg-red-100 text-red-800 border border-red-200'
                  }`}>
                    {criterion.meets_criteria ? 'Criteria Met' : 'Criteria UnMet'}
                  </span>
                  
                  <div className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm ${
                  criterion.confidence >= 0.8 
                      ? isDarkMode
                        ? 'bg-gradient-to-r from-emerald-600/20 to-emerald-700/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : criterion.confidence >= 0.6 
                        ? isDarkMode
                          ? 'bg-gradient-to-r from-yellow-600/20 to-yellow-700/20 text-yellow-300 border border-yellow-500/30'
                          : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        : isDarkMode
                          ? 'bg-gradient-to-r from-red-600/20 to-red-700/20 text-red-300 border border-red-500/30'
                          : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  {Math.round(criterion.confidence * 100)}% confidence
                  </div>
                </div>
              </div>
              
              <h6 className={`relative font-bold mb-2 text-sm ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 bg-clip-text text-transparent' 
                  : 'text-gray-900'
              }`}>
                      {criterion.criteria_text}
              </h6>
              
              <div className="relative grid md:grid-cols-3 gap-3">
                <div>
                  <p className={`text-sm font-bold mb-1 ${
                    isDarkMode 
                      ? 'bg-gradient-to-r from-blue-400 via-blue-300 to-blue-400 bg-clip-text text-transparent' 
                      : 'text-blue-700'
                  }`}>
                    Question Asked:
                  </p>
                  <p className={`text-sm font-medium rounded-lg p-2 backdrop-blur-sm border ${
                    isDarkMode 
                      ? 'bg-gradient-to-r from-blue-700/20 to-blue-800/20 border-blue-500/30 text-blue-300'
                      : 'bg-blue-50/80 border-blue-200/60 text-blue-800'
                  }`}>
                      {criterion.criteria_question || "Question not available"}
                  </p>
                </div>
                <div>
                  <p className={`text-sm font-bold mb-1 ${
                    isDarkMode 
                      ? 'bg-gradient-to-r from-purple-400 via-purple-300 to-purple-400 bg-clip-text text-transparent' 
                      : 'text-purple-700'
                  }`}>
                    Your Response:
                  </p>
                  <p className={`text-sm italic font-medium rounded-lg p-2 backdrop-blur-sm border ${
                    isDarkMode 
                      ? 'bg-gradient-to-r from-purple-700/20 to-purple-800/20 border-purple-500/30 text-purple-300'
                      : 'bg-purple-50/80 border-purple-200/60 text-purple-800'
                  }`}>
                      "{criterion.participant_response}"
                  </p>
                    </div>
                <div>
                  <p className={`text-sm font-bold mb-1 ${
                    isDarkMode 
                      ? 'bg-gradient-to-r from-indigo-400 via-indigo-300 to-indigo-400 bg-clip-text text-transparent' 
                      : 'text-indigo-700'
                  }`}>
                    Assessment:
                  </p>
                  <p className={`text-sm font-medium rounded-lg p-2 backdrop-blur-sm border ${
                    isDarkMode 
                      ? 'bg-gradient-to-r from-indigo-700/20 to-indigo-800/20 border-indigo-500/30 text-indigo-300'
                      : 'bg-indigo-50/80 border-indigo-200/60 text-indigo-800'
                  }`}>
                      {criterion.reasoning}
                  </p>
                        </div>
                      </div>
                    </div>
              ))}
        </div>

        {/* 📊 Priority Breakdown Card */}
        <div className={`relative mt-8 p-6 rounded-2xl backdrop-blur-2xl border shadow-lg group ${
          isDarkMode 
            ? 'bg-gradient-to-br from-slate-800/60 via-slate-700/40 to-slate-800/60 border-slate-600/40' 
            : 'bg-gradient-to-br from-white/80 via-white/70 to-white/80 border-slate-200/50'
        }`}>
          {/* Floating sparkles */}
          <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce opacity-60" style={{ animationDelay: '0ms' }}></div>
          <div className="absolute top-3 right-6 w-1 h-1 bg-indigo-400 rounded-full animate-bounce opacity-50" style={{ animationDelay: '150ms' }}></div>
          <div className="absolute top-5 left-3 w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce opacity-40" style={{ animationDelay: '300ms' }}></div>
          <div className="absolute top-1 left-8 w-1 h-1 bg-blue-300 rounded-full animate-bounce opacity-55" style={{ animationDelay: '450ms' }}></div>
          
          {/* Floating ring */}
          <div className="absolute -top-4 -right-4 w-16 h-16 border border-blue-300/20 rounded-full opacity-30 transition-transform duration-500 group-hover:scale-110"></div>
          
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-200/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 skew-x-12 transform-gpu rounded-2xl"></div>
          
          <div className="relative flex items-center space-x-3 mb-6">
            <div className="p-2 rounded-xl bg-gradient-to-r from-blue-600/20 to-blue-700/20 backdrop-blur-sm border border-blue-500/30">
              <TrendingUp className="h-5 w-5 text-blue-400" />
            </div>
            <h6 className="text-xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Criteria by Priority Level
            </h6>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* High Priority */}
            {(() => {
              const highCriteria = eligibilityResult.criteria_met.filter((c: any) => c.priority === 'high');
              const highMet = highCriteria.filter((c: any) => c.meets_criteria).length;
              const highUnmet = highCriteria.length - highMet;
              
              return (
                <div className={`relative p-4 rounded-xl border backdrop-blur-2xl transition-all duration-300 hover:scale-[1.01] group/priority ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-red-800/60 via-red-700/40 to-red-800/60 border-red-500/30' 
                    : 'bg-gradient-to-br from-red-50/80 via-red-100/70 to-red-50/80 border-red-200/60'
                }`}>
                  {/* Mini sparkles */}
                  <div className="absolute top-1 right-1 w-1 h-1 bg-red-400 rounded-full animate-bounce opacity-60" style={{ animationDelay: '0ms' }}></div>
                  <div className="absolute top-2 left-2 w-0.5 h-0.5 bg-red-300 rounded-full animate-bounce opacity-50" style={{ animationDelay: '200ms' }}></div>
                  
                  {/* Mini shimmer */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-200/15 to-transparent opacity-0 group-hover/priority:opacity-100 transition-opacity duration-500 skew-x-12 transform-gpu rounded-xl"></div>
                  
                  <div className="relative flex items-center space-x-2 mb-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full shadow-lg shadow-red-500/30"></div>
                    <span className="font-black bg-gradient-to-r from-red-600 via-red-500 to-red-600 bg-clip-text text-transparent">
                      High Priority
                    </span>
                  </div>
                  <div className="relative space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600 bg-clip-text text-transparent">
                        Met:
                      </span>
                      <span className="font-black bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 bg-clip-text text-transparent">
                        {highMet}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600 bg-clip-text text-transparent">
                        UnMet:
                      </span>
                      <span className="font-black bg-gradient-to-r from-red-600 via-red-500 to-red-600 bg-clip-text text-transparent">
                        {highUnmet}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Medium Priority */}
            {(() => {
              const mediumCriteria = eligibilityResult.criteria_met.filter((c: any) => c.priority === 'medium');
              const mediumMet = mediumCriteria.filter((c: any) => c.meets_criteria).length;
              const mediumUnmet = mediumCriteria.length - mediumMet;
              
              return (
                <div className={`relative p-4 rounded-xl border backdrop-blur-2xl transition-all duration-300 hover:scale-[1.01] group/priority ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-yellow-800/60 via-yellow-700/40 to-yellow-800/60 border-yellow-500/30' 
                    : 'bg-gradient-to-br from-yellow-50/80 via-yellow-100/70 to-yellow-50/80 border-yellow-200/60'
                }`}>
                  {/* Mini sparkles */}
                  <div className="absolute top-1 right-1 w-1 h-1 bg-yellow-400 rounded-full animate-bounce opacity-60" style={{ animationDelay: '0ms' }}></div>
                  <div className="absolute top-2 left-2 w-0.5 h-0.5 bg-yellow-300 rounded-full animate-bounce opacity-50" style={{ animationDelay: '200ms' }}></div>
                  
                  {/* Mini shimmer */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-200/15 to-transparent opacity-0 group-hover/priority:opacity-100 transition-opacity duration-500 skew-x-12 transform-gpu rounded-xl"></div>
                  
                  <div className="relative flex items-center space-x-2 mb-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-lg shadow-yellow-500/30"></div>
                    <span className="font-black bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 bg-clip-text text-transparent">
                      Medium Priority
                    </span>
                  </div>
                  <div className="relative space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600 bg-clip-text text-transparent">
                        Met:
                      </span>
                      <span className="font-black bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 bg-clip-text text-transparent">
                        {mediumMet}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600 bg-clip-text text-transparent">
                        UnMet:
                      </span>
                      <span className="font-black bg-gradient-to-r from-red-600 via-red-500 to-red-600 bg-clip-text text-transparent">
                        {mediumUnmet}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Low Priority */}
            {(() => {
              const lowCriteria = eligibilityResult.criteria_met.filter((c: any) => c.priority === 'low');
              const lowMet = lowCriteria.filter((c: any) => c.meets_criteria).length;
              const lowUnmet = lowCriteria.length - lowMet;
              
              return (
                <div className={`relative p-4 rounded-xl border backdrop-blur-2xl transition-all duration-300 hover:scale-[1.01] group/priority ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-green-800/60 via-green-700/40 to-green-800/60 border-green-500/30' 
                    : 'bg-gradient-to-br from-green-50/80 via-green-100/70 to-green-50/80 border-green-200/60'
                }`}>
                  {/* Mini sparkles */}
                  <div className="absolute top-1 right-1 w-1 h-1 bg-green-400 rounded-full animate-bounce opacity-60" style={{ animationDelay: '0ms' }}></div>
                  <div className="absolute top-2 left-2 w-0.5 h-0.5 bg-green-300 rounded-full animate-bounce opacity-50" style={{ animationDelay: '200ms' }}></div>
                  
                  {/* Mini shimmer */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-200/15 to-transparent opacity-0 group-hover/priority:opacity-100 transition-opacity duration-500 skew-x-12 transform-gpu rounded-xl"></div>
                  
                  <div className="relative flex items-center space-x-2 mb-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full shadow-lg shadow-green-500/30"></div>
                    <span className="font-black bg-gradient-to-r from-green-600 via-green-500 to-green-600 bg-clip-text text-transparent">
                      Low Priority
                    </span>
                  </div>
                  <div className="relative space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600 bg-clip-text text-transparent">
                        Met:
                      </span>
                      <span className="font-black bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 bg-clip-text text-transparent">
                        {lowMet}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600 bg-clip-text text-transparent">
                        UnMet:
                      </span>
                      <span className="font-black bg-gradient-to-r from-red-600 via-red-500 to-red-600 bg-clip-text text-transparent">
                        {lowUnmet}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

                 {/* Enhanced Download Button with Glass Effect */}
         <div className="flex justify-center pt-8">
           <div className="relative group">
             <button
               onClick={async () => {
                 try {
                   // ✅ Fetch saved data directly from backend API (no transformation!)
                                       const response = await fetch(`http://localhost:8000/api/download/evaluation/${session?.session_id || 'unknown'}/${eligibilityResult.participant_id}`);
                   
                   if (response.ok) {
                     // Use exact backend data structure
                     const backendData = await response.json();
                     const jsonString = JSON.stringify(backendData, null, 2);
                     const blob = new Blob([jsonString], { type: 'application/json' });
                     const url = URL.createObjectURL(blob);
                     const a = document.createElement('a');
                     a.href = url;
                     a.download = `evaluation-${eligibilityResult.participant_id}-${new Date().toISOString().split('T')[0]}.json`;
                     document.body.appendChild(a);
                     a.click();
                     document.body.removeChild(a);
                     URL.revokeObjectURL(url);
                   } else {
                     // Fallback: basic export if API fails
                     const basicData = {
                       participant_id: eligibilityResult.participant_id,
                       eligible: eligibilityResult.eligible,
                       score: eligibilityResult.score,
                       evaluation_timestamp: eligibilityResult.evaluation_timestamp,
                       criteria_met: eligibilityResult.criteria_met,
                       note: "Downloaded from UI fallback - saved backend data not available"
                     };
                     const jsonString = JSON.stringify(basicData, null, 2);
                     const blob = new Blob([jsonString], { type: 'application/json' });
                     const url = URL.createObjectURL(blob);
                     const a = document.createElement('a');
                     a.href = url;
                     a.download = `evaluation-fallback-${eligibilityResult.participant_id}-${new Date().toISOString().split('T')[0]}.json`;
                     document.body.appendChild(a);
                     a.click();
                     document.body.removeChild(a);
                     URL.revokeObjectURL(url);
                   }
                 } catch (error) {
                   console.error('Download failed:', error);
                   alert('Download failed. Please try again.');
                 }
               }}
               className={`group/download relative px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-[1.15] hover:-translate-y-3 border backdrop-blur-2xl shadow-2xl ${
                 isDarkMode 
                   ? 'bg-gradient-to-br from-purple-700/80 via-pink-600/60 to-purple-700/80 hover:from-purple-600/90 hover:via-pink-500/70 hover:to-purple-600/90 text-purple-100 border-purple-400/60 hover:border-pink-300/80 shadow-purple-500/30' 
                   : 'bg-gradient-to-br from-purple-300/90 via-pink-400/80 to-purple-300/90 hover:from-purple-400/100 hover:via-pink-500/90 hover:to-purple-400/100 text-white border-purple-500/70 hover:border-pink-500/90 shadow-purple-500/50'
               }`}
               title="Download assessment results as JSON"
             >
               {/* Enhanced glittering sparkles */}
               <div className="absolute top-2 right-2 w-2 h-2 bg-purple-400 rounded-full animate-bounce opacity-80 shadow-lg shadow-purple-400/50" style={{ animationDelay: '0ms' }}></div>
               <div className="absolute top-3 right-8 w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce opacity-70 shadow-lg shadow-pink-400/50" style={{ animationDelay: '150ms' }}></div>
               <div className="absolute top-1 left-3 w-1 h-1 bg-purple-300 rounded-full animate-bounce opacity-60 shadow-lg shadow-purple-300/50" style={{ animationDelay: '300ms' }}></div>
               <div className="absolute top-4 left-10 w-2.5 h-2.5 bg-pink-300 rounded-full animate-bounce opacity-75 shadow-lg shadow-pink-300/50" style={{ animationDelay: '450ms' }}></div>
               <div className="absolute top-2 left-20 w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce opacity-65 shadow-lg shadow-purple-500/50" style={{ animationDelay: '600ms' }}></div>
               <div className="absolute bottom-1 right-6 w-1 h-1 bg-pink-500 rounded-full animate-bounce opacity-55 shadow-lg shadow-pink-500/50" style={{ animationDelay: '750ms' }}></div>
               
               {/* Glittering floating rings */}
               <div className="absolute -top-6 -right-6 w-20 h-20 border border-purple-300/30 rounded-full opacity-40 transition-transform duration-500 group-hover/download:scale-110 animate-spin" style={{animationDuration: '8s'}}></div>
               <div className="absolute -bottom-4 -left-4 w-16 h-16 border border-pink-300/25 rounded-full opacity-35 transition-transform duration-700 group-hover/download:scale-125 animate-spin" style={{animationDuration: '6s', animationDirection: 'reverse'}}></div>
               
               {/* Enhanced shimmer effect */}
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-300/50 via-pink-300/60 to-transparent opacity-0 group-hover/download:opacity-100 transition-opacity duration-1000 skew-x-12 transform-gpu rounded-2xl"></div>
               
               {/* Breathing glow layers */}
               <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r opacity-70 transition-opacity duration-300 ${
                 isDarkMode 
                   ? 'from-purple-500/25 via-pink-400/30 to-purple-500/25' 
                   : 'from-purple-400/30 via-pink-400/35 to-purple-400/30'
               }`} style={{animation: 'breathe 3s ease-in-out infinite'}} />
               
               {/* Multiple enhanced glow layers */}
               <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 via-pink-400/25 to-purple-500/20 blur-xl opacity-60 group-hover/download:opacity-90 transition-opacity duration-300" style={{animation: 'breathe 4s ease-in-out infinite reverse'}}></div>
               <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400/15 via-pink-300/20 to-purple-400/15 blur-2xl opacity-40 group-hover/download:opacity-70 transition-opacity duration-500" style={{animation: 'breathe 5s ease-in-out infinite'}}></div>
               
                                <div className="relative flex items-center space-x-3">
                 <Download className={`h-5 w-5 transition-transform duration-300 group-hover/download:scale-110 group-hover/download:rotate-12 ${
                   isDarkMode ? 'text-purple-100' : 'text-white'
                 }`} />
                 <span className={`font-black ${
                   isDarkMode 
                     ? 'bg-gradient-to-r from-purple-100 via-pink-100 to-purple-100 bg-clip-text text-transparent drop-shadow-lg'
                     : 'text-white font-bold drop-shadow-md'
                 }`}>
                   Download Results
                 </span>
               </div>
             </button>
           </div>
         </div>
        
                 {/* Enhanced Next Steps Section */}
         <div className={`relative mt-8 p-6 rounded-2xl backdrop-blur-2xl border shadow-lg group ${
           eligibilityResult.eligible 
             ? isDarkMode 
               ? 'bg-gradient-to-br from-emerald-800/60 via-emerald-700/40 to-emerald-800/60 border-emerald-500/30 shadow-emerald-500/20' 
               : 'bg-gradient-to-br from-emerald-50/80 via-emerald-100/70 to-emerald-50/80 border-emerald-200/60 shadow-emerald-200/50'
             : isDarkMode
               ? 'bg-gradient-to-br from-amber-800/60 via-amber-700/40 to-amber-800/60 border-amber-500/30 shadow-amber-500/20'
               : 'bg-gradient-to-br from-amber-50/80 via-amber-100/70 to-amber-50/80 border-amber-200/60 shadow-amber-200/50'
         }`}>
          {/* Floating sparkles */}
          <div className={`absolute top-2 right-2 w-1.5 h-1.5 ${eligibilityResult.eligible ? 'bg-emerald-400' : 'bg-amber-400'} rounded-full animate-bounce opacity-60`} style={{ animationDelay: '0ms' }}></div>
          <div className={`absolute top-3 right-6 w-1 h-1 ${eligibilityResult.eligible ? 'bg-emerald-300' : 'bg-amber-300'} rounded-full animate-bounce opacity-50`} style={{ animationDelay: '150ms' }}></div>
          <div className={`absolute top-5 left-3 w-1.5 h-1.5 ${eligibilityResult.eligible ? 'bg-emerald-500' : 'bg-amber-500'} rounded-full animate-bounce opacity-40`} style={{ animationDelay: '300ms' }}></div>
          <div className={`absolute top-1 left-8 w-1 h-1 ${eligibilityResult.eligible ? 'bg-emerald-400' : 'bg-amber-400'} rounded-full animate-bounce opacity-55`} style={{ animationDelay: '450ms' }}></div>
          
          {/* Floating ring */}
          <div className={`absolute -top-4 -right-4 w-16 h-16 border ${eligibilityResult.eligible ? 'border-emerald-300/20' : 'border-amber-300/20'} rounded-full opacity-30 transition-transform duration-500 group-hover:scale-110`}></div>
          
          {/* Shimmer effect */}
          <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${eligibilityResult.eligible ? 'via-emerald-200/20' : 'via-amber-200/20'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 skew-x-12 transform-gpu rounded-2xl`}></div>
          
          <h6 className={`relative font-black text-lg mb-4 flex items-center space-x-2 bg-gradient-to-r ${
            eligibilityResult.eligible 
              ? 'from-emerald-600 via-emerald-500 to-emerald-600' 
              : 'from-amber-600 via-amber-500 to-amber-600'
          } bg-clip-text text-transparent`}>
            <Target className={`h-5 w-5 ${eligibilityResult.eligible ? 'text-emerald-500' : 'text-amber-500'}`} />
            <span>Next Steps</span>
          </h6>
          <div className="relative text-sm">
            {eligibilityResult.eligible ? (
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <p className="font-bold bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-700 bg-clip-text text-transparent">
                    <span className="font-black">Congratulations!</span> You appear to meet the initial eligibility criteria for this clinical trial.
                  </p>
                </div>
                <div className="rounded-xl p-4 backdrop-blur-sm bg-gradient-to-r from-emerald-700/20 to-emerald-800/20 border border-emerald-500/30">
                  <p className="font-bold mb-3 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 bg-clip-text text-transparent">Our research team will contact you within 2-3 business days to discuss:</p>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50"></div>
                      <span className="font-medium bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 bg-clip-text text-transparent">Detailed medical history review</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50"></div>
                      <span className="font-medium bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 bg-clip-text text-transparent">In-person screening visit scheduling</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50"></div>
                      <span className="font-medium bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 bg-clip-text text-transparent">Study requirements and timeline</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50"></div>
                      <span className="font-medium bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 bg-clip-text text-transparent">Informed consent process</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="font-bold bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 bg-clip-text text-transparent">
                    <span className="font-black">Thank you for your participation.</span> Based on your responses, you may not meet the current criteria for this specific study.
                  </p>
                </div>
                <div className="rounded-xl p-4 backdrop-blur-sm bg-gradient-to-r from-amber-700/20 to-amber-800/20 border border-amber-500/30">
                  <p className="font-bold mb-3 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 bg-clip-text text-transparent">However, you may be eligible for other clinical trials. Consider:</p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full shadow-lg shadow-amber-500/50"></div>
                      <span className="font-medium bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 bg-clip-text text-transparent">Selecting a different clinical study</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full shadow-lg shadow-amber-500/50"></div>
                      <span className="font-medium bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 bg-clip-text text-transparent">Speaking with your healthcare provider about research opportunities</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full shadow-lg shadow-amber-500/50"></div>
                      <span className="font-medium bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 bg-clip-text text-transparent">Contacting our research center for future studies</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 