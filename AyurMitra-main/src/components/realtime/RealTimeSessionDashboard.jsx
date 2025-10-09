// src/components/realtime/RealTimeSessionDashboard.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Clock, Users, WifiOff, Play, CheckCircle, Calendar,
  Eye, RefreshCw, Monitor, PhoneCall, Video, Zap, BarChart3, 
  Menu, X, Settings, AlertTriangle, Maximize2, Minimize2, ChevronLeft
} from 'lucide-react';
import { useRealTime } from '../../context/RealTimeContext';
import ActiveSessionTracker from './ActiveSessionTracker';
import ProviderStatusWidget from './ProviderStatusWidget';
import SessionNotifications from './SessionNotifications';
import LiveSessionMetrics from './LiveSessionMetrics';

const RealTimeSessionDashboard = () => {
  const {
    isConnected,
    connectionStatus,
    unreadNotifications,
    providerStatus,
    activeSessions
  } = useRealTime();

  // ✅ NEW: Real session data state
  const [sessionSummaries, setSessionSummaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedSession, setSelectedSession] = useState(null);
  const [showMetrics, setShowMetrics] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidePanel, setSidePanel] = useState(false);
  const [mobileView, setMobileView] = useState(false);

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setMobileView(window.innerWidth < 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // ✅ NEW: Load real session data
  const loadSessionData = useCallback(async () => {
    if (!isConnected) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Load today's consultations
      const response = await fetch('http://localhost:3003/api/consultations/doctor/today', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        // Format sessions for display
        const formattedSessions = data.data.map(session => ({
          id: session._id,
          patientName: session.patientId?.name || 'Unknown Patient',
          type: session.consultationType || 'video', // video or audio
          status: session.status,
          scheduledAt: session.scheduledFor,
          estimatedDuration: session.estimatedDuration || 60,
          participantCount: session.activeParticipants?.length || 0,
          lastUpdate: session.updatedAt,
          therapyType: session.therapyType || 'general',
          roomNumber: session.roomNumber || 'Virtual',
          notes: session.notes || '',
          currentPhase: session.currentPhase || 'scheduled',
          providerId: session.providerId,
          patientId: session.patientId?._id
        }));

        setSessionSummaries(formattedSessions);
        console.log('✅ Loaded real session data:', formattedSessions);
      } else {
        setSessionSummaries([]);
      }
    } catch (err) {
      console.error('❌ Failed to load session data:', err);
      setError(err.message);
      
      // Fallback: try therapy tracking data
      try {
        const fallbackResponse = await fetch('http://localhost:3003/api/realtime/therapy-tracking/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          
          if (fallbackData.success) {
            const allSessions = [
              ...fallbackData.data.activeSessions || [],
              ...fallbackData.data.upcomingSessions || [],
              ...fallbackData.data.completedToday || []
            ];
            
            setSessionSummaries(allSessions);
            console.log('✅ Loaded fallback session data:', allSessions);
          }
        }
      } catch (fallbackErr) {
        console.error('❌ Fallback data load failed:', fallbackErr);
        setSessionSummaries([]);
      }
    } finally {
      setLoading(false);
    }
  }, [isConnected]);

  // ✅ Load real consultations data
  const loadConsultationsData = useCallback(async () => {
    if (!isConnected) return;

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      // Try to load from doctor consultations endpoint
      const response = await fetch('http://localhost:3003/api/doctors/consultations?today=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.data?.consultations) {
          const sessions = data.data.consultations.map(consultation => ({
            id: consultation._id,
            patientName: consultation.patientId?.name || consultation.patientName || 'Unknown Patient',
            type: 'video', // Default type
            status: consultation.status,
            scheduledAt: consultation.scheduledFor,
            estimatedDuration: consultation.estimatedDuration || 60,
            participantCount: consultation.activeParticipants?.length || 0,
            lastUpdate: consultation.updatedAt,
            therapyType: consultation.type || 'general',
            roomNumber: consultation.roomNumber || 'Virtual',
            notes: consultation.notes || '',
            currentPhase: consultation.currentPhase || 'scheduled',
            providerId: consultation.providerId,
            patientId: consultation.patientId?._id || consultation.patientId
          }));

          setSessionSummaries(sessions);
          console.log('✅ Loaded consultations data:', sessions);
          return;
        }
      }
    } catch (err) {
      console.error('❌ Failed to load consultations:', err);
    }

    // Fallback to previous method
    await loadSessionData();
  }, [isConnected, loadSessionData]);

  // Auto refresh
  useEffect(() => {
    let interval;
    if (autoRefresh && isConnected) {
      interval = setInterval(() => loadConsultationsData(), 15000);
    }
    return () => interval && clearInterval(interval);
  }, [autoRefresh, isConnected, loadConsultationsData]);

  // Initial load
  useEffect(() => {
    if (isConnected) {
      loadConsultationsData();
    }
  }, [isConnected, loadConsultationsData]);

  // Compact stats
  const stats = useMemo(() => {
    const total = sessionSummaries.length;
    const active = sessionSummaries.filter(s => s.status === 'in_progress').length;
    const scheduled = sessionSummaries.filter(s => ['scheduled', 'confirmed'].includes(s.status)).length;
    const completed = sessionSummaries.filter(s => s.status === 'completed').length;
    const participants = sessionSummaries.reduce((n, s) => n + (s.participantCount || 0), 0);
    return { total, active, scheduled, completed, participants };
  }, [sessionSummaries]);

  const getStatusDot = (status) => {
    const colors = {
      in_progress: 'bg-emerald-500 animate-pulse',
      scheduled: 'bg-blue-500',
      confirmed: 'bg-blue-500',
      completed: 'bg-slate-400',
      cancelled: 'bg-red-500',
      paused: 'bg-orange-500'
    };
    return colors[status] || 'bg-slate-400';
  };

  const getTypeIcon = (type, status) => {
    const iconClass = "w-4 h-4";
    if (status === 'in_progress') {
      return type === 'video' 
        ? <Video className={`${iconClass} text-emerald-600`} />
        : <PhoneCall className={`${iconClass} text-emerald-600`} />;
    }
    return <Monitor className={`${iconClass} text-slate-500`} />;
  };

  const formatTime = (dateString) => {
    if (!dateString) return '--:--';
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes) => {
    const h = Math.floor((minutes || 0) / 60);
    const m = (minutes || 0) % 60;
    return h ? `${h}h${m}m` : `${m}m`;
  };

  const handleSessionSelect = useCallback((id) => {
    setSelectedSession(prev => prev === id ? null : id);
    if (mobileView) setSidePanel(true);
  }, [mobileView]);

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : ''} bg-gradient-to-br from-slate-50 via-emerald-50/20 to-teal-50/10 min-h-screen`}>
      {/* Responsive Top Bar */}
      <div className="sticky top-0 z-40 h-14 sm:h-16 bg-white/90 backdrop-blur border-b border-emerald-100 shadow-sm">
        <div className="h-full flex items-center justify-between px-3 sm:px-4 lg:px-6">
          {/* Left section */}
          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 min-w-0">
            {/* Live indicator */}
            <div className="flex items-center gap-2 shrink-0">
              <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse shadow-lg shadow-emerald-200' : 'bg-red-500'}`} />
              <span className="text-sm sm:text-base lg:text-lg font-bold text-slate-800">
                {isConnected ? 'LIVE' : 'OFFLINE'}
              </span>
            </div>

            {/* Quick stats - responsive */}
            <div className="hidden sm:flex items-center gap-3 lg:gap-6 overflow-hidden">
              <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 shrink-0" />
                <span className="font-semibold text-emerald-700 text-sm sm:text-base">{stats.active}</span>
                <span className="text-xs sm:text-sm text-slate-600 hidden lg:inline">Active</span>
                <span className="text-xs sm:text-sm text-slate-600 lg:hidden">A</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-400 shrink-0" />
                <span className="font-semibold text-blue-700 text-sm sm:text-base">{stats.scheduled}</span>
                <span className="text-xs sm:text-sm text-slate-600 hidden lg:inline">Scheduled</span>
                <span className="text-xs sm:text-sm text-slate-600 lg:hidden">S</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-slate-400 shrink-0" />
                <span className="font-semibold text-slate-700 text-sm sm:text-base">{stats.total}</span>
                <span className="text-xs sm:text-sm text-slate-600 hidden lg:inline">Total</span>
                <span className="text-xs sm:text-sm text-slate-600 lg:hidden">T</span>
              </div>
            </div>

            {/* Provider status - responsive */}
            <div className={`hidden md:block px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium shrink-0 ${
              providerStatus === 'available' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
              providerStatus === 'busy' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
              'bg-slate-100 text-slate-800 border border-slate-200'
            }`}>
              <span className="lg:hidden">{providerStatus?.charAt(0)?.toUpperCase()}</span>
              <span className="hidden lg:inline">{providerStatus?.toUpperCase()}</span>
            </div>
          </div>

          {/* Right section - controls */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Mobile stats toggle */}
            <button
              onClick={() => setSidePanel(true)}
              className="sm:hidden p-2 rounded-lg bg-emerald-100 text-emerald-600 border border-emerald-200"
            >
              <BarChart3 className="w-4 h-4" />
            </button>

            {/* Desktop controls */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`hidden sm:flex p-2 lg:p-2.5 rounded-lg transition-all duration-200 ${
                autoRefresh 
                  ? 'bg-emerald-500 text-white shadow-lg hover:bg-emerald-600' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
              title="Auto Refresh"
            >
              <RefreshCw className={`w-3 h-3 lg:w-4 lg:h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setShowMetrics(!showMetrics)}
              className={`hidden md:flex p-2 lg:p-2.5 rounded-lg transition-all duration-200 ${
                showMetrics 
                  ? 'bg-blue-500 text-white shadow-lg hover:bg-blue-600' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
              title="Analytics"
            >
              <BarChart3 className="w-3 h-3 lg:w-4 lg:h-4" />
            </button>

            <button
              onClick={loadConsultationsData}
              disabled={loading}
              className="p-2 lg:p-2.5 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-3 h-3 lg:w-4 lg:h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setSidePanel(!sidePanel)}
              className="lg:hidden p-2 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Responsive Layout */}
      <div className="relative">
        {/* Desktop Layout */}
        <div className="hidden lg:flex h-[calc(100vh-4rem)]">
          {/* Sessions List */}
          <div className="flex-1 min-w-0 p-6">
            <div className="bg-white/80 backdrop-blur rounded-2xl border border-emerald-100 shadow-lg h-full flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="text-lg font-bold text-slate-800">Real-Time Sessions</span>
                    <p className="text-xs text-slate-600">Today's consultations and therapy sessions</p>
                  </div>
                </div>
                {loading && (
                  <div className="flex items-center gap-2 text-emerald-600 text-sm">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Loading...</span>
                  </div>
                )}
                {error && (
                  <div className="text-xs text-red-600 max-w-xs truncate">
                    Error: {error}
                  </div>
                )}
              </div>

              {/* Sessions List */}
              <div className="flex-1 overflow-auto p-4">
                {sessionSummaries.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Monitor className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-lg font-medium text-slate-800 mb-2">
                        {loading ? 'Loading sessions...' : 'No Sessions Today'}
                      </p>
                      <p className="text-sm text-slate-600">
                        {loading ? 'Fetching real-time data...' : 'No consultations scheduled for today'}
                      </p>
                      {error && (
                        <p className="text-xs text-red-600 mt-2">
                          {error}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    <AnimatePresence>
                      {sessionSummaries.map((session, idx) => (
                        <motion.div
                          key={session.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ delay: idx * 0.03 }}
                          className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border ${
                            selectedSession === session.id
                              ? 'border-emerald-300 bg-emerald-50 shadow-md'
                              : 'border-slate-200 hover:border-slate-300 bg-white hover:shadow-sm'
                          }`}
                          onClick={() => handleSessionSelect(session.id)}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${getStatusDot(session.status)}`} />
                              {getTypeIcon(session.type, session.status)}
                              <span className="font-semibold text-slate-800">{session.patientName}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-medium text-slate-500 uppercase bg-slate-100 px-2 py-1 rounded-full">
                                {session.status.replace('_', ' ')}
                              </span>
                              <Eye className="w-4 h-4 text-slate-400" />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-slate-500 font-medium">Time</span>
                              <div className="font-semibold text-slate-800">{formatTime(session.scheduledAt)}</div>
                            </div>
                            <div>
                              <span className="text-slate-500 font-medium">Duration</span>
                              <div className="font-semibold text-slate-800">{formatDuration(session.estimatedDuration)}</div>
                            </div>
                            <div>
                              <span className="text-slate-500 font-medium">Type</span>
                              <div className="font-semibold text-slate-800">{session.therapyType}</div>
                            </div>
                          </div>

                          {session.status === 'in_progress' && (
                            <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                  <span className="text-emerald-800 font-medium">Session Active</span>
                                </div>
                                <span className="text-emerald-600 text-xs">
                                  {new Date(session.lastUpdate).toLocaleTimeString()}
                                </span>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Desktop */}
          <div className="w-80 xl:w-96 p-6 max-w-full">
            <div className="h-full">
              <AnimatePresence mode="wait">
                {selectedSession ? (
                  <motion.div
                    key="tracker"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full"
                  >
                    <ActiveSessionTracker 
                      sessionId={selectedSession}
                      sessionData={sessionSummaries.find(s => s.id === selectedSession)}
                      onClose={() => setSelectedSession(null)}
                    />
                  </motion.div>
                ) : showMetrics ? (
                  <motion.div
                    key="metrics"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full"
                  >
                    <LiveSessionMetrics sessions={sessionSummaries} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="widgets"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4 h-full overflow-y-auto"
                  >
                    <ProviderStatusWidget />
                    <SessionNotifications />
                    
                    <div className="bg-white/80 backdrop-blur rounded-2xl border border-emerald-100 shadow-lg p-6">
                      <h3 className="text-lg font-bold text-slate-800 mb-4">Today's Overview</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">Total Sessions</span>
                          <span className="font-bold text-slate-800">{stats.total}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">Active Now</span>
                          <span className="font-bold text-emerald-600">{stats.active}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">Scheduled</span>
                          <span className="font-bold text-blue-600">{stats.scheduled}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">Completed</span>
                          <span className="font-bold text-slate-600">{stats.completed}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur rounded-2xl border border-emerald-100 shadow-lg p-6">
                      <h3 className="text-lg font-bold text-slate-800 mb-4">Quick Actions</h3>
                      <div className="space-y-3">
                        <button className="w-full p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl">
                          Start New Session
                        </button>
                        <button className="w-full p-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl">
                          Schedule Session
                        </button>
                        <button 
                          onClick={loadConsultationsData}
                          className="w-full p-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2"
                        >
                          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                          Refresh Data
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Mobile/Tablet Layout */}
        <div className="lg:hidden">
          {/* Main Sessions List */}
          <div className="p-3 sm:p-4">
            <div className="bg-white/80 backdrop-blur rounded-xl sm:rounded-2xl border border-emerald-100 shadow-lg">
              {/* Mobile Header */}
              <div className="p-3 sm:p-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-xl sm:rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <div>
                    <span className="text-base sm:text-lg font-bold text-slate-800">Real-Time Sessions</span>
                    <p className="text-xs text-slate-600">Today's consultations</p>
                  </div>
                </div>
              </div>

              {/* Mobile Sessions */}
              <div className="max-h-[calc(100vh-12rem)] overflow-auto p-3 sm:p-4">
                {sessionSummaries.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 text-slate-500">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <Monitor className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
                    </div>
                    <p className="text-base sm:text-lg font-medium text-slate-800 mb-1 sm:mb-2">
                      {loading ? 'Loading...' : 'No Sessions Today'}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-600">
                      {loading ? 'Fetching data...' : 'No consultations scheduled'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {sessionSummaries.map((session, idx) => (
                      <div
                        key={session.id}
                        className={`p-3 sm:p-4 rounded-lg sm:rounded-xl cursor-pointer transition-all duration-200 border ${
                          selectedSession === session.id
                            ? 'border-emerald-300 bg-emerald-50 shadow-md'
                            : 'border-slate-200 hover:border-slate-300 bg-white hover:shadow-sm'
                        }`}
                        onClick={() => handleSessionSelect(session.id)}
                      >
                        <div className="flex items-start justify-between mb-2 sm:mb-3">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${getStatusDot(session.status)} shrink-0`} />
                            {getTypeIcon(session.type, session.status)}
                            <span className="font-semibold text-slate-800 text-sm sm:text-base truncate">{session.patientName}</span>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            <span className="text-xs font-medium text-slate-500 uppercase bg-slate-100 px-2 py-0.5 sm:py-1 rounded-full">
                              {session.status.replace('_', ' ')}
                            </span>
                            <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
                          <div>
                            <span className="text-slate-500 font-medium block">Time</span>
                            <div className="font-semibold text-slate-800">{formatTime(session.scheduledAt)}</div>
                          </div>
                          <div>
                            <span className="text-slate-500 font-medium block">Duration</span>
                            <div className="font-semibold text-slate-800">{formatDuration(session.estimatedDuration)}</div>
                          </div>
                          <div>
                            <span className="text-slate-500 font-medium block">Type</span>
                            <div className="font-semibold text-slate-800">{session.therapyType}</div>
                          </div>
                        </div>

                        {session.status === 'in_progress' && (
                          <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                            <div className="flex items-center justify-between text-xs sm:text-sm">
                              <div className="flex items-center gap-1 sm:gap-2">
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-emerald-800 font-medium">Active</span>
                              </div>
                              <span className="text-emerald-600 text-xs">
                                {new Date(session.lastUpdate).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile/Tablet Side Panel */}
        <AnimatePresence>
          {sidePanel && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="lg:hidden fixed inset-0 bg-black/50 z-40"
                onClick={() => setSidePanel(false)}
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                className="lg:hidden fixed right-0 top-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl overflow-y-auto"
              >
                {/* Panel Header */}
                <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
                  <span className="text-lg font-bold text-slate-800">Control Panel</span>
                  <button
                    onClick={() => setSidePanel(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Panel Content */}
                <div className="p-4 space-y-4">
                  {/* Mobile Stats */}
                  <div className="sm:hidden bg-slate-50 rounded-xl p-4">
                    <h3 className="font-semibold text-slate-800 mb-3">Session Stats</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-3 border">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span className="text-xs font-medium text-slate-600">Active</span>
                        </div>
                        <div className="text-2xl font-bold text-emerald-700">{stats.active}</div>
                      </div>
                      <div className="bg-white rounded-lg p-3 border">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full bg-blue-400" />
                          <span className="text-xs font-medium text-slate-600">Scheduled</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-700">{stats.scheduled}</div>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Controls */}
                  <div className="bg-slate-50 rounded-xl p-4">
                    <h3 className="font-semibold text-slate-800 mb-3">Controls</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                          autoRefresh 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-white text-slate-600 border border-slate-200'
                        }`}
                      >
                        <span>Auto Refresh</span>
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => {setShowMetrics(!showMetrics); setSidePanel(false);}}
                        className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                          showMetrics 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-white text-slate-600 border border-slate-200'
                        }`}
                      >
                        <span>Analytics</span>
                        <BarChart3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={loadConsultationsData}
                        className="w-full flex items-center justify-between p-3 rounded-lg bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        <span>Refresh Data</span>
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Widgets */}
                  <AnimatePresence mode="wait">
                    {selectedSession ? (
                      <motion.div
                        key="tracker-mobile"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <ActiveSessionTracker 
                          sessionId={selectedSession}
                          sessionData={sessionSummaries.find(s => s.id === selectedSession)}
                          onClose={() => setSelectedSession(null)}
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="widgets-mobile"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                      >
                        <ProviderStatusWidget />
                        <SessionNotifications />
                        
                        <div className="bg-white rounded-xl border border-emerald-100 shadow-lg p-4">
                          <h3 className="font-bold text-slate-800 mb-3">Quick Actions</h3>
                          <div className="space-y-2">
                            <button className="w-full p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg font-medium">
                              Start New Session
                            </button>
                            <button className="w-full p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium">
                              Schedule Session
                            </button>
                            <button className="w-full p-3 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium">
                              View All Patients
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Connection Error - Responsive */}
      <AnimatePresence>
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 z-50"
          >
            <div className="bg-red-50 border border-red-200 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 shrink-0" />
                  <div className="min-w-0">
                    <span className="font-semibold text-red-800 text-sm sm:text-base">Connection Lost</span>
                    <p className="text-xs sm:text-sm text-red-600 truncate">
                      {connectionStatus?.reason || 'Reconnecting...'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={loadConsultationsData}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-500 hover:bg-red-600 text-white rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-colors shrink-0"
                >
                  Retry
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RealTimeSessionDashboard;
