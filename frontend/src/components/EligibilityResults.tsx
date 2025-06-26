import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, FileText, TrendingUp, Download, Target, Brain, Zap } from 'lucide-react';
import { EligibilityResult } from '../types/interview';

interface EligibilityResultsProps {
  eligibilityResult: EligibilityResult;
  isDarkMode: boolean;
  onDownload: () => void;
  onRestart: () => void;
}

export const EligibilityResults: React.FC<EligibilityResultsProps> = ({ 
  eligibilityResult, 
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
      <div className={`backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border max-w-6xl mx-auto transition-all duration-700 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      } ${
        isDarkMode 
          ? 'bg-gray-800/40 border-gray-700/30' 
          : 'bg-white/80 border-gray-200/30'
      }`}>
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
            <h2 className={`text-4xl font-bold mb-4 ${
              isDarkMode 
                ? 'text-gray-100' 
                : 'text-gray-900'
            }`}>
              Clinical Trial Assessment
            </h2>
            <p className={`text-lg ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
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
            <FileText className={`h-6 w-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`} />
            <h4 className={`text-2xl font-bold ${
              isDarkMode ? 'text-gray-200' : 'text-gray-800'
            }`}>
              Detailed Assessment
            </h4>
          </div>
          
          {/* Enhanced Summary Stats with Glass Effect */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className={`p-6 rounded-xl backdrop-blur-md border transition-all duration-300 hover:scale-105 shadow-lg ${
              isDarkMode 
                ? 'bg-slate-800/40 border-slate-600/40 hover:bg-slate-700/50 shadow-black/20' 
                : 'bg-white/70 border-white/40 hover:bg-white/80 shadow-slate-200/50'
            }`}>
              <div className={`text-3xl font-bold mb-2 ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
              {eligibilityResult.criteria_met.length}
              </div>
              <div className={`font-medium ${
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Total Criteria
              </div>
            </div>
            
            <div className={`p-6 rounded-xl backdrop-blur-md border transition-all duration-300 hover:scale-105 shadow-lg ${
              isDarkMode 
                ? 'bg-emerald-600/20 border-emerald-500/30 hover:bg-emerald-600/25 shadow-emerald-500/20' 
                : 'bg-emerald-50/80 border-emerald-200/60 hover:bg-emerald-100/90 shadow-emerald-200/50'
            }`}>
              <div className={`text-3xl font-bold mb-2 ${
                isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
              }`}>
                {eligibilityResult.criteria_met.filter((c: any) => c.meets_criteria).length}
              </div>
              <div className={`font-medium ${
                isDarkMode ? 'text-emerald-300' : 'text-emerald-700'
              }`}>
                Criteria Met
          </div>
            </div>
            
            <div className={`p-6 rounded-xl backdrop-blur-md border transition-all duration-300 hover:scale-105 shadow-lg ${
              isDarkMode 
                ? 'bg-amber-600/20 border-amber-500/30 hover:bg-amber-600/25 shadow-amber-500/20' 
                : 'bg-amber-50/80 border-amber-200/60 hover:bg-amber-100/90 shadow-amber-200/50'
            }`}>
              <div className={`text-3xl font-bold mb-2 ${
                isDarkMode ? 'text-amber-400' : 'text-amber-600'
              }`}>
                {eligibilityResult.criteria_met.filter((c: any) => c.priority === 'high' && !c.meets_criteria).length}
              </div>
              <div className={`font-medium ${
                isDarkMode ? 'text-amber-300' : 'text-amber-700'
              }`}>
                High Priority Gaps
          </div>
          </div>
        </div>

        {/* Enhanced Card-based Criteria Display */}
        <div className="space-y-4">
              {eligibilityResult.criteria_met.map((criterion: any, index: number) => (
            <div key={index} className={`backdrop-blur-md rounded-2xl p-6 border transition-all duration-300 hover:scale-[1.02] shadow-lg ${
              criterion.meets_criteria 
                ? isDarkMode 
                  ? 'bg-emerald-600/20 border-emerald-500/30 hover:bg-emerald-600/25 shadow-emerald-500/20' 
                  : 'bg-emerald-50/80 border-emerald-200/60 hover:bg-emerald-100/90 shadow-emerald-200/50'
                : isDarkMode
                  ? 'bg-red-600/20 border-red-500/30 hover:bg-red-600/25 shadow-red-500/20'
                  : 'bg-red-50/80 border-red-200/60 hover:bg-red-100/90 shadow-red-200/50'
            }`}>
              <div className="flex items-start justify-between mb-4">
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
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      criterion.priority === 'high' 
                      ? isDarkMode 
                        ? 'bg-red-600/20 text-red-300 border border-red-500/30' 
                        : 'bg-red-100 text-red-800 border border-red-200'
                      : criterion.priority === 'medium'
                        ? isDarkMode
                          ? 'bg-yellow-600/20 text-yellow-300 border border-yellow-500/30'
                          : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        : isDarkMode
                          ? 'bg-green-600/20 text-green-300 border border-green-500/30'
                          : 'bg-green-100 text-green-800 border border-green-200'
                  }`}>
                    {criterion.priority === 'high' ? 'High Priority' : criterion.priority === 'medium' ? 'Medium Priority' : 'Low Priority'}
                    </span>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                  criterion.confidence >= 0.8 
                    ? isDarkMode ? 'bg-emerald-600/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
                    : criterion.confidence >= 0.6 
                      ? isDarkMode ? 'bg-yellow-600/20 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                      : isDarkMode ? 'bg-red-600/20 text-red-300' : 'bg-red-100 text-red-800'
                }`}>
                  {Math.round(criterion.confidence * 100)}% confidence
                </div>
              </div>
              
              <h6 className={`font-semibold mb-2 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-900'
              }`}>
                      {criterion.criteria_text}
              </h6>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className={`text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Question Asked:
                  </p>
                  <p className={`text-sm rounded-lg p-3 ${
                    isDarkMode 
                      ? 'text-blue-300 bg-slate-700/30' 
                      : 'text-blue-700 bg-blue-50/50'
                  }`}>
                      {criterion.criteria_question || "Question not available"}
                  </p>
                </div>
                <div>
                  <p className={`text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Your Response:
                  </p>
                  <p className={`text-sm italic rounded-lg p-3 ${
                    isDarkMode 
                      ? 'text-gray-300 bg-slate-700/30' 
                      : 'text-gray-600 bg-white/50'
                  }`}>
                      "{criterion.participant_response}"
                  </p>
                    </div>
                <div>
                  <p className={`text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Assessment:
                  </p>
                  <p className={`text-sm rounded-lg p-3 ${
                    isDarkMode 
                      ? 'text-gray-300 bg-slate-700/30' 
                      : 'text-gray-600 bg-white/50'
                  }`}>
                      {criterion.reasoning}
                  </p>
                        </div>
                      </div>
                    </div>
              ))}
        </div>

                 {/* Enhanced Download Button with Glass Effect */}
         <div className="flex justify-center pt-8">
           <div className="relative group">
             <button
               onClick={() => {
                 const jsonData = {
                   metadata: {
                     participant_id: eligibilityResult.participant_id,
                     evaluation_timestamp: eligibilityResult.evaluation_timestamp,
                     export_timestamp: new Date().toISOString(),
                     export_date: new Date().toLocaleDateString(),
                     assessment_type: 'clinical_trial_eligibility'
                   },
                   results: {
                     eligible: eligibilityResult.eligible,
                     overall_score: eligibilityResult.score,
                     eligibility_status: eligibilityResult.eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'
                   },
                   criteria_assessment: eligibilityResult.criteria_met.map((criterion: any) => ({
                     criteria_text: criterion.criteria_text,
                     meets_criteria: criterion.meets_criteria,
                     participant_response: criterion.participant_response,
                     assessment_reasoning: criterion.reasoning,
                     confidence_score: Math.round(criterion.confidence * 100),
                     priority: criterion.priority
                   })),
                   summary: {
                     total_criteria: eligibilityResult.criteria_met.length,
                     criteria_met: eligibilityResult.criteria_met.filter((c: any) => c.meets_criteria).length,
                     critical_gaps: eligibilityResult.criteria_met.filter((c: any) => c.priority === 'high' && !c.meets_criteria).length,
                     overall_assessment: `Clinical trial eligibility assessment for participant ${eligibilityResult.participant_id}. Overall result: ${eligibilityResult.eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'} with a score of ${eligibilityResult.score}%.`
                   }
                 };
                 
                 const jsonString = JSON.stringify(jsonData, null, 2);
                 const blob = new Blob([jsonString], { type: 'application/json' });
                 const url = URL.createObjectURL(blob);
                 const a = document.createElement('a');
                 a.href = url;
                 a.download = `clinical-trial-assessment-${new Date().toISOString().split('T')[0]}.json`;
                 document.body.appendChild(a);
                 a.click();
                 document.body.removeChild(a);
                 URL.revokeObjectURL(url);
               }}
               className={`group relative px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 border backdrop-blur-md shadow-lg ${
                 isDarkMode 
                   ? 'bg-gradient-to-r from-blue-800/60 via-indigo-800/60 to-purple-800/60 border-blue-600/40 text-blue-200 hover:from-blue-700/70 hover:via-indigo-700/70 hover:to-purple-700/70 hover:border-blue-500/60 shadow-blue-900/30' 
                   : 'bg-gradient-to-r from-blue-100/80 via-indigo-100/80 to-purple-100/80 border-blue-200/60 text-blue-800 hover:from-blue-200/90 hover:via-indigo-200/90 hover:to-purple-200/90 hover:border-blue-300/70 shadow-blue-200/50'
               }`}
               title="Download assessment results as JSON"
             >
               {/* Enhanced glass morphism inner glow */}
               <div className={`absolute inset-0 rounded-xl bg-gradient-to-r opacity-0 group-hover:opacity-30 transition-opacity duration-300 ${
                 isDarkMode 
                   ? 'from-blue-400/40 via-indigo-400/40 to-purple-400/40' 
                   : 'from-blue-200/70 via-indigo-200/70 to-purple-200/70'
               }`} />
               
               <div className="relative flex items-center space-x-2">
                 <Download className="h-4 w-4" />
                 <span>Download Results</span>
               </div>
             </button>
           </div>
         </div>
        
                 {/* Enhanced Next Steps Section */}
         <div className={`mt-8 p-6 rounded-2xl backdrop-blur-md border shadow-lg ${
           eligibilityResult.eligible 
             ? isDarkMode 
               ? 'bg-emerald-600/20 border-emerald-500/30 shadow-emerald-500/20' 
               : 'bg-emerald-50/80 border-emerald-200/60 shadow-emerald-200/50'
             : isDarkMode
               ? 'bg-amber-600/20 border-amber-500/30 shadow-amber-500/20'
               : 'bg-amber-50/80 border-amber-200/60 shadow-amber-200/50'
         }`}>
          <h6 className={`font-bold text-lg mb-4 flex items-center space-x-2 ${
            eligibilityResult.eligible 
              ? isDarkMode ? 'text-emerald-300' : 'text-emerald-700'
              : isDarkMode ? 'text-amber-300' : 'text-amber-700'
          }`}>
            <Target className="h-5 w-5" />
            <span>Next Steps</span>
          </h6>
          <div className={`text-sm ${
            eligibilityResult.eligible 
              ? isDarkMode ? 'text-emerald-200' : 'text-emerald-800'
              : isDarkMode ? 'text-amber-200' : 'text-amber-800'
          }`}>
            {eligibilityResult.eligible ? (
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <p><strong>Congratulations!</strong> You appear to meet the initial eligibility criteria for this clinical trial.</p>
                </div>
                <div className={`rounded-xl p-4 ${
                  isDarkMode ? 'bg-slate-700/30' : 'bg-white/50'
                }`}>
                  <p className="font-medium mb-3">Our research team will contact you within 2-3 business days to discuss:</p>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span>Detailed medical history review</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span>In-person screening visit scheduling</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span>Study requirements and timeline</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span>Informed consent process</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p><strong>Thank you for your participation.</strong> Based on your responses, you may not meet the current criteria for this specific study.</p>
                </div>
                <div className={`rounded-xl p-4 ${
                  isDarkMode ? 'bg-slate-700/30' : 'bg-white/50'
                }`}>
                  <p className="font-medium mb-3">However, you may be eligible for other clinical trials. Consider:</p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      <span>Checking <strong>clinicaltrials.gov</strong> for other studies</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      <span>Speaking with your healthcare provider about research opportunities</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      <span>Contacting our research center for future studies</span>
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