import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { EligibilityResult } from '../types/interview';

interface EligibilityResultsProps {
  eligibilityResult: EligibilityResult;
}

export const EligibilityResults: React.FC<EligibilityResultsProps> = ({ eligibilityResult }) => {
  return (
    <div className="mt-8 bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
        <h3 className="text-xl font-semibold text-gray-900">Eligibility Assessment</h3>
        <p className="text-sm text-gray-500 mt-1">
          Participant ID: {eligibilityResult.participant_id} | 
          Evaluated on {new Date(eligibilityResult.evaluation_timestamp).toLocaleDateString()}
        </p>
      </div>
      
      {/* Overall Result */}
      <div className={`p-6 border-b border-gray-200 ${
        eligibilityResult.eligible ? 'bg-green-50' : 'bg-red-50'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {eligibilityResult.eligible ? (
              <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
            ) : (
              <AlertCircle className="h-8 w-8 text-red-500 mr-3" />
            )}
            <div>
              <h4 className={`text-2xl font-bold ${
                eligibilityResult.eligible ? 'text-green-800' : 'text-red-800'
              }`}>
                {eligibilityResult.eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
              </h4>
              <p className="text-sm text-gray-600">
                {eligibilityResult.eligible 
                  ? 'Qualified for next screening phase' 
                  : 'Does not meet current study requirements'
                }
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${
              eligibilityResult.eligible ? 'text-green-600' : 'text-red-600'
            }`}>
              {eligibilityResult.score}%
            </div>
            <p className="text-sm text-gray-500">Overall Score</p>
          </div>
        </div>
      </div>

      {/* Criteria Breakdown */}
      <div className="p-6">
        <h5 className="text-lg font-semibold text-gray-900 mb-4">Detailed Criteria Assessment</h5>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {eligibilityResult.criteria_met.length}
            </div>
            <div className="text-sm text-blue-700">Total Criteria</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {eligibilityResult.criteria_met.filter((c: any) => c.meets_criteria).length}
            </div>
            <div className="text-sm text-green-700">Criteria Met</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {eligibilityResult.criteria_met.filter((c: any) => c.priority === 'high' && !c.meets_criteria).length}
            </div>
            <div className="text-sm text-red-700">High Priority Unmet</div>
          </div>
        </div>

        {/* Criteria Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Criteria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Response
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assessment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Confidence
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {eligibilityResult.criteria_met.map((criterion: any, index: number) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {criterion.meets_criteria ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      criterion.priority === 'high' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {criterion.priority === 'high' ? '🔴 High' : '🟡 Medium'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 font-medium">
                      {criterion.criteria_text}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700 max-w-xs">
                      "{criterion.participant_response}"
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">
                      {criterion.reasoning}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-10 h-10">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium ${
                          criterion.confidence >= 0.8 ? 'bg-green-100 text-green-800' :
                          criterion.confidence >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {Math.round(criterion.confidence * 100)}%
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Next Steps */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h6 className="font-semibold text-blue-900 mb-2">Next Steps</h6>
          <div className="text-sm text-blue-800">
            {eligibilityResult.eligible ? (
              <div>
                <p className="mb-2">✅ <strong>Congratulations!</strong> You appear to meet the initial eligibility criteria.</p>
                <p className="mb-2">📞 Our research team will contact you within 2-3 business days to discuss:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Detailed medical history review</li>
                  <li>In-person screening visit scheduling</li>
                  <li>Study requirements and timeline</li>
                  <li>Informed consent process</li>
                </ul>
              </div>
            ) : (
              <div>
                <p className="mb-2">❌ <strong>Unfortunately,</strong> you do not meet the current eligibility criteria for this study.</p>
                <p className="mb-2">However, you may be eligible for other clinical trials. Consider:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Checking clinicaltrials.gov for other studies</li>
                  <li>Speaking with your healthcare provider about research opportunities</li>
                  <li>Contacting our research center for future studies</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 