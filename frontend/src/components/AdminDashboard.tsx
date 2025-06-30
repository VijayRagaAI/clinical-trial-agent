import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminInterview, AdminInterviewsResponse } from '../types/interview';
import { Study } from '../types/interview';
import { Plus, Users, CheckCircle, Clock, AlertCircle, Calendar, User, X, Eye, Download, Trash2, MessageSquare, ArrowUpDown, UserCircle, Search, Sparkles, FileText, Settings, Palette, Moon, Sun, Play, Mic, Pause, WifiOff, XCircle } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<AdminInterview[]>([]);
  const [stats, setStats] = useState({
    total_count: 0,
    completed_count: 0,
    in_progress_count: 0,
    abandoned_count: 0,
    paused_count: 0,
    interrupted_count: 0,
    incomplete_count: 0
  });
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [availableStudies, setAvailableStudies] = useState<Study[]>([]);
  const [selectedStudyForView, setSelectedStudyForView] = useState<Study | null>(null);
  const [showStudyModal, setShowStudyModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importQuery, setImportQuery] = useState('');
  const [importResults, setImportResults] = useState<any[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importingStudyId, setImportingStudyId] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [importedStudyInfo, setImportedStudyInfo] = useState<any>(null);
  const [showDeleteStudyModal, setShowDeleteStudyModal] = useState(false);
  const [studyToDelete, setStudyToDelete] = useState<any>(null);
  const [showDeleteInterviewModal, setShowDeleteInterviewModal] = useState(false);
  const [interviewToDelete, setInterviewToDelete] = useState<any>(null);

  useEffect(() => {
    fetchInterviews();
    loadThemePreference();
    loadAvailableStudies();
  }, []);

  const loadThemePreference = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE}/api/theme/preferences`);
      
      if (response.ok) {
        const data = await response.json();
        setIsDarkMode(data.is_dark_mode);
        console.log('✅ Loaded theme preference:', data.is_dark_mode ? 'Dark' : 'Light');
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    }
  };

  const handleThemeChange = async (newIsDarkMode: boolean) => {
    setIsDarkMode(newIsDarkMode);
    
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      const response = await fetch(`${API_BASE}/api/theme/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_dark_mode: newIsDarkMode
        })
      });

      if (response.ok) {
        console.log('✅ Theme preference saved:', newIsDarkMode ? 'Dark mode' : 'Light mode');
      } else {
        console.error('Failed to save theme preference');
      }
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const loadAvailableStudies = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE}/api/studies`);
      
      if (response.ok) {
        const data = await response.json();
        setAvailableStudies(data.studies);
        console.log('✅ Loaded available studies:', data.studies.length);
      } else {
        console.error('Failed to load available studies');
      }
    } catch (error) {
      console.error('Failed to load available studies:', error);
    }
  };

  const fetchInterviews = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE}/api/admin/interviews`);
      if (response.ok) {
        const data: AdminInterviewsResponse = await response.json();
        setInterviews(data.interviews);
        setStats({
          total_count: data.total_count,
          completed_count: data.completed_count,
          in_progress_count: data.in_progress_count,
          abandoned_count: data.abandoned_count,
          paused_count: data.paused_count,
          interrupted_count: data.interrupted_count,
          incomplete_count: data.incomplete_count
        });
        console.log(`✅ Loaded ${data.total_count} interviews from admin API`);
      } else {
        console.error('Failed to fetch interviews:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort interviews with error handling
  const filteredInterviews = React.useMemo(() => {
    try {
      if (!searchTerm || !interviews || interviews.length === 0) {
        console.log('📊 Search Debug: No search term or no interviews, returning all', { 
          searchTerm, 
          interviewCount: interviews?.length || 0 
        });
        return interviews;
      }
      
      const searchLower = searchTerm.toLowerCase().trim();
      if (!searchLower) return interviews;
      
      console.log('🔍 Search Debug: Filtering with term:', searchTerm);
      
      const filtered = interviews.filter(interview => {
        try {
          // Safely get all searchable text
          const searchableFields = [
            interview.participant_name || '',
            interview.participant_id || '',
            interview.session_id || '',
            interview.study_name || '',
            interview.study_id || '',
            interview.status || '',
            interview.eligibility_result?.eligible ? 'eligible' : interview.eligibility_result ? 'not eligible' : 'pending',
            interview.date || '', // Search raw date instead of formatted
            (interview.total_messages || 0).toString(),
            (interview.eligibility_result?.score || 0).toString()
          ].filter(field => field); // Remove empty strings
          
          // Check if any field contains the search term
          const matches = searchableFields.some(field => 
            field.toLowerCase().includes(searchLower)
          );
          
          console.log(`${matches ? '✅' : '❌'} ${interview.participant_id} (${interview.status}) - matches: ${matches}`);
          
          return matches;
        } catch (error) {
          console.warn('Error filtering interview:', error);
          return true; // Include interview if there's an error
        }
      });
      
      console.log('🎯 Search Results:', {
        searchTerm,
        totalInterviews: interviews.length,
        filteredCount: filtered.length,
        filtered: filtered.map(i => ({ name: i.participant_name, status: i.status }))
      });
      
      return filtered;
    } catch (error) {
      console.error('Error in filteredInterviews:', error);
      return interviews; // Return all interviews if there's an error
    }
  }, [interviews, searchTerm]);

  const sortedInterviews = [...filteredInterviews].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const handleSortByDate = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      'Completed': (
        <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 hover:scale-105 ${
          isDarkMode 
            ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50' 
            : 'bg-emerald-100 text-emerald-800 border border-emerald-200/50'
        }`}>
          <CheckCircle className="w-3 h-3 mr-1.5" />
          Completed
        </span>
      ),
      'In Progress': (
        <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 hover:scale-105 ${
          isDarkMode 
            ? 'bg-blue-900/40 text-blue-300 border border-blue-700/50' 
            : 'bg-blue-100 text-blue-800 border border-blue-200/50'
        }`}>
          <Clock className="w-3 h-3 mr-1.5" />
          In Progress
        </span>
      ),
      'Paused': (
        <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 hover:scale-105 ${
          isDarkMode 
            ? 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/50' 
            : 'bg-yellow-100 text-yellow-800 border border-yellow-200/50'
        }`}>
          <Pause className="w-3 h-3 mr-1.5" />
          Paused
        </span>
      ),
      'Interrupted': (
        <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 hover:scale-105 ${
          isDarkMode 
            ? 'bg-purple-900/40 text-purple-300 border border-purple-700/50' 
            : 'bg-purple-100 text-purple-800 border border-purple-200/50'
        }`}>
          <WifiOff className="w-3 h-3 mr-1.5" />
          Interrupted
        </span>
      ),
      'Incomplete': (
        <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 hover:scale-105 ${
          isDarkMode 
            ? 'bg-red-900/40 text-red-300 border border-red-700/50' 
            : 'bg-red-100 text-red-800 border border-red-200/50'
        }`}>
          <XCircle className="w-3 h-3 mr-1.5" />
          Incomplete
        </span>
      ),
      'Abandoned': (
        <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 hover:scale-105 ${
          isDarkMode 
            ? 'bg-orange-900/40 text-orange-300 border border-orange-700/50' 
            : 'bg-orange-100 text-orange-800 border border-orange-200/50'
        }`}>
          <AlertCircle className="w-3 h-3 mr-1.5" />
          Abandoned
        </span>
      )
    };
    return badges[status as keyof typeof badges] || (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-300 hover:scale-105 ${
        isDarkMode 
          ? 'bg-gray-800 text-gray-400 border-gray-700/50' 
          : 'bg-gray-100 text-gray-600 border-gray-200/50'
      }`}>
        {status}
      </span>
    );
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

  const getEligibilityBadge = (eligibility: AdminInterview['eligibility_result']) => {
    if (!eligibility) {
      return (
        <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-300 hover:scale-105 ${
          isDarkMode 
            ? 'bg-gray-800 text-gray-400 border-gray-700/50' 
            : 'bg-gray-100 text-gray-600 border-gray-200/50'
        }`}>
          N/A
        </span>
      );
    }

    return eligibility.eligible ? (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r border shadow-sm transition-all duration-300 hover:scale-105 ${
        isDarkMode 
          ? 'from-green-900/40 to-emerald-900/40 text-green-300 border-green-700/50' 
          : 'from-green-100 to-emerald-100 text-green-800 border-green-200/50'
      }`}>
        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
        ✓ Eligible
      </span>
    ) : (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r border shadow-sm transition-all duration-300 hover:scale-105 ${
        isDarkMode 
          ? 'from-red-900/40 to-orange-900/40 text-red-300 border-red-700/50' 
          : 'from-red-100 to-orange-100 text-red-800 border-red-200/50'
      }`}>
        <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
        ✗ Not Eligible
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Unknown';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const handleStartNewInterview = () => {
    // Navigate directly to interview page
    navigate('/interview');
  };

  const handleDeleteInterview = (participantId: string, participantName: string) => {
    setInterviewToDelete({ participantId, participantName });
    setShowDeleteInterviewModal(true);
  };

  const confirmDeleteInterview = async () => {
    if (!interviewToDelete) return;

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE}/api/admin/interviews/${interviewToDelete.participantId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Interview deleted successfully:', result.message);
        
        // Close modal and refresh the interviews list
        setShowDeleteInterviewModal(false);
        setInterviewToDelete(null);
        await fetchInterviews();
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        console.error('Failed to delete interview:', errorData);
        alert(`Failed to delete interview: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting interview:', error);
      alert('Failed to delete interview. Please check your connection and try again.');
    }
  };

  const handleViewInterview = (interview: AdminInterview) => {
    // Navigate to the interview viewer page
    navigate(`/interview/view/${interview.participant_id}`);
  };

  const handleDownloadInterview = async (interview: AdminInterview) => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE}/api/download/interview/${interview.participant_id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const interviewData = await response.json();
        
        // Create filename with participant_id and current date
        const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        const filename = `interview_${interview.participant_id}_${currentDate}.json`;
        
        // Create blob and download
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
        
        console.log('✅ Interview data downloaded successfully:', filename);
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        console.error('Failed to download interview data:', errorData);
        alert(`Failed to download interview data: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error downloading interview data:', error);
      alert('Failed to download interview data. Please check your connection and try again.');
    }
  };

  const handleViewStudy = (study: Study) => {
    setSelectedStudyForView(study);
    setShowStudyModal(true);
  };

  const closeStudyModal = () => {
    setShowStudyModal(false);
    setSelectedStudyForView(null);
  };

  const handleDeleteStudy = (studyId: string, studyTitle: string) => {
    setStudyToDelete({ id: studyId, title: studyTitle });
    setShowDeleteStudyModal(true);
  };

  const confirmDeleteStudy = async () => {
    if (!studyToDelete) return;

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE}/api/admin/studies/${studyToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        console.log(`✅ Study ${studyToDelete.id} deleted successfully`);
        
        // Close modals and refresh studies list
        setShowDeleteStudyModal(false);
        setStudyToDelete(null);
        closeStudyModal();
        await loadAvailableStudies();
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        console.error('❌ Failed to delete study:', errorData);
        alert(`Failed to delete study: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error deleting study:', error);
      alert('Failed to delete study. Please try again.');
    }
  };

  const handleSearchClinicalTrials = async () => {
    if (!importQuery.trim()) {
      setImportError('Please enter a search term');
      return;
    }

    setImportLoading(true);
    setImportError(null);
    setImportResults([]);

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(
        `${API_BASE}/api/clinicaltrials/search?query=${encodeURIComponent(importQuery)}&max_results=20`
      );

      if (response.ok) {
        const data = await response.json();
        setImportResults(data.studies || []);
        console.log(`✅ Found ${data.total_count} clinical trials for "${importQuery}"`);
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        setImportError(errorData.detail || 'Failed to search clinical trials');
      }
    } catch (error) {
      console.error('Error searching clinical trials:', error);
      setImportError('Failed to connect to ClinicalTrials.gov. Please try again.');
    } finally {
      setImportLoading(false);
    }
  };

  const performSearchWithValidation = async () => {
    await handleSearchClinicalTrials();
  };

  const performSearchWithoutValidation = async () => {
    setImportLoading(true);
    setImportError(null);
    setImportResults([]);

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(
        `${API_BASE}/api/clinicaltrials/search?query=${encodeURIComponent(importQuery)}&max_results=20`
      );

      if (response.ok) {
        const data = await response.json();
        setImportResults(data.studies || []);
        console.log(`✅ Found ${data.total_count} clinical trials for "${importQuery}"`);
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        setImportError(errorData.detail || 'Failed to search clinical trials');
      }
    } catch (error) {
      console.error('Error searching clinical trials:', error);
      setImportError('Failed to connect to ClinicalTrials.gov. Please try again.');
    } finally {
      setImportLoading(false);
    }
  };

  const performDirectSearch = async (searchQuery: string) => {
    setImportLoading(true);
    setImportError(null);
    setImportResults([]);

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(
        `${API_BASE}/api/clinicaltrials/search?query=${encodeURIComponent(searchQuery)}&max_results=20`
      );

      if (response.ok) {
        const data = await response.json();
        setImportResults(data.studies || []);
        console.log(`✅ Found ${data.total_count} clinical trials for "${searchQuery}"`);
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        setImportError(errorData.detail || 'Failed to search clinical trials');
      }
    } catch (error) {
      console.error('Error searching clinical trials:', error);
      setImportError('Failed to connect to ClinicalTrials.gov. Please try again.');
    } finally {
      setImportLoading(false);
    }
  };

  const handleImportStudy = async (study: any) => {
    try {
      setImportingStudyId(study.nct_id);
      setImportError(null);
      
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE}/api/clinicaltrials/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ study }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Study imported successfully:', result);
        
        // Show success message
        setImportedStudyInfo({
          title: study.title,
          nct_id: study.nct_id,
          study_id: result.study_id
        });
        setShowSuccessModal(true);
        
        // Refresh available studies to show the newly imported study
        await loadAvailableStudies();
        
        // Close the import modal
        closeImportModal();
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        setImportError(errorData.detail || 'Failed to import study');
      }
    } catch (error) {
      console.error('Error importing study:', error);
      setImportError('Failed to import study. Please check your connection and try again.');
    } finally {
      setImportingStudyId(null);
    }
  };

  const resetImportModal = () => {
    setImportQuery('');
    setImportResults([]);
    setImportError(null);
    setImportLoading(false);
    setImportingStudyId(null);
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    resetImportModal();
  };

  const StatCard = ({ icon: Icon, title, subtitle, value, color }: {
    icon: any;
    title: string;
    subtitle?: string;
    value: number;
    color: string;
  }) => (
    <div className={`group relative overflow-hidden rounded-3xl backdrop-blur-2xl border transition-all duration-700 hover:scale-[1.02] hover:shadow-xl hover:-translate-y-1 ${
      color === 'blue' 
        ? isDarkMode 
          ? 'bg-gradient-to-br from-gray-800/60 via-gray-700/40 to-gray-800/60 border-gray-600/40 hover:shadow-blue-500/30' 
          : 'bg-gradient-to-br from-white/80 via-white/70 to-white/80 border-white/40 hover:shadow-blue-500/25'
        : color === 'emerald'
        ? isDarkMode 
          ? 'bg-gradient-to-br from-gray-800/60 via-gray-700/40 to-gray-800/60 border-gray-600/40 hover:shadow-emerald-500/30' 
          : 'bg-gradient-to-br from-white/80 via-white/70 to-white/80 border-white/40 hover:shadow-emerald-500/25'
        : color === 'indigo'
        ? isDarkMode 
          ? 'bg-gradient-to-br from-gray-800/60 via-gray-700/40 to-gray-800/60 border-gray-600/40 hover:shadow-indigo-500/30' 
          : 'bg-gradient-to-br from-white/80 via-white/70 to-white/80 border-white/40 hover:shadow-indigo-500/25'
        : color === 'yellow'
        ? isDarkMode 
          ? 'bg-gradient-to-br from-gray-800/60 via-gray-700/40 to-gray-800/60 border-gray-600/40 hover:shadow-yellow-500/30' 
          : 'bg-gradient-to-br from-white/80 via-white/70 to-white/80 border-white/40 hover:shadow-yellow-500/25'
        : color === 'purple'
        ? isDarkMode 
          ? 'bg-gradient-to-br from-gray-800/60 via-gray-700/40 to-gray-800/60 border-gray-600/40 hover:shadow-purple-500/30' 
          : 'bg-gradient-to-br from-white/80 via-white/70 to-white/80 border-white/40 hover:shadow-purple-500/25'
        : color === 'red'
        ? isDarkMode 
          ? 'bg-gradient-to-br from-gray-800/60 via-gray-700/40 to-gray-800/60 border-gray-600/40 hover:shadow-red-500/30' 
          : 'bg-gradient-to-br from-white/80 via-white/70 to-white/80 border-white/40 hover:shadow-red-500/25'
        : isDarkMode 
          ? 'bg-gradient-to-br from-gray-800/60 via-gray-700/40 to-gray-800/60 border-gray-600/40 hover:shadow-orange-500/30' 
          : 'bg-gradient-to-br from-white/80 via-white/70 to-white/80 border-white/40 hover:shadow-orange-500/25'
    } p-4 shadow-2xl`}
      style={{
        animation: 'breathe 4s ease-in-out infinite',
        animationDelay: `${Math.random() * 2}s`
      }}
    >
      {/* Enhanced magical background effects */}
      <div className={`absolute inset-0 bg-gradient-to-br opacity-8 transition-all duration-700 group-hover:opacity-20 rounded-3xl ${
        color === 'blue' 
          ? 'from-blue-500/20 to-blue-600/15' 
          : color === 'emerald'
          ? 'from-emerald-500/20 to-emerald-600/15'
          : color === 'indigo'
          ? 'from-indigo-500/20 to-indigo-600/15'
          : color === 'yellow'
          ? 'from-yellow-500/20 to-yellow-600/15'
          : color === 'purple'
          ? 'from-purple-500/20 to-purple-600/15'
          : color === 'red'
          ? 'from-red-500/20 to-red-600/15'
          : 'from-orange-500/20 to-red-500/15'
      }`}></div>
      <div className={`absolute inset-0 bg-gradient-to-tr opacity-0 group-hover:opacity-10 transition-all duration-700 rounded-3xl ${
        color === 'blue' 
          ? isDarkMode ? 'from-blue-500/20 to-blue-600/20' : 'from-blue-400/15 to-blue-500/15'
          : color === 'emerald'
          ? isDarkMode ? 'from-emerald-500/20 to-emerald-600/20' : 'from-emerald-400/15 to-emerald-500/15'
          : color === 'indigo'
          ? isDarkMode ? 'from-indigo-500/20 to-indigo-600/20' : 'from-indigo-400/15 to-indigo-500/15'
          : color === 'yellow'
          ? isDarkMode ? 'from-yellow-500/20 to-yellow-600/20' : 'from-yellow-400/15 to-yellow-500/15'
          : color === 'purple'
          ? isDarkMode ? 'from-purple-500/20 to-purple-600/20' : 'from-purple-400/15 to-purple-500/15'
          : color === 'red'
          ? isDarkMode ? 'from-red-500/20 to-red-600/20' : 'from-red-400/15 to-red-500/15'
          : isDarkMode ? 'from-orange-500/20 to-red-500/20' : 'from-orange-400/15 to-red-400/15'
      }`}></div>
      
      {/* Floating sparkles */}
      <div className={`absolute top-4 right-6 w-2 h-2 rounded-full animate-bounce ${
        color === 'blue' ? 'bg-blue-400/40' : color === 'emerald' ? 'bg-emerald-400/40' : color === 'indigo' ? 'bg-indigo-400/40' : color === 'yellow' ? 'bg-yellow-400/40' : color === 'purple' ? 'bg-purple-400/40' : color === 'red' ? 'bg-red-400/40' : 'bg-orange-400/40'
      }`} style={{animationDelay: '0s'}}></div>
      <div className={`absolute top-8 right-12 w-1.5 h-1.5 rounded-full animate-bounce ${
        color === 'blue' ? 'bg-blue-300/30' : color === 'emerald' ? 'bg-emerald-300/30' : color === 'indigo' ? 'bg-indigo-300/30' : color === 'yellow' ? 'bg-yellow-300/30' : color === 'purple' ? 'bg-purple-300/30' : color === 'red' ? 'bg-red-300/30' : 'bg-orange-300/30'
      }`} style={{animationDelay: '0.3s'}}></div>
      <div className={`absolute bottom-8 left-6 w-2.5 h-2.5 rounded-full animate-bounce ${
        color === 'blue' ? 'bg-blue-300/25' : color === 'emerald' ? 'bg-emerald-300/25' : color === 'indigo' ? 'bg-indigo-300/25' : color === 'yellow' ? 'bg-yellow-300/25' : color === 'purple' ? 'bg-purple-300/25' : color === 'red' ? 'bg-red-300/25' : 'bg-orange-300/25'
      }`} style={{animationDelay: '0.6s'}}></div>
      <div className={`absolute bottom-4 right-8 w-1 h-1 rounded-full animate-bounce ${
        color === 'blue' ? 'bg-blue-200/20' : color === 'emerald' ? 'bg-emerald-200/20' : color === 'indigo' ? 'bg-indigo-200/20' : color === 'yellow' ? 'bg-yellow-200/20' : color === 'purple' ? 'bg-purple-200/20' : color === 'red' ? 'bg-red-200/20' : 'bg-orange-200/20'
      }`} style={{animationDelay: '0.9s'}}></div>
      
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className={`text-sm font-semibold mb-1 transition-all duration-500 group-hover:scale-105 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>{title}</p>
          {subtitle && (
            <p className={`text-xs mb-3 transition-all duration-500 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>{subtitle}</p>
          )}
          <p className={`text-2xl font-black group-hover:scale-110 transition-all duration-500 ${
            isDarkMode 
              ? 'bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent' 
              : 'bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent'
          } drop-shadow-lg`}>{value}</p>
        </div>
        <div className={`relative p-2 rounded-2xl bg-gradient-to-br shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-12 backdrop-blur-sm border ${
          color === 'blue' 
            ? 'from-blue-500 to-blue-600 shadow-blue-500/40 border-blue-400/30' 
            : color === 'emerald'
            ? 'from-emerald-500 to-emerald-600 shadow-emerald-500/40 border-emerald-400/30'
            : color === 'indigo'
            ? 'from-indigo-500 to-indigo-600 shadow-indigo-500/40 border-indigo-400/30'
            : color === 'yellow'
            ? 'from-yellow-500 to-yellow-600 shadow-yellow-500/40 border-yellow-400/30'
            : color === 'purple'
            ? 'from-purple-500 to-purple-600 shadow-purple-500/40 border-purple-400/30'
            : color === 'red'
            ? 'from-red-500 to-red-600 shadow-red-500/40 border-red-400/30'
            : 'from-orange-500 to-red-500 shadow-orange-500/40 border-orange-400/30'
        }`}>
          <Icon className="w-6 h-6 text-white drop-shadow-lg" />
          
          {/* Enhanced floating mini-circles */}
          <div className="absolute top-1 right-1 w-2 h-2 bg-white/40 rounded-full animate-pulse"></div>
          <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-white/30 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute top-2 left-2 w-1 h-1 bg-white/20 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
          
          {/* Enhanced glow effect */}
          <div className={`absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-all duration-700 ${
            color === 'blue' 
              ? 'bg-blue-400/30' 
              : color === 'emerald'
              ? 'bg-emerald-400/30'
              : color === 'indigo'
              ? 'bg-indigo-400/30'
              : color === 'yellow'
              ? 'bg-yellow-400/30'
              : color === 'purple'
              ? 'bg-purple-400/30'
              : color === 'red'
              ? 'bg-red-400/30'
              : 'bg-orange-400/30'
          }`}></div>
        </div>
      </div>
      
      {/* Enhanced floating decorative rings */}
      <div className={`absolute -top-16 -right-16 w-64 h-64 border rounded-full group-hover:scale-110 transition-transform duration-1000 ${
        color === 'blue' ? 'border-blue-300/10' : color === 'emerald' ? 'border-emerald-300/10' : color === 'indigo' ? 'border-indigo-300/10' : color === 'yellow' ? 'border-yellow-300/10' : color === 'purple' ? 'border-purple-300/10' : color === 'red' ? 'border-red-300/10' : 'border-orange-300/10'
      }`}></div>
      <div className={`absolute -bottom-12 -left-12 w-48 h-48 border rounded-full group-hover:scale-110 transition-transform duration-1200 ${
        color === 'blue' ? 'border-blue-300/10' : color === 'emerald' ? 'border-emerald-300/10' : color === 'indigo' ? 'border-indigo-300/10' : color === 'yellow' ? 'border-yellow-300/10' : color === 'purple' ? 'border-purple-300/10' : color === 'red' ? 'border-red-300/10' : 'border-orange-300/10'
      }`}></div>
      
      {/* Enhanced shimmer effect */}
      <div className={`absolute inset-0 bg-gradient-to-r from-transparent to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1500 rounded-3xl ${
        color === 'blue' ? 'via-blue-300/10' : color === 'emerald' ? 'via-emerald-300/10' : color === 'indigo' ? 'via-indigo-300/10' : color === 'yellow' ? 'via-yellow-300/10' : color === 'purple' ? 'via-purple-300/10' : color === 'red' ? 'via-red-300/10' : 'via-orange-300/10'
      }`}></div>
      
      {/* Premium glow effect */}
      <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-40 transition-all duration-700 blur-xl ${
        color === 'blue' 
          ? isDarkMode ? 'bg-blue-400/20' : 'bg-blue-400/15'
          : color === 'emerald'
          ? isDarkMode ? 'bg-emerald-400/20' : 'bg-emerald-400/15'
          : color === 'indigo'
          ? isDarkMode ? 'bg-indigo-400/20' : 'bg-indigo-400/15'
          : color === 'yellow'
          ? isDarkMode ? 'bg-yellow-400/20' : 'bg-yellow-400/15'
          : color === 'purple'
          ? isDarkMode ? 'bg-purple-400/20' : 'bg-purple-400/15'
          : color === 'red'
          ? isDarkMode ? 'bg-red-400/20' : 'bg-red-400/15'
          : isDarkMode ? 'bg-orange-400/20' : 'bg-orange-400/15'
      }`}></div>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
      `}</style>
      <div className={`min-h-screen transition-all duration-500 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
          : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'
      }`}>
      {/* Enhanced Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl transform translate-x-32 -translate-y-32 transition-all duration-500 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-blue-600/20 to-purple-800/20' 
            : 'bg-gradient-to-br from-blue-400/10 to-purple-600/10'
        }`}></div>
        <div className={`absolute bottom-0 left-0 w-80 h-80 rounded-full blur-3xl transform -translate-x-32 translate-y-32 transition-all duration-500 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-emerald-600/20 to-teal-800/20' 
            : 'bg-gradient-to-br from-emerald-400/10 to-teal-600/10'
        }`}></div>
        <div className={`absolute top-1/2 left-1/2 w-64 h-64 rounded-full blur-2xl transform -translate-x-32 -translate-y-32 transition-all duration-500 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-pink-600/15 to-purple-800/15' 
            : 'bg-gradient-to-br from-pink-400/5 to-purple-600/5'
        }`}></div>
      </div>

      {/* Settings Panel - Like Interview UI */}
      <div className="fixed right-4 top-8 z-50">
        <div className={`backdrop-blur-xl rounded-3xl shadow-2xl border p-6 w-64 transition-all duration-500 ${
          isDarkMode 
            ? 'bg-gray-800/40 border-gray-700/30 shadow-black/20' 
            : 'bg-white/80 border-white/20 shadow-indigo-500/10'
        }`}>
          {/* Settings Header */}
          <div className="text-center mb-6">
            <div className={`inline-flex p-3 rounded-2xl backdrop-blur-sm transition-all duration-500 ${
              isDarkMode 
                ? 'bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-purple-600/20 border border-blue-500/30' 
                : 'bg-gradient-to-br from-indigo-50/80 via-purple-50/60 to-pink-50/80 border border-indigo-200/50'
            }`}>
              <Settings className={`h-7 w-7 ${isDarkMode ? 'text-blue-400' : 'text-indigo-600'}`} />
            </div>
            <h3 className={`text-lg font-bold mt-3 ${
              isDarkMode 
                ? 'bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent' 
                : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent'
            }`}>
              Settings
            </h3>
            <div className="flex justify-center mt-2">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0ms'} as React.CSSProperties}></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '150ms'} as React.CSSProperties}></div>
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '300ms'} as React.CSSProperties}></div>
              </div>
            </div>
          </div>

          {/* Enhanced Theme Settings with Study Card Effects */}
          <div className="group/card relative overflow-hidden rounded-3xl backdrop-blur-2xl border-2 shadow-2xl transition-all duration-700 hover:scale-[1.08] hover:-translate-y-3 cursor-pointer">
            {/* Magical background layers */}
            <div className={`absolute inset-0 bg-gradient-to-br opacity-60 transition-all duration-700 group-hover/card:opacity-80 rounded-3xl ${
              isDarkMode 
                ? 'from-amber-800/60 via-orange-700/40 to-amber-800/60' 
                : 'from-orange-100/80 via-amber-50/70 to-orange-100/80'
            }`}></div>
            
            {/* Enhanced shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent transform -skew-x-12 -translate-x-full group-hover/card:translate-x-full transition-transform duration-1000 rounded-3xl"></div>
            
            {/* Floating sparkles */}
            <div className="absolute top-4 right-6 w-2 h-2 bg-amber-400/60 rounded-full animate-bounce shadow-lg shadow-amber-400/40" style={{animationDelay: '0.1s'}}></div>
            <div className="absolute bottom-4 left-6 w-1.5 h-1.5 bg-orange-400/50 rounded-full animate-bounce shadow-md shadow-orange-400/60" style={{animationDelay: '0.8s'}}></div>
            <div className="absolute top-1/2 right-8 w-1 h-1 bg-amber-300/60 rounded-full animate-bounce shadow-sm shadow-amber-300/50" style={{animationDelay: '1.3s'}}></div>
            <div className="absolute top-6 left-1/2 w-1.5 h-1.5 bg-orange-300/70 rounded-full animate-bounce shadow-md shadow-orange-300/60" style={{animationDelay: '0.4s'}}></div>
            
            {/* Floating decorative rings */}
            <div className="absolute top-3 right-3 w-8 h-8 border border-amber-400/20 rounded-full opacity-0 group-hover/card:opacity-60 group-hover/card:scale-110 transition-all duration-500"></div>
            <div className="absolute bottom-3 left-3 w-6 h-6 border border-orange-400/30 rounded-full opacity-0 group-hover/card:opacity-50 group-hover/card:scale-125 transition-all duration-700" style={{animationDelay: '0.2s'}}></div>
            
            {/* Enhanced border glow */}
            <div className={`absolute inset-0 rounded-3xl border-2 opacity-0 group-hover/card:opacity-100 transition-all duration-500 ${
              isDarkMode ? 'border-amber-400/50' : 'border-orange-500/60'
            }`}></div>
            
            <button
              onClick={() => handleThemeChange(!isDarkMode)}
              className="relative w-full p-4 rounded-3xl transition-all duration-700"
            >
              <div className="relative z-10 flex flex-col items-center space-y-3">
                <div className={`relative p-3 rounded-xl transition-all duration-500 group-hover/card:rotate-12 group-hover/card:scale-110 shadow-xl ${
                  isDarkMode ? 'bg-amber-600/30 shadow-amber-600/40' : 'bg-orange-500/30 shadow-orange-500/40'
                }`}>
                  <Palette className={`h-6 w-6 ${isDarkMode ? 'text-amber-300' : 'text-orange-700'} drop-shadow-lg`} />
                  
                  {/* Enhanced Theme Badge */}
                  <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-500 group-hover/card:scale-110 group-hover/card:rotate-12 shadow-xl ${
                    isDarkMode 
                      ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border-amber-400 shadow-amber-500/50' 
                      : 'bg-gradient-to-br from-orange-600 to-amber-700 text-white border-orange-500 shadow-orange-600/50'
                  } animate-pulse`}>
                    {isDarkMode ? (
                      <Moon className="h-4 w-4" />
                    ) : (
                      <Sun className="h-4 w-4" />
                    )}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className={`font-semibold text-sm bg-gradient-to-r bg-clip-text text-transparent transition-all duration-500 ${
                    isDarkMode 
                      ? 'from-amber-300 via-orange-300 to-amber-300' 
                      : 'from-orange-700 via-amber-700 to-orange-700'
                  } drop-shadow-lg`}>
                    Theme Mode
                  </div>
                  <div className={`text-xs mt-1 font-semibold transition-all duration-500 ${
                    isDarkMode ? 'text-amber-400/70' : 'text-orange-600/70'
                  }`}>
                    {isDarkMode ? 'Dark theme' : 'Light theme'}
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* Decorative bottom element */}
          <div className="mt-6 pt-4 border-t border-gray-200/20">
            <div className="flex justify-center">
              <div className={`w-12 h-1 rounded-full ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500' 
                  : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'
              }`} />
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mr-72">
        {/* Enhanced Header with Interview UI styling */}
        <div className="mb-12">
          <div className="flex items-center space-x-4 mb-4">
            {/* Fancy Logo with glass morphism */}
            <div className={`relative p-4 rounded-2xl backdrop-blur-xl border shadow-2xl transition-all duration-500 hover:scale-105 hover:rotate-3 ${
              isDarkMode 
                ? 'bg-gradient-to-br from-gray-800/80 via-gray-700/60 to-gray-800/80 border-gray-600/30' 
                : 'bg-gradient-to-br from-white/80 via-indigo-50/60 to-white/80 border-white/30'
            }`}>
              {/* Decorative elements */}
              <div className={`absolute top-1 right-1 w-2 h-2 rounded-full animate-pulse ${
                isDarkMode ? 'bg-blue-400/50' : 'bg-indigo-400/50'
              }`}></div>
              <div className={`absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full animate-pulse ${
                isDarkMode ? 'bg-purple-400/40' : 'bg-purple-400/40'
              }`} style={{animationDelay: '0.5s'}}></div>
              
              <MessageSquare className={`h-8 w-8 ${isDarkMode ? 'text-blue-400/70' : 'text-indigo-500/70'}`} />
              
              {/* Glow effect */}
              <div className={`absolute inset-0 rounded-2xl blur-lg opacity-0 hover:opacity-20 transition-opacity duration-500 ${
                isDarkMode ? 'bg-blue-400' : 'bg-indigo-400'
              }`}></div>
            </div>
            
            <div>
              <h1 className={`text-5xl font-bold bg-gradient-to-r bg-clip-text text-transparent drop-shadow-lg transition-all duration-500 ${
                isDarkMode 
                  ? 'from-blue-400 via-indigo-400 to-purple-400' 
                  : 'from-indigo-600 via-purple-600 to-pink-600'
              }`}>
                Clinical Trial Voice Interviewer
              </h1>
              <p className={`text-lg mt-2 transition-all duration-500 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Admin Dashboard - Manage and monitor all clinical trial interviews
              </p>
              
              {/* Animated dots below description */}
              <div className="flex space-x-1 mt-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0ms'} as React.CSSProperties}></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '150ms'} as React.CSSProperties}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '300ms'} as React.CSSProperties}></div>
              </div>
            </div>
          </div>
          
          {/* Enhanced decorative line with gradient */}
          <div className={`h-1 rounded-full opacity-60 transition-all duration-500 ${
            isDarkMode 
              ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500' 
              : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'
          }`}></div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="flex justify-center mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl">
            <StatCard
              icon={Users}
              title="Total"
              value={stats.total_count}
              color="blue"
            />
            <StatCard
              icon={CheckCircle}
              title="Completed"
              value={stats.completed_count}
              color="emerald"
            />
            <StatCard
              icon={Clock}
              title="In Progress"
              value={stats.in_progress_count}
              color="indigo"
            />
          </div>
        </div>
        
        <div className="flex justify-center mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl">
          <StatCard
            icon={Pause}
            title="Paused"
            subtitle="Interview paused"
            value={stats.paused_count}
            color="yellow"
          />
          <StatCard
            icon={AlertCircle}
            title="Abandoned"
            subtitle="Study changed"
            value={stats.abandoned_count}
            color="orange"
          />
          <StatCard
            icon={WifiOff}
            title="Interrupted"
            subtitle="Page refreshed"
            value={stats.interrupted_count}
            color="purple"
          />
          <StatCard
            icon={XCircle}
            title="Incomplete"
            subtitle="Consent not given"
            value={stats.incomplete_count}
            color="red"
          />
          </div>
        </div>

        {/* ✨ SPECIAL SHINING Start New Interview Card ✨ */}
        <div className="flex justify-center mb-12">
          <div className="w-full max-w-md relative">
            {/* ✨ SPECIAL GLOW RING AROUND THE CARD ✨ */}
            <div className={`absolute -inset-1 bg-gradient-to-r rounded-3xl blur-sm opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse ${
              isDarkMode 
                ? 'from-purple-600 via-pink-600 to-indigo-600' 
                : 'from-purple-500 via-pink-500 to-indigo-500'
            }`} style={{animationDuration: '3s'}}></div>
            
            <div className={`group relative overflow-hidden rounded-3xl backdrop-blur-2xl border-2 p-6 shadow-2xl transition-all duration-700 transform hover:scale-[1.05] hover:-translate-y-4 cursor-pointer ${
              isDarkMode 
                ? 'bg-gradient-to-br from-gray-800/70 via-purple-900/50 to-gray-800/70 border-purple-400/60 hover:shadow-2xl hover:shadow-purple-400/50' 
                : 'bg-gradient-to-br from-white/90 via-purple-50/60 to-white/90 border-purple-300/60 hover:shadow-2xl hover:shadow-purple-400/40'
            }`}>
              {/* ✨ ENHANCED MAGICAL BACKGROUND EFFECTS FOR STANDOUT ✨ */}
              <div className={`absolute inset-0 bg-gradient-to-br opacity-15 transition-all duration-700 group-hover:opacity-30 rounded-3xl ${
                isDarkMode ? 'from-purple-500/30 via-pink-500/25 to-indigo-500/30' : 'from-purple-400/25 via-pink-400/20 to-indigo-400/25'
              }`}></div>
              <div className={`absolute inset-0 bg-gradient-to-tr opacity-0 group-hover:opacity-20 transition-all duration-700 rounded-3xl ${
                isDarkMode ? 'from-pink-500/25 via-purple-500/30 to-indigo-500/25' : 'from-pink-400/20 via-purple-400/25 to-indigo-400/20'
              }`}></div>
              
              {/* ✨ ENHANCED FLOATING SPARKLES WITH GLOW ✨ */}
              <div className={`absolute top-4 right-6 w-3 h-3 rounded-full animate-bounce shadow-lg ${
                isDarkMode ? 'bg-yellow-400/60 shadow-yellow-400/40' : 'bg-yellow-300/50 shadow-yellow-300/30'
              }`} style={{animationDelay: '0s'}}></div>
              <div className={`absolute top-8 right-12 w-2.5 h-2.5 rounded-full animate-bounce shadow-md ${
                isDarkMode ? 'bg-pink-400/50 shadow-pink-400/30' : 'bg-pink-300/40 shadow-pink-300/20'
              }`} style={{animationDelay: '0.3s'}}></div>
              <div className={`absolute bottom-8 left-6 w-3.5 h-3.5 rounded-full animate-bounce shadow-lg ${
                isDarkMode ? 'bg-cyan-400/50 shadow-cyan-400/30' : 'bg-cyan-300/40 shadow-cyan-300/20'
              }`} style={{animationDelay: '0.6s'}}></div>
              <div className={`absolute bottom-4 right-8 w-2 h-2 rounded-full animate-bounce shadow-sm ${
                isDarkMode ? 'bg-purple-400/40 shadow-purple-400/20' : 'bg-purple-300/30 shadow-purple-300/15'
              }`} style={{animationDelay: '0.9s'}}></div>
              
              {/* ✨ EXTRA SPARKLES FOR MORE MAGIC ✨ */}
              <div className={`absolute top-16 left-8 w-2.5 h-2.5 rounded-full animate-bounce ${
                isDarkMode ? 'bg-emerald-400/40' : 'bg-emerald-300/30'
              }`} style={{animationDelay: '1.2s'}}></div>
              <div className={`absolute bottom-16 right-16 w-2 h-2 rounded-full animate-bounce ${
                isDarkMode ? 'bg-rose-400/40' : 'bg-rose-300/30'
              }`} style={{animationDelay: '1.5s'}}></div>
              
              <div className="relative z-10 text-center">
                <div className="flex justify-center mb-4">
                  <div className={`relative p-3 rounded-2xl backdrop-blur-sm shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 ${
                    isDarkMode ? 'bg-gray-700/40' : 'bg-white/20'
                  }`}>
                    <Sparkles className={`w-6 h-6 drop-shadow-lg ${
                      isDarkMode ? 'text-yellow-300' : 'text-yellow-200'
                    }`} />
                    <div className={`absolute inset-0 bg-gradient-to-br to-transparent rounded-2xl ${
                      isDarkMode ? 'from-gray-600/30' : 'from-white/30'
                    }`}></div>
                    {/* Enhanced glow effect */}
                    <div className={`absolute inset-0 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500 ${
                      isDarkMode ? 'bg-yellow-300/30' : 'bg-yellow-400/20'
                    }`}></div>
                  </div>
                </div>
                
                <h2 className={`text-3xl font-black drop-shadow-lg mb-4 bg-gradient-to-r bg-clip-text transition-all duration-500 group-hover:scale-105 ${
                  isDarkMode 
                    ? 'from-purple-300 via-indigo-200 to-purple-300 text-transparent' 
                    : 'from-purple-800 via-indigo-800 to-purple-800 text-transparent'
                }`}>
                  ✨ Launch New Interview ✨
                </h2>
                <p className={`mb-6 text-sm leading-relaxed max-w-sm mx-auto transition-all duration-500 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Begin an intelligent screening session with our AI-powered Voice assistant.
                </p>
                
                <button
                  onClick={handleStartNewInterview}
                  className={`group/btn relative overflow-hidden backdrop-blur-xl border-2 font-bold text-xl transition-all duration-500 flex items-center gap-5 hover:gap-7 shadow-2xl mx-auto px-12 py-5 rounded-2xl ${
                    isDarkMode 
                      ? 'bg-gradient-to-r from-purple-600/40 via-pink-600/35 to-indigo-600/40 hover:from-purple-500/60 hover:via-pink-500/55 hover:to-indigo-500/60 border-pink-400/70 hover:border-pink-300/90 text-white hover:shadow-pink-500/50' 
                      : 'bg-gradient-to-r from-purple-200/90 via-pink-200/80 to-indigo-200/90 hover:from-purple-300/95 hover:via-pink-300/85 hover:to-indigo-300/95 border-pink-400/70 hover:border-pink-500/90 text-purple-900 hover:shadow-pink-500/40'
                  }`}
                >
                  {/* ✨ ENHANCED BUTTON BACKGROUND EFFECTS ✨ */}
                  <div className={`absolute inset-0 bg-gradient-to-r from-transparent to-transparent transition-all duration-500 ${
                    isDarkMode ? 'via-pink-300/15 group-hover/btn:via-pink-200/25' : 'via-pink-400/15 group-hover/btn:via-pink-300/25'
                  }`}></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-300/10 via-pink-300/15 to-purple-300/10 opacity-0 group-hover/btn:opacity-100 transition-all duration-500"></div>
                  
                  {/* ✨ ENHANCED PLAY ICON WITH SPECIAL EFFECTS ✨ */}
                  <div className="relative">
                    <Play className="w-6 h-6 group-hover/btn:scale-150 group-hover/btn:translate-x-2 transition-all duration-700 relative z-10 drop-shadow-lg" />
                    <div className={`absolute inset-0 rounded-full blur-sm opacity-0 group-hover/btn:opacity-60 transition-all duration-500 ${
                      isDarkMode ? 'bg-pink-300/40' : 'bg-pink-400/30'
                    }`}></div>
                  </div>
                  
                  <span className="relative z-10 group-hover/btn:scale-110 transition-all duration-500">✨ Start Interview</span>
                  
                  {/* ✨ MULTIPLE GLOW EFFECTS ✨ */}
                  <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover/btn:opacity-40 transition-all duration-500 blur-lg ${
                    isDarkMode ? 'bg-pink-400/30' : 'bg-pink-400/20'
                  }`}></div>
                  <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover/btn:opacity-20 transition-all duration-700 blur-xl ${
                    isDarkMode ? 'bg-purple-400/20' : 'bg-purple-400/15'
                  }`}></div>
                  
                  {/* ✨ BUTTON SPARKLES ✨ */}
                  <div className="absolute top-2 right-3 w-1.5 h-1.5 bg-yellow-300/50 rounded-full opacity-0 group-hover/btn:opacity-100 animate-bounce transition-all duration-300"></div>
                  <div className="absolute bottom-2 left-3 w-1 h-1 bg-pink-300/40 rounded-full opacity-0 group-hover/btn:opacity-100 animate-bounce transition-all duration-300" style={{animationDelay: '0.2s'}}></div>
                </button>
              </div>
              
              {/* Enhanced floating decorative rings like study cards */}
              <div className="absolute -top-16 -right-16 w-64 h-64 border border-purple-300/10 rounded-full group-hover:scale-110 transition-transform duration-1000"></div>
              <div className="absolute -bottom-12 -left-12 w-48 h-48 border border-indigo-300/10 rounded-full group-hover:scale-110 transition-transform duration-1200"></div>
              
              {/* Enhanced shimmer effect like study cards */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-300/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1500 rounded-3xl"></div>
              
              {/* ✨ ENHANCED PREMIUM GLOW EFFECT ✨ */}
              <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-60 transition-all duration-700 blur-xl ${
                isDarkMode ? 'bg-purple-400/30' : 'bg-purple-400/25'
              }`}></div>
              <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-30 transition-all duration-1000 blur-2xl ${
                isDarkMode ? 'bg-pink-400/20' : 'bg-pink-400/15'
              }`}></div>
              
              {/* ✨ EXTRA FLOATING RINGS FOR MAGIC ✨ */}
              <div className="absolute -top-20 -right-20 w-80 h-80 border border-purple-300/20 rounded-full group-hover:scale-125 group-hover:rotate-12 transition-all duration-1500"></div>
              <div className="absolute -bottom-16 -left-16 w-64 h-64 border border-pink-300/15 rounded-full group-hover:scale-125 group-hover:-rotate-12 transition-all duration-1800"></div>
            </div>
          </div>
        </div>

        {/* Available Studies Section */}
        <div className="mb-12">
          {/* Section Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`relative p-3 rounded-xl backdrop-blur-md border shadow-lg transition-all duration-500 hover:scale-105 hover:rotate-3 ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-emerald-600/20 via-teal-600/10 to-emerald-600/20 border-emerald-500/30' 
                    : 'bg-gradient-to-br from-emerald-50/80 via-teal-50/60 to-emerald-50/80 border-emerald-200/30'
                }`}>
                  <div className={`absolute top-1 right-1 w-2 h-2 rounded-full animate-pulse ${
                    isDarkMode ? 'bg-emerald-400/50' : 'bg-emerald-400/50'
                  }`}></div>
                  <FileText className={`h-6 w-6 ${isDarkMode ? 'text-emerald-400/70' : 'text-emerald-500/70'}`} />
                </div>
                
                <div>
                  <h2 className={`text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent transition-all duration-500 ${
                    isDarkMode 
                      ? 'from-emerald-400 via-teal-400 to-emerald-400' 
                      : 'from-emerald-600 via-teal-600 to-emerald-600'
                  }`}>
                    Available Studies
                  </h2>
                  <p className={`text-base mt-1 transition-all duration-500 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {availableStudies.length} clinical trials available for interviews
                  </p>
                </div>
              </div>

              {/* Import from ClinicalTrials.gov Button - Simple & Elegant */}
              <div className="relative">
                <button
                  onClick={() => setShowImportModal(true)}
                  className={`group relative flex items-center space-x-3 px-6 py-4 rounded-3xl font-bold text-sm transition-all duration-500 hover:scale-105 backdrop-blur-md border shadow-lg ${
                    isDarkMode 
                      ? 'bg-gradient-to-br from-emerald-900/40 via-teal-900/30 to-emerald-900/40 hover:from-emerald-800/50 hover:via-teal-800/40 hover:to-emerald-800/50 border-emerald-700/30 text-emerald-400 hover:shadow-emerald-400/30' 
                      : 'bg-gradient-to-br from-emerald-100 via-teal-100 to-emerald-100 hover:from-emerald-200 hover:via-teal-200 hover:to-emerald-200 border-emerald-200/50 text-emerald-600 hover:shadow-emerald-400/30'
                  } hover:shadow-xl`}
                >
                  <Plus className="h-4 w-4 group-hover:scale-110 group-hover:rotate-90 transition-all duration-300" />
                  <span className="relative z-10">Import from ClinicalTrials.gov</span>
                  
                  {/* Simple glow effect */}
                  <div className="absolute inset-0 bg-emerald-400/0 group-hover:bg-emerald-400/15 rounded-3xl transition-all duration-500"></div>
                  
                  {/* Subtle sparkle */}
                  <div className="absolute top-1 right-1 w-1 h-1 bg-white/60 rounded-full opacity-0 group-hover:opacity-100 animate-bounce transition-all duration-300"></div>
                </button>
              </div>
            </div>
            
            <div className={`h-0.5 rounded-full opacity-60 transition-all duration-500 ${
              isDarkMode 
                ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500' 
                : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500'
            }`}></div>
          </div>

          {/* Studies Grid */}
          {availableStudies.length > 0 ? (
            <div className="relative max-h-[900px] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {availableStudies.map((study, index) => (
                <div
                  key={study.id}
                  onClick={() => handleViewStudy(study)}
                  className={`group relative overflow-hidden rounded-3xl backdrop-blur-2xl border transition-all duration-700 hover:scale-[1.05] hover:-translate-y-3 cursor-pointer ${
                    isDarkMode 
                      ? 'bg-gradient-to-br from-gray-800/60 via-gray-700/40 to-gray-800/60 border-gray-600/40 hover:shadow-2xl hover:shadow-emerald-500/30' 
                      : 'bg-gradient-to-br from-white/80 via-white/70 to-white/80 border-white/40 hover:shadow-2xl hover:shadow-emerald-500/25'
                  } p-8 shadow-2xl`}
                  style={{
                    animationDelay: `${index * 150}ms`
                  }}
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
                        <FileText className={`h-4 w-4 ${
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
                    </div>
                  </div>
                  
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
              ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <div className={`relative p-8 rounded-3xl bg-gradient-to-br mb-8 shadow-2xl transition-all duration-500 group hover:scale-105 ${
                isDarkMode 
                  ? 'from-emerald-900/40 via-teal-900/30 to-emerald-900/40 border border-emerald-700/30' 
                  : 'from-emerald-100 via-teal-100 to-emerald-100 border border-emerald-200/50'
              }`}>
                {/* Floating sparkles */}
                <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-400/40 rounded-full animate-bounce"></div>
                <div className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-teal-400/30 rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
                
                <FileText className="h-16 w-16 text-emerald-400 drop-shadow-lg group-hover:scale-110 transition-transform duration-300" />
                
                {/* Glow effect */}
                <div className="absolute inset-0 bg-emerald-400/20 rounded-3xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
              </div>
              <h3 className={`text-2xl font-black mb-4 transition-all duration-500 ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent' 
                  : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent'
              } drop-shadow-lg`}>
                No Studies Available
              </h3>
              <p className={`text-base leading-relaxed max-w-md text-center transition-all duration-500 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Clinical trial studies will appear here when they become available for interviews
              </p>
            </div>
          )}
        </div>

        {/* Interview Sessions Section */}
        <div className="mb-12">
          {/* Section Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`relative p-3 rounded-xl backdrop-blur-md border shadow-lg transition-all duration-500 hover:scale-105 hover:rotate-3 ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-purple-600/20 via-indigo-600/10 to-purple-600/20 border-purple-500/30' 
                    : 'bg-gradient-to-br from-purple-50/80 via-indigo-50/60 to-purple-50/80 border-purple-200/30'
                }`}>
                  <div className={`absolute top-1 right-1 w-2 h-2 rounded-full animate-pulse ${
                    isDarkMode ? 'bg-purple-400/50' : 'bg-purple-400/50'
                  }`}></div>
                  <User className={`h-6 w-6 ${isDarkMode ? 'text-purple-400/70' : 'text-purple-500/70'}`} />
                </div>
                
                <div>
                  <h2 className={`text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent transition-all duration-500 ${
                    isDarkMode 
                      ? 'from-purple-400 via-indigo-400 to-purple-400' 
                      : 'from-purple-600 via-indigo-600 to-purple-600'
                  }`}>
                    Interview Sessions
                  </h2>
                  <p className={`text-base mt-1 transition-all duration-500 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {sortedInterviews.length} participant interviews {searchTerm ? `(filtered from ${interviews.length})` : 'recorded'}
                  </p>
                  {searchTerm && (
                    <p className={`text-sm mt-1 transition-all duration-500 ${
                      isDarkMode ? 'text-purple-300' : 'text-purple-600'
                    }`}>
                      🔍 Searching for: "{searchTerm}" {sortedInterviews.length === 0 && '(no matches)'}
                    </p>
                  )}
                </div>
              </div>

              {/* Search Input */}
              <div className="relative max-w-sm">
                <div className={`relative flex items-center backdrop-blur-md border rounded-2xl shadow-lg transition-all duration-500 hover:scale-105 focus-within:scale-105 focus-within:shadow-xl ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-purple-600/20 via-indigo-600/10 to-purple-600/20 border-purple-500/30 focus-within:border-purple-400/50' 
                    : 'bg-gradient-to-br from-purple-50/80 via-indigo-50/60 to-purple-50/80 border-purple-200/30 focus-within:border-purple-300/50'
                }`}>
                  <div className="absolute left-3 flex items-center pointer-events-none">
                    <Search className={`h-5 w-5 transition-all duration-300 ${
                      isDarkMode ? 'text-purple-400/70' : 'text-purple-500/70'
                    }`} />
                  </div>
                  <input
                    type="text"
                    placeholder="Search interviews..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 rounded-2xl text-sm font-medium placeholder-opacity-60 transition-all duration-300 focus:outline-none bg-transparent ${
                      isDarkMode 
                        ? 'text-gray-200 placeholder-gray-400' 
                        : 'text-gray-800 placeholder-gray-500'
                    }`}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className={`absolute right-3 p-1 rounded-lg transition-all duration-300 hover:scale-110 ${
                        isDarkMode 
                          ? 'text-purple-400 hover:bg-purple-600/20' 
                          : 'text-purple-500 hover:bg-purple-100/50'
                      }`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                {/* Floating sparkles for search */}
                <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full animate-bounce ${
                  isDarkMode ? 'bg-purple-400/40' : 'bg-purple-400/40'
                }`} style={{animationDelay: '0s'}}></div>
                <div className={`absolute -bottom-1 -left-1 w-1.5 h-1.5 rounded-full animate-bounce ${
                  isDarkMode ? 'bg-indigo-400/30' : 'bg-indigo-400/30'
                }`} style={{animationDelay: '0.5s'}}></div>
              </div>
            </div>
            
            <div className={`h-0.5 rounded-full opacity-60 transition-all duration-500 ${
              isDarkMode 
                ? 'bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500' 
                : 'bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500'
            }`}></div>
          </div>
        </div>

        {/* Enhanced Premium Interviews Table */}
        <div className={`relative backdrop-blur-2xl border rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 ${
          isDarkMode 
            ? 'bg-gray-800/80 border-gray-700/30' 
            : 'bg-white/80 border-white/30'
        }`}>
          {/* Enhanced magical background overlay */}
          <div className={`absolute inset-0 bg-gradient-to-br transition-all duration-500 ${
            isDarkMode 
              ? 'from-blue-600/8 via-indigo-600/6 to-purple-600/8' 
              : 'from-violet-500/8 via-purple-500/6 to-indigo-500/8'
          }`}></div>
          <div className={`absolute inset-0 bg-gradient-to-r from-transparent to-transparent transition-all duration-500 ${
            isDarkMode ? 'via-blue-400/5' : 'via-white/5'
          }`}></div>
          
          {/* Enhanced Premium Table Header */}
          <div className={`relative backdrop-blur-sm bg-gradient-to-r border-b px-6 py-8 transition-all duration-500 ${
            isDarkMode 
              ? 'from-blue-600/15 via-indigo-600/12 to-purple-600/15 border-blue-700/30' 
              : 'from-violet-500/15 via-purple-500/12 to-indigo-500/15 border-purple-200/30'
          }`}>
            <div className={`grid grid-cols-12 gap-4 items-center text-sm font-black uppercase tracking-wider transition-all duration-500`}>
              <div className="col-span-2 flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span className={`transition-all duration-500 ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-purple-200 via-purple-100 to-purple-200 bg-clip-text text-transparent' 
                    : 'bg-gradient-to-r from-purple-800 via-purple-700 to-purple-800 bg-clip-text text-transparent'
                } drop-shadow-sm`}>Participant</span>
              </div>
              <div className="col-span-2">
                                  <button 
                    onClick={handleSortByDate}
                    className={`flex items-center space-x-2 transition-all duration-300 group hover:scale-105`}
                  >
                    <div className="w-2 h-2 bg-indigo-500 rounded-full group-hover:scale-125 transition-transform animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <span className={`transition-all duration-500 ${
                      isDarkMode 
                        ? 'bg-gradient-to-r from-indigo-200 via-indigo-100 to-indigo-200 bg-clip-text text-transparent group-hover:from-indigo-300 group-hover:via-indigo-200 group-hover:to-indigo-300' 
                        : 'bg-gradient-to-r from-indigo-800 via-indigo-700 to-indigo-800 bg-clip-text text-transparent group-hover:from-indigo-600 group-hover:via-indigo-500 group-hover:to-indigo-600'
                    } drop-shadow-sm`}>Date & Time</span>
                    <ArrowUpDown className={`h-4 w-4 transition-all duration-300 group-hover:scale-110 ${sortOrder === 'desc' ? 'rotate-180' : ''} ${
                      isDarkMode ? 'text-indigo-300' : 'text-indigo-700'
                    }`} />
                  </button>
              </div>
              <div className="col-span-2 flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                <span className={`transition-all duration-500 ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-blue-200 via-blue-100 to-blue-200 bg-clip-text text-transparent' 
                    : 'bg-gradient-to-r from-blue-800 via-blue-700 to-blue-800 bg-clip-text text-transparent'
                } drop-shadow-sm`}>Study</span>
              </div>
              <div className="col-span-2 flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" style={{animationDelay: '0.6s'}}></div>
                <span className={`transition-all duration-500 ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-emerald-200 via-emerald-100 to-emerald-200 bg-clip-text text-transparent' 
                    : 'bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-800 bg-clip-text text-transparent'
                } drop-shadow-sm`}>Status</span>
              </div>
              <div className="col-span-2 flex items-center space-x-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" style={{animationDelay: '0.8s'}}></div>
                <span className={`transition-all duration-500 ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-amber-200 via-amber-100 to-amber-200 bg-clip-text text-transparent' 
                    : 'bg-gradient-to-r from-amber-800 via-amber-700 to-amber-800 bg-clip-text text-transparent'
                } drop-shadow-sm`}>Eligibility</span>
              </div>
              <div className="col-span-2 text-center flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                <span className={`transition-all duration-500 ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-pink-200 via-pink-100 to-pink-200 bg-clip-text text-transparent' 
                    : 'bg-gradient-to-r from-pink-800 via-pink-700 to-pink-800 bg-clip-text text-transparent'
                } drop-shadow-sm`}>Actions</span>
              </div>
            </div>
          </div>

          {/* Premium Table Content */}
          <div className="relative max-h-[900px] overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="relative">
                  <div className={`animate-spin rounded-full h-16 w-16 border-4 transition-all duration-500 ${
                    isDarkMode ? 'border-purple-400/30 border-t-purple-400' : 'border-purple-500/30 border-t-purple-500'
                  }`}></div>
                  <div className={`absolute inset-0 rounded-full bg-gradient-to-r animate-pulse transition-all duration-500 ${
                    isDarkMode ? 'from-purple-400/20 via-violet-400/20 to-indigo-400/20' : 'from-purple-500/20 via-violet-500/20 to-indigo-500/20'
                  }`}></div>
                  <div className={`absolute inset-2 rounded-full bg-gradient-to-r transition-all duration-500 ${
                    isDarkMode ? 'from-purple-300/10 to-indigo-300/10' : 'from-purple-400/10 to-indigo-400/10'
                  }`}></div>
                </div>
                <p className={`mt-6 text-lg font-semibold transition-all duration-500 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Loading interviews...</p>
              </div>
            ) : sortedInterviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className={`p-6 rounded-3xl bg-gradient-to-br mb-6 shadow-lg transition-all duration-500 ${
                  isDarkMode 
                    ? 'from-purple-900/30 via-violet-900/30 to-indigo-900/30' 
                    : 'from-purple-100 via-violet-100 to-indigo-100'
                }`}>
                  {searchTerm ? (
                    <Search className="h-12 w-12 text-purple-400" />
                  ) : (
                    <User className="h-12 w-12 text-purple-400" />
                  )}
                </div>
                <p className={`text-xl font-bold mb-3 transition-all duration-500 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {searchTerm ? 'No matching interviews' : 'No interviews yet'}
                </p>
                <p className={`text-sm transition-all duration-500 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {searchTerm 
                    ? `No interviews match "${searchTerm}". Try different search terms.`
                    : 'Click "Start Interview" above to begin your first interview session'
                  }
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className={`mt-4 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 ${
                      isDarkMode 
                        ? 'bg-purple-600/20 text-purple-300 hover:bg-purple-600/30' 
                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    }`}
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className={`divide-y transition-all duration-500 ${
                isDarkMode ? 'divide-purple-700/20' : 'divide-purple-100/50'
              }`}>
                {sortedInterviews.map((interview, index) => (
                  <div 
                    key={interview.id} 
                    className={`group relative overflow-hidden px-6 py-8 transition-all duration-500 hover:shadow-lg hover:-translate-y-1 border-l-4 border-transparent hover:border-l-purple-400 ${
                      isDarkMode 
                        ? 'hover:bg-gradient-to-r hover:from-gray-800/80 hover:via-purple-900/40 hover:to-gray-800/80 hover:shadow-purple-500/30' 
                        : 'hover:bg-gradient-to-r hover:from-white/90 hover:via-purple-50/60 hover:to-white/90 hover:shadow-purple-500/20'
                    }`}
                    style={{
                      animationDelay: `${index * 50}ms`
                    }}
                  >
                    {/* ✨ ENHANCED MAGICAL BACKGROUND EFFECTS ✨ */}
                    <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-20 transition-all duration-700 ${
                      isDarkMode ? 'from-purple-500/30 via-indigo-500/25 to-purple-500/30' : 'from-purple-400/25 via-indigo-400/20 to-purple-400/25'
                    }`}></div>
                    <div className={`absolute inset-0 bg-gradient-to-tr opacity-0 group-hover:opacity-15 transition-all duration-700 ${
                      isDarkMode ? 'from-indigo-500/25 via-purple-500/30 to-indigo-500/25' : 'from-indigo-400/20 via-purple-400/25 to-indigo-400/20'
                    }`}></div>
                    
                    {/* ✨ PROMINENT FLOATING SPARKLES ✨ */}
                    <div className={`absolute top-6 right-8 w-2.5 h-2.5 rounded-full opacity-0 group-hover:opacity-100 animate-bounce transition-all duration-300 shadow-md ${
                      isDarkMode ? 'bg-yellow-400/60 shadow-yellow-400/30' : 'bg-yellow-300/50 shadow-yellow-300/20'
                    }`} style={{animationDelay: '0s'}}></div>
                    <div className={`absolute top-12 right-16 w-2 h-2 rounded-full opacity-0 group-hover:opacity-100 animate-bounce transition-all duration-300 shadow-sm ${
                      isDarkMode ? 'bg-pink-400/50 shadow-pink-400/25' : 'bg-pink-300/40 shadow-pink-300/15'
                    }`} style={{animationDelay: '0.2s'}}></div>
                    <div className={`absolute bottom-6 left-8 w-2.5 h-2.5 rounded-full opacity-0 group-hover:opacity-100 animate-bounce transition-all duration-300 shadow-md ${
                      isDarkMode ? 'bg-cyan-400/50 shadow-cyan-400/25' : 'bg-cyan-300/40 shadow-cyan-300/15'
                    }`} style={{animationDelay: '0.4s'}}></div>
                    <div className={`absolute bottom-12 right-12 w-1.5 h-1.5 rounded-full opacity-0 group-hover:opacity-100 animate-bounce transition-all duration-300 ${
                      isDarkMode ? 'bg-purple-400/40' : 'bg-purple-300/30'
                    }`} style={{animationDelay: '0.6s'}}></div>
                    
                    {/* ✨ ENHANCED SHIMMER EFFECT ✨ */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-300/15 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1500"></div>
                    
                    {/* ✨ PROMINENT GLOW EFFECTS ✨ */}
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-30 transition-all duration-700 blur-lg ${
                      isDarkMode ? 'bg-purple-400/25' : 'bg-purple-400/15'
                    }`}></div>
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-15 transition-all duration-1000 blur-xl ${
                      isDarkMode ? 'bg-indigo-400/20' : 'bg-indigo-400/10'
                    }`}></div>
                    
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-indigo-500 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-top"></div>
                    
                    <div className="relative grid grid-cols-12 gap-4 items-center">
                      {/* Participant */}
                      <div className="col-span-2 flex items-center space-x-3">
                        <div className="relative flex-shrink-0">
                          <div className="relative h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                            <User className="h-6 w-6 text-white drop-shadow-lg" />
                            
                            {/* Enhanced floating mini-circles like stat cards */}
                            <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-white/40 rounded-full animate-pulse"></div>
                            <div className="absolute bottom-1 left-1 w-1 h-1 bg-white/30 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                            
                            {/* Glow effect like stat cards */}
                            <div className="absolute inset-0 rounded-2xl blur-lg opacity-0 group-hover:opacity-40 transition-opacity duration-500 bg-violet-400"></div>
                          </div>
                        </div>
                        <div>
                          <div className={`font-black text-lg transition-all duration-500 group-hover:scale-110 ${
                            isDarkMode 
                              ? 'bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent group-hover:from-purple-200 group-hover:via-purple-100 group-hover:to-purple-200' 
                              : 'bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent group-hover:from-purple-800 group-hover:via-purple-700 group-hover:to-purple-800'
                          } drop-shadow-lg`}>
                            {interview.participant_name}
                          </div>
                        </div>
                      </div>

                      {/* Date & Time */}
                      <div className="col-span-2">
                        <div className={`flex items-center space-x-2 text-sm transition-all duration-300 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          <div className={`p-2 rounded-xl group-hover:scale-110 transition-transform duration-300 ${
                            isDarkMode ? 'bg-indigo-900/30' : 'bg-indigo-100'
                          }`}>
                            <Calendar className={`h-4 w-4 ${
                              isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
                            }`} />
                          </div>
                          <div>
                            <span className={`font-bold transition-all duration-500 group-hover:scale-105 ${
                              isDarkMode 
                                ? 'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-clip-text text-transparent group-hover:from-indigo-200 group-hover:via-indigo-100 group-hover:to-indigo-200' 
                                : 'bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-clip-text text-transparent group-hover:from-indigo-700 group-hover:via-indigo-600 group-hover:to-indigo-700'
                            } drop-shadow-sm`}>
                              {formatDate(interview.date)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Study */}
                      <div className="col-span-2">
                        <span className={`inline-flex items-center px-3 py-2 rounded-2xl text-sm font-black bg-gradient-to-r border shadow-lg group-hover:shadow-xl group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-500 backdrop-blur-sm ${
                          isDarkMode 
                            ? 'from-blue-900/50 via-indigo-900/50 to-violet-900/50 border-blue-600/70 hover:border-blue-500/90' 
                            : 'from-blue-100/90 via-indigo-100/90 to-violet-100/90 border-blue-300/70 hover:border-blue-400/90'
                        }`}>
                          <div className={`p-1 rounded-lg mr-2 transition-all duration-300 ${
                            isDarkMode ? 'bg-blue-600/30' : 'bg-blue-500/20'
                          }`}>
                            <FileText className={`w-3 h-3 ${
                              isDarkMode ? 'text-blue-300' : 'text-blue-700'
                            }`} />
                          </div>
                          <span className={`transition-all duration-500 ${
                            isDarkMode 
                              ? 'bg-gradient-to-r from-blue-200 via-indigo-200 to-violet-200 bg-clip-text text-transparent' 
                              : 'bg-gradient-to-r from-blue-800 via-indigo-800 to-violet-800 bg-clip-text text-transparent'
                          } drop-shadow-sm`}>
                            {interview.study_name}
                          </span>
                        </span>
                      </div>

                      {/* Status */}
                      <div className="col-span-2">
                        {getStatusBadge(interview.status)}
                      </div>

                      {/* Eligibility */}
                      <div className="col-span-2">
                        {getEligibilityBadge(interview.eligibility_result)}
                      </div>

                      {/* Actions - Enhanced with better spacing and sizing */}
                      <div className="col-span-2 flex items-center justify-center space-x-3">
                        <button
                          onClick={() => interview.status !== 'In Progress' && handleViewInterview(interview)}
                          disabled={interview.status === 'In Progress'}
                          className={`group/btn relative p-3.5 rounded-2xl border transition-all duration-500 backdrop-blur-sm ${
                            interview.status === 'In Progress'
                              ? `bg-gradient-to-br ${isDarkMode ? 'from-gray-600/20 to-gray-700/20 border-gray-600/40' : 'from-gray-300/20 to-gray-400/20 border-gray-400/40'} cursor-not-allowed opacity-50`
                              : 'bg-gradient-to-br from-blue-500/20 to-indigo-500/20 hover:from-blue-500/35 hover:to-indigo-500/35 border-blue-500/40 hover:border-blue-400/70 hover:scale-125 hover:shadow-2xl hover:shadow-blue-500/40 hover:-translate-y-2'
                          }`}
                          title={interview.status === 'In Progress' ? 'Cannot view - Interview in progress' : 'View Details'}
                        >
                          <Eye className={`h-5 w-5 transition-all duration-500 drop-shadow-sm ${
                            interview.status === 'In Progress'
                              ? (isDarkMode ? 'text-gray-500' : 'text-gray-400')
                              : `group-hover/btn:scale-125 ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`
                          }`} />
                          {interview.status !== 'In Progress' && (
                            <>
                              <div className="absolute inset-0 bg-blue-500/0 group-hover/btn:bg-blue-500/15 rounded-2xl transition-all duration-500"></div>
                              <div className="absolute inset-0 bg-blue-400/0 group-hover/btn:bg-blue-400/10 rounded-2xl blur-sm transition-all duration-500"></div>
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={() => interview.status !== 'In Progress' && handleDownloadInterview(interview)}
                          disabled={interview.status === 'In Progress'}
                          className={`group/btn relative p-3.5 rounded-2xl border transition-all duration-500 backdrop-blur-sm ${
                            interview.status === 'In Progress'
                              ? `bg-gradient-to-br ${isDarkMode ? 'from-gray-600/20 to-gray-700/20 border-gray-600/40' : 'from-gray-300/20 to-gray-400/20 border-gray-400/40'} cursor-not-allowed opacity-50`
                              : 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/35 hover:to-teal-500/35 border-emerald-500/40 hover:border-emerald-400/70 hover:scale-125 hover:shadow-2xl hover:shadow-emerald-500/40 hover:-translate-y-2'
                          }`}
                          title={interview.status === 'In Progress' ? 'Cannot download - Interview in progress' : 'Download Data'}
                        >
                          <Download className={`h-5 w-5 transition-all duration-500 drop-shadow-sm ${
                            interview.status === 'In Progress'
                              ? (isDarkMode ? 'text-gray-500' : 'text-gray-400')
                              : `group-hover/btn:scale-125 ${isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}`
                          }`} />
                          {interview.status !== 'In Progress' && (
                            <>
                              <div className="absolute inset-0 bg-emerald-500/0 group-hover/btn:bg-emerald-500/15 rounded-2xl transition-all duration-500"></div>
                              <div className="absolute inset-0 bg-emerald-400/0 group-hover/btn:bg-emerald-400/10 rounded-2xl blur-sm transition-all duration-500"></div>
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={() => interview.status !== 'In Progress' && handleDeleteInterview(interview.participant_id, interview.participant_name)}
                          disabled={interview.status === 'In Progress'}
                          className={`group/btn relative p-3.5 rounded-2xl border transition-all duration-500 backdrop-blur-sm ${
                            interview.status === 'In Progress'
                              ? `bg-gradient-to-br ${isDarkMode ? 'from-gray-600/20 to-gray-700/20 border-gray-600/40' : 'from-gray-300/20 to-gray-400/20 border-gray-400/40'} cursor-not-allowed opacity-50`
                              : 'bg-gradient-to-br from-red-500/20 to-rose-500/20 hover:from-red-500/35 hover:to-rose-500/35 border-red-500/40 hover:border-red-400/70 hover:scale-125 hover:shadow-2xl hover:shadow-red-500/40 hover:-translate-y-2'
                          }`}
                          title={interview.status === 'In Progress' ? 'Cannot delete - Interview in progress' : 'Delete Interview'}
                        >
                          <Trash2 className={`h-5 w-5 transition-all duration-500 drop-shadow-sm ${
                            interview.status === 'In Progress'
                              ? (isDarkMode ? 'text-gray-500' : 'text-gray-400')
                              : `group-hover/btn:scale-125 ${isDarkMode ? 'text-red-300' : 'text-red-700'}`
                          }`} />
                          {interview.status !== 'In Progress' && (
                            <>
                              <div className="absolute inset-0 bg-red-500/0 group-hover/btn:bg-red-500/15 rounded-2xl transition-all duration-500"></div>
                              <div className="absolute inset-0 bg-red-400/0 group-hover/btn:bg-red-400/10 rounded-2xl blur-sm transition-all duration-500"></div>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Import from ClinicalTrials.gov Modal - Redesigned */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div 
            className={`absolute inset-0 backdrop-blur-xl transition-all duration-500 ${
              isDarkMode 
                ? 'bg-black/60' 
                : 'bg-black/40'
            }`}
            onClick={closeImportModal}
          />
          
          {/* Modal Content */}
          <div 
            className={`relative w-full max-w-6xl max-h-[90vh] m-4 overflow-hidden rounded-3xl backdrop-blur-2xl border shadow-2xl transform transition-all duration-700 scale-100 animate-in fade-in-0 zoom-in-95 ${
              isDarkMode 
                ? 'bg-gradient-to-br from-gray-800/80 via-gray-700/60 to-gray-800/80 border-gray-600/40' 
                : 'bg-gradient-to-br from-white/90 via-white/80 to-white/90 border-white/40'
            }`}
          >
            {/* Enhanced magical background effects - Emerald theme */}
            <div className={`absolute inset-0 bg-gradient-to-br opacity-20 transition-all duration-700 rounded-3xl ${
              isDarkMode ? 'from-emerald-500/30 to-teal-500/25' : 'from-emerald-400/25 to-teal-400/20'
            }`}></div>
            <div className={`absolute inset-0 bg-gradient-to-tr opacity-15 transition-all duration-700 rounded-3xl ${
              isDarkMode ? 'from-teal-500/25 to-emerald-500/30' : 'from-teal-400/20 to-emerald-400/25'
            }`}></div>
            
            {/* Floating sparkles - Emerald theme */}
            <div className="absolute top-8 right-12 w-3 h-3 bg-emerald-400/50 rounded-full animate-bounce shadow-lg" style={{animationDelay: '0s'}}></div>
            <div className="absolute top-16 right-20 w-2 h-2 bg-teal-400/40 rounded-full animate-bounce shadow-md" style={{animationDelay: '0.3s'}}></div>
            <div className="absolute bottom-16 left-12 w-3.5 h-3.5 bg-emerald-300/35 rounded-full animate-bounce shadow-lg" style={{animationDelay: '0.6s'}}></div>
            <div className="absolute bottom-8 right-16 w-1.5 h-1.5 bg-teal-300/30 rounded-full animate-bounce" style={{animationDelay: '0.9s'}}></div>
            
            {/* Header - Emerald theme */}
            <div className={`relative px-8 py-6 border-b backdrop-blur-sm ${
              isDarkMode 
                ? 'bg-gradient-to-r from-emerald-600/20 via-teal-600/15 to-emerald-600/20 border-emerald-700/30' 
                : 'bg-gradient-to-r from-emerald-50/80 via-teal-50/60 to-emerald-50/80 border-emerald-200/30'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`relative p-3 rounded-xl backdrop-blur-md border shadow-lg transition-all duration-500 ${
                    isDarkMode 
                      ? 'bg-gradient-to-br from-emerald-600/30 via-teal-600/20 to-emerald-600/30 border-emerald-500/40' 
                      : 'bg-gradient-to-br from-emerald-100/90 via-teal-100/70 to-emerald-100/90 border-emerald-300/40'
                  }`}>
                    <div className={`absolute top-1 right-1 w-2 h-2 rounded-full animate-pulse ${
                      isDarkMode ? 'bg-emerald-400/60' : 'bg-emerald-500/60'
                    }`}></div>
                    <Plus className={`h-6 w-6 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  </div>
                  
                  <div>
                    <h2 className={`text-2xl font-black bg-gradient-to-r bg-clip-text text-transparent transition-all duration-500 ${
                      isDarkMode 
                        ? 'from-emerald-400 via-teal-400 to-emerald-400' 
                        : 'from-emerald-600 via-teal-600 to-emerald-600'
                    } drop-shadow-lg`}>
                      Import from ClinicalTrials.gov
                    </h2>
                    <p className={`text-sm mt-1 transition-all duration-500 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Search and import clinical trials from ClinicalTrials.gov
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={closeImportModal}
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
            <div className="relative overflow-y-auto max-h-[70vh] custom-scrollbar">
              <div className="p-8 space-y-8">
                {/* Default Visible Search Section */}
                <div className={`relative p-6 rounded-2xl backdrop-blur-sm border shadow-lg ${
                  isDarkMode 
                    ? 'bg-emerald-600/10 border-emerald-700/30' 
                    : 'bg-emerald-50/80 border-emerald-200/30'
                }`}>
                  <div className="flex items-center space-x-3 mb-6">
                    <div className={`p-2 rounded-lg ${
                      isDarkMode ? 'bg-emerald-600/20' : 'bg-emerald-200'
                    }`}>
                      <Search className={`h-5 w-5 ${
                        isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                      }`} />
                    </div>
                    <h3 className={`text-lg font-black bg-gradient-to-r bg-clip-text text-transparent ${
                      isDarkMode 
                        ? 'from-emerald-400 to-teal-400' 
                        : 'from-emerald-600 to-teal-600'
                    }`}>
                      Search Clinical Trials
                    </h3>
                  </div>
                  
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={importQuery}
                        onChange={(e) => setImportQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && performSearchWithValidation()}
                        placeholder="Enter condition or keyword (e.g., diabetes, cancer, heart disease)"
                        className={`w-full px-4 py-3 rounded-xl text-sm font-medium border transition-all duration-300 focus:outline-none focus:ring-2 ${
                          isDarkMode 
                            ? 'bg-gray-800/50 border-gray-600/50 text-gray-200 placeholder-gray-400 focus:ring-emerald-500/50' 
                            : 'bg-white/80 border-emerald-300/50 text-gray-800 placeholder-gray-500 focus:ring-emerald-500/50'
                        }`}
                        disabled={importLoading}
                      />
                    </div>
                    <button
                                                                        onClick={performSearchWithValidation}
                        disabled={importLoading}
                        className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-105 disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed ${
                        isDarkMode 
                          ? 'bg-gradient-to-br from-emerald-900/60 via-teal-900/50 to-emerald-900/60 hover:from-emerald-800/70 hover:via-teal-800/60 hover:to-emerald-800/70 text-emerald-400 border border-emerald-700/40 disabled:bg-gray-600/50 hover:shadow-emerald-400/30' 
                          : 'bg-gradient-to-br from-emerald-100/90 via-teal-100/80 to-emerald-100/90 hover:from-emerald-200 hover:via-teal-200 hover:to-emerald-200 text-emerald-600 border border-emerald-200/60 disabled:bg-gray-400/50 hover:shadow-emerald-400/30'
                      } shadow-lg hover:shadow-xl disabled:shadow-none`}
                    >
                      {importLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin"></div>
                          <span>Searching...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Search className="h-4 w-4" />
                          <span>Search</span>
                        </div>
                      )}
                    </button>
                  </div>
                  
                  {/* Quick search suggestions */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Popular searches:
                    </span>
                    {['diabetes', 'cancer', 'heart disease', 'alzheimer', 'depression', 'arthritis', 'asthma'].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => {
                          setImportQuery(suggestion);
                          // Directly search with the suggestion instead of relying on state update
                          performDirectSearch(suggestion);
                        }}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg border ${
                          isDarkMode 
                            ? 'bg-gradient-to-br from-emerald-900/50 via-teal-900/40 to-emerald-900/50 hover:from-emerald-800/60 hover:via-teal-800/50 hover:to-emerald-800/60 text-emerald-400 border-emerald-700/30 hover:shadow-emerald-400/30' 
                            : 'bg-gradient-to-br from-emerald-100/80 via-teal-100/70 to-emerald-100/80 hover:from-emerald-200/90 hover:via-teal-200/80 hover:to-emerald-200/90 text-emerald-600 border-emerald-200/40 hover:shadow-emerald-400/30'
                        }`}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                                {/* Results Section - Emerald Theme */}
                <div className={`relative p-6 rounded-2xl backdrop-blur-sm border shadow-lg ${
                  isDarkMode 
                    ? 'bg-emerald-600/10 border-emerald-700/30' 
                    : 'bg-emerald-50/80 border-emerald-200/30'
                }`}>
                  {importError && (
                    <div className={`mb-6 p-4 rounded-xl border ${
                      isDarkMode 
                        ? 'bg-red-900/30 border-red-700/50 text-red-300' 
                        : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-medium">{importError}</span>
                      </div>
                    </div>
                  )}

                  {importResults.length === 0 && !importLoading && !importError && (
                    <div className="text-center py-12">
                      <div className={`p-6 rounded-3xl bg-gradient-to-br mb-6 shadow-lg transition-all duration-500 mx-auto w-fit ${
                        isDarkMode 
                          ? 'from-emerald-900/40 via-teal-900/30 to-emerald-900/40' 
                          : 'from-emerald-100 via-teal-100 to-emerald-100'
                      }`}>
                        <Search className="h-12 w-12 text-emerald-400" />
                      </div>
                      <p className={`text-xl font-bold mb-3 transition-all duration-500 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Ready to Search
                      </p>
                      <p className={`text-sm transition-all duration-500 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Enter a condition above or try one of the popular searches to find clinical trials
                      </p>
                    </div>
                  )}

                  {importLoading && (
                    <div className="text-center py-12">
                      <div className={`p-6 rounded-3xl bg-gradient-to-br mb-6 shadow-lg transition-all duration-500 mx-auto w-fit ${
                        isDarkMode 
                          ? 'from-emerald-900/40 via-teal-900/30 to-emerald-900/40' 
                          : 'from-emerald-100 via-teal-100 to-emerald-100'
                      }`}>
                        <div className="w-12 h-12 border-4 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin"></div>
                      </div>
                      <p className={`text-xl font-bold mb-3 transition-all duration-500 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Searching ClinicalTrials.gov...
                      </p>
                      <p className={`text-sm transition-all duration-500 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Finding studies related to "{importQuery}"
                      </p>
                    </div>
                  )}

                  {importResults.length > 0 && (
                    <div>
                      <div className="flex items-center space-x-3 mb-6">
                        <div className={`p-2 rounded-lg ${
                          isDarkMode ? 'bg-emerald-600/20' : 'bg-emerald-200'
                        }`}>
                          <FileText className={`h-5 w-5 ${
                            isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                          }`} />
                        </div>
                        <h3 className={`text-lg font-black bg-gradient-to-r bg-clip-text text-transparent ${
                          isDarkMode 
                            ? 'from-emerald-400 to-teal-400' 
                            : 'from-emerald-600 to-teal-600'
                        }`}>
                          Found {importResults.length} Clinical Trials
                        </h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto custom-scrollbar">
                        {importResults.map((study, index) => (
                          <div 
                            key={study.nct_id || index}
                            className={`group relative p-4 rounded-xl border transition-all duration-300 hover:scale-[1.01] hover:shadow-md ${
                              isDarkMode 
                                ? 'bg-gray-800/30 border-gray-600/30 hover:border-emerald-500/50' 
                                : 'bg-white/60 border-emerald-200/30 hover:border-emerald-300/50'
                            }`}
                          >
                            {/* Simple sparkle */}
                            <div className="absolute top-2 right-2 w-1 h-1 bg-emerald-400/40 rounded-full opacity-0 group-hover:opacity-100 animate-bounce transition-all duration-300"></div>
                            
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h4 className={`font-bold text-sm mb-2 line-clamp-2 ${
                                  isDarkMode ? 'text-gray-200' : 'text-gray-800'
                                }`}>
                                  {study.title || study.official_title || 'No title available'}
                                </h4>
                                
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {study.nct_id && (
                                    <span className={`px-2 py-1 rounded-lg text-xs font-mono font-bold ${
                                      isDarkMode 
                                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30' 
                                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                    }`}>
                                      {study.nct_id}
                                    </span>
                                  )}
                                  
                                  {study.phase && study.phase !== 'N/A' && (
                                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                                      isDarkMode 
                                        ? 'bg-teal-600/20 text-teal-300 border border-teal-500/30' 
                                        : 'bg-teal-100 text-teal-700 border border-teal-200'
                                    }`}>
                                      {study.phase}
                                    </span>
                                  )}
                                  
                                  {study.status && (
                                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                                      isDarkMode 
                                        ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' 
                                        : 'bg-blue-100 text-blue-700 border border-blue-200'
                                    }`}>
                                      {study.status}
                                    </span>
                                  )}
                                </div>
                                
                                {study.conditions && study.conditions.length > 0 && (
                                  <p className={`text-xs mb-2 ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                  }`}>
                                    <span className="font-semibold">Conditions:</span> {study.conditions.slice(0, 3).join(', ')}
                                    {study.conditions.length > 3 && '...'}
                                  </p>
                                )}
                                
                                {study.brief_summary && (
                                  <p className={`text-xs line-clamp-2 ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                  }`}>
                                    {study.brief_summary}
                                  </p>
                                )}
                              </div>
                              
                              <button
                                onClick={() => handleImportStudy(study)}
                                disabled={importingStudyId === study.nct_id}
                                className={`ml-4 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-300 hover:scale-105 disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed border ${
                                  isDarkMode 
                                    ? 'bg-gradient-to-br from-emerald-800/70 via-teal-800/60 to-emerald-800/70 hover:from-emerald-700/80 hover:via-teal-700/70 hover:to-emerald-700/80 text-emerald-300 border-emerald-600/40 disabled:bg-gray-600/50 hover:shadow-emerald-400/30' 
                                    : 'bg-gradient-to-br from-emerald-200/90 via-teal-200/80 to-emerald-200/90 hover:from-emerald-300 hover:via-teal-300 hover:to-emerald-300 text-emerald-700 border-emerald-300/50 disabled:bg-gray-400/50 hover:shadow-emerald-400/30'
                                } shadow-md hover:shadow-lg disabled:shadow-none`}
                              >
                                {importingStudyId === study.nct_id ? (
                                  <div className="flex items-center space-x-1">
                                    <div className="w-3 h-3 border-2 border-emerald-300/30 border-t-emerald-300 rounded-full animate-spin"></div>
                                    <span>Importing...</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-1">
                                    <Download className="h-3 w-3" />
                                    <span>Import</span>
                                  </div>
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && importedStudyInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div 
            className={`absolute inset-0 backdrop-blur-xl transition-all duration-500 ${
              isDarkMode 
                ? 'bg-black/60' 
                : 'bg-black/40'
            }`}
            onClick={() => setShowSuccessModal(false)}
          />
          
          {/* Modal Content */}
          <div 
            className={`relative w-full max-w-md m-4 overflow-hidden rounded-3xl backdrop-blur-2xl border shadow-2xl transform transition-all duration-700 scale-100 animate-in fade-in-0 zoom-in-95 ${
              isDarkMode 
                ? 'bg-gradient-to-br from-gray-800/80 via-gray-700/60 to-gray-800/80 border-gray-600/40' 
                : 'bg-gradient-to-br from-white/90 via-white/80 to-white/90 border-white/40'
            }`}
          >
            {/* Success background effects */}
            <div className={`absolute inset-0 bg-gradient-to-br opacity-20 transition-all duration-700 rounded-3xl ${
              isDarkMode ? 'from-emerald-500/30 to-teal-500/25' : 'from-emerald-400/25 to-teal-400/20'
            }`}></div>
            
            {/* Floating sparkles */}
            <div className="absolute top-4 right-4 w-2 h-2 bg-emerald-400/50 rounded-full animate-bounce shadow-lg"></div>
            <div className="absolute top-8 right-12 w-1.5 h-1.5 bg-teal-400/40 rounded-full animate-bounce shadow-md" style={{animationDelay: '0.3s'}}></div>
            <div className="absolute bottom-4 left-4 w-2.5 h-2.5 bg-emerald-300/35 rounded-full animate-bounce shadow-lg" style={{animationDelay: '0.6s'}}></div>
            
            {/* Content */}
            <div className="relative p-8">
              {/* Success Icon */}
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-emerald-600/30 via-teal-600/20 to-emerald-600/30' 
                  : 'bg-gradient-to-br from-emerald-100 via-teal-100 to-emerald-100'
              }`}>
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              
              {/* Title */}
              <h3 className={`text-xl font-black text-center mb-2 bg-gradient-to-r bg-clip-text text-transparent ${
                isDarkMode 
                  ? 'from-emerald-400 via-teal-400 to-emerald-400' 
                  : 'from-emerald-600 via-teal-600 to-emerald-600'
              }`}>
                Successfully Imported!
              </h3>
              
              {/* Study Info */}
              <div className={`p-4 rounded-xl mb-6 ${
                isDarkMode 
                  ? 'bg-gray-700/30 border border-emerald-700/30' 
                  : 'bg-emerald-50/50 border border-emerald-200/30'
              }`}>
                <p className={`font-bold text-sm mb-1 ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  {importedStudyInfo.title}
                </p>
                <p className={`text-xs mb-1 ${
                  isDarkMode ? 'text-emerald-300' : 'text-emerald-600'
                }`}>
                  <span className="font-semibold">NCT ID:</span> {importedStudyInfo.nct_id}
                </p>
                <p className={`text-xs ${
                  isDarkMode ? 'text-teal-300' : 'text-teal-600'
                }`}>
                  <span className="font-semibold">Local ID:</span> {importedStudyInfo.study_id}
                </p>
              </div>
              
              <p className={`text-sm text-center mb-6 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                The study is now available in your Available Studies list.
              </p>
              
              {/* Close Button */}
              <button
                onClick={() => setShowSuccessModal(false)}
                className={`w-full px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-105 ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-emerald-600/80 via-teal-600/70 to-emerald-600/80 hover:from-emerald-500/90 hover:via-teal-500/80 hover:to-emerald-500/90 text-white' 
                    : 'bg-gradient-to-br from-emerald-500/90 via-teal-500/80 to-emerald-500/90 hover:from-emerald-600/95 hover:via-teal-600/85 hover:to-emerald-600/95 text-white'
                } shadow-lg hover:shadow-xl`}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Study Details Modal */}
      {showStudyModal && selectedStudyForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div 
            className={`absolute inset-0 backdrop-blur-xl transition-all duration-500 ${
              isDarkMode 
                ? 'bg-black/60' 
                : 'bg-black/40'
            }`}
            onClick={closeStudyModal}
          />
          
          {/* Modal Content */}
          <div 
            className={`relative w-full max-w-4xl max-h-[90vh] m-4 overflow-hidden rounded-3xl backdrop-blur-2xl border shadow-2xl transform transition-all duration-700 scale-100 animate-in fade-in-0 zoom-in-95 ${
              isDarkMode 
                ? 'bg-gradient-to-br from-gray-800/80 via-gray-700/60 to-gray-800/80 border-gray-600/40' 
                : 'bg-gradient-to-br from-white/90 via-white/80 to-white/90 border-white/40'
            }`}
          >
            {/* Enhanced magical background effects */}
            <div className={`absolute inset-0 bg-gradient-to-br opacity-20 transition-all duration-700 rounded-3xl ${
              isDarkMode ? 'from-emerald-500/30 to-teal-500/25' : 'from-emerald-400/25 to-teal-400/20'
            }`}></div>
            <div className={`absolute inset-0 bg-gradient-to-tr opacity-15 transition-all duration-700 rounded-3xl ${
              isDarkMode ? 'from-teal-500/25 to-emerald-500/30' : 'from-teal-400/20 to-emerald-400/25'
            }`}></div>
            
            {/* Floating sparkles */}
            <div className="absolute top-8 right-12 w-3 h-3 bg-emerald-400/50 rounded-full animate-bounce shadow-lg" style={{animationDelay: '0s'}}></div>
            <div className="absolute top-16 right-20 w-2 h-2 bg-teal-400/40 rounded-full animate-bounce shadow-md" style={{animationDelay: '0.3s'}}></div>
            <div className="absolute bottom-16 left-12 w-3.5 h-3.5 bg-emerald-300/35 rounded-full animate-bounce shadow-lg" style={{animationDelay: '0.6s'}}></div>
            <div className="absolute bottom-8 right-16 w-1.5 h-1.5 bg-teal-300/30 rounded-full animate-bounce" style={{animationDelay: '0.9s'}}></div>
            <div className="absolute top-32 left-8 w-2.5 h-2.5 bg-emerald-400/40 rounded-full animate-bounce shadow-md" style={{animationDelay: '1.2s'}}></div>
            <div className="absolute bottom-32 right-8 w-2 h-2 bg-teal-400/35 rounded-full animate-bounce" style={{animationDelay: '1.5s'}}></div>
            
            {/* Floating decorative rings */}
            <div className="absolute -top-20 -right-20 w-80 h-80 border border-emerald-300/15 rounded-full animate-pulse"></div>
            <div className="absolute -bottom-16 -left-16 w-64 h-64 border border-teal-300/15 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
            
            {/* Enhanced shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-300/15 to-transparent transform -skew-x-12 -translate-x-full animate-shimmer rounded-3xl"></div>
            
            {/* Premium glow effect */}
            <div className={`absolute inset-0 rounded-3xl opacity-60 transition-all duration-700 blur-xl ${
              isDarkMode ? 'bg-emerald-400/25' : 'bg-emerald-400/20'
            }`}></div>
            
            {/* Header */}
            <div className={`relative px-8 py-6 border-b backdrop-blur-sm ${
              isDarkMode 
                ? 'bg-gradient-to-r from-emerald-600/20 via-teal-600/15 to-emerald-600/20 border-emerald-700/30' 
                : 'bg-gradient-to-r from-emerald-50/80 via-teal-50/60 to-emerald-50/80 border-emerald-200/30'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`relative p-3 rounded-xl backdrop-blur-md border shadow-lg transition-all duration-500 ${
                    isDarkMode 
                      ? 'bg-gradient-to-br from-emerald-600/30 via-teal-600/20 to-emerald-600/30 border-emerald-500/40' 
                      : 'bg-gradient-to-br from-emerald-100/90 via-teal-100/70 to-emerald-100/90 border-emerald-300/40'
                  }`}>
                    <div className={`absolute top-1 right-1 w-2 h-2 rounded-full animate-pulse ${
                      isDarkMode ? 'bg-emerald-400/60' : 'bg-emerald-500/60'
                    }`}></div>
                    <FileText className={`h-6 w-6 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  </div>
                  
                  <div>
                    <h2 className={`text-2xl font-black bg-gradient-to-r bg-clip-text text-transparent transition-all duration-500 ${
                      isDarkMode 
                        ? 'from-emerald-400 via-teal-400 to-emerald-400' 
                        : 'from-emerald-600 via-teal-600 to-emerald-600'
                    } drop-shadow-lg`}>
                      Study Details
                    </h2>
                    <p className={`text-sm mt-1 transition-all duration-500 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Clinical Trial Information
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={closeStudyModal}
                  className={`group relative p-3 rounded-2xl transition-all duration-500 hover:scale-110 hover:rotate-90 backdrop-blur-md border ${
                    isDarkMode 
                      ? 'bg-gray-700/50 hover:bg-red-600/30 border-gray-600/50 hover:border-red-500/50' 
                      : 'bg-white/70 hover:bg-red-100/70 border-gray-300/50 hover:border-red-300/50'
                  } hover:shadow-2xl hover:shadow-red-500/30`}
                >
                  <X className={`h-6 w-6 transition-all duration-300 ${
                    isDarkMode ? 'text-gray-300 group-hover:text-red-300' : 'text-gray-600 group-hover:text-red-600'
                  }`} />
                  
                  {/* Hover glow */}
                  <div className="absolute inset-0 bg-red-400/0 group-hover:bg-red-400/20 rounded-2xl transition-all duration-500"></div>
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="relative overflow-y-auto max-h-[70vh] custom-scrollbar p-8">
              <div className="space-y-8">
                {/* Study Title & Basic Info */}
                <div className={`relative p-6 rounded-2xl backdrop-blur-sm border shadow-lg ${
                  isDarkMode 
                    ? 'bg-gray-700/30 border-gray-600/30' 
                    : 'bg-white/50 border-gray-200/30'
                }`}>
                  <div className="absolute top-3 right-3 w-2 h-2 bg-emerald-400/40 rounded-full animate-pulse"></div>
                  
                  <h3 className={`text-2xl font-black mb-4 line-clamp-3 transition-all duration-500 ${
                    isDarkMode 
                      ? 'bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent' 
                      : 'bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent'
                  } drop-shadow-lg`}>
                    {selectedStudyForView.title}
                  </h3>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <div className={`flex items-center space-x-2 px-3 py-2 rounded-xl backdrop-blur-sm border ${
                      isDarkMode 
                        ? 'bg-emerald-600/20 border-emerald-500/30' 
                        : 'bg-emerald-100 border-emerald-200'
                    }`}>
                      <FileText className={`h-4 w-4 ${
                        isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                      }`} />
                      <span className={`font-mono font-bold text-xs ${
                        isDarkMode ? 'text-emerald-300' : 'text-emerald-700'
                      }`}>
                        {selectedStudyForView.nct_id}
                      </span>
                    </div>
                    
                    <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-xl backdrop-blur-sm border ${
                      isDarkMode 
                        ? 'bg-teal-600/20 border-teal-500/30' 
                        : 'bg-teal-100 border-teal-200'
                    }`}>
                      <span className="text-sm">{getCategoryIcon(selectedStudyForView.category)}</span>
                      <span className={`font-bold text-xs ${
                        isDarkMode ? 'text-teal-300' : 'text-teal-700'
                      }`}>
                        {selectedStudyForView.category}
                      </span>
                    </div>
                    
                    <div className={`px-3 py-2 rounded-xl text-xs font-bold shadow-sm ${
                      isDarkMode 
                        ? 'bg-gradient-to-r from-emerald-600/40 to-teal-600/40 text-emerald-300' 
                        : 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700'
                    }`}>
                      {selectedStudyForView.phase}
                    </div>

                    <div className={`px-3 py-2 rounded-xl text-xs font-bold shadow-sm ${
                      isDarkMode 
                        ? 'bg-gradient-to-r from-blue-600/40 to-indigo-600/40 text-blue-300' 
                        : 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700'
                    }`}>
                      {selectedStudyForView.protocol_version || 'Latest Version'}
                    </div>
                  </div>

                  {/* Sponsor & Last Updated */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className={`flex items-center space-x-3 p-3 rounded-xl backdrop-blur-sm border ${
                      isDarkMode 
                        ? 'bg-purple-600/15 border-purple-500/25' 
                        : 'bg-purple-50 border-purple-200'
                    }`}>
                      <div className={`p-2 rounded-lg ${
                        isDarkMode ? 'bg-purple-600/25' : 'bg-purple-200'
                      }`}>
                        <User className={`h-4 w-4 ${
                          isDarkMode ? 'text-purple-400' : 'text-purple-600'
                        }`} />
                      </div>
                      <div>
                        <p className={`text-xs font-semibold ${
                          isDarkMode ? 'text-purple-300' : 'text-purple-700'
                        }`}>Sponsor</p>
                        <p className={`text-sm font-bold ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-800'
                        }`}>{selectedStudyForView.sponsor || 'Clinical Research Institute'}</p>
                      </div>
                    </div>

                    <div className={`flex items-center space-x-3 p-3 rounded-xl backdrop-blur-sm border ${
                      isDarkMode 
                        ? 'bg-indigo-600/15 border-indigo-500/25' 
                        : 'bg-indigo-50 border-indigo-200'
                    }`}>
                      <div className={`p-2 rounded-lg ${
                        isDarkMode ? 'bg-indigo-600/25' : 'bg-indigo-200'
                      }`}>
                        <Calendar className={`h-4 w-4 ${
                          isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
                        }`} />
                      </div>
                      <div>
                        <p className={`text-xs font-semibold ${
                          isDarkMode ? 'text-indigo-300' : 'text-indigo-700'
                        }`}>Last Updated</p>
                        <p className={`text-sm font-bold ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-800'
                        }`}>{selectedStudyForView.last_amended || 'Recent'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Study Description */}
                <div className={`relative p-6 rounded-2xl backdrop-blur-sm border shadow-lg ${
                  isDarkMode 
                    ? 'bg-gray-700/30 border-gray-600/30' 
                    : 'bg-white/50 border-gray-200/30'
                }`}>
                  <div className="absolute top-3 right-3 w-2 h-2 bg-blue-400/40 rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
                  
                  <h4 className={`text-lg font-black mb-3 bg-gradient-to-r bg-clip-text text-transparent ${
                    isDarkMode 
                      ? 'from-blue-400 to-indigo-400' 
                      : 'from-blue-600 to-indigo-600'
                  }`}>
                    Study Description
                  </h4>
                  <p className={`text-base leading-relaxed ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {selectedStudyForView.description || selectedStudyForView.purpose}
                  </p>
                </div>
                
                {/* Study Purpose */}
                <div className={`relative p-6 rounded-2xl backdrop-blur-sm border shadow-lg ${
                  isDarkMode 
                    ? 'bg-gray-700/30 border-gray-600/30' 
                    : 'bg-white/50 border-gray-200/30'
                }`}>
                  <div className="absolute top-3 right-3 w-2 h-2 bg-teal-400/40 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                  
                  <h4 className={`text-lg font-black mb-3 bg-gradient-to-r bg-clip-text text-transparent ${
                    isDarkMode 
                      ? 'from-teal-400 to-emerald-400' 
                      : 'from-teal-600 to-emerald-600'
                  }`}>
                    Study Purpose
                  </h4>
                  <p className={`text-base leading-relaxed ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {selectedStudyForView.purpose}
                  </p>
                </div>

                {/* Contact Information */}
                <div className={`relative p-6 rounded-2xl backdrop-blur-sm border shadow-lg ${
                  isDarkMode 
                    ? 'bg-gray-700/30 border-gray-600/30' 
                    : 'bg-white/50 border-gray-200/30'
                }`}>
                  <div className="absolute top-3 right-3 w-2 h-2 bg-green-400/40 rounded-full animate-pulse" style={{animationDelay: '0.7s'}}></div>
                  
                  <div className="flex items-center space-x-4 mb-3">
                    <div className={`p-3 rounded-xl ${
                      isDarkMode ? 'bg-green-600/20' : 'bg-green-100'
                    }`}>
                      <Users className={`h-6 w-6 ${
                        isDarkMode ? 'text-green-400' : 'text-green-600'
                      }`} />
                    </div>
                    <h4 className={`text-lg font-black bg-gradient-to-r bg-clip-text text-transparent ${
                      isDarkMode 
                        ? 'from-green-400 to-emerald-400' 
                        : 'from-green-600 to-emerald-600'
                    }`}>
                      Location & Contact
                    </h4>
                  </div>
                  <p className={`text-base leading-relaxed ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {selectedStudyForView.contact_info || 'Contact information will be provided upon enrollment.'}
                  </p>
                </div>
                
                {/* Time Commitment & Key Procedures */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Time Commitment */}
                  <div className={`relative p-6 rounded-2xl backdrop-blur-sm border shadow-lg ${
                    isDarkMode 
                      ? 'bg-gray-700/30 border-gray-600/30' 
                      : 'bg-white/50 border-gray-200/30'
                  }`}>
                    <div className="absolute top-3 right-3 w-2 h-2 bg-emerald-400/40 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                    
                    <div className="flex items-center space-x-4 mb-3">
                      <div className={`p-3 rounded-xl ${
                        isDarkMode ? 'bg-teal-600/20' : 'bg-teal-100'
                      }`}>
                        <Clock className={`h-6 w-6 ${
                          isDarkMode ? 'text-teal-400' : 'text-teal-600'
                        }`} />
                      </div>
                      <h4 className={`text-lg font-black bg-gradient-to-r bg-clip-text text-transparent ${
                        isDarkMode 
                          ? 'from-teal-400 to-emerald-400' 
                          : 'from-teal-600 to-emerald-600'
                      }`}>
                        Time Commitment
                      </h4>
                    </div>
                    <p className={`text-base font-semibold ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {selectedStudyForView.commitment}
                    </p>
                  </div>

                  {/* Key Procedures */}
                  <div className={`relative p-6 rounded-2xl backdrop-blur-sm border shadow-lg ${
                    isDarkMode 
                      ? 'bg-gray-700/30 border-gray-600/30' 
                      : 'bg-white/50 border-gray-200/30'
                  }`}>
                    <div className="absolute top-3 right-3 w-2 h-2 bg-purple-400/40 rounded-full animate-pulse" style={{animationDelay: '1.2s'}}></div>
                    
                    <div className="flex items-center space-x-4 mb-4">
                      <div className={`p-3 rounded-xl ${
                        isDarkMode ? 'bg-purple-600/20' : 'bg-purple-100'
                      }`}>
                        <FileText className={`h-6 w-6 ${
                          isDarkMode ? 'text-purple-400' : 'text-purple-600'
                        }`} />
                      </div>
                      <h4 className={`text-lg font-black bg-gradient-to-r bg-clip-text text-transparent ${
                        isDarkMode 
                          ? 'from-purple-400 to-pink-400' 
                          : 'from-purple-600 to-pink-600'
                      }`}>
                        Key Procedures
                      </h4>
                    </div>
                    
                    <div className="space-y-2">
                      {(selectedStudyForView.key_procedures || [
                        'Medical assessments',
                        'Laboratory tests',
                        'Study medication',
                        'Regular monitoring'
                      ]).map((procedure, index) => (
                        <div 
                          key={index}
                          className={`flex items-center space-x-3 p-2 rounded-lg transition-all duration-300 hover:scale-105 ${
                            isDarkMode 
                              ? 'bg-purple-600/10 hover:bg-purple-600/20' 
                              : 'bg-purple-50 hover:bg-purple-100'
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

                {/* Screening Questions */}
                <div className={`relative p-6 rounded-2xl backdrop-blur-sm border shadow-lg ${
                  isDarkMode 
                    ? 'bg-gray-700/30 border-gray-600/30' 
                    : 'bg-white/50 border-gray-200/30'
                }`}>
                  <div className="absolute top-3 right-3 w-2 h-2 bg-amber-400/40 rounded-full animate-pulse" style={{animationDelay: '1.3s'}}></div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-xl ${
                        isDarkMode ? 'bg-amber-600/20' : 'bg-amber-100'
                      }`}>
                        <FileText className={`h-6 w-6 ${
                          isDarkMode ? 'text-amber-400' : 'text-amber-600'
                        }`} />
                      </div>
                      <h4 className={`text-lg font-black bg-gradient-to-r bg-clip-text text-transparent ${
                        isDarkMode 
                          ? 'from-amber-400 to-orange-400' 
                          : 'from-amber-600 to-orange-600'
                      }`}>
                        Screening Questions
                      </h4>
                    </div>
                    
                    {/* Total Questions Count Badge */}
                    <div className={`px-4 py-2 rounded-xl backdrop-blur-sm border ${
                      isDarkMode 
                        ? 'bg-gradient-to-r from-amber-600/30 to-orange-600/30 border-amber-500/40 text-amber-300' 
                        : 'bg-gradient-to-r from-amber-100 to-orange-100 border-amber-200/40 text-amber-700'
                    }`}>
                      <div className="text-center">
                        <div className="text-lg font-black">
                          {selectedStudyForView.criteria?.length || 0}
                        </div>
                        <div className="text-xs font-semibold">
                          Total Questions
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <p className={`text-base leading-relaxed mb-6 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Participants will be asked {selectedStudyForView.criteria?.length || 0} screening questions to determine their eligibility for this study. The questions cover medical history, current health status, and study-specific requirements.
                  </p>
                </div>


                
                {/* Action Buttons */}
                <div className="flex justify-center space-x-4 pt-4">
                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteStudy(selectedStudyForView.id, selectedStudyForView.title)}
                    className={`group relative px-6 py-4 rounded-2xl font-bold text-lg transition-all duration-500 hover:scale-110 hover:-translate-y-2 backdrop-blur-md border shadow-2xl ${
                      isDarkMode 
                        ? 'bg-gradient-to-r from-red-600/80 via-rose-600/70 to-red-600/80 hover:from-red-500/90 hover:via-rose-500/80 hover:to-red-500/90 border-red-500/50 text-white' 
                        : 'bg-gradient-to-r from-red-500/90 via-rose-500/80 to-red-500/90 hover:from-red-600/95 hover:via-rose-600/85 hover:to-red-600/95 border-red-400/50 text-white'
                    } hover:shadow-2xl hover:shadow-red-500/40`}
                  >
                    <span className="relative z-10 flex items-center space-x-3">
                      <Trash2 className="h-5 w-5 group-hover:scale-125 transition-transform duration-300" />
                      <span>Delete Study</span>
                    </span>
                    
                    {/* Button effects */}
                    <div className="absolute inset-0 bg-gradient-to-r from-red-400/0 via-red-400/20 to-red-400/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                    <div className="absolute inset-0 bg-red-400/0 group-hover:bg-red-400/15 rounded-2xl blur-sm transition-all duration-500"></div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Study Modal */}
      {showDeleteStudyModal && studyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div 
            className={`absolute inset-0 backdrop-blur-xl transition-all duration-500 ${
              isDarkMode 
                ? 'bg-black/60' 
                : 'bg-black/40'
            }`}
            onClick={() => setShowDeleteStudyModal(false)}
          />
          
          {/* Modal Content */}
          <div 
            className={`relative w-full max-w-md m-4 overflow-hidden rounded-3xl backdrop-blur-2xl border shadow-2xl transform transition-all duration-700 scale-100 animate-in fade-in-0 zoom-in-95 ${
              isDarkMode 
                ? 'bg-gradient-to-br from-gray-800/80 via-gray-700/60 to-gray-800/80 border-gray-600/40' 
                : 'bg-gradient-to-br from-white/90 via-white/80 to-white/90 border-white/40'
            }`}
          >
            {/* Delete background effects - Emerald theme */}
            <div className={`absolute inset-0 bg-gradient-to-br opacity-20 transition-all duration-700 rounded-3xl ${
              isDarkMode ? 'from-red-500/30 to-rose-500/25' : 'from-red-400/25 to-rose-400/20'
            }`}></div>
            
            {/* Floating sparkles */}
            <div className="absolute top-4 right-4 w-2 h-2 bg-red-400/50 rounded-full animate-bounce shadow-lg"></div>
            <div className="absolute top-8 right-12 w-1.5 h-1.5 bg-rose-400/40 rounded-full animate-bounce shadow-md" style={{animationDelay: '0.3s'}}></div>
            <div className="absolute bottom-4 left-4 w-2.5 h-2.5 bg-red-300/35 rounded-full animate-bounce shadow-lg" style={{animationDelay: '0.6s'}}></div>
            
            {/* Content */}
            <div className="relative p-8">
              {/* Warning Icon */}
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-red-600/30 via-rose-600/20 to-red-600/30' 
                  : 'bg-gradient-to-br from-red-100 via-rose-100 to-red-100'
              }`}>
                <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              
              {/* Title */}
              <h3 className={`text-xl font-black text-center mb-2 bg-gradient-to-r bg-clip-text text-transparent ${
                isDarkMode 
                  ? 'from-red-400 via-rose-400 to-red-400' 
                  : 'from-red-600 via-rose-600 to-red-600'
              }`}>
                Delete Study?
              </h3>
              
              {/* Study Info */}
              <div className={`p-4 rounded-xl mb-6 ${
                isDarkMode 
                  ? 'bg-gray-700/30 border border-red-700/30' 
                  : 'bg-red-50/50 border border-red-200/30'
              }`}>
                <p className={`font-bold text-sm mb-1 ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  {studyToDelete.title}
                </p>
                <p className={`text-xs ${
                  isDarkMode ? 'text-red-300' : 'text-red-600'
                }`}>
                  <span className="font-semibold">Study ID:</span> {studyToDelete.id}
                </p>
              </div>
              
              <p className={`text-sm text-center mb-6 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                This action cannot be undone. All study data will be permanently deleted.
              </p>
              
              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteStudyModal(false)}
                  className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-105 ${
                    isDarkMode 
                      ? 'bg-gray-600/50 hover:bg-gray-500/60 text-gray-300 border border-gray-500/30' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                  } shadow-lg hover:shadow-xl`}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteStudy}
                  className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-105 ${
                    isDarkMode 
                      ? 'bg-gradient-to-br from-red-600/80 via-rose-600/70 to-red-600/80 hover:from-red-500/90 hover:via-rose-500/80 hover:to-red-500/90 text-white' 
                      : 'bg-gradient-to-br from-red-500/90 via-rose-500/80 to-red-500/90 hover:from-red-600/95 hover:via-rose-600/85 hover:to-red-600/95 text-white'
                  } shadow-lg hover:shadow-xl`}
                >
                  Delete Study
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Interview Modal - Purple theme like Interview Sessions */}
      {showDeleteInterviewModal && interviewToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div 
            className={`absolute inset-0 backdrop-blur-xl transition-all duration-500 ${
              isDarkMode 
                ? 'bg-black/60' 
                : 'bg-black/40'
            }`}
            onClick={() => setShowDeleteInterviewModal(false)}
          />
          
          {/* Modal Content */}
          <div 
            className={`relative w-full max-w-md m-4 overflow-hidden rounded-3xl backdrop-blur-2xl border shadow-2xl transform transition-all duration-700 scale-100 animate-in fade-in-0 zoom-in-95 ${
              isDarkMode 
                ? 'bg-gradient-to-br from-gray-800/80 via-gray-700/60 to-gray-800/80 border-gray-600/40' 
                : 'bg-gradient-to-br from-white/90 via-white/80 to-white/90 border-white/40'
            }`}
          >
            {/* Delete background effects - Purple theme */}
            <div className={`absolute inset-0 bg-gradient-to-br opacity-20 transition-all duration-700 rounded-3xl ${
              isDarkMode ? 'from-purple-500/30 to-indigo-500/25' : 'from-purple-400/25 to-indigo-400/20'
            }`}></div>
            
            {/* Floating sparkles */}
            <div className="absolute top-4 right-4 w-2 h-2 bg-purple-400/50 rounded-full animate-bounce shadow-lg"></div>
            <div className="absolute top-8 right-12 w-1.5 h-1.5 bg-indigo-400/40 rounded-full animate-bounce shadow-md" style={{animationDelay: '0.3s'}}></div>
            <div className="absolute bottom-4 left-4 w-2.5 h-2.5 bg-purple-300/35 rounded-full animate-bounce shadow-lg" style={{animationDelay: '0.6s'}}></div>
            
            {/* Content */}
            <div className="relative p-8">
              {/* Warning Icon */}
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-purple-600/30 via-indigo-600/20 to-purple-600/30' 
                  : 'bg-gradient-to-br from-purple-100 via-indigo-100 to-purple-100'
              }`}>
                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              
              {/* Title */}
              <h3 className={`text-xl font-black text-center mb-2 bg-gradient-to-r bg-clip-text text-transparent ${
                isDarkMode 
                  ? 'from-purple-400 via-indigo-400 to-purple-400' 
                  : 'from-purple-600 via-indigo-600 to-purple-600'
              }`}>
                Delete Interview?
              </h3>
              
              {/* Interview Info */}
              <div className={`p-4 rounded-xl mb-6 ${
                isDarkMode 
                  ? 'bg-gray-700/30 border border-purple-700/30' 
                  : 'bg-purple-50/50 border border-purple-200/30'
              }`}>
                <p className={`font-bold text-sm mb-1 ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  {interviewToDelete.participantName}
                </p>
                <p className={`text-xs ${
                  isDarkMode ? 'text-purple-300' : 'text-purple-600'
                }`}>
                  <span className="font-semibold">Participant ID:</span> {interviewToDelete.participantId}
                </p>
              </div>
              
              <p className={`text-sm text-center mb-6 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                This action cannot be undone. All interview data will be permanently deleted.
              </p>
              
              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteInterviewModal(false)}
                  className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-105 ${
                    isDarkMode 
                      ? 'bg-gray-600/50 hover:bg-gray-500/60 text-gray-300 border border-gray-500/30' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                  } shadow-lg hover:shadow-xl`}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteInterview}
                  className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-105 ${
                    isDarkMode 
                      ? 'bg-gradient-to-br from-purple-600/80 via-indigo-600/70 to-purple-600/80 hover:from-purple-500/90 hover:via-indigo-500/80 hover:to-purple-500/90 text-white' 
                      : 'bg-gradient-to-br from-purple-500/90 via-indigo-500/80 to-purple-500/90 hover:from-purple-600/95 hover:via-indigo-600/85 hover:to-purple-600/95 text-white'
                  } shadow-lg hover:shadow-xl`}
                >
                  Delete Interview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
    </>
  );
};

export default AdminDashboard; 