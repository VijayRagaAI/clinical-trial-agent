import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminInterview, AdminInterviewsResponse } from '../types/interview';
import { Plus, Users, CheckCircle, Clock, AlertCircle, Calendar, User, X, Eye, Download, Trash2, MessageSquare, ArrowUpDown, UserCircle, Search, Sparkles, FileText, Settings, Palette, Moon, Sun, Play, Mic } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<AdminInterview[]>([]);
  const [stats, setStats] = useState({
    total_count: 0,
    completed_count: 0,
    in_progress_count: 0,
    abandoned_count: 0
  });
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    fetchInterviews();
    loadThemePreference();
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
          abandoned_count: data.abandoned_count
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

  // Sort interviews by date
  const sortedInterviews = [...interviews].sort((a, b) => {
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
    return badges[status as keyof typeof badges] || null;
  };

  const getEligibilityBadge = (eligibility: AdminInterview['eligibility_result']) => {
    if (!eligibility) {
      return (
        <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-300 hover:scale-105 ${
          isDarkMode 
            ? 'bg-gray-800 text-gray-400 border-gray-700/50' 
            : 'bg-gray-100 text-gray-600 border-gray-200/50'
        }`}>
          No Result
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

  const handleDeleteInterview = async (interviewId: string, participantName: string) => {
    if (window.confirm(`Are you sure you want to delete the interview for ${participantName}? This action cannot be undone.`)) {
      try {
        // TODO: Implement delete API call
        console.log(`Delete interview ${interviewId} for ${participantName}`);
        // For now, just refresh the data
        await fetchInterviews();
      } catch (error) {
        console.error('Error deleting interview:', error);
        alert('Failed to delete interview. Please try again.');
      }
    }
  };

  const handleViewInterview = (interview: AdminInterview) => {
    // TODO: Implement view details modal or navigation
    console.log('View interview:', interview);
  };

  const handleDownloadInterview = (interview: AdminInterview) => {
    // TODO: Implement download functionality
    console.log('Download interview:', interview);
  };

  const StatCard = ({ icon: Icon, title, value, color }: {
    icon: any;
    title: string;
    value: number;
    color: string;
  }) => (
    <div className={`group relative overflow-hidden rounded-3xl backdrop-blur-xl border transition-all duration-500 hover:scale-[1.05] hover:shadow-2xl hover:-translate-y-2 ${
      color === 'blue' 
        ? isDarkMode 
          ? 'bg-blue-600/10 border-blue-500/20 hover:bg-blue-600/20 hover:shadow-blue-500/30' 
          : 'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/15 hover:shadow-blue-500/20'
        : color === 'emerald'
        ? isDarkMode 
          ? 'bg-emerald-600/10 border-emerald-500/20 hover:bg-emerald-600/20 hover:shadow-emerald-500/30' 
          : 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/15 hover:shadow-emerald-500/20'
        : color === 'indigo'
        ? isDarkMode 
          ? 'bg-indigo-600/10 border-indigo-500/20 hover:bg-indigo-600/20 hover:shadow-indigo-500/30' 
          : 'bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/15 hover:shadow-indigo-500/20'
        : isDarkMode 
          ? 'bg-orange-600/10 border-orange-500/20 hover:bg-orange-600/20 hover:shadow-orange-500/30' 
          : 'bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/15 hover:shadow-orange-500/20'
    } p-6 shadow-xl`}>
      {/* Enhanced magical background effects */}
      <div className={`absolute inset-0 bg-gradient-to-br opacity-5 transition-opacity duration-500 group-hover:opacity-15 rounded-3xl ${
        color === 'blue' 
          ? 'from-blue-500 to-blue-600' 
          : color === 'emerald'
          ? 'from-emerald-500 to-emerald-600'
          : color === 'indigo'
          ? 'from-indigo-500 to-indigo-600'
          : 'from-orange-500 to-red-500'
      }`}></div>
      
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium mb-2 transition-all duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>{title}</p>
          <p className={`text-4xl font-bold group-hover:scale-110 transition-transform duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>{value}</p>
        </div>
        <div className={`relative p-4 rounded-2xl bg-gradient-to-br shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-12 ${
          color === 'blue' 
            ? 'from-blue-500 to-blue-600 shadow-blue-500/40' 
            : color === 'emerald'
            ? 'from-emerald-500 to-emerald-600 shadow-emerald-500/40'
            : color === 'indigo'
            ? 'from-indigo-500 to-indigo-600 shadow-indigo-500/40'
            : 'from-orange-500 to-red-500 shadow-orange-500/40'
        }`}>
          <Icon className="w-7 h-7 text-white drop-shadow-lg" />
          
          {/* Enhanced floating mini-circles */}
          <div className="absolute top-1 right-1 w-2 h-2 bg-white/40 rounded-full animate-pulse"></div>
          <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-white/30 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute top-2 left-2 w-1 h-1 bg-white/20 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
          
          {/* Glow effect */}
          <div className={`absolute inset-0 rounded-2xl blur-lg opacity-0 group-hover:opacity-40 transition-opacity duration-500 ${
            color === 'blue' 
              ? 'bg-blue-400' 
              : color === 'emerald'
              ? 'bg-emerald-400'
              : color === 'indigo'
              ? 'bg-indigo-400'
              : 'bg-orange-400'
          }`}></div>
        </div>
      </div>
      
      {/* Enhanced decorative elements with shimmer */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-1000"></div>
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full -ml-10 -mb-10 group-hover:scale-150 transition-transform duration-1000"></div>
      
      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-3xl"></div>
    </div>
  );

  return (
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

          {/* Theme Settings - Only Setting Available */}
          <div className="group">
            <button
              onClick={() => handleThemeChange(!isDarkMode)}
              className={`w-full p-4 rounded-2xl backdrop-blur-sm border transition-all duration-300 hover:scale-105 hover:-translate-y-1 ${
                isDarkMode 
                  ? 'bg-amber-600/10 border-amber-500/30 hover:bg-amber-600/20 hover:border-amber-400/50 hover:shadow-lg hover:shadow-amber-500/20' 
                  : 'bg-orange-50/80 border-orange-200/60 hover:bg-orange-100/90 hover:border-orange-300/80 hover:shadow-lg hover:shadow-orange-200/50'
              }`}
            >
              <div className="flex flex-col items-center space-y-3">
                <div className={`relative p-3 rounded-xl transition-all duration-300 group-hover:rotate-12 ${
                  isDarkMode ? 'bg-amber-600/20' : 'bg-orange-500/20'
                }`}>
                  <Palette className={`h-6 w-6 ${isDarkMode ? 'text-amber-400' : 'text-orange-600'}`} />
                  
                  {/* Floating Theme Badge */}
                  <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 group-hover:scale-110 ${
                    isDarkMode 
                      ? 'bg-amber-500 text-amber-900 border-amber-400' 
                      : 'bg-orange-500 text-orange-100 border-orange-500'
                  }`}>
                    {isDarkMode ? (
                      <Moon className="h-4 w-4" />
                    ) : (
                      <Sun className="h-4 w-4" />
                    )}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className={`font-semibold text-sm ${isDarkMode ? 'text-amber-300' : 'text-orange-700'}`}>
                    Theme Mode
                  </div>
                  <div className={`text-xs mt-1 ${isDarkMode ? 'text-amber-400/70' : 'text-orange-600/70'}`}>
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
                Clinical Trial Dashboard
              </h1>
              <p className={`text-lg mt-2 transition-all duration-500 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Manage and monitor all clinical trial interviews with elegance
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <StatCard
            icon={Users}
            title="Total Interviews"
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
          <StatCard
            icon={AlertCircle}
            title="Abandoned"
            value={stats.abandoned_count}
            color="orange"
          />
        </div>

        {/* Enhanced Start New Interview Card */}
        <div className="flex justify-center mb-12">
          <div className="w-full max-w-md">
            <div className={`group relative overflow-hidden rounded-3xl backdrop-blur-xl border p-6 shadow-2xl transition-all duration-700 transform hover:scale-[1.05] hover:-translate-y-4 ${
              isDarkMode 
                ? 'bg-gradient-to-br from-gray-800/90 via-gray-700/80 to-gray-800/90 border-gray-600/40 hover:shadow-purple-500/40' 
                : 'bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700 border-purple-300/30 hover:shadow-purple-500/40'
            }`}>
              {/* Enhanced magical background effects */}
              <div className={`absolute inset-0 bg-gradient-to-br opacity-80 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl ${
                isDarkMode 
                  ? 'from-blue-500/20 via-indigo-500/25 to-purple-500/20' 
                  : 'from-white/15 via-purple-300/25 to-indigo-400/15'
              }`}></div>
              
              {/* Enhanced floating sparkles */}
              <div className={`absolute top-6 right-8 w-3 h-3 rounded-full animate-bounce ${
                isDarkMode ? 'bg-yellow-400/70' : 'bg-yellow-300/60'
              }`} style={{animationDelay: '0s'}}></div>
              <div className={`absolute top-12 right-16 w-2 h-2 rounded-full animate-bounce ${
                isDarkMode ? 'bg-pink-400/60' : 'bg-pink-300/50'
              }`} style={{animationDelay: '0.3s'}}></div>
              <div className={`absolute top-4 left-12 w-2.5 h-2.5 rounded-full animate-bounce ${
                isDarkMode ? 'bg-cyan-400/50' : 'bg-cyan-300/40'
              }`} style={{animationDelay: '0.6s'}}></div>
              <div className={`absolute bottom-8 left-10 w-2 h-2 rounded-full animate-bounce ${
                isDarkMode ? 'bg-emerald-400/60' : 'bg-emerald-300/50'
              }`} style={{animationDelay: '0.9s'}}></div>
              <div className={`absolute bottom-6 right-12 w-1.5 h-1.5 rounded-full animate-bounce ${
                isDarkMode ? 'bg-orange-400/50' : 'bg-orange-300/40'
              }`} style={{animationDelay: '1.2s'}}></div>
              
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
                
                <h2 className={`text-3xl font-black drop-shadow-lg mb-4 bg-gradient-to-r bg-clip-text transition-all duration-500 ${
                  isDarkMode 
                    ? 'from-blue-300 via-indigo-200 to-purple-300 text-transparent' 
                    : 'from-white via-yellow-100 to-white text-transparent'
                }`}>
                  Launch New Interview
                </h2>
                <p className={`mb-6 text-sm leading-relaxed max-w-sm mx-auto transition-all duration-500 ${
                  isDarkMode ? 'text-gray-200/90' : 'text-white/80'
                }`}>
                  Begin an intelligent screening session with our AI-powered Voice assistant.
                </p>
                
                <button
                  onClick={handleStartNewInterview}
                  className={`group/btn relative overflow-hidden backdrop-blur-lg border-2 font-bold text-xl transition-all duration-400 flex items-center gap-5 hover:gap-6 shadow-2xl mx-auto px-12 py-5 rounded-2xl ${
                    isDarkMode 
                      ? 'bg-gray-700/30 hover:bg-gray-600/40 border-gray-500/50 hover:border-gray-400/70 text-gray-200 hover:shadow-blue-500/30' 
                      : 'bg-white/20 hover:bg-white/30 border-white/50 hover:border-white/70 text-white hover:shadow-white/30'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-yellow-200/20 to-white/10 group-hover/btn:from-white/20 group-hover/btn:via-yellow-200/30 group-hover/btn:to-white/20 transition-all duration-400"></div>
                  <Play className="w-6 h-6 group-hover/btn:scale-125 group-hover/btn:translate-x-1 transition-all duration-500 relative z-10" />
                  <span className="relative z-10">Start Interview</span>
                  <div className="absolute inset-0 bg-white/0 group-hover/btn:bg-white/10 transition-all duration-400 rounded-2xl"></div>
                  
                  {/* Button glow */}
                  <div className="absolute inset-0 bg-purple-400/0 group-hover/btn:bg-purple-400/20 rounded-2xl blur-sm transition-all duration-400"></div>
                </button>
              </div>
              
              {/* Enhanced floating decorative elements */}
              <div className="absolute -top-12 -right-12 w-56 h-56 bg-gradient-to-br from-pink-300/20 via-purple-300/15 to-transparent rounded-full group-hover:scale-125 group-hover:rotate-12 transition-all duration-1000 blur-xl"></div>
              <div className="absolute -bottom-8 -left-8 w-44 h-44 bg-gradient-to-br from-cyan-300/20 via-indigo-300/15 to-transparent rounded-full group-hover:scale-125 group-hover:-rotate-12 transition-all duration-1000 blur-lg"></div>
              
              {/* Magical shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1500"></div>
              
              {/* Floating rings */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-white/10 rounded-full group-hover:scale-110 transition-transform duration-1000"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-purple-300/10 rounded-full group-hover:scale-105 transition-transform duration-1200"></div>
            </div>
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
          <div className={`relative backdrop-blur-sm bg-gradient-to-r border-b px-10 py-8 transition-all duration-500 ${
            isDarkMode 
              ? 'from-blue-600/15 via-indigo-600/12 to-purple-600/15 border-blue-700/30' 
              : 'from-violet-500/15 via-purple-500/12 to-indigo-500/15 border-purple-200/30'
          }`}>
            <div className={`grid grid-cols-12 gap-6 items-center text-sm font-bold uppercase tracking-wider transition-all duration-500 ${
              isDarkMode ? 'text-gray-200' : 'text-gray-800'
            }`}>
              <div className="col-span-3 flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span>Participant</span>
              </div>
              <div className="col-span-2">
                <button 
                  onClick={handleSortByDate}
                  className={`flex items-center space-x-3 transition-all duration-300 group hover:scale-105 ${
                    isDarkMode ? 'hover:text-purple-400' : 'hover:text-purple-600'
                  }`}
                >
                  <div className="w-2 h-2 bg-indigo-500 rounded-full group-hover:scale-125 transition-transform animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <span>Date & Time</span>
                  <ArrowUpDown className={`h-4 w-4 transition-all duration-300 group-hover:scale-110 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                </button>
              </div>
              <div className="col-span-2 flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                <span>Study</span>
              </div>
              <div className="col-span-2 flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" style={{animationDelay: '0.6s'}}></div>
                <span>Status</span>
              </div>
              <div className="col-span-2 flex items-center space-x-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" style={{animationDelay: '0.8s'}}></div>
                <span>Eligibility</span>
              </div>
              <div className="col-span-1 text-center flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                <span>Actions</span>
              </div>
            </div>
          </div>

          {/* Premium Table Content */}
          <div className="relative max-h-[700px] overflow-y-auto custom-scrollbar">
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
                  <User className="h-12 w-12 text-purple-400" />
                </div>
                <p className={`text-xl font-bold mb-3 transition-all duration-500 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  No interviews yet
                </p>
                <p className={`text-sm transition-all duration-500 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Click "Start Interview" above to begin your first interview session
                </p>
              </div>
            ) : (
              <div className={`divide-y transition-all duration-500 ${
                isDarkMode ? 'divide-purple-700/20' : 'divide-purple-100/50'
              }`}>
                {sortedInterviews.map((interview, index) => (
                  <div 
                    key={interview.id} 
                    className={`group relative px-10 py-8 transition-all duration-500 hover:shadow-xl hover:-translate-y-1 ${
                      isDarkMode 
                        ? 'hover:bg-gradient-to-r hover:from-purple-900/20 hover:via-violet-900/15 hover:to-indigo-900/20' 
                        : 'hover:bg-gradient-to-r hover:from-purple-50/80 hover:via-violet-50/60 hover:to-indigo-50/80'
                    }`}
                  >
                    {/* Enhanced premium background decoration for hover */}
                    <div className={`absolute inset-0 bg-gradient-to-r from-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 ${
                      isDarkMode ? 'via-purple-400/8' : 'via-purple-500/8'
                    }`}></div>
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-indigo-500 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-top"></div>
                    
                    <div className="relative grid grid-cols-12 gap-6 items-center">
                      {/* Participant */}
                      <div className="col-span-3 flex items-center space-x-4">
                        <div className="relative flex-shrink-0">
                          <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                            <User className="h-8 w-8 text-white drop-shadow-lg" />
                            
                            {/* Enhanced floating mini-circles like stat cards */}
                            <div className="absolute top-1 right-1 w-2 h-2 bg-white/40 rounded-full animate-pulse"></div>
                            <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-white/30 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                            <div className="absolute top-2 left-2 w-1 h-1 bg-white/20 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                            
                            {/* Glow effect like stat cards */}
                            <div className="absolute inset-0 rounded-2xl blur-lg opacity-0 group-hover:opacity-40 transition-opacity duration-500 bg-violet-400"></div>
                          </div>
                          <div className={`absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 shadow-md transition-all duration-300 ${
                            isDarkMode ? 'border-gray-800' : 'border-white'
                          }`}>
                            <div className="w-full h-full bg-emerald-500 rounded-full animate-pulse"></div>
                          </div>
                        </div>
                        <div>
                          <div className={`font-bold text-xl transition-colors duration-300 group-hover:scale-105 ${
                            isDarkMode 
                              ? 'text-white group-hover:text-purple-400' 
                              : 'text-gray-900 group-hover:text-purple-600'
                          }`}>
                            {interview.participant_name}
                          </div>
                        </div>
                      </div>

                      {/* Date & Time */}
                      <div className="col-span-2">
                        <div className={`flex items-center space-x-3 text-sm transition-all duration-300 ${
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
                            <span className="font-medium">{formatDate(interview.date)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Study */}
                      <div className="col-span-2">
                        <span className={`inline-flex items-center px-4 py-2 rounded-2xl text-sm font-bold bg-gradient-to-r border shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300 ${
                          isDarkMode 
                            ? 'from-blue-900/40 via-indigo-900/40 to-violet-900/40 text-blue-300 border-blue-700/60' 
                            : 'from-blue-100 via-indigo-100 to-violet-100 text-blue-800 border-blue-200/60'
                        }`}>
                          <FileText className={`w-3 h-3 mr-2 ${
                            isDarkMode ? 'text-blue-400' : 'text-blue-600'
                          }`} />
                          {interview.study_name}
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

                      {/* Actions */}
                      <div className="col-span-1 flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleViewInterview(interview)}
                          className="group/btn relative p-3 rounded-2xl bg-gradient-to-br from-blue-500/15 to-indigo-500/15 hover:from-blue-500/25 hover:to-indigo-500/25 border border-blue-500/30 hover:border-blue-500/50 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-1"
                          title="View Details"
                        >
                          <Eye className="h-5 w-5 group-hover/btn:scale-110 transition-transform duration-300" />
                          <div className="absolute inset-0 bg-blue-500/0 group-hover/btn:bg-blue-500/10 rounded-2xl transition-all duration-300"></div>
                        </button>
                        
                        <button
                          onClick={() => handleDownloadInterview(interview)}
                          className="group/btn relative p-3 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-teal-500/15 hover:from-emerald-500/25 hover:to-teal-500/25 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-1"
                          title="Download Data"
                        >
                          <Download className="h-5 w-5 group-hover/btn:scale-110 transition-transform duration-300" />
                          <div className="absolute inset-0 bg-emerald-500/0 group-hover/btn:bg-emerald-500/10 rounded-2xl transition-all duration-300"></div>
                        </button>
                        
                        <button
                          onClick={() => handleDeleteInterview(interview.id, interview.participant_name)}
                          className="group/btn relative p-3 rounded-2xl bg-gradient-to-br from-red-500/15 to-rose-500/15 hover:from-red-500/25 hover:to-rose-500/25 border border-red-500/30 hover:border-red-500/50 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-red-500/30 hover:-translate-y-1"
                          title="Delete Interview"
                        >
                          <Trash2 className="h-5 w-5 group-hover/btn:scale-110 transition-transform duration-300" />
                          <div className="absolute inset-0 bg-red-500/0 group-hover/btn:bg-red-500/10 rounded-2xl transition-all duration-300"></div>
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


    </div>
  );
};

export default AdminDashboard; 