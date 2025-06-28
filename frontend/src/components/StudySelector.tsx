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
                <h2 className={`text-3xl font-black bg-gradient-to-r bg-clip-text text-transparent transition-all duration-500 ${
                  isDarkMode 
                    ? 'from-emerald-400 via-teal-400 to-emerald-400' 
                    : 'from-emerald-600 via-teal-600 to-emerald-600'
                } drop-shadow-lg`}>
                  Select Clinical Study
                </h2>
                <p className={`text-base mt-2 leading-relaxed transition-all duration-500 ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-clip-text text-transparent' 
                    : 'bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 bg-clip-text text-transparent'
                } drop-shadow-sm`}>
                  Click any study card to preview details, then select to change your choice
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
                {studies.map((study) => {
                  const isCurrentlySelected = selectedStudy?.id === study.id;
                  const isBeingPreviewed = selectedForPreview?.id === study.id;
                  
                  return (
                    <div
                      key={study.id}
                      className={`group relative overflow-hidden rounded-3xl backdrop-blur-2xl border transition-all duration-700 hover:scale-[1.05] hover:-translate-y-3 cursor-pointer shadow-2xl ${
                        isCurrentlySelected
                          ? isDarkMode 
                            ? 'bg-gradient-to-br from-gray-800/60 via-gray-700/40 to-gray-800/60 border-gray-600/40 hover:shadow-2xl hover:shadow-emerald-500/30 ring-2 ring-emerald-400/70' 
                            : 'bg-gradient-to-br from-white/80 via-white/70 to-white/80 border-white/40 hover:shadow-2xl hover:shadow-emerald-500/25 ring-2 ring-emerald-500/70'
                          : isBeingPreviewed
                          ? isDarkMode 
                            ? 'bg-gradient-to-br from-gray-800/60 via-gray-700/40 to-gray-800/60 border-gray-600/40 hover:shadow-2xl hover:shadow-blue-500/30 ring-2 ring-blue-400/50' 
                            : 'bg-gradient-to-br from-white/80 via-white/70 to-white/80 border-white/40 hover:shadow-2xl hover:shadow-blue-500/25 ring-2 ring-indigo-400/50'
                          : isDarkMode 
                            ? 'bg-gradient-to-br from-gray-800/60 via-gray-700/40 to-gray-800/60 border-gray-600/40 hover:shadow-2xl hover:shadow-emerald-500/30' 
                            : 'bg-gradient-to-br from-white/80 via-white/70 to-white/80 border-white/40 hover:shadow-2xl hover:shadow-emerald-500/25'
                      } p-8`}
                      onClick={() => setSelectedForPreview(study)}
                    >
                      {/* Enhanced magical background effects */}
                      <div className={`absolute inset-0 bg-gradient-to-br opacity-8 transition-all duration-700 group-hover:opacity-20 rounded-3xl ${
                        isDarkMode ? 'from-emerald-500/20 to-teal-500/15' : 'from-emerald-400/15 to-teal-400/15'
                      }`}></div>
                      <div className={`absolute inset-0 bg-gradient-to-tr opacity-0 group-hover:opacity-10 transition-all duration-700 rounded-3xl ${
                        isDarkMode ? 'from-emerald-500/20 to-teal-500/20' : 'from-emerald-400/15 to-teal-400/15'
                      }`}></div>
                      
                      {/* Floating sparkles */}
                      <div className="absolute top-4 right-6 w-2 h-2 bg-emerald-400/40 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                      <div className="absolute top-8 right-12 w-1.5 h-1.5 bg-teal-400/30 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
                      <div className="absolute bottom-8 left-6 w-2.5 h-2.5 bg-emerald-300/25 rounded-full animate-bounce" style={{animationDelay: '0.6s'}}></div>
                      <div className="absolute bottom-4 right-8 w-1 h-1 bg-teal-300/20 rounded-full animate-bounce" style={{animationDelay: '0.9s'}}></div>
                      
                      <div className="relative z-10">
                      {/* Enhanced Category Badge */}
                      <div className="flex items-center justify-between mb-6">
                        <div className={`inline-flex items-center space-x-3 px-4 py-2.5 rounded-2xl text-sm font-bold backdrop-blur-md border shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-1 ${
                          isDarkMode 
                            ? 'bg-gradient-to-r from-gray-700/80 to-gray-600/60 text-gray-200 border-gray-500/50' 
                            : 'bg-gradient-to-r from-white/90 to-white/70 text-gray-700 border-gray-300/50'
                        }`}>
                          <span className="text-lg">{getCategoryIcon(study.category)}</span>
                          <span className="font-semibold">{study.category}</span>
                          <span className={`px-3 py-1 rounded-xl text-xs font-bold shadow-sm transition-all duration-300 ${
                            isDarkMode 
                              ? 'bg-gradient-to-r from-emerald-600/40 to-teal-600/40 text-emerald-300' 
                              : 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700'
                          }`}>
                            {study.phase}
                          </span>
                        </div>
                        <ChevronRight className={`h-5 w-5 transition-all duration-500 group-hover:translate-x-2 group-hover:scale-125 ${
                          isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                        }`} />
                      </div>

                      {/* Enhanced Study Title */}
                      <h3 className={`text-xl font-black mb-4 line-clamp-2 transition-all duration-500 group-hover:scale-105 ${
                        isDarkMode 
                          ? 'bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent' 
                          : 'bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent'
                      } drop-shadow-lg`}>
                        {study.title}
                      </h3>

                      {/* Enhanced NCT ID */}
                      <div className={`flex items-center space-x-3 mb-4 p-3 rounded-xl backdrop-blur-sm border transition-all duration-300 group-hover:scale-105 ${
                        isDarkMode 
                          ? 'bg-gray-700/30 border-gray-600/30' 
                          : 'bg-white/50 border-gray-200/30'
                      }`}>
                        <div className={`p-2 rounded-lg transition-all duration-300 ${
                          isDarkMode ? 'bg-emerald-600/20' : 'bg-emerald-100'
                        }`}>
                          <Award className={`h-4 w-4 ${
                            isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                          }`} />
                        </div>
                        <span className={`font-mono font-semibold text-sm ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>{study.nct_id}</span>
                      </div>

                      {/* Enhanced Purpose */}
                      <p className={`text-sm mb-6 line-clamp-3 leading-relaxed transition-all duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {study.purpose}
                      </p>

                      {/* Enhanced Study Info */}
                      <div className="space-y-3">
                        <div className={`flex items-center space-x-3 p-3 rounded-xl backdrop-blur-sm border transition-all duration-300 group-hover:scale-105 ${
                          isDarkMode 
                            ? 'bg-gray-700/30 border-gray-600/30' 
                            : 'bg-white/50 border-gray-200/30'
                        }`}>
                          <div className={`p-2 rounded-lg transition-all duration-300 ${
                            isDarkMode ? 'bg-teal-600/20' : 'bg-teal-100'
                          }`}>
                            <Clock className={`h-4 w-4 ${
                              isDarkMode ? 'text-teal-400' : 'text-teal-600'
                            }`} />
                          </div>
                          <span className={`text-sm font-medium ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>{study.commitment}</span>
                        </div>
                        
                        <div className={`flex items-center space-x-3 p-3 rounded-xl backdrop-blur-sm border transition-all duration-300 group-hover:scale-105 ${
                          isDarkMode 
                            ? 'bg-gray-700/30 border-gray-600/30' 
                            : 'bg-white/50 border-gray-200/30'
                        }`}>
                          <div className={`p-2 rounded-lg transition-all duration-300 ${
                            isDarkMode ? 'bg-purple-600/20' : 'bg-purple-100'
                          }`}>
                            <Building className={`h-4 w-4 ${
                              isDarkMode ? 'text-purple-400' : 'text-purple-600'
                            }`} />
                          </div>
                          <span className={`text-sm font-medium truncate ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>{study.sponsor}</span>
                        </div>
                      </div>

                      {/* Enhanced Status Indicators */}
                      {isCurrentlySelected && (
                        <div className="absolute top-6 right-20">
                          <div className={`px-4 py-2 rounded-full text-xs font-bold backdrop-blur-md border shadow-lg transition-all duration-500 animate-pulse ${
                            isDarkMode 
                              ? 'bg-gradient-to-r from-emerald-600/80 to-teal-600/80 text-white border-emerald-400/50' 
                              : 'bg-gradient-to-r from-emerald-500/90 to-teal-500/90 text-white border-emerald-300/50'
                          }`}>
                            ✓ Selected
                          </div>
                        </div>
                      )}
                      
                      {isBeingPreviewed && !isCurrentlySelected && (
                        <div className="absolute top-6 right-20">
                          <div className={`px-4 py-2 rounded-full text-xs font-bold backdrop-blur-md border shadow-lg transition-all duration-500 animate-pulse ${
                            isDarkMode 
                              ? 'bg-gradient-to-r from-blue-600/80 to-indigo-600/80 text-white border-blue-400/50' 
                              : 'bg-gradient-to-r from-indigo-500/90 to-purple-500/90 text-white border-indigo-300/50'
                          }`}>
                            👁️ Preview
                          </div>
                        </div>
                      )}
                      
                      {/* Enhanced floating decorative rings */}
                      <div className="absolute -top-16 -right-16 w-64 h-64 border border-emerald-300/10 rounded-full group-hover:scale-110 transition-transform duration-1000"></div>
                      <div className="absolute -bottom-12 -left-12 w-48 h-48 border border-teal-300/10 rounded-full group-hover:scale-110 transition-transform duration-1200"></div>
                      
                      {/* Enhanced shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-300/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1500 rounded-3xl"></div>
                      
                      {/* Premium glow effect */}
                      <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-40 transition-all duration-700 blur-xl ${
                        isDarkMode ? 'bg-emerald-400/20' : 'bg-emerald-400/15'
                      }`}></div>
                    </div>
                  </div>
                  );
                })}
              </div>

              {/* Enhanced Study Preview Panel */}
              <div className={`group sticky top-0 rounded-3xl backdrop-blur-2xl border shadow-2xl overflow-hidden transition-all duration-700 ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-gray-800/60 via-gray-700/40 to-gray-800/60 border-gray-600/40' 
                  : 'bg-gradient-to-br from-white/80 via-white/70 to-white/80 border-white/40'
              } p-8`}>
                {/* Enhanced magical background effects */}
                <div className={`absolute inset-0 bg-gradient-to-br opacity-8 transition-all duration-700 group-hover:opacity-15 rounded-3xl ${
                  isDarkMode ? 'from-blue-500/20 to-indigo-500/15' : 'from-blue-400/15 to-indigo-400/15'
                }`}></div>
                <div className={`absolute inset-0 bg-gradient-to-tr opacity-0 group-hover:opacity-8 transition-all duration-700 rounded-3xl ${
                  isDarkMode ? 'from-indigo-500/20 to-blue-500/20' : 'from-indigo-400/15 to-blue-400/15'
                }`}></div>
                
                {/* Floating sparkles */}
                <div className="absolute top-6 right-8 w-2 h-2 bg-blue-400/40 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                <div className="absolute top-12 right-14 w-1.5 h-1.5 bg-indigo-400/30 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                <div className="absolute bottom-12 left-8 w-2.5 h-2.5 bg-blue-300/25 rounded-full animate-bounce" style={{animationDelay: '0.8s'}}></div>
                <div className="absolute bottom-6 right-12 w-1 h-1 bg-indigo-300/20 rounded-full animate-bounce" style={{animationDelay: '1.2s'}}></div>
                
                <div className="relative z-10">
                {selectedForPreview ? (
                  <div className="space-y-8">
                    {/* Enhanced Preview Header */}
                    <div className={`relative p-6 rounded-2xl backdrop-blur-sm border shadow-lg ${
                      isDarkMode 
                        ? 'bg-gray-700/30 border-gray-600/30' 
                        : 'bg-white/50 border-gray-200/30'
                    }`}>
                      <div className="absolute top-3 right-3 w-2 h-2 bg-blue-400/40 rounded-full animate-pulse"></div>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className={`inline-flex items-center space-x-3 px-4 py-2.5 rounded-2xl text-sm font-bold backdrop-blur-md border shadow-lg transition-all duration-500 ${
                          isDarkMode 
                            ? 'bg-gradient-to-r from-gray-700/80 to-gray-600/60 text-gray-200 border-gray-500/50' 
                            : 'bg-gradient-to-r from-white/90 to-white/70 text-gray-700 border-gray-300/50'
                        }`}>
                          <span className="text-lg">{getCategoryIcon(selectedForPreview.category)}</span>
                          <span className="font-semibold">{selectedForPreview.category}</span>
                          <span className={`px-3 py-1 rounded-xl text-xs font-bold shadow-sm transition-all duration-300 ${
                            isDarkMode 
                              ? 'bg-gradient-to-r from-blue-600/40 to-indigo-600/40 text-blue-300' 
                              : 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700'
                          }`}>
                            {selectedForPreview.phase}
                          </span>
                        </div>
                        
                        {/* Enhanced Status Badge */}
                        {selectedStudy?.id === selectedForPreview.id ? (
                          <div className={`px-4 py-2 rounded-full text-xs font-bold backdrop-blur-md border shadow-lg transition-all duration-500 animate-pulse ${
                            isDarkMode 
                              ? 'bg-gradient-to-r from-emerald-600/80 to-teal-600/80 text-white border-emerald-400/50' 
                              : 'bg-gradient-to-r from-emerald-500/90 to-teal-500/90 text-white border-emerald-300/50'
                          }`}>
                            ✅ Currently Selected
                          </div>
                        ) : (
                          <div className={`px-4 py-2 rounded-full text-xs font-bold backdrop-blur-md border shadow-lg transition-all duration-500 animate-pulse ${
                            isDarkMode 
                              ? 'bg-gradient-to-r from-blue-600/80 to-indigo-600/80 text-white border-blue-400/50' 
                              : 'bg-gradient-to-r from-indigo-500/90 to-purple-500/90 text-white border-indigo-300/50'
                          }`}>
                            👁️ Previewing
                          </div>
                        )}
                      </div>
                      
                      <h3 className={`text-2xl font-black mb-4 line-clamp-2 transition-all duration-500 ${
                        isDarkMode 
                          ? 'bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent' 
                          : 'bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent'
                      } drop-shadow-lg`}>
                        {selectedForPreview.title}
                      </h3>
                      
                      <div className={`flex items-center space-x-3 p-3 rounded-xl backdrop-blur-sm border transition-all duration-300 ${
                        isDarkMode 
                          ? 'bg-gray-700/30 border-gray-600/30' 
                          : 'bg-white/50 border-gray-200/30'
                      }`}>
                        <div className={`p-2 rounded-lg transition-all duration-300 ${
                          isDarkMode ? 'bg-blue-600/20' : 'bg-blue-100'
                        }`}>
                          <Award className={`h-4 w-4 ${
                            isDarkMode ? 'text-blue-400' : 'text-blue-600'
                          }`} />
                        </div>
                        <span className={`font-mono font-semibold text-sm ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>{selectedForPreview.nct_id}</span>
                      </div>
                    </div>

                    {/* Enhanced Description */}
                    <div className={`relative p-6 rounded-2xl backdrop-blur-sm border shadow-lg ${
                      isDarkMode 
                        ? 'bg-gray-700/30 border-gray-600/30' 
                        : 'bg-white/50 border-gray-200/30'
                    }`}>
                      <div className="absolute top-3 right-3 w-2 h-2 bg-teal-400/40 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      
                      <h4 className={`text-lg font-black mb-3 bg-gradient-to-r bg-clip-text text-transparent ${
                        isDarkMode 
                          ? 'from-teal-400 to-blue-400' 
                          : 'from-teal-600 to-blue-600'
                      }`}>
                        Study Description
                      </h4>
                      <p className={`text-sm leading-relaxed ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {selectedForPreview.description}
                      </p>
                    </div>

                    {/* Enhanced Purpose */}
                    <div className={`relative p-6 rounded-2xl backdrop-blur-sm border shadow-lg ${
                      isDarkMode 
                        ? 'bg-gray-700/30 border-gray-600/30' 
                        : 'bg-white/50 border-gray-200/30'
                    }`}>
                      <div className="absolute top-3 right-3 w-2 h-2 bg-emerald-400/40 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                      
                      <h4 className={`text-lg font-black mb-3 bg-gradient-to-r bg-clip-text text-transparent ${
                        isDarkMode 
                          ? 'from-emerald-400 to-teal-400' 
                          : 'from-emerald-600 to-teal-600'
                      }`}>
                        Study Purpose
                      </h4>
                      <p className={`text-sm leading-relaxed ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {selectedForPreview.purpose}
                      </p>
                    </div>

                    {/* Enhanced Commitment & Procedures */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Enhanced Commitment */}
                      <div className={`relative p-6 rounded-2xl backdrop-blur-sm border shadow-lg ${
                        isDarkMode 
                          ? 'bg-gray-700/30 border-gray-600/30' 
                          : 'bg-white/50 border-gray-200/30'
                      }`}>
                        <div className="absolute top-3 right-3 w-2 h-2 bg-purple-400/40 rounded-full animate-pulse" style={{animationDelay: '0.6s'}}></div>
                        
                        <div className="flex items-center space-x-4 mb-3">
                          <div className={`p-3 rounded-xl ${
                            isDarkMode ? 'bg-purple-600/20' : 'bg-purple-100'
                          }`}>
                            <Clock className={`h-6 w-6 ${
                              isDarkMode ? 'text-purple-400' : 'text-purple-600'
                            }`} />
                          </div>
                          <h4 className={`text-lg font-black bg-gradient-to-r bg-clip-text text-transparent ${
                            isDarkMode 
                              ? 'from-purple-400 to-pink-400' 
                              : 'from-purple-600 to-pink-600'
                          }`}>
                            Time Commitment
                          </h4>
                        </div>
                        <p className={`text-sm font-semibold ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {selectedForPreview.commitment}
                        </p>
                      </div>

                      {/* Enhanced Procedures */}
                      <div className={`relative p-6 rounded-2xl backdrop-blur-sm border shadow-lg ${
                        isDarkMode 
                          ? 'bg-gray-700/30 border-gray-600/30' 
                          : 'bg-white/50 border-gray-200/30'
                      }`}>
                        <div className="absolute top-3 right-3 w-2 h-2 bg-indigo-400/40 rounded-full animate-pulse" style={{animationDelay: '0.8s'}}></div>
                        
                        <div className="flex items-center space-x-4 mb-4">
                          <div className={`p-3 rounded-xl ${
                            isDarkMode ? 'bg-indigo-600/20' : 'bg-indigo-100'
                          }`}>
                            <Stethoscope className={`h-6 w-6 ${
                              isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
                            }`} />
                          </div>
                          <h4 className={`text-lg font-black bg-gradient-to-r bg-clip-text text-transparent ${
                            isDarkMode 
                              ? 'from-indigo-400 to-blue-400' 
                              : 'from-indigo-600 to-blue-600'
                          }`}>
                            Key Procedures
                          </h4>
                        </div>
                        
                        <div className="space-y-2">
                          {selectedForPreview.procedures.map((procedure, index) => (
                            <div 
                              key={index}
                              className={`flex items-center space-x-3 p-2 rounded-lg transition-all duration-300 hover:scale-105 ${
                                isDarkMode 
                                  ? 'bg-indigo-600/10 hover:bg-indigo-600/20' 
                                  : 'bg-indigo-50 hover:bg-indigo-100'
                              }`}
                            >
                              <div className={`w-2 h-2 rounded-full ${
                                index % 4 === 0 ? 'bg-emerald-400' :
                                index % 4 === 1 ? 'bg-blue-400' :
                                index % 4 === 2 ? 'bg-purple-400' : 'bg-pink-400'
                              } animate-pulse`} style={{animationDelay: `${index * 0.2}s`}}></div>
                              <span className={`text-sm font-medium ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                {procedure}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Sponsor */}
                    <div className={`relative p-6 rounded-2xl backdrop-blur-sm border shadow-lg ${
                      isDarkMode 
                        ? 'bg-gray-700/30 border-gray-600/30' 
                        : 'bg-white/50 border-gray-200/30'
                    }`}>
                      <div className="absolute top-3 right-3 w-2 h-2 bg-amber-400/40 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                      
                      <div className="flex items-center space-x-4 mb-3">
                        <div className={`p-3 rounded-xl ${
                          isDarkMode ? 'bg-amber-600/20' : 'bg-amber-100'
                        }`}>
                          <Building className={`h-6 w-6 ${
                            isDarkMode ? 'text-amber-400' : 'text-amber-600'
                          }`} />
                        </div>
                        <h4 className={`text-lg font-black bg-gradient-to-r bg-clip-text text-transparent ${
                          isDarkMode 
                            ? 'from-amber-400 to-orange-400' 
                            : 'from-amber-600 to-orange-600'
                        }`}>
                          Research Sponsor
                        </h4>
                      </div>
                      <p className={`text-sm font-semibold ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {selectedForPreview.sponsor}
                      </p>
                    </div>

                    {/* Enhanced Select Button */}
                    <div className="flex justify-center pt-4">
                      <button
                        onClick={() => handleStudySelect(selectedForPreview)}
                        disabled={selectedStudy?.id === selectedForPreview.id}
                        className={`group relative px-8 py-4 rounded-2xl font-black text-lg transition-all duration-700 hover:scale-110 hover:-translate-y-2 backdrop-blur-md border shadow-2xl ${
                          selectedStudy?.id === selectedForPreview.id
                            ? isDarkMode
                              ? 'bg-gradient-to-r from-gray-600/80 to-gray-700/80 text-gray-400 border-gray-500/50 cursor-not-allowed'
                              : 'bg-gradient-to-r from-gray-300/80 to-gray-400/80 text-gray-500 border-gray-300/50 cursor-not-allowed'
                            : isDarkMode
                            ? 'bg-gradient-to-r from-blue-600/80 via-indigo-600/70 to-purple-600/80 hover:from-blue-500/90 hover:via-indigo-500/80 hover:to-purple-500/90 border-blue-500/50 text-white' 
                            : 'bg-gradient-to-r from-indigo-500/90 via-purple-500/80 to-pink-500/90 hover:from-indigo-600/95 hover:via-purple-600/85 hover:to-pink-600/95 border-indigo-400/50 text-white'
                        } hover:shadow-2xl ${
                          selectedStudy?.id === selectedForPreview.id
                            ? ''
                            : isDarkMode 
                              ? 'hover:shadow-blue-500/40' 
                              : 'hover:shadow-indigo-500/40'
                        }`}
                      >
                        <span className="relative z-10 flex items-center space-x-3">
                          {selectedStudy?.id === selectedForPreview.id ? (
                            <>
                              <span className="text-2xl">✅</span>
                              <span>Already Selected</span>
                            </>
                          ) : (
                            <>
                              <span className="text-2xl group-hover:scale-125 transition-transform duration-300">🎯</span>
                              <span>Select This Study</span>
                            </>
                          )}
                        </span>
                        
                        {!selectedStudy || selectedStudy.id !== selectedForPreview.id ? (
                          <>
                            {/* Enhanced button effects */}
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-indigo-400/20 to-purple-400/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                            <div className="absolute inset-0 bg-indigo-400/0 group-hover:bg-indigo-400/15 rounded-2xl blur-sm transition-all duration-500"></div>
                            
                            {/* Button sparkles */}
                            <div className="absolute top-2 right-3 w-1.5 h-1.5 bg-white/60 rounded-full opacity-0 group-hover:opacity-100 animate-bounce transition-all duration-300"></div>
                            <div className="absolute bottom-2 left-3 w-1 h-1 bg-white/40 rounded-full opacity-0 group-hover:opacity-100 animate-bounce transition-all duration-300" style={{animationDelay: '0.3s'}}></div>
                          </>
                        ) : null}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                    <div className={`relative p-8 rounded-3xl bg-gradient-to-br mb-8 shadow-2xl transition-all duration-500 group hover:scale-105 ${
                      isDarkMode 
                        ? 'from-blue-900/40 via-indigo-900/30 to-blue-900/40 border border-blue-700/30' 
                        : 'from-blue-100 via-indigo-100 to-blue-100 border border-blue-200/50'
                    }`}>
                      {/* Floating sparkles */}
                      <div className="absolute top-3 right-3 w-2 h-2 bg-blue-400/40 rounded-full animate-bounce"></div>
                      <div className="absolute bottom-3 left-3 w-1.5 h-1.5 bg-indigo-400/30 rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
                      
                      <FileText className="h-16 w-16 text-blue-400 drop-shadow-lg group-hover:scale-110 transition-transform duration-300" />
                      
                      {/* Glow effect */}
                      <div className="absolute inset-0 bg-blue-400/20 rounded-3xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
                    </div>
                    <h3 className={`text-2xl font-black mb-4 transition-all duration-500 ${
                      isDarkMode 
                        ? 'bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent' 
                        : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent'
                    } drop-shadow-lg`}>
                      Select a Study
                    </h3>
                    <p className={`text-base leading-relaxed max-w-md text-center transition-all duration-500 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Click on a study card to see detailed information and make your selection
                    </p>
                    
                    {/* Decorative elements */}
                    <div className="mt-6 flex space-x-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                    </div>
                  </div>
                )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 