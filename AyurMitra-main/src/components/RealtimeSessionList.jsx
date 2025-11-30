// src/components/RealtimeSessionList.jsx
// ✅ PRODUCTION-READY SESSION LIST WITH TRACK LIVE MODAL
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Circle, Clock, User, Play, Pause, CheckCircle, AlertCircle,
  ChevronDown, ChevronRight, Eye, Activity, AlertTriangle
} from 'lucide-react';
import therapistApiService from '../services/therapistApiService';
import { toast } from 'react-hot-toast';
import TrackLiveModal from './TrackLiveModal';

const RealtimeSessionList = ({ onSessionUpdate }) => {
  // ═══════════════════════════════════════════════════════════
  // 🔥 STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════
  const [realtimeData, setRealtimeData] = useState({
    activeSessions: [],
    upcomingSessions: [],
    completedSessions: [],
    pausedSessions: []
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSessions, setExpandedSessions] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  
  // ✅ TRACK LIVE MODAL STATE
  const [trackLiveModalOpen, setTrackLiveModalOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  // ═══════════════════════════════════════════════════════════
  // 🔥 FETCH REAL-TIME SESSIONS
  // ═══════════════════════════════════════════════════════════
  const fetchRealtimeSessions = useCallback(async () => {
    try {
      console.log('🔄 [SESSION LIST] Fetching real-time sessions...');
      
      const result = await therapistApiService.getRealtimeTrackingDashboard();
      
      if (result.success) {
        console.log('✅ [SESSION LIST] Sessions loaded:', result.data);
        setRealtimeData(result.data);
        
        // Log session statuses for debugging
        result.data.activeSessions?.forEach(session => {
          console.log('📊 [ACTIVE]', {
            id: session._id,
            patient: session.patientName,
            status: session.sessionStatus,
            canPause: session.sessionStatus === 'in_progress',
            canComplete: ['in_progress', 'paused'].includes(session.sessionStatus)
          });
        });
      } else {
        console.error('❌ [SESSION LIST] Failed to load:', result.error);
      }
    } catch (error) {
      console.error('❌ [SESSION LIST] Error fetching sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════
  // 🔥 AUTO-REFRESH & INITIAL LOAD
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    fetchRealtimeSessions();
    
    const interval = setInterval(() => {
      console.log('🔄 [SESSION LIST] Auto-refreshing...');
      fetchRealtimeSessions();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [fetchRealtimeSessions]);

  // ═══════════════════════════════════════════════════════════
  // 🔥 SESSION ACTION HANDLERS
  // ═══════════════════════════════════════════════════════════
  const handleStartSession = async (sessionId) => {
    setActionLoading(prev => ({ ...prev, [sessionId]: 'starting' }));
    
    try {
      console.log('🚀 [START] Starting session:', sessionId);
      
      const result = await therapistApiService.startRealtimeSession(sessionId);
      
      if (result.success) {
        console.log('✅ [START] Session started successfully');
        toast.success('Session started! 🎉');
        await fetchRealtimeSessions();
        if (onSessionUpdate) onSessionUpdate();
      } else {
        console.error('❌ [START] Failed:', result.error);
        toast.error(result.error || 'Failed to start session');
      }
    } catch (error) {
      console.error('❌ [START] Error:', error);
      toast.error('Error starting session');
    } finally {
      setActionLoading(prev => ({ ...prev, [sessionId]: null }));
    }
  };

  const handlePauseSession = async (sessionId) => {
    setActionLoading(prev => ({ ...prev, [sessionId]: 'pausing' }));
    
    try {
      console.log('⏸️ [PAUSE] Pausing session:', sessionId);
      
      const result = await therapistApiService.pauseRealtimeSession(sessionId);
      
      if (result.success) {
        console.log('✅ [PAUSE] Session paused successfully');
        toast.success('Session paused ⏸️');
        await fetchRealtimeSessions();
        if (onSessionUpdate) onSessionUpdate();
      } else {
        console.error('❌ [PAUSE] Failed:', result.error);
        toast.error(result.error || 'Failed to pause session');
      }
    } catch (error) {
      console.error('❌ [PAUSE] Error:', error);
      toast.error('Error pausing session');
    } finally {
      setActionLoading(prev => ({ ...prev, [sessionId]: null }));
    }
  };

  const handleResumeSession = async (sessionId) => {
    setActionLoading(prev => ({ ...prev, [sessionId]: 'resuming' }));
    
    try {
      console.log('▶️ [RESUME] Resuming session:', sessionId);
      
      const result = await therapistApiService.resumeRealtimeSession(sessionId);
      
      if (result.success) {
        console.log('✅ [RESUME] Session resumed successfully');
        toast.success('Session resumed! ▶️');
        await fetchRealtimeSessions();
        if (onSessionUpdate) onSessionUpdate();
      } else {
        console.error('❌ [RESUME] Failed:', result.error);
        toast.error(result.error || 'Failed to resume session');
      }
    } catch (error) {
      console.error('❌ [RESUME] Error:', error);
      toast.error('Error resuming session');
    } finally {
      setActionLoading(prev => ({ ...prev, [sessionId]: null }));
    }
  };

  const handleCompleteSession = async (sessionId) => {
    setActionLoading(prev => ({ ...prev, [sessionId]: 'completing' }));
    
    try {
      console.log('✅ [COMPLETE] Completing session:', sessionId);
      
      const result = await therapistApiService.completeRealtimeSession(
        sessionId,
        'Session completed successfully',
        'Treatment completed'
      );
      
      if (result.success) {
        console.log('✅ [COMPLETE] Session completed successfully');
        toast.success('Session completed! ✅');
        await fetchRealtimeSessions();
        if (onSessionUpdate) onSessionUpdate();
      } else {
        console.error('❌ [COMPLETE] Failed:', result.error);
        toast.error(result.error || 'Failed to complete session');
      }
    } catch (error) {
      console.error('❌ [COMPLETE] Error:', error);
      toast.error('Error completing session');
    } finally {
      setActionLoading(prev => ({ ...prev, [sessionId]: null }));
    }
  };

  // ✅ OPEN TRACK LIVE MODAL
  const handleTrackLive = (sessionId) => {
    console.log('🔥 [TRACK LIVE] Opening modal for:', sessionId);
    setSelectedSessionId(sessionId);
    setTrackLiveModalOpen(true);
  };

  // ═══════════════════════════════════════════════════════════
  // 🔥 UTILITY FUNCTIONS
  // ═══════════════════════════════════════════════════════════
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

  const toggleSessionExpansion = (sessionId) => {
    setExpandedSessions(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }));
  };

  // ═══════════════════════════════════════════════════════════
  // 🔥 RENDER SESSION CARD
  // ═══════════════════════════════════════════════════════════
  const renderSessionCard = (session, type) => {
    const isExpanded = expandedSessions[session._id];
    const isActionPending = actionLoading[session._id];
    
    // Check actual session status from backend
    const sessionStatus = session.sessionStatus || session.status || 'scheduled';
    const isInProgress = sessionStatus === 'in_progress';
    const isPaused = sessionStatus === 'paused';
    const canPause = isInProgress;
    const canComplete = isInProgress || isPaused;
    const canResume = isPaused;
    
    const statusConfig = {
      active: {
        bgColor: 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50',
        badgeColor: 'bg-green-100 text-green-700',
        iconColor: 'bg-gradient-to-br from-green-500 to-green-600'
      },
      upcoming: {
        bgColor: 'border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50',
        badgeColor: 'bg-amber-100 text-amber-700',
        iconColor: 'bg-gradient-to-br from-amber-500 to-amber-600'
      },
      completed: {
        bgColor: 'border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50',
        badgeColor: 'bg-blue-100 text-blue-700',
        iconColor: 'bg-gradient-to-br from-blue-500 to-blue-600'
      },
      paused: {
        bgColor: 'border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50',
        badgeColor: 'bg-purple-100 text-purple-700',
        iconColor: 'bg-gradient-to-br from-purple-500 to-purple-600'
      }
    };
    
    const config = statusConfig[type];
    
    return (
      <motion.div
        key={session._id}
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={`${config.bgColor} rounded-2xl p-6 shadow-lg border-2 hover:shadow-xl transition-all`}
      >
        <div className="flex items-center justify-between mb-4">
          {/* Patient Info */}
          <div className="flex items-center space-x-4">
            <div className={`w-14 h-14 ${config.iconColor} rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
              {session.patientName?.charAt(0).toUpperCase() || 'P'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">{session.patientName || 'Patient'}</h3>
              <p className="text-sm text-slate-600">
                {session.sessionStartTime 
                  ? `Started: ${new Date(session.sessionStartTime).toLocaleTimeString()}`
                  : `Scheduled: ${new Date(session.scheduledAt).toLocaleTimeString()}`
                }
              </p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* Status Badge */}
            <span className={`px-4 py-2 rounded-xl text-sm font-semibold ${config.badgeColor} flex items-center space-x-2`}>
              {type === 'active' && <Circle className="w-2 h-2 fill-current animate-pulse" />}
              <span className="capitalize">{type}</span>
            </span>
            
            {/* UPCOMING SESSION ACTIONS */}
            {type === 'upcoming' && (
              <button
                onClick={() => handleStartSession(session._id)}
                disabled={isActionPending}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isActionPending === 'starting' ? (
                  <Activity className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                <span>{isActionPending === 'starting' ? 'Starting...' : 'Start'}</span>
              </button>
            )}
            
            {/* ACTIVE SESSION ACTIONS */}
            {type === 'active' && (
              <>
                {/* Track Live Button - ALWAYS SHOW */}
                <button
                  onClick={() => handleTrackLive(session._id)}
                  className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white px-4 py-2 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
                >
                  <Activity className="w-4 h-4" />
                  <span>Track Live</span>
                </button>
                
                {/* Conditional buttons based on actual status */}
                {!isInProgress && !isPaused && (
                  <button
                    onClick={() => handleStartSession(session._id)}
                    disabled={isActionPending}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl flex items-center space-x-2 disabled:opacity-50"
                  >
                    {isActionPending === 'starting' ? (
                      <Activity className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    <span>Start Session</span>
                  </button>
                )}
                
                {canPause && (
                  <button
                    onClick={() => handlePauseSession(session._id)}
                    disabled={isActionPending}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-4 py-2 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl flex items-center space-x-2 disabled:opacity-50"
                  >
                    {isActionPending === 'pausing' ? (
                      <Activity className="w-4 h-4 animate-spin" />
                    ) : (
                      <Pause className="w-4 h-4" />
                    )}
                    <span>Pause</span>
                  </button>
                )}
                
                {canComplete && (
                  <button
                    onClick={() => handleCompleteSession(session._id)}
                    disabled={isActionPending}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl flex items-center space-x-2 disabled:opacity-50"
                  >
                    {isActionPending === 'completing' ? (
                      <Activity className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    <span>Complete</span>
                  </button>
                )}
              </>
            )}
            
            {/* PAUSED SESSION ACTIONS */}
            {type === 'paused' && (
              <>
                <button
                  onClick={() => handleResumeSession(session._id)}
                  disabled={isActionPending}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl flex items-center space-x-2 disabled:opacity-50"
                >
                  {isActionPending === 'resuming' ? (
                    <Activity className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  <span>Resume</span>
                </button>
                
                <button
                  onClick={() => handleCompleteSession(session._id)}
                  disabled={isActionPending}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl flex items-center space-x-2 disabled:opacity-50"
                >
                  {isActionPending === 'completing' ? (
                    <Activity className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  <span>Complete</span>
                </button>
              </>
            )}
            
            {/* Expand/Collapse Button */}
            <button
              onClick={() => toggleSessionExpansion(session._id)}
              className="p-2 rounded-xl bg-white/50 hover:bg-white/80 transition-all"
            >
              {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        {/* Progress Bar for Active Sessions */}
        {type === 'active' && session.timing && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-600">Progress</span>
              <span className="font-semibold text-slate-800">{session.timing.progressPercentage}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${session.timing.progressPercentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Elapsed: {formatTimeRemaining(session.timing.elapsedTime)}</span>
              <span>Remaining: {formatTimeRemaining(session.timing.remainingTime)}</span>
            </div>
          </div>
        )}
        
        {/* Session Type Tags */}
        {session.therapyType && (
          <div className="mt-3 flex items-center space-x-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">
              {session.therapyType}
            </span>
            {session.roomNumber && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold">
                Room {session.roomNumber}
              </span>
            )}
            <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
              Status: {sessionStatus}
            </span>
          </div>
        )}
        
        {/* Expanded Details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-slate-200 space-y-2"
            >
              <div className="text-sm">
                <span className="text-slate-600">Duration:</span>
                <span className="ml-2 font-semibold text-slate-800">{session.estimatedDuration || 60} minutes</span>
              </div>
              {session.dayNumber && (
                <div className="text-sm">
                  <span className="text-slate-600">Day:</span>
                  <span className="ml-2 font-semibold text-slate-800">{session.dayNumber} of {session.totalDays || 21}</span>
                </div>
              )}
              {session.participantCount > 0 && (
                <div className="text-sm">
                  <span className="text-slate-600">Participants:</span>
                  <span className="ml-2 font-semibold text-slate-800">{session.participantCount}</span>
                </div>
              )}
              <div className="text-sm">
                <span className="text-slate-600">Session ID:</span>
                <span className="ml-2 font-mono text-xs text-slate-800">{session._id}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // 🔥 LOADING STATE
  // ═══════════════════════════════════════════════════════════
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading sessions...</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // 🔥 MAIN RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="space-y-8">
      {/* Active Sessions */}
      {realtimeData.activeSessions.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center space-x-2">
            <Circle className="w-3 h-3 fill-current text-green-500 animate-pulse" />
            <span>Active Sessions</span>
            <span className="text-sm font-normal text-slate-600">({realtimeData.activeSessions.length})</span>
          </h3>
          <div className="space-y-4">
            {realtimeData.activeSessions.map(session => renderSessionCard(session, 'active'))}
          </div>
        </div>
      )}

      {/* Paused Sessions */}
      {realtimeData.pausedSessions.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center space-x-2">
            <Pause className="w-5 h-5 text-amber-500" />
            <span>Paused Sessions</span>
            <span className="text-sm font-normal text-slate-600">({realtimeData.pausedSessions.length})</span>
          </h3>
          <div className="space-y-4">
            {realtimeData.pausedSessions.map(session => renderSessionCard(session, 'paused'))}
          </div>
        </div>
      )}

      {/* Upcoming Sessions */}
      {realtimeData.upcomingSessions.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <span>Upcoming Sessions</span>
            <span className="text-sm font-normal text-slate-600">({realtimeData.upcomingSessions.length})</span>
          </h3>
          <div className="space-y-4">
            {realtimeData.upcomingSessions.map(session => renderSessionCard(session, 'upcoming'))}
          </div>
        </div>
      )}

      {/* Completed Sessions */}
      {realtimeData.completedSessions.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-blue-500" />
            <span>Completed Today</span>
            <span className="text-sm font-normal text-slate-600">({realtimeData.completedSessions.length})</span>
          </h3>
          <div className="space-y-4">
            {realtimeData.completedSessions.slice(0, 5).map(session => renderSessionCard(session, 'completed'))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {realtimeData.activeSessions.length === 0 && 
       realtimeData.upcomingSessions.length === 0 && 
       realtimeData.pausedSessions.length === 0 && 
       realtimeData.completedSessions.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center">
          <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">No sessions today</h3>
          <p className="text-slate-600">Your schedule is clear for today</p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          🔥 TRACK LIVE MODAL
      ═══════════════════════════════════════════════════════════ */}
      <TrackLiveModal
        sessionId={selectedSessionId}
        isOpen={trackLiveModalOpen}
        onClose={() => {
          setTrackLiveModalOpen(false);
          setSelectedSessionId(null);
        }}
        onUpdate={async () => {
          await fetchRealtimeSessions();
          if (onSessionUpdate) onSessionUpdate();
        }}
      />
    </div>
  );
};

export default RealtimeSessionList;
