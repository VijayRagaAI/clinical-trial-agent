import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  Clock, 
  Users, 
  Stethoscope, 
  Award,
  ChevronRight,
  Building,
  Calendar
} from 'lucide-react';
import { Study } from '../types/interview';
import { getAvailableStudies } from '../services/api';

interface StudySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStudy: Study | null;
  onStudySelect: (study: Study) => void;
  isDarkMode: boolean;
}

export const StudySelector: React.FC<StudySelectorProps> = ({
  isOpen,
  onClose,
  selectedStudy,
  onStudySelect,
  isDarkMode
}) => {
  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedForPreview, setSelectedForPreview] = useState<Study | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadStudies();
    }
  }, [isOpen]);

  const loadStudies = async () => {
    try {
      setLoading(true);
      const response = await getAvailableStudies();
      setStudies(response.studies);
    } catch (error) {
      console.error('Failed to load studies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStudySelect = (study: Study) => {
    onStudySelect(study);
    onClose();
  };

  const getCategoryColor = (category: string) => {
    // Generate colors based on category hash for consistency
    const hash = category.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const colorIndex = Math.abs(hash) % 6;
    const colors = [
      isDarkMode ? 'from-green-600/20 to-emerald-600/10 border-green-500/30' : 'from-green-50 to-emerald-50 border-green-200',
      isDarkMode ? 'from-red-600/20 to-rose-600/10 border-red-500/30' : 'from-red-50 to-rose-50 border-red-200',
      isDarkMode ? 'from-blue-600/20 to-indigo-600/10 border-blue-500/30' : 'from-blue-50 to-indigo-50 border-blue-200',
      isDarkMode ? 'from-purple-600/20 to-violet-600/10 border-purple-500/30' : 'from-purple-50 to-violet-50 border-purple-200',
      isDarkMode ? 'from-orange-600/20 to-amber-600/10 border-orange-500/30' : 'from-orange-50 to-amber-50 border-orange-200',
      isDarkMode ? 'from-teal-600/20 to-cyan-600/10 border-teal-500/30' : 'from-teal-50 to-cyan-50 border-teal-200'
    ];
    return colors[colorIndex];
  };

  const getCategoryIcon = (category: string) => {
    // Generate consistent icons based on category
    const hash = category.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const iconIndex = Math.abs(hash) % 8;
    const icons = ['🧬', '🩺', '❤️', '🦴', '🧠', '👁️', '🫁', '💊'];
    return icons[iconIndex];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-6xl max-h-[90vh] rounded-3xl backdrop-blur-xl border shadow-2xl overflow-hidden ${
        isDarkMode 
          ? 'bg-gray-900/90 border-gray-700/50' 
          : 'bg-white/90 border-white/20'
      }`}>
        {/* Header */}
        <div className={`p-6 border-b backdrop-blur-sm ${
          isDarkMode ? 'border-gray-700/50 bg-gray-800/20' : 'border-white/20 bg-white/20'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-xl backdrop-blur-md border transition-all duration-500 ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-purple-600/10 border-blue-500/20' 
                  : 'bg-gradient-to-br from-indigo-50/80 via-purple-50/60 to-pink-50/80 border-indigo-200/30'
              }`}>
                <FileText className={`h-6 w-6 ${
                  isDarkMode ? 'text-blue-400/70' : 'text-indigo-500/70'
                }`} />
              </div>
              
              <div>
                <h2 className={`text-2xl font-bold bg-gradient-to-r ${
                  isDarkMode 
                    ? 'from-blue-400 via-indigo-400 to-purple-400' 
                    : 'from-indigo-600 via-purple-600 to-pink-600'
                } bg-clip-text text-transparent`}>
                  Select Clinical Study
                </h2>
                <p className={`mt-1 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {selectedStudy ? 
                    'Click any study card to preview details, then select to change your choice' :
                    'Choose a clinical trial that interests you'
                  }
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className={`p-2 rounded-full transition-all duration-300 hover:scale-110 ${
                isDarkMode 
                  ? 'hover:bg-gray-700/50 text-gray-400 hover:text-gray-300' 
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-600'
              }`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                  Loading studies...
                </span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Study Cards */}
              <div className="space-y-4">
                {/* Currently Selected Study Header */}
                {selectedStudy && (
                  <div className={`text-sm font-semibold mb-2 ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    ✅ Currently Selected Study
                  </div>
                )}
                
                {studies.map((study) => {
                  const isCurrentlySelected = selectedStudy?.id === study.id;
                  const isBeingPreviewed = selectedForPreview?.id === study.id;
                  
                  return (
                    <div
                      key={study.id}
                      className={`group relative p-6 rounded-2xl backdrop-blur-md border transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
                        isCurrentlySelected
                          ? `bg-gradient-to-br ${getCategoryColor(study.category)} ring-2 ${
                              isDarkMode ? 'ring-emerald-400/70' : 'ring-emerald-500/70'
                            } shadow-lg`
                          : isBeingPreviewed
                          ? `bg-gradient-to-br ${getCategoryColor(study.category)} ring-2 ${
                              isDarkMode ? 'ring-blue-400/50' : 'ring-indigo-400/50'
                            }`
                          : `${
                              isDarkMode 
                                ? 'bg-gray-800/30 border-gray-700/50 hover:bg-gray-800/50' 
                                : 'bg-white/50 border-white/20 hover:bg-white/70'
                            }`
                      }`}
                      onClick={() => setSelectedForPreview(study)}
                    >
                    {/* Category Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                        isDarkMode 
                          ? 'bg-gray-700/50 text-gray-300' 
                          : 'bg-white/70 text-gray-600'
                      }`}>
                        <span className="text-sm">{getCategoryIcon(study.category)}</span>
                        <span>{study.category}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          isDarkMode ? 'bg-gray-600/50' : 'bg-gray-200/70'
                        }`}>
                          {study.phase}
                        </span>
                      </div>
                      <ChevronRight className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                    </div>

                    {/* Study Title */}
                    <h3 className={`text-lg font-semibold mb-3 line-clamp-2 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {study.title}
                    </h3>

                    {/* NCT ID */}
                    <div className={`flex items-center space-x-2 mb-3 text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <Award className="h-4 w-4" />
                      <span className="font-mono">{study.nct_id}</span>
                    </div>

                    {/* Purpose */}
                    <p className={`text-sm mb-4 line-clamp-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {study.purpose}
                    </p>

                    {/* Study Info */}
                    <div className="space-y-2">
                      <div className={`flex items-center space-x-2 text-xs ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        <Clock className="h-3 w-3" />
                        <span>{study.commitment}</span>
                      </div>
                      <div className={`flex items-center space-x-2 text-xs ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        <Building className="h-3 w-3" />
                        <span className="truncate">{study.sponsor}</span>
                      </div>
                    </div>

                    {/* Status Indicators */}
                    {isCurrentlySelected && (
                      <div className="absolute top-3 right-3">
                        <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                          isDarkMode ? 'bg-emerald-500 text-white' : 'bg-emerald-600 text-white'
                        }`}>
                          ✓ Selected
                        </div>
                      </div>
                    )}
                    
                    {isBeingPreviewed && !isCurrentlySelected && (
                      <div className="absolute top-3 right-3">
                        <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                          isDarkMode ? 'bg-blue-500 text-white' : 'bg-indigo-600 text-white'
                        }`}>
                          👁️ Preview
                        </div>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>

              {/* Study Preview Panel */}
              <div className={`sticky top-0 rounded-2xl backdrop-blur-md border p-6 ${
                isDarkMode 
                  ? 'bg-gray-800/30 border-gray-700/50' 
                  : 'bg-white/50 border-white/20'
              }`}>
                {selectedForPreview ? (
                  <div className="space-y-6">
                    {/* Preview Header with Status */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                          isDarkMode 
                            ? 'bg-gray-700/50 text-gray-300' 
                            : 'bg-white/70 text-gray-600'
                        }`}>
                          <span className="text-sm">{getCategoryIcon(selectedForPreview.category)}</span>
                          <span>{selectedForPreview.category}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            isDarkMode ? 'bg-gray-600/50' : 'bg-gray-200/70'
                          }`}>
                            {selectedForPreview.phase}
                          </span>
                        </div>
                        
                        {/* Status Badge */}
                        {selectedStudy?.id === selectedForPreview.id ? (
                          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                            isDarkMode ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30' : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                          }`}>
                            ✅ Currently Selected
                          </div>
                        ) : (
                          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                            isDarkMode ? 'bg-blue-500/20 text-blue-400 border border-blue-400/30' : 'bg-blue-100 text-blue-700 border border-blue-300'
                          }`}>
                            👁️ Previewing
                          </div>
                        )}
                      </div>
                      
                      <h3 className={`text-xl font-bold mb-2 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {selectedForPreview.title}
                      </h3>
                      
                      <div className={`flex items-center space-x-2 mb-4 text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        <Award className="h-4 w-4" />
                        <span className="font-mono">{selectedForPreview.nct_id}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <h4 className={`font-semibold mb-2 ${
                        isDarkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                        Description
                      </h4>
                      <p className={`text-sm ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {selectedForPreview.description}
                      </p>
                    </div>

                    {/* Purpose */}
                    <div>
                      <h4 className={`font-semibold mb-2 ${
                        isDarkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                        Study Purpose
                      </h4>
                      <p className={`text-sm ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {selectedForPreview.purpose}
                      </p>
                    </div>

                    {/* Commitment */}
                    <div>
                      <h4 className={`font-semibold mb-2 flex items-center space-x-2 ${
                        isDarkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                        <Clock className="h-4 w-4" />
                        <span>Time Commitment</span>
                      </h4>
                      <p className={`text-sm ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {selectedForPreview.commitment}
                      </p>
                    </div>

                    {/* Procedures */}
                    <div>
                      <h4 className={`font-semibold mb-2 flex items-center space-x-2 ${
                        isDarkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                        <Stethoscope className="h-4 w-4" />
                        <span>Key Procedures</span>
                      </h4>
                      <ul className={`text-sm space-y-1 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {selectedForPreview.procedures.map((procedure, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              isDarkMode ? 'bg-blue-400' : 'bg-indigo-500'
                            }`} />
                            <span>{procedure}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Sponsor */}
                    <div>
                      <h4 className={`font-semibold mb-2 flex items-center space-x-2 ${
                        isDarkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                        <Building className="h-4 w-4" />
                        <span>Sponsor</span>
                      </h4>
                      <p className={`text-sm ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {selectedForPreview.sponsor}
                      </p>
                    </div>

                    {/* Select Button */}
                    <button
                      onClick={() => handleStudySelect(selectedForPreview)}
                      disabled={selectedStudy?.id === selectedForPreview.id}
                      className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 ${
                        selectedStudy?.id === selectedForPreview.id
                          ? isDarkMode
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : isDarkMode
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white'
                          : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white'
                      }`}
                    >
                      {selectedStudy?.id === selectedForPreview.id ? 
                        '✅ Already Selected' : 
                        'Select This Study'
                      }
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                    <div className={`p-4 rounded-full mb-4 ${
                      isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'
                    }`}>
                      <FileText className={`h-8 w-8 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                    </div>
                    <h3 className={`text-lg font-semibold mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Select a Study
                    </h3>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Click on a study card to see detailed information
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 