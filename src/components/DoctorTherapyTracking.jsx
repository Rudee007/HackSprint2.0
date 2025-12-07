// src/components/doctor/DoctorTherapyTracking.jsx
// 🔥 PRODUCTION-READY - Doctor Therapy Real-Time Monitoring

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Users, Monitor, Clock, TrendingUp, AlertCircle,
  CheckCircle, Wifi, WifiOff, RefreshCw, Play, Pause, Square,
  Eye, Bell, Download, UserCheck, Award, Calendar, Timer,
  Zap, AlertTriangle, User, Phone, Mail, MapPin, FileText, X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import io from 'socket.io-client';
import doctorApiService from '../services/doctorApiService';

const DoctorTherapyTracking = () => {
  // ═══════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // ═══════════════════════════════════════════════════════════
  // WEBSOCKET INITIALIZATION
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    initializeWebSocket();
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const initializeWebSocket = () => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    
    if (!token) {
      console.error('❌ No auth token found');
      toast.error('Authentication required');
      return;
    }

    console.log('🔌 Initializing Doctor WebSocket connection...');
    
    const newSocket = io('http://localhost:3003', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('✅ Doctor connected to real-time monitoring');
      setIsConnected(true);
      toast.success('Connected to therapy tracking', { duration: 2000 });
      
      // Subscribe to therapy tracking
      newSocket.emit('subscribe_therapy_tracking');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🚪 Disconnected:', reason);
      setIsConnected(false);
      toast.error('Disconnected from therapy tracking');
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      setIsConnected(false);
    });

    // Real-time event listeners
    newSocket.on('session_status_update', (data) => {
      console.log('📡 Session status update:', data);
      loadDashboardData();
      toast.info(`Session ${data.status}: ${data.patientName || 'Patient'}`, { duration: 3000 });
    });

    newSocket.on('milestone_achieved', (data) => {
      console.log('🏆 Milestone achieved:', data);
      toast.success(`🏆 ${data.milestone.patientName} achieved: ${data.milestone.title}`, { duration: 5000 });
      loadDashboardData();
    });

    newSocket.on('countdown_update', (data) => {
      console.log('⏰ Countdown update:', data);
    });

    newSocket.on('session_time_ended', (data) => {
      console.log('⏰ Session time ended:', data);
      toast.warning(`Session ${data.sessionId} time has ended`, { duration: 5000, icon: '⏰' });
    });

    setSocket(newSocket);
  };

  // ═══════════════════════════════════════════════════════════
  // API CALLS
  // ═══════════════════════════════════════════════════════════
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📊 Loading doctor therapy tracking dashboard...');
      
      const response = await doctorApiService.getTherapyTrackingDashboard();
      
      if (response.data.success) {
        console.log('✅ Dashboard data loaded:', response.data.data);
        setDashboardData(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to load dashboard');
      }
    } catch (error) {
      console.error('❌ Failed to load dashboard:', error);
      toast.error('Failed to load therapy tracking data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
    
    let interval;
    if (autoRefresh) {
      interval = setInterval(loadDashboardData, 30000); // 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loadDashboardData, autoRefresh]);

  // ═══════════════════════════════════════════════════════════
  // SESSION CONTROL ACTIONS
  // ═══════════════════════════════════════════════════════════
  const handleViewSession = async (session) => {
    try {
      console.log('👁️ Viewing session:', session);
      
      // Get full session details
      const response = await doctorApiService.getRealtimeSessionDetails(session.id);
      
      if (response.data.success) {
        setSelectedSession(response.data.data);
        setShowSessionModal(true);
        
        // Join session for real-time updates
        await doctorApiService.joinSessionAsObserver(session.id);
        if (socket) {
          socket.emit('join_session', session.id);
        }
      }
    } catch (error) {
      console.error('❌ Error viewing session:', error);
      toast.error('Failed to view session details');
    }
  };

  const handleCloseSessionModal = async () => {
    if (selectedSession && socket) {
      try {
        await doctorApiService.leaveSession(selectedSession.id);
        socket.emit('leave_session', selectedSession.id);
      } catch (error) {
        console.error('❌ Error leaving session:', error);
      }
    }
    
    setShowSessionModal(false);
    setSelectedSession(null);
  };

  // ═══════════════════════════════════════════════════════════
  // FILTERING
  // ═══════════════════════════════════════════════════════════
  const filteredSessions = () => {
    if (!dashboardData) return [];
    
    const now = new Date();
    let sessions = [];
    
    const allSessions = [
      ...(dashboardData.activeSessions || []),
      ...(dashboardData.upcomingSessions || []),
      ...(dashboardData.completedSessions || []),
      ...(dashboardData.pausedSessions || [])
    ];
    
    switch (filter) {
      case 'active':
        sessions = allSessions.filter(s => 
          s.status === 'in_progress' || s.sessionStatus === 'in_progress'
        );
        break;
      case 'upcoming':
        sessions = allSessions.filter(s => {
          const scheduledDate = new Date(s.scheduledAt);
          return scheduledDate > now && ['scheduled', 'confirmed'].includes(s.status || s.sessionStatus);
        });
        break;
      case 'completed':
        sessions = allSessions.filter(s => 
          s.status === 'completed' || s.sessionStatus === 'completed'
        );
        break;
      case 'paused':
        sessions = allSessions.filter(s => 
          s.status === 'paused' || s.sessionStatus === 'paused'
        );
        break;
      default:
        sessions = allSessions;
    }
    
    // Remove duplicates
    const uniqueSessions = sessions.filter((session, index, self) =>
      index === self.findIndex((s) => s.id === session.id)
    );
    
    return uniqueSessions;
  };

  // ═══════════════════════════════════════════════════════════
  // LOADING STATE
  // ═══════════════════════════════════════════════════════════
  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Loading Therapy Tracking</h3>
          <p className="text-slate-600">Connecting to live sessions...</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-lg p-8 text-white"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Monitor className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Therapy Tracking</h1>
              <p className="text-emerald-100 mt-1">Monitor your patients' therapy sessions in real-time</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg backdrop-blur-sm ${
              isConnected ? 'bg-green-500/20' : 'bg-red-500/20'
            }`}>
              {isConnected ? (
                <>
                  <Wifi className="w-5 h-5 text-green-300" />
                  <span className="text-sm font-medium">Online</span>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5 text-red-300" />
                  <span className="text-sm font-medium">Offline</span>
                </>
              )}
            </div>
            
            {/* Auto-refresh toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-3 rounded-lg backdrop-blur-sm transition-colors ${
                autoRefresh ? 'bg-white/20' : 'bg-white/10'
              }`}
              title={autoRefresh ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}
            >
              <Timer className={`w-5 h-5 ${autoRefresh ? 'text-green-300' : 'text-white/60'}`} />
            </button>
            
            {/* Manual refresh */}
            <button
              onClick={loadDashboardData}
              disabled={loading}
              className="p-3 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Activity}
          label="Active Sessions"
          value={dashboardData?.stats?.active || 0}
          color="emerald"
          pulse={true}
        />
        <StatCard
          icon={Clock}
          label="Upcoming"
          value={dashboardData?.stats?.upcoming || 0}
          color="blue"
        />
        <StatCard
          icon={CheckCircle}
          label="Completed Today"
          value={dashboardData?.stats?.completed || 0}
          color="indigo"
        />
        <StatCard
          icon={Users}
          label="Total Patients"
          value={dashboardData?.stats?.totalPatients || 0}
          color="purple"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-2 flex-wrap gap-2">
            {['all', 'active', 'upcoming', 'completed', 'paused'].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === filterOption
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">
            Therapy Sessions ({filteredSessions().length})
          </h3>
          {loading && (
            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Updating...</span>
            </div>
          )}
        </div>
        
        {filteredSessions().length === 0 ? (
          <div className="text-center py-12">
            <Monitor className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 text-lg font-medium">No sessions found</p>
            <p className="text-slate-500 text-sm mt-2">
              {filter === 'all' ? 'No therapy sessions scheduled' : `No ${filter} sessions`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredSessions().map((session, index) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  index={index}
                  onView={() => handleViewSession(session)}
                  isConnected={isConnected}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Session Details Modal */}
      <AnimatePresence>
        {showSessionModal && selectedSession && (
          <SessionDetailsModal
            session={selectedSession}
            onClose={handleCloseSessionModal}
            isConnected={isConnected}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// SUB-COMPONENTS (Same as Admin version)
// ═══════════════════════════════════════════════════════════

const StatCard = ({ icon: Icon, label, value, color, pulse = false }) => {
  const colors = {
    emerald: 'from-emerald-500 to-teal-600',
    blue: 'from-blue-500 to-cyan-600',
    indigo: 'from-indigo-500 to-purple-600',
    purple: 'from-purple-500 to-pink-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative overflow-hidden"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 bg-gradient-to-r ${colors[color]} rounded-lg shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {pulse && value > 0 && (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-emerald-600">Live</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-3xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-600 mt-1">{label}</p>
      </div>
    </motion.div>
  );
};

const SessionCard = ({ session, index, onView, isConnected }) => {
  const getStatusConfig = (status) => {
    const configs = {
      in_progress: {
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        icon: Activity,
        label: 'In Progress',
        pulse: true
      },
      scheduled: {
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        icon: Calendar,
        label: 'Scheduled'
      },
      completed: {
        color: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: CheckCircle,
        label: 'Completed'
      },
      paused: {
        color: 'bg-amber-100 text-amber-700 border-amber-200',
        icon: Pause,
        label: 'Paused'
      }
    };
    return configs[status] || configs.scheduled;
  };

  const statusConfig = getStatusConfig(session.status || session.sessionStatus);
  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow bg-white"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-4 flex-1">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            {session.patientName?.charAt(0) || 'P'}
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-slate-900 text-lg">{session.patientName || 'Patient'}</h4>
            <p className="text-sm text-slate-600">{session.therapyType || 'General Therapy'}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center space-x-1 ${statusConfig.color}`}>
          {statusConfig.pulse && <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>}
          <StatusIcon className="w-3 h-3" />
          <span>{statusConfig.label}</span>
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
        <div>
          <span className="text-slate-500 block text-xs mb-1">Start Time</span>
          <p className="font-medium text-slate-900">
            {new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div>
          <span className="text-slate-500 block text-xs mb-1">Duration</span>
          <p className="font-medium text-slate-900">{session.estimatedDuration || 60}m</p>
        </div>
        <div>
          <span className="text-slate-500 block text-xs mb-1">Room</span>
          <p className="font-medium text-slate-900">{session.roomNumber || 'TBD'}</p>
        </div>
        <div>
          <span className="text-slate-500 block text-xs mb-1">Day</span>
          <p className="font-medium text-slate-900">{session.dayNumber || 1}/{session.totalDays || 21}</p>
        </div>
      </div>

      <button
        onClick={onView}
        className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2"
      >
        <Eye className="w-4 h-4" />
        <span>View Details</span>
      </button>
    </motion.div>
  );
};

const SessionDetailsModal = ({ session, onClose, isConnected }) => {
  if (!session) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Session Details</h2>
              <p className="text-emerald-100 mt-1">{session.patientName || 'Patient Session'}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Patient Info */}
          <div className="bg-slate-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Patient Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-600">Name</p>
                <p className="font-semibold text-slate-900">{session.patientName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Therapy Type</p>
                <p className="font-semibold text-slate-900">{session.therapyType}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Start Time</p>
                <p className="font-semibold text-slate-900">{new Date(session.scheduledAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Duration</p>
                <p className="font-semibold text-slate-900">{session.estimatedDuration} minutes</p>
              </div>
            </div>
          </div>

          {/* Progress */}
          {session.timing && (
            <div className="bg-emerald-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Progress</h3>
              <div className="w-full bg-slate-200 rounded-full h-3 mb-4">
                <div 
                  className="bg-emerald-600 h-3 rounded-full"
                  style={{ width: `${session.timing.progressPercentage || 0}%` }}
                ></div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-emerald-700">{Math.floor((session.timing.elapsedTime || 0) / 60000)}m</p>
                  <p className="text-xs text-slate-600">Elapsed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700">{Math.floor((session.timing.remainingTime || 0) / 60000)}m</p>
                  <p className="text-xs text-slate-600">Remaining</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-indigo-700">{Math.round(session.timing.progressPercentage || 0)}%</p>
                  <p className="text-xs text-slate-600">Complete</p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DoctorTherapyTracking;
