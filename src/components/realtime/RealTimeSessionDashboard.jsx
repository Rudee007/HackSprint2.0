// src/components/realtime/RealTimeSessionDashboard.jsx
// 🔥 PRODUCTION-READY - MATCHED TO BACKEND THERAPY TRACKING API

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Clock, Users, WifiOff, Play, CheckCircle, Calendar,
  Eye, RefreshCw, Monitor, PhoneCall, Video, Zap, BarChart3, 
  Menu, X, Settings, AlertTriangle, Heart, Timer, Pause, CheckCircle2
} from 'lucide-react';

import { useRealTime } from '../../context/RealTimeContext';
import doctorApiService from '../../services/doctorApiService';
import ActiveSessionTracker from './ActiveSessionTracker';
import ProviderStatusWidget from './ProviderStatusWidget';
import SessionNotifications from './SessionNotifications';

const RealTimeSessionDashboard = () => {
  const {
    isConnected,
    connectionStatus,
    unreadNotifications,
    providerStatus
  } = useRealTime();

  // ✅ State matching backend response structure
  const [therapyData, setTherapyData] = useState({
    activeSessions: [],
    upcomingSessions: [],
    completedSessions: [],
    pausedSessions: [],
    stats: {
      active: 0,
      upcoming: 0,
      completed: 0,
      paused: 0,
      total: 0
    },
    connectedUsers: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [sidePanel, setSidePanel] = useState(false);
  const [mobileView, setMobileView] = useState(false);

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => setMobileView(window.innerWidth < 1024);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // ✅ Load therapy tracking data from YOUR backend
  const loadTherapyData = useCallback(async () => {
    if (!isConnected) {
      console.warn('⏸ Not loading - WebSocket not connected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Loading therapy tracking dashboard...');
      
      // ✅ Use YOUR API service
      const response = await doctorApiService.getTherapyTrackingDashboard();
      
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        
        // ✅ Set data matching backend structure
        setTherapyData({
          activeSessions: data.activeSessions || [],
          upcomingSessions: data.upcomingSessions || [],
          completedSessions: data.completedSessions || [],
          pausedSessions: data.pausedSessions || [],
          stats: data.stats || {
            active: (data.activeSessions || []).length,
            upcoming: (data.upcomingSessions || []).length,
            completed: (data.completedSessions || []).length,
            paused: (data.pausedSessions || []).length,
            total: (data.activeSessions || []).length + (data.upcomingSessions || []).length + (data.completedSessions || []).length + (data.pausedSessions || []).length
          },
          connectedUsers: data.connectedUsers || []
        });

        console.log('✅ Therapy data loaded:', {
          active: data.activeSessions?.length,
          upcoming: data.upcomingSessions?.length,
          completed: data.completedSessions?.length,
          paused: data.pausedSessions?.length
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('❌ Failed to load therapy data:', err);
      setError(err.message || 'Failed to load dashboard');
      
      // ✅ Set empty fallback
      setTherapyData({
        activeSessions: [],
        upcomingSessions: [],
        completedSessions: [],
        pausedSessions: [],
        stats: { active: 0, upcoming: 0, completed: 0, paused: 0, total: 0 },
        connectedUsers: []
      });
    } finally {
      setLoading(false);
    }
  }, [isConnected]);

  // Auto refresh every 5 seconds
  useEffect(() => {
    let interval;
    if (autoRefresh && isConnected) {
      interval = setInterval(loadTherapyData, 5000);
    }
    return () => interval && clearInterval(interval);
  }, [autoRefresh, isConnected, loadTherapyData]);

  // Initial load
  useEffect(() => {
    if (isConnected) {
      loadTherapyData();
    }
  }, [isConnected, loadTherapyData]);

  // ✅ Combine all sessions for display
  const allSessions = useMemo(() => {
    return [
      ...therapyData.activeSessions.map(s => ({ ...s, displayStatus: 'active' })),
      ...therapyData.pausedSessions.map(s => ({ ...s, displayStatus: 'paused' })),
      ...therapyData.upcomingSessions.map(s => ({ ...s, displayStatus: 'upcoming' })),
      ...therapyData.completedSessions.map(s => ({ ...s, displayStatus: 'completed' }))
    ];
  }, [therapyData]);

  // ✅ Helper functions matching backend data fields
  const getStatusConfig = (session) => {
    const status = session.sessionStatus || session.status || 'scheduled';
    
    const configs = {
      'in_progress': {
        dot: 'bg-emerald-500 animate-pulse',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: Activity,
        label: 'IN PROGRESS'
      },
      'paused': {
        dot: 'bg-orange-500',
        badge: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: Pause,
        label: 'PAUSED'
      },
      'scheduled': {
        dot: 'bg-blue-500',
        badge: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Clock,
        label: 'SCHEDULED'
      },
      'confirmed': {
        dot: 'bg-blue-500',
        badge: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: CheckCircle2,
        label: 'CONFIRMED'
      },
      'completed': {
        dot: 'bg-slate-400',
        badge: 'bg-slate-100 text-slate-800 border-slate-200',
        icon: CheckCircle,
        label: 'COMPLETED'
      },
      'cancelled': {
        dot: 'bg-red-500',
        badge: 'bg-red-100 text-red-800 border-red-200',
        icon: X,
        label: 'CANCELLED'
      }
    };

    return configs[status] || configs.scheduled;
  };

  const formatTime = (dateString) => {
    if (!dateString) return '--:--';
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '--';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h ? `${h}h ${m}m` : `${m}m`;
  };

  const calculateElapsedTime = (session) => {
    if (session.sessionStartTime && session.sessionStatus === 'in_progress') {
      const elapsed = Date.now() - new Date(session.sessionStartTime).getTime();
      const minutes = Math.floor(elapsed / (1000 * 60));
      return formatDuration(minutes);
    }
    return null;
  };

  const calculateProgress = (session) => {
    if (session.timing?.progressPercentage !== undefined) {
      return session.timing.progressPercentage;
    }
    
    if (session.sessionStartTime && session.estimatedDuration && session.sessionStatus === 'in_progress') {
      const elapsed = Date.now() - new Date(session.sessionStartTime).getTime();
      const total = session.estimatedDuration * 60 * 1000;
      return Math.min(100, Math.round((elapsed / total) * 100));
    }
    
    return 0;
  };

  const handleSessionSelect = useCallback((sessionId) => {
    setSelectedSession(prev => prev === sessionId ? null : sessionId);
    if (mobileView) setSidePanel(true);
  }, [mobileView]);

  return (
    <div className="bg-gradient-to-br from-slate-50 via-emerald-50/20 to-teal-50/10 min-h-screen">
      {/* ✅ Top Bar */}
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

            {/* Quick stats */}
            <div className="hidden sm:flex items-center gap-3 lg:gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-semibold text-emerald-700 text-sm sm:text-base">{therapyData.stats.active}</span>
                <span className="text-xs sm:text-sm text-slate-600 hidden lg:inline">Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-400" />
                <span className="font-semibold text-orange-700 text-sm sm:text-base">{therapyData.stats.paused}</span>
                <span className="text-xs sm:text-sm text-slate-600 hidden lg:inline">Paused</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="font-semibold text-blue-700 text-sm sm:text-base">{therapyData.stats.upcoming}</span>
                <span className="text-xs sm:text-sm text-slate-600 hidden lg:inline">Upcoming</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-400" />
                <span className="font-semibold text-slate-700 text-sm sm:text-base">{therapyData.stats.total}</span>
                <span className="text-xs sm:text-sm text-slate-600 hidden lg:inline">Total</span>
              </div>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`hidden sm:flex p-2 lg:p-2.5 rounded-lg transition-all ${
                autoRefresh 
                  ? 'bg-emerald-500 text-white shadow-lg' 
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
              title="Auto Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={loadTherapyData}
              disabled={loading}
              className="p-2 lg:p-2.5 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-lg disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setSidePanel(!sidePanel)}
              className="lg:hidden p-2 bg-white text-slate-600 border border-slate-200 rounded-lg"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ✅ Main Content */}
      <div className="p-3 sm:p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Sessions List */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur rounded-2xl border border-emerald-100 shadow-lg">
              {/* Header */}
              <div className="p-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                      <Heart className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <span className="text-lg font-bold text-slate-800">Therapy Sessions</span>
                      <p className="text-xs text-slate-600">Real-time Panchakarma tracking</p>
                    </div>
                  </div>
                  {loading && (
                    <div className="flex items-center gap-2 text-emerald-600 text-sm">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span className="hidden sm:inline">Loading...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Sessions Grid */}
              <div className="p-4 max-h-[calc(100vh-14rem)] overflow-y-auto">
                {allSessions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Heart className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-lg font-medium text-slate-800 mb-2">
                      {loading ? 'Loading sessions...' : 'No Sessions Today'}
                    </p>
                    <p className="text-sm text-slate-600">
                      {loading ? 'Fetching therapy data...' : 'No therapy sessions scheduled for today'}
                    </p>
                    {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {allSessions.map((session) => {
                        const statusConfig = getStatusConfig(session);
                        const StatusIcon = statusConfig.icon;
                        const progress = calculateProgress(session);
                        const elapsed = calculateElapsedTime(session);

                        return (
                          <motion.div
                            key={session._id || session.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={`p-4 rounded-xl cursor-pointer transition-all border ${
                              selectedSession === (session._id || session.id)
                                ? 'border-emerald-300 bg-emerald-50 shadow-md'
                                : 'border-slate-200 bg-white hover:shadow-sm'
                            }`}
                            onClick={() => handleSessionSelect(session._id || session.id)}
                          >
                            {/* Session Header */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${statusConfig.dot}`} />
                                <StatusIcon className="w-4 h-4 text-slate-500" />
                                <span className="font-semibold text-slate-800">
                                  {session.patientName || 'Unknown Patient'}
                                </span>
                              </div>
                              <span className={`text-xs font-medium px-2 py-1 rounded-full border ${statusConfig.badge}`}>
                                {statusConfig.label}
                              </span>
                            </div>

                            {/* Session Details */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-3">
                              <div>
                                <span className="text-slate-500 font-medium block">Time</span>
                                <div className="font-semibold text-slate-800">
                                  {formatTime(session.scheduledAt)}
                                </div>
                              </div>
                              <div>
                                <span className="text-slate-500 font-medium block">Duration</span>
                                <div className="font-semibold text-slate-800">
                                  {formatDuration(session.estimatedDuration)}
                                </div>
                              </div>
                              <div>
                                <span className="text-slate-500 font-medium block">Type</span>
                                <div className="font-semibold text-slate-800">
                                  {session.therapyType || session.sessionType || 'Panchakarma'}
                                </div>
                              </div>
                              <div>
                                <span className="text-slate-500 font-medium block">Room</span>
                                <div className="font-semibold text-slate-800">
                                  {session.roomNumber || 'TBD'}
                                </div>
                              </div>
                            </div>

                            {/* Active Session Progress */}
                            {session.sessionStatus === 'in_progress' && (
                              <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-emerald-800 font-medium text-sm">Session Active</span>
                                  </div>
                                  {elapsed && (
                                    <span className="text-emerald-600 text-xs font-medium">{elapsed} elapsed</span>
                                  )}
                                </div>
                                {progress > 0 && (
                                  <div className="w-full bg-emerald-100 rounded-full h-2">
                                    <div 
                                      className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Paused Session */}
                            {session.sessionStatus === 'paused' && (
                              <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Pause className="w-4 h-4 text-orange-600" />
                                    <span className="text-orange-800 font-medium text-sm">Session Paused</span>
                                  </div>
                                  {session.sessionMetadata?.totalPauses && (
                                    <span className="text-orange-600 text-xs">
                                      {session.sessionMetadata.totalPauses} pause(s)
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Desktop Only */}
          <div className="hidden lg:block">
            <div className="space-y-4">
              {/* Stats Card */}
              <div className="bg-white/80 backdrop-blur rounded-2xl border border-emerald-100 shadow-lg p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Today's Overview</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Total Sessions</span>
                    <span className="font-bold text-slate-800">{therapyData.stats.total}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Active Now</span>
                    <span className="font-bold text-emerald-600">{therapyData.stats.active}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Paused</span>
                    <span className="font-bold text-orange-600">{therapyData.stats.paused}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Upcoming</span>
                    <span className="font-bold text-blue-600">{therapyData.stats.upcoming}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Completed</span>
                    <span className="font-bold text-slate-600">{therapyData.stats.completed}</span>
                  </div>
                </div>
              </div>

              {/* Widgets */}
              <ProviderStatusWidget />
              <SessionNotifications />
            </div>
          </div>
        </div>
      </div>

      {/* Connection Error */}
      <AnimatePresence>
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 left-4 right-4 z-50"
          >
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <div>
                    <span className="font-semibold text-red-800">Connection Lost</span>
                    <p className="text-sm text-red-600">{connectionStatus?.reason || 'Reconnecting...'}</p>
                  </div>
                </div>
                <button
                  onClick={loadTherapyData}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium"
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
