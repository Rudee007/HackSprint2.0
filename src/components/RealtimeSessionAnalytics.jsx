// src/components/RealtimeSessionAnalytics.jsx
// 🔥 PRODUCTION READY REAL-TIME ANALYTICS - COMPLETE FILE
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Clock, Users, CheckCircle, PlayCircle, PauseCircle,
  AlertCircle, TrendingUp, Zap, Circle, ChevronRight, Eye
} from 'lucide-react';
import therapistApiService from '../services/therapistApiService';
import { toast } from 'react-hot-toast';

const RealtimeSessionAnalytics = () => {
  const [realtimeData, setRealtimeData] = useState({
    activeSessions: [],
    upcomingSessions: [],
    completedSessions: [],
    pausedSessions: [],
    connectedUsers: [],
    stats: {
      active: 0,
      upcoming: 0,
      completed: 0,
      paused: 0,
      total: 0,
      connectedUsers: 0,
      activeCountdowns: 0
    }
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionTimers, setSessionTimers] = useState({});

  const fetchRealtimeData = useCallback(async () => {
    try {
      console.log('🔥 [ANALYTICS] Fetching real-time dashboard...');
      
      const result = await therapistApiService.getRealtimeTrackingDashboard();
      
      if (result.success) {
        console.log('✅ [ANALYTICS] Real-time data loaded:', result.data);
        setRealtimeData(result.data);
        setLastUpdate(new Date());
      } else {
        console.error('❌ [ANALYTICS] Failed:', result.error);
        toast.error('Failed to load real-time data');
      }
    } catch (error) {
      console.error('❌ [ANALYTICS] Error:', error);
      toast.error('Error loading real-time sessions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRealtimeData();
    
    const interval = setInterval(() => {
      console.log('🔄 [ANALYTICS] Auto-refreshing...');
      fetchRealtimeData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchRealtimeData]);

  useEffect(() => {
    const handleSessionUpdated = (event) => {
      console.log('📡 [ANALYTICS EVENT] Session updated:', event.detail);
      fetchRealtimeData();
    };
    
    const handleSessionStarted = (event) => {
      console.log('🟢 [ANALYTICS EVENT] Session started:', event.detail);
      fetchRealtimeData();
      toast.success('Session started!');
    };
    
    const handleSessionCompleted = (event) => {
      console.log('✅ [ANALYTICS EVENT] Session completed:', event.detail);
      fetchRealtimeData();
      toast.success('Session completed!');
    };
    
    const handleCountdownTick = (event) => {
      const { sessionId, remaining } = event.detail;
      setSessionTimers(prev => ({
        ...prev,
        [sessionId]: remaining
      }));
    };
    
    window.addEventListener('realtime:session:updated', handleSessionUpdated);
    window.addEventListener('realtime:session:started', handleSessionStarted);
    window.addEventListener('realtime:session:completed', handleSessionCompleted);
    window.addEventListener('realtime:countdown:tick', handleCountdownTick);
    
    return () => {
      window.removeEventListener('realtime:session:updated', handleSessionUpdated);
      window.removeEventListener('realtime:session:started', handleSessionStarted);
      window.removeEventListener('realtime:session:completed', handleSessionCompleted);
      window.removeEventListener('realtime:countdown:tick', handleCountdownTick);
    };
  }, [fetchRealtimeData]);

  const formatTimeRemaining = (milliseconds) => {
    if (!milliseconds) return '--:--';
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const statsCards = [
    {
      label: 'Active Now',
      value: realtimeData.stats.active,
      icon: Activity,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
      isLive: true
    },
    {
      label: 'Upcoming',
      value: realtimeData.stats.upcoming,
      icon: Clock,
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-100',
      textColor: 'text-amber-700',
      isLive: false
    },
    {
      label: 'Completed Today',
      value: realtimeData.stats.completed,
      icon: CheckCircle,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700',
      isLive: false
    },
    {
      label: 'Connected Users',
      value: realtimeData.stats.connectedUsers,
      icon: Users,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-700',
      isLive: true
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Activity className="w-8 h-8 text-white animate-pulse" />
          </div>
          <p className="text-slate-600 font-medium">Loading real-time analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center space-x-2">
              <span>Real-Time Session Analytics</span>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex items-center space-x-1 bg-green-100 px-2 py-1 rounded-full"
              >
                <Circle className="w-2 h-2 fill-current text-green-500" />
                <span className="text-xs font-semibold text-green-700">LIVE</span>
              </motion.div>
            </h2>
            <p className="text-sm text-slate-600">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
        </div>
        
        <button
          onClick={fetchRealtimeData}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
        >
          <TrendingUp className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all hover:scale-105"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bgColor} p-3 rounded-xl shadow-md`}>
                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
              {stat.isLive && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex items-center space-x-1 bg-green-100 px-2 py-1 rounded-full"
                >
                  <Circle className="w-2 h-2 fill-current text-green-500 animate-pulse" />
                  <span className="text-xs font-semibold text-green-700">LIVE</span>
                </motion.div>
              )}
            </div>
            <p className="text-sm font-medium text-slate-600 mb-2">{stat.label}</p>
            <p className="text-4xl font-bold text-slate-900">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 shadow-lg border border-green-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
              <PlayCircle className="w-5 h-5 text-green-600" />
              <span>Active Sessions</span>
            </h3>
            <span className="text-3xl font-bold text-green-600">
              {realtimeData.activeSessions.length}
            </span>
          </div>
          <p className="text-sm text-slate-600">
            Sessions currently in progress with live tracking
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6 shadow-lg border border-amber-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
              <PauseCircle className="w-5 h-5 text-amber-600" />
              <span>Paused Sessions</span>
            </h3>
            <span className="text-3xl font-bold text-amber-600">
              {realtimeData.pausedSessions.length}
            </span>
          </div>
          <p className="text-sm text-slate-600">
            Sessions temporarily on hold
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200"
      >
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <span>Session Status Distribution</span>
        </h3>
        
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700 flex items-center space-x-2">
                <Circle className="w-2 h-2 fill-current text-green-500 animate-pulse" />
                <span>Active</span>
              </span>
              <span className="text-sm font-bold text-slate-900">
                {realtimeData.stats.active} ({realtimeData.stats.total > 0 ? Math.round((realtimeData.stats.active / realtimeData.stats.total) * 100) : 0}%)
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${realtimeData.stats.total > 0 ? (realtimeData.stats.active / realtimeData.stats.total) * 100 : 0}%` }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Upcoming</span>
              <span className="text-sm font-bold text-slate-900">
                {realtimeData.stats.upcoming} ({realtimeData.stats.total > 0 ? Math.round((realtimeData.stats.upcoming / realtimeData.stats.total) * 100) : 0}%)
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${realtimeData.stats.total > 0 ? (realtimeData.stats.upcoming / realtimeData.stats.total) * 100 : 0}%` }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-gradient-to-r from-amber-500 to-amber-600 h-3 rounded-full"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Completed</span>
              <span className="text-sm font-bold text-slate-900">
                {realtimeData.stats.completed} ({realtimeData.stats.total > 0 ? Math.round((realtimeData.stats.completed / realtimeData.stats.total) * 100) : 0}%)
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${realtimeData.stats.total > 0 ? (realtimeData.stats.completed / realtimeData.stats.total) * 100 : 0}%` }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Paused</span>
              <span className="text-sm font-bold text-slate-900">
                {realtimeData.stats.paused} ({realtimeData.stats.total > 0 ? Math.round((realtimeData.stats.paused / realtimeData.stats.total) * 100) : 0}%)
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${realtimeData.stats.total > 0 ? (realtimeData.stats.paused / realtimeData.stats.total) * 100 : 0}%` }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full"
              />
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 shadow-lg border border-blue-200"
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <h4 className="font-bold text-slate-800">Total Today</h4>
          </div>
          <p className="text-3xl font-bold text-blue-600 mb-2">{realtimeData.stats.total}</p>
          <p className="text-sm text-slate-600">All sessions scheduled for today</p>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-6 shadow-lg border border-purple-200"
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center shadow-md">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h4 className="font-bold text-slate-800">Live Countdowns</h4>
          </div>
          <p className="text-3xl font-bold text-purple-600 mb-2">{realtimeData.stats.activeCountdowns || 0}</p>
          <p className="text-sm text-slate-600">Active session timers</p>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-6 shadow-lg border border-teal-200"
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center shadow-md">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h4 className="font-bold text-slate-800">Online Now</h4>
          </div>
          <p className="text-3xl font-bold text-teal-600 mb-2">{realtimeData.connectedUsers.length}</p>
          <p className="text-sm text-slate-600">Connected users</p>
        </motion.div>
      </div>
    </div>
  );
};

export default RealtimeSessionAnalytics;
