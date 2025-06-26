import React from 'react';
import { AlertCircle, CheckCircle, Award, FileText, TrendingUp, X } from 'lucide-react';
import { EligibilityResult } from '../types/interview';

interface EligibilityResultsProps {
  eligibilityResult: EligibilityResult;
}

export const EligibilityResults: React.FC<EligibilityResultsProps> = ({ eligibilityResult }) => {
  return (
    <div className="backdrop-blur-xl bg-white/90 rounded-3xl shadow-2xl overflow-hidden border border-white/20 max-w-6xl mx-auto">
      {/* Header with close functionality */}
      <div className="relative p-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10">
        <button 
          onClick={() => window.location.reload()} 
          className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-200"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>
        <div className="flex items-center space-x-3">
          <Award className="h-8 w-8 text-indigo-600" />
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Eligibility Assessment Results</h3>
            <p className="text-sm text-gray-600 mt-1">
              Participant: {eligibilityResult.participant_id} • 
              Evaluated: {new Date(eligibilityResult.evaluation_timestamp).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
      
      {/* Overall Result with modern card design */}
      <div className={`p-8 border-b border-gray-200/50 relative overflow-hidden ${
        eligibilityResult.eligible 
          ? 'bg-gradient-to-br from-emerald-50/50 via-green-50/30 to-emerald-100/50' 
          : 'bg-gradient-to-br from-red-50/50 via-pink-50/30 to-red-100/50'
      }`}>
        {/* Background decoration */}
        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 ${
          eligibilityResult.eligible ? 'bg-green-400' : 'bg-red-400'
        }`} />
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`p-4 rounded-2xl backdrop-blur-sm ${
              eligibilityResult.eligible 
                ? 'bg-green-500/20 border border-green-200/50' 
                : 'bg-red-500/20 border border-red-200/50'
            }`}>
              {eligibilityResult.eligible ? (
                <CheckCircle className="h-10 w-10 text-green-600" />
              ) : (
                <AlertCircle className="h-10 w-10 text-red-600" />
              )}
            </div>
            <div>
              <h4 className={`text-3xl font-bold tracking-tight ${
                eligibilityResult.eligible ? 'text-green-800' : 'text-red-800'
              }`}>
                {eligibilityResult.eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
              </h4>
              <p className="text-gray-700 font-medium">
                {eligibilityResult.eligible 
                  ? 'Qualified for next screening phase' 
                  : 'Does not meet current study requirements'
                }
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-3">
              <TrendingUp className={`h-6 w-6 ${
                eligibilityResult.eligible ? 'text-green-600' : 'text-red-600'
              }`} />
              <div>
                <div className={`text-4xl font-bold ${
                  eligibilityResult.eligible ? 'text-green-600' : 'text-red-600'
                }`}>
                  {eligibilityResult.score}%
                </div>
                <p className="text-sm text-gray-600 font-medium">Overall Score</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Criteria Breakdown with modern styling */}
      <div className="p-8">
        <div className="flex items-center space-x-3 mb-6">
          <FileText className="h-6 w-6 text-indigo-600" />
          <h5 className="text-xl font-bold text-gray-900">Detailed Criteria Assessment</h5>
        </div>
        
        {/* Enhanced Summary Stats with glass morphism */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="backdrop-blur-sm bg-blue-500/10 border border-blue-200/50 rounded-2xl p-6 text-center hover:scale-105 transition-transform duration-300">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {eligibilityResult.criteria_met.length}
            </div>
            <div className="text-blue-700 font-medium">Total Criteria</div>
          </div>
          <div className="backdrop-blur-sm bg-green-500/10 border border-green-200/50 rounded-2xl p-6 text-center hover:scale-105 transition-transform duration-300">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {eligibilityResult.criteria_met.filter((c: any) => c.meets_criteria).length}
            </div>
            <div className="text-green-700 font-medium">Criteria Met</div>
          </div>
          <div className="backdrop-blur-sm bg-red-500/10 border border-red-200/50 rounded-2xl p-6 text-center hover:scale-105 transition-transform duration-300">
            <div className="text-3xl font-bold text-red-600 mb-2">
              {eligibilityResult.criteria_met.filter((c: any) => c.priority === 'high' && !c.meets_criteria).length}
            </div>
            <div className="text-red-700 font-medium">High Priority Unmet</div>
          </div>
        </div>

        {/* Modern Card-based Criteria Display */}
        <div className="space-y-4">
          {eligibilityResult.criteria_met.map((criterion: any, index: number) => (
            <div key={index} className={`backdrop-blur-sm rounded-2xl p-6 border transition-all duration-300 hover:scale-[1.02] ${
              criterion.meets_criteria 
                ? 'bg-green-50/50 border-green-200/50 hover:bg-green-50/70' 
                : 'bg-red-50/50 border-red-200/50 hover:bg-red-50/70'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-xl ${
                    criterion.meets_criteria ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    {criterion.meets_criteria ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    criterion.priority === 'high' 
                      ? 'bg-red-100 text-red-800 border border-red-200' 
                      : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                  }`}>
                    {criterion.priority === 'high' ? '🔴 High Priority' : '🟡 Medium Priority'}
                  </span>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                  criterion.confidence >= 0.8 ? 'bg-green-100 text-green-800' :
                  criterion.confidence >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {Math.round(criterion.confidence * 100)}% confidence
                </div>
              </div>
              
              <h6 className="font-semibold text-gray-900 mb-2">{criterion.criteria_text}</h6>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Your Response:</p>
                  <p className="text-sm text-gray-600 italic bg-white/50 rounded-lg p-3">
                    "{criterion.participant_response}"
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Assessment:</p>
                  <p className="text-sm text-gray-600 bg-white/50 rounded-lg p-3">
                    {criterion.reasoning}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Next Steps Section */}
        <div className={`mt-8 p-6 rounded-2xl backdrop-blur-sm border ${
          eligibilityResult.eligible 
            ? 'bg-blue-500/10 border-blue-200/50' 
            : 'bg-orange-500/10 border-orange-200/50'
        }`}>
          <h6 className={`font-bold text-lg mb-4 flex items-center space-x-2 ${
            eligibilityResult.eligible ? 'text-blue-900' : 'text-orange-900'
          }`}>
            <Award className="h-5 w-5" />
            <span>Next Steps</span>
          </h6>
          <div className={`text-sm ${
            eligibilityResult.eligible ? 'text-blue-800' : 'text-orange-800'
          }`}>
            {eligibilityResult.eligible ? (
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p><strong>Congratulations!</strong> You appear to meet the initial eligibility criteria for this clinical trial.</p>
                </div>
                <div className="bg-white/50 rounded-xl p-4">
                  <p className="font-medium mb-3">📞 Our research team will contact you within 2-3 business days to discuss:</p>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Detailed medical history review</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>In-person screening visit scheduling</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Study requirements and timeline</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Informed consent process</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p><strong>Unfortunately,</strong> you do not meet the current eligibility criteria for this study.</p>
                </div>
                <div className="bg-white/50 rounded-xl p-4">
                  <p className="font-medium mb-3">However, you may be eligible for other clinical trials. Consider:</p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span>Checking <strong>clinicaltrials.gov</strong> for other studies</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span>Speaking with your healthcare provider about research opportunities</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
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
  );
}; 