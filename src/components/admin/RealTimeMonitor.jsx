// src/components/admin/AdminRealtimeMonitoring.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Users, Monitor, Clock, TrendingUp, AlertCircle,
  CheckCircle, Wifi, WifiOff, RefreshCw, BarChart3, Play,
  Pause, Square, Eye, Bell, Settings, Download, MessageSquare,
  UserCheck, Award, Calendar, Timer, Zap, AlertTriangle, User,
  Phone, Mail, MapPin, FileText, X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import io from 'socket.io-client';
import adminRealtimeService from '../../services/adminRealtimeService';

const RealtimeMonitoring = () => {
  // State management
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Initialize WebSocket connection
  useEffect(() => {
    initializeWebSocket();
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const initializeWebSocket = () => {
    const token = localStorage.getItem('accessToken') || 
                  localStorage.getItem('token') ||
                  localStorage.getItem('adminToken');
    
    if (!token) {
      console.error('❌ No auth token found');
      toast.error('Authentication required');
      return;
    }

    console.log('🔌 Initializing WebSocket connection...');
    
    const newSocket = io('http://localhost:3003', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('✅ Admin connected to real-time monitoring');
      setIsConnected(true);
      toast.success('Connected to real-time monitoring', { duration: 2000 });
      
      // Subscribe to therapy tracking
      newSocket.emit('subscribe_therapy_tracking');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🚪 Disconnected from real-time monitoring:', reason);
      setIsConnected(false);
      toast.error('Disconnected from real-time monitoring');
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      setIsConnected(false);
    });

    // Real-time event listeners
    newSocket.on('therapy_tracking_connected', (data) => {
      console.log('📡 Therapy tracking connected:', data);
    });

    newSocket.on('therapy_tracking_state', (data) => {
      console.log('📊 Received initial state:', data);
    });

    newSocket.on('session_status_update', (data) => {
      console.log('📡 Session status update:', data);
      loadDashboardData(); // Refresh dashboard
      
      toast.info(
        `Session ${data.status}: ${data.patientName || 'Patient'}`,
        { duration: 3000 }
      );
    });

    newSocket.on('connected_users_update', (data) => {
      console.log('📡 Connected users updated:', data);
      setDashboardData(prev => prev ? {
        ...prev,
        connectedUsers: data.users,
        stats: {
          ...prev.stats,
          connectedUsers: data.totalCount
        }
      } : null);
    });

    newSocket.on('countdown_update', (data) => {
      console.log('⏰ Countdown update:', data);
    });

    newSocket.on('session_time_ended', (data) => {
      console.log('⏰ Session time ended:', data);
      toast.warning(`Session ${data.sessionId} time has ended`, {
        duration: 5000,
        icon: '⏰'
      });
    });

    newSocket.on('milestone_achieved', (data) => {
      console.log('🏆 Milestone achieved:', data);
      toast.success(
        `🏆 ${data.milestone.patientName} achieved: ${data.milestone.title}`,
        { duration: 5000 }
      );
      loadDashboardData();
    });

    newSocket.on('countdown_started', (data) => {
      console.log('⏰ Countdown started:', data);
      toast.info(`Timer started for session ${data.sessionId}`, { duration: 3000 });
    });

    newSocket.on('countdown_stopped', (data) => {
      console.log('⏰ Countdown stopped:', data);
    });

    newSocket.on('therapy_tracking_update', (data) => {
      console.log('📡 Therapy tracking update:', data);
      loadDashboardData();
    });

    setSocket(newSocket);
  };

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📊 Loading dashboard data...');
      
      const response = await adminRealtimeService.getTrackingDashboard();
      
      if (response.success) {
        console.log('✅ Dashboard data loaded:', response.data);
        setDashboardData(response.data);
      } else {
        throw new Error(response.message || 'Failed to load dashboard');
      }
    } catch (error) {
      console.error('❌ Failed to load dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load and auto-refresh
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

  // Session control actions
  const handleSessionControl = async (sessionId, action) => {
    try {
      let response;
      
      switch (action) {
        case 'start':
          response = await adminRealtimeService.startSession(sessionId);
          toast.success('Session started successfully');
          break;
        case 'pause':
          response = await adminRealtimeService.updateSessionStatus(sessionId, {
            status: 'paused',
            reason: 'Admin pause'
          });
          toast.success('Session paused');
          break;
        case 'resume':
          response = await adminRealtimeService.updateSessionStatus(sessionId, {
            status: 'in_progress',
            reason: 'Admin resume'
          });
          toast.success('Session resumed');
          break;
        case 'complete':
          response = await adminRealtimeService.updateSessionStatus(sessionId, {
            status: 'completed',
            reason: 'Session completed'
          });
          toast.success('Session completed');
          break;
        case 'cancel':
          if (window.confirm('Are you sure you want to cancel this session?')) {
            response = await adminRealtimeService.updateSessionStatus(sessionId, {
              status: 'cancelled',
              reason: 'Admin cancellation'
            });
            toast.warning('Session cancelled');
          }
          break;
        case 'emergency_stop':
          if (window.confirm('EMERGENCY STOP: Are you absolutely sure?')) {
            const reason = prompt('Enter emergency stop reason:');
            if (reason) {
              response = await adminRealtimeService.emergencyStopSession(sessionId, reason);
              toast.error('Emergency stop executed');
            }
          }
          break;
        default:
          break;
      }
      
      loadDashboardData();
    } catch (error) {
      console.error(`❌ Session control error (${action}):`, error);
      toast.error(`Failed to ${action} session: ${error.message}`);
    }
  };

  // View session details
  const handleViewSession = async (session) => {
    try {
      console.log('👁️ Viewing session:', session);
      setSelectedSession(session);
      setShowSessionModal(true);
      
      // Join session for real-time updates
      try {
        await adminRealtimeService.joinSession(session.id);
        
        if (socket) {
          socket.emit('join_session', session.id);
        }
      } catch (joinError) {
        console.warn('⚠️ Could not join session for real-time updates:', joinError);
      }
    } catch (error) {
      console.error('❌ Error viewing session:', error);
      toast.error('Failed to view session details');
    }
  };

  // Close session details modal
  const handleCloseSessionModal = async () => {
    if (selectedSession && socket) {
      try {
        await adminRealtimeService.leaveSession(selectedSession.id);
        socket.emit('leave_session', selectedSession.id);
      } catch (error) {
        console.error('❌ Error leaving session:', error);
      }
    }
    
    setShowSessionModal(false);
    setSelectedSession(null);
  };

  // ✅ FIXED: Better filtering logic
  const filteredSessions = () => {
    if (!dashboardData) return [];
    
    const now = new Date();
    let sessions = [];
    
    // Collect all sessions first
    const allSessions = [
      ...(dashboardData.activeSessions || []),
      ...(dashboardData.upcomingSessions || []),
      ...(dashboardData.completedSessions || []),
      ...(dashboardData.pausedSessions || [])
    ];
    
    switch (filter) {
      case 'active':
        // Only today's in-progress sessions
        sessions = allSessions.filter(s => 
          s.status === 'in_progress' || s.sessionStatus === 'in_progress'
        );
        break;
        
      case 'upcoming':
        // All future scheduled sessions
        sessions = allSessions.filter(s => {
          const scheduledDate = new Date(s.scheduledAt);
          return scheduledDate > now && ['scheduled', 'confirmed', 'patient_arrived', 'therapist_ready'].includes(s.status || s.sessionStatus);
        });
        break;
        
      case 'completed':
        // All completed sessions
        sessions = allSessions.filter(s => 
          s.status === 'completed' || s.sessionStatus === 'completed'
        );
        break;
        
      case 'paused':
        // Only paused sessions
        sessions = allSessions.filter(s => 
          s.status === 'paused' || s.sessionStatus === 'paused'
        );
        break;
        
      default: // 'all'
        // Show ALL sessions
        sessions = allSessions;
    }
    
    // Remove duplicates by ID
    const uniqueSessions = sessions.filter((session, index, self) =>
      index === self.findIndex((s) => s.id === session.id)
    );
    
    return uniqueSessions;
  };

  // Loading state
  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Loading Real-Time Monitoring</h3>
          <p className="text-slate-600">Connecting to live therapy tracking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Monitor className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Real-Time Monitoring</h1>
              <p className="text-indigo-100 mt-1">
                Live system-wide therapy tracking and control
              </p>
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
          label="Connected Users"
          value={dashboardData?.stats?.connectedUsers || 0}
          color="purple"
        />
      </div>

      {/* Filters & Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-2 flex-wrap gap-2">
            {['all', 'active', 'upcoming', 'completed', 'paused'].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === filterOption
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex items-center space-x-2">
            <button 
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
            </button>
            <button 
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Export data"
            >
              <Download className="w-5 h-5" />
            </button>
            <button 
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">
            Live Sessions ({filteredSessions().length})
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
              {filter === 'all' ? 'No sessions scheduled' : `No ${filter} sessions`}
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
                  onControl={handleSessionControl}
                  onView={() => handleViewSession(session)}
                  isConnected={isConnected}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Connected Users */}
      {dashboardData?.connectedUsers && dashboardData.connectedUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
        >
          <div className="flex items-center space-x-2 mb-4">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-900">
              Connected Users ({dashboardData.connectedUsers.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.connectedUsers.map((user) => (
              <ConnectedUserCard key={user.userId} user={user} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Session Details Modal */}
      <AnimatePresence>
        {showSessionModal && selectedSession && (
          <SessionDetailsModal
            session={selectedSession}
            onClose={handleCloseSessionModal}
            onControl={handleSessionControl}
            isConnected={isConnected}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ========== SUB-COMPONENTS ==========

// Stat Card Component
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
      
      {/* Background decoration */}
      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-gradient-to-r from-slate-100 to-transparent rounded-full opacity-50"></div>
    </motion.div>
  );
};

// Session Card Component
const SessionCard = ({ session, index, onControl, onView, isConnected }) => {
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
        label: 'Scheduled',
        pulse: false
      },
      confirmed: {
        color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        icon: CheckCircle,
        label: 'Confirmed',
        pulse: false
      },
      patient_arrived: {
        color: 'bg-purple-100 text-purple-700 border-purple-200',
        icon: UserCheck,
        label: 'Patient Arrived',
        pulse: false
      },
      therapist_ready: {
        color: 'bg-cyan-100 text-cyan-700 border-cyan-200',
        icon: UserCheck,
        label: 'Therapist Ready',
        pulse: false
      },
      paused: {
        color: 'bg-amber-100 text-amber-700 border-amber-200',
        icon: Pause,
        label: 'Paused',
        pulse: false
      },
      completed: {
        color: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: CheckCircle,
        label: 'Completed',
        pulse: false
      },
      cancelled: {
        color: 'bg-red-100 text-red-700 border-red-200',
        icon: AlertCircle,
        label: 'Cancelled',
        pulse: false
      }
    };
    return configs[status] || configs.scheduled;
  };

  const statusConfig = getStatusConfig(session.status || session.sessionStatus);
  const StatusIcon = statusConfig.icon;

  // Calculate progress if in progress
  let progress = 0;
  if ((session.status === 'in_progress' || session.sessionStatus === 'in_progress') && session.timing) {
    progress = session.timing.progressPercentage || 0;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow bg-white"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-4 flex-1">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {session.patientName?.charAt(0) || 'P'}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-slate-900 text-lg truncate">
              {session.patientName || 'Unknown Patient'}
            </h4>
            <p className="text-sm text-slate-600 capitalize">{session.therapyType || session.sessionType || 'General Therapy'}</p>
            <p className="text-xs text-slate-500 mt-1">
              Therapist: {session.therapistName || 'Unassigned'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center space-x-1 ${statusConfig.color}`}>
            {statusConfig.pulse && (
              <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
            )}
            <StatusIcon className="w-3 h-3" />
            <span>{statusConfig.label}</span>
          </span>
        </div>
      </div>

      {/* Progress Bar for Active Sessions */}
      {(session.status === 'in_progress' || session.sessionStatus === 'in_progress') && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Session Progress</span>
            <span className="text-sm text-slate-600">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full"
            />
          </div>
        </div>
      )}

      {/* Session Details Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
        <div>
          <span className="text-slate-500 block text-xs mb-1">Start Time</span>
          <p className="font-medium text-slate-900">
            {new Date(session.scheduledAt).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
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
          <p className="font-medium text-slate-900">
            {session.dayNumber || 1}/{session.totalDays || 21}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2 pt-4 border-t border-slate-200 flex-wrap gap-2">
        {/* Conditional buttons based on session status */}
        {(session.status === 'confirmed' || session.sessionStatus === 'confirmed') && (
          <button
            onClick={() => onControl(session.id, 'start')}
            disabled={!isConnected}
            className="flex-1 min-w-[100px] px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4" />
            <span>Start</span>
          </button>
        )}
        
        {(session.status === 'in_progress' || session.sessionStatus === 'in_progress') && (
          <>
            <button
              onClick={() => onControl(session.id, 'pause')}
              disabled={!isConnected}
              className="flex-1 min-w-[100px] px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Pause className="w-4 h-4" />
              <span>Pause</span>
            </button>
            <button
              onClick={() => onControl(session.id, 'complete')}
              disabled={!isConnected}
              className="flex-1 min-w-[100px] px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Complete</span>
            </button>
          </>
        )}
        
        {(session.status === 'paused' || session.sessionStatus === 'paused') && (
          <button
            onClick={() => onControl(session.id, 'resume')}
            disabled={!isConnected}
            className="flex-1 min-w-[100px] px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            <span>Resume</span>
          </button>
        )}
        
        {!['completed', 'cancelled'].includes(session.status || session.sessionStatus) && (
          <button
            onClick={() => onControl(session.id, 'cancel')}
            disabled={!isConnected}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Square className="w-4 h-4" />
            <span>Cancel</span>
          </button>
        )}
        
        {(session.status === 'in_progress' || session.sessionStatus === 'in_progress') && (
          <button
            onClick={() => onControl(session.id, 'emergency_stop')}
            disabled={!isConnected}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            title="Emergency Stop"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Emergency</span>
          </button>
        )}
        
        {/* View button - always visible */}
        <button
          onClick={onView}
          className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center justify-center space-x-2"
        >
          <Eye className="w-4 h-4" />
          <span>View</span>
        </button>
      </div>
    </motion.div>
  );
};

// Connected User Card Component
const ConnectedUserCard = ({ user }) => {
  return (
    <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${user.isActive ? 'bg-green-500' : 'bg-gray-400'}`}>
        {user.isActive && <div className="w-3 h-3 bg-green-500 rounded-full animate-ping"></div>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 truncate">{user.name || user.email}</p>
        <p className="text-sm text-slate-600 capitalize">{user.role}</p>
        {user.currentActivity && (
          <p className="text-xs text-slate-500 mt-1 truncate">{user.currentActivity}</p>
        )}
      </div>
      <Zap className={`w-4 h-4 flex-shrink-0 ${user.isActive ? 'text-green-600' : 'text-gray-400'}`} />
    </div>
  );
};

// ✅ COMPLETE Session Details Modal Component
const SessionDetailsModal = ({ session, onClose, onControl, isConnected }) => {
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
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Session Details</h2>
              <p className="text-indigo-100 mt-1">{session.patientName || 'Patient Session'}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Patient Information */}
          <div className="bg-slate-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center space-x-2">
              <User className="w-5 h-5 text-indigo-600" />
              <span>Patient Information</span>
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="Name" value={session.patientName} icon={User} />
              <InfoItem label="Email" value={session.patientEmail} icon={Mail} />
              <InfoItem label="Phone" value={session.patientPhone} icon={Phone} />
              <InfoItem label="Therapy Type" value={session.therapyType || session.sessionType} icon={Activity} />
            </div>
          </div>

          {/* Session Information */}
          <div className="bg-indigo-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <span>Session Information</span>
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem 
                label="Status" 
                value={(session.status || session.sessionStatus).replace('_', ' ').toUpperCase()} 
              />
              <InfoItem label="Room" value={session.roomNumber || 'TBD'} icon={MapPin} />
              <InfoItem 
                label="Duration" 
                value={`${session.estimatedDuration || 60} minutes`} 
                icon={Clock} 
              />
              <InfoItem label="Therapist" value={session.therapistName} />
              <InfoItem 
                label="Scheduled Time" 
                value={new Date(session.scheduledAt).toLocaleString()} 
                icon={Calendar}
              />
              {session.startedAt && (
                <InfoItem 
                  label="Started At" 
                  value={new Date(session.startedAt).toLocaleString()} 
                />
              )}
              <InfoItem label="Day" value={`${session.dayNumber || 1}/${session.totalDays || 21}`} />
              <InfoItem label="Phase" value={session.currentPhase || 'Preparation'} />
            </div>
          </div>

          {/* Progress Information (if in progress) */}
          {(session.status === 'in_progress' || session.sessionStatus === 'in_progress') && session.timing && (
            <div className="bg-emerald-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center space-x-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                <span>Progress</span>
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Completion</span>
                    <span className="text-sm text-slate-600">
                      {Math.round(session.timing.progressPercentage || 0)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-green-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${session.timing.progressPercentage || 0}%` }}
                    ></div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-emerald-700">
                      {Math.floor((session.timing.elapsedTime || 0) / 60000)}m
                    </p>
                    <p className="text-xs text-slate-600">Elapsed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-700">
                      {Math.floor((session.timing.remainingTime || 0) / 60000)}m
                    </p>
                    <p className="text-xs text-slate-600">Remaining</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-indigo-700">
                      {session.participantCount || 0}
                    </p>
                    <p className="text-xs text-slate-600">Participants</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Alerts/Notes */}
          {session.alerts && session.alerts.length > 0 && (
            <div className="bg-yellow-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-yellow-600" />
                <span>Alerts & Notes</span>
              </h3>
              <ul className="space-y-2">
                {session.alerts.map((alert, index) => (
                  <li key={index} className="text-sm text-slate-700 flex items-start">
                    <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mt-1.5 mr-2 flex-shrink-0" />
                    {alert}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Additional Session Data */}
          {session.notes && (
            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>Session Notes</span>
              </h3>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{session.notes}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 pt-4 border-t border-slate-200 flex-wrap gap-2">
            {(session.status === 'confirmed' || session.sessionStatus === 'confirmed') && (
              <button
                onClick={() => {
                  onControl(session.id, 'start');
                  onClose();
                }}
                disabled={!isConnected}
                className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Play className="w-5 h-5" />
                <span>Start Session</span>
              </button>
            )}
            {(session.status === 'in_progress' || session.sessionStatus === 'in_progress') && (
              <>
                <button
                  onClick={() => {
                    onControl(session.id, 'pause');
                    onClose();
                  }}
                  disabled={!isConnected}
                  className="flex-1 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Pause className="w-5 h-5" />
                  <span>Pause</span>
                </button>
                <button
                  onClick={() => {
                    onControl(session.id, 'complete');
                    onClose();
                  }}
                  disabled={!isConnected}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>Complete</span>
                </button>
              </>
            )}
            {(session.status === 'paused' || session.sessionStatus === 'paused') && (
              <button
                onClick={() => {
                  onControl(session.id, 'resume');
                  onClose();
                }}
                disabled={!isConnected}
                className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Play className="w-5 h-5" />
                <span>Resume</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Info Item Component with optional icon
const InfoItem = ({ label, value, icon: Icon }) => (
  <div>
    <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1 flex items-center space-x-1">
      {Icon && <Icon className="w-3 h-3" />}
      <span>{label}</span>
    </p>
    <p className="text-sm font-semibold text-slate-900">{value || 'N/A'}</p>
  </div>
);

export default RealtimeMonitoring;
