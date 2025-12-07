// src/components/realtime/RealTimeTherapyTracker.jsx
// 🔥 PRODUCTION-READY - USES API SERVICE, NO BUGS

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Clock, Users, Calendar, Play, CheckCircle, AlertCircle, 
  Timer, Zap, RefreshCw
} from 'lucide-react';
import { useRealTime } from '../../context/RealTimeContext';
import doctorApiService from '../../services/doctorApiService';

// Child components
import LiveProgressMonitor from './LiveProgressMonitor';
import SessionMilestones from './SessionMilestones';
import UpcomingSessionsDashboard from './UpcomingSessionsDashboard';
import MultiUserSyncStatus from './MultiUserSyncStatus';

const RealTimeTherapyTracker = ({ therapyData, onRefresh }) => {
  const [activeView, setActiveView] = useState('overview');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ Use existing WebSocket from context
  const { isConnected } = useRealTime();

  // ✅ If no data passed as props, load internally
  const [internalData, setInternalData] = useState({
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

  // ✅ Load therapy data using API service
  const loadTherapyData = useCallback(async () => {
    if (!isConnected) {
      console.warn('⏸ Not loading therapy data - not connected');
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 Loading therapy tracking data via API service...');
      
      // ✅ Use YOUR API service
      const response = await doctorApiService.getTherapyTrackingDashboard();
      
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        
        setInternalData({
          activeSessions: data.activeSessions || [],
          upcomingSessions: data.upcomingSessions || [],
          completedSessions: data.completedSessions || [],
          pausedSessions: data.pausedSessions || [],
          stats: data.stats || {
            active: (data.activeSessions || []).length,
            upcoming: (data.upcomingSessions || []).length,
            completed: (data.completedSessions || []).length,
            paused: (data.pausedSessions || []).length,
            total: (data.activeSessions || []).length + 
                   (data.upcomingSessions || []).length + 
                   (data.completedSessions || []).length + 
                   (data.pausedSessions || []).length
          },
          connectedUsers: data.connectedUsers || []
        });

        console.log('✅ Therapy tracking data loaded successfully');
      }
    } catch (error) {
      console.error('❌ Failed to load therapy tracking data:', error);
      
      // ✅ Fallback empty data
      setInternalData({
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

  // ✅ Load on mount and when connection changes
  useEffect(() => {
    if (isConnected && !therapyData) {
      loadTherapyData();
    }
  }, [isConnected, therapyData, loadTherapyData]);

  // ✅ Auto-refresh every 10 seconds if no external refresh
  useEffect(() => {
    if (!onRefresh && isConnected) {
      const interval = setInterval(() => {
        console.log('🔄 Auto-refreshing therapy data...');
        loadTherapyData();
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [onRefresh, isConnected, loadTherapyData]);

  // ✅ Use external data if provided, otherwise use internal
  const data = therapyData || internalData;

  // Handle refresh
  const handleRefresh = useCallback(() => {
    if (onRefresh) {
      onRefresh();
    } else {
      loadTherapyData();
    }
  }, [onRefresh, loadTherapyData]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50"
    >
      {/* Header */}
      <motion.header
        variants={cardVariants}
        className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-emerald-100/50 shadow-sm"
      >
        <div className="px-4 lg:px-8 py-4 lg:py-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
            {/* Title */}
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-slate-800 to-emerald-700 bg-clip-text text-transparent">
                  Panchakarma Therapy Tracker
                </h1>
                <p className="text-sm lg:text-base text-slate-600">Real-time monitoring & milestone tracking</p>
              </div>
            </div>

            {/* Connection & Refresh */}
            <div className="flex items-center space-x-3">
              {/* Connection Status */}
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-semibold border shadow-sm ${
                isConnected 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                {isConnected ? (
                  <>
                    <Zap className="w-4 h-4 animate-pulse" />
                    <span className="hidden sm:inline">Live</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Offline</span>
                  </>
                )}
              </div>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
                title="Refresh data"
              >
                <RefreshCw className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* View Toggle */}
          <div className="mt-4 flex items-center bg-slate-100 rounded-xl p-1 overflow-x-auto">
            {['overview', 'progress', 'milestones', 'upcoming'].map((view) => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize whitespace-nowrap ${
                  activeView === view
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                {view}
              </button>
            ))}
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="p-4 lg:p-8">
        <AnimatePresence mode="wait">
          {activeView === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 lg:space-y-8"
            >
              {/* Quick Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <motion.div
                  variants={cardVariants}
                  whileHover={{ scale: 1.02 }}
                  className="p-4 lg:p-6 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-200/50 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-emerald-700">Active Sessions</p>
                      <p className="text-2xl lg:text-3xl font-bold text-emerald-800">
                        {data.stats?.active || data.activeSessions?.length || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  variants={cardVariants}
                  whileHover={{ scale: 1.02 }}
                  className="p-4 lg:p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-200/50 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-blue-700">Upcoming Today</p>
                      <p className="text-2xl lg:text-3xl font-bold text-blue-800">
                        {data.stats?.upcoming || data.upcomingSessions?.length || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  variants={cardVariants}
                  whileHover={{ scale: 1.02 }}
                  className="p-4 lg:p-6 bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl border border-purple-200/50 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-purple-700">Completed Today</p>
                      <p className="text-2xl lg:text-3xl font-bold text-purple-800">
                        {data.stats?.completed || data.completedSessions?.length || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  variants={cardVariants}
                  whileHover={{ scale: 1.02 }}
                  className="p-4 lg:p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200/50 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-amber-700">Connected Users</p>
                      <p className="text-2xl lg:text-3xl font-bold text-amber-800">
                        {data.connectedUsers?.length || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Live Sessions Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
                <div className="xl:col-span-2">
                  <LiveProgressMonitor 
                    sessions={data.activeSessions || []} 
                    loading={loading}
                  />
                </div>
                <div className="xl:col-span-1">
                  <MultiUserSyncStatus 
                    connectedUsers={data.connectedUsers || []} 
                  />
                </div>
              </div>
            </motion.div>
          )}

          {activeView === 'progress' && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <LiveProgressMonitor 
                sessions={data.activeSessions || []} 
                detailed={true}
                onSelectPatient={setSelectedPatient}
                loading={loading}
              />
            </motion.div>
          )}

          {activeView === 'milestones' && (
            <motion.div
              key="milestones"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <SessionMilestones 
                milestones={data.milestones || {}}
                selectedPatient={selectedPatient}
              />
            </motion.div>
          )}

          {activeView === 'upcoming' && (
            <motion.div
              key="upcoming"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <UpcomingSessionsDashboard 
                sessions={data.upcomingSessions || []} 
                loading={loading}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default RealTimeTherapyTracker;
