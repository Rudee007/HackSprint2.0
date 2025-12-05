// src/components/RealtimeSessionList.jsx
// ✅ SCHEMA-ALIGNED REALTIME SESSION LIST (Consultation v2.0)
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Circle,
  Clock,
  Play,
  Pause,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Activity
} from 'lucide-react';
import therapistApiService from '../services/therapistApiService';
import { toast } from 'react-hot-toast';
import TrackLiveModal from './TrackLiveModal';

const RealtimeSessionList = ({ onSessionUpdate }) => {
  // Core state from /realtime/tracking/dashboard
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
  const [expandedSessions, setExpandedSessions] = useState({});
  const [actionLoading, setActionLoading] = useState({});

  const [trackLiveModalOpen, setTrackLiveModalOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  // ─────────────────────────────────────────────────────────────
  // Fetch realtime dashboard (strictly via therapistApiService)
  // ─────────────────────────────────────────────────────────────
  const fetchRealtimeSessions = useCallback(async () => {
    try {
      console.log('🔄 [SESSION LIST] Fetching realtime tracking dashboard...');
      const result = await therapistApiService.getRealtimeTrackingDashboard();

      if (result.success) {
        console.log('✅ [SESSION LIST] Dashboard data:', result.data);
        setRealtimeData(result.data);

        result.data.activeSessions?.forEach(session => {
          console.log('📊 [ACTIVE SESSION]', {
            id: session._id,
            patient: session.patientName,
            sessionType: session.sessionType,
            sessionStatus: session.sessionStatus,
            timing: session.timing
          });
        });
      } else {
        console.error('❌ [SESSION LIST] Failed to load dashboard:', result.error);
        toast.error(result.error || 'Failed to load realtime sessions');
      }
    } catch (error) {
      console.error('❌ [SESSION LIST] Error fetching realtime sessions:', error);
      toast.error('Error loading realtime sessions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRealtimeSessions();
    const interval = setInterval(() => {
      console.log('🔄 [SESSION LIST] Auto-refresh...');
      fetchRealtimeSessions();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchRealtimeSessions]);

  // ─────────────────────────────────────────────────────────────
  // Action handlers – strictly calling updated API service
  // ─────────────────────────────────────────────────────────────
  const handleStartSession = async (sessionId) => {
    setActionLoading(prev => ({ ...prev, [sessionId]: 'starting' }));
    try {
      const result = await therapistApiService.startRealtimeSession(sessionId);
      if (result.success) {
        toast.success('Session started');
        await fetchRealtimeSessions();
        onSessionUpdate && onSessionUpdate();
      } else {
        toast.error(result.error || 'Failed to start session');
      }
    } catch (err) {
      console.error('❌ [START] Error:', err);
      toast.error('Error starting session');
    } finally {
      setActionLoading(prev => ({ ...prev, [sessionId]: null }));
    }
  };

  const handlePauseSession = async (sessionId) => {
    setActionLoading(prev => ({ ...prev, [sessionId]: 'pausing' }));
    try {
      const result = await therapistApiService.pauseRealtimeSession(sessionId);
      if (result.success) {
        toast.success('Session paused');
        await fetchRealtimeSessions();
        onSessionUpdate && onSessionUpdate();
      } else {
        toast.error(result.error || 'Failed to pause session');
      }
    } catch (err) {
      console.error('❌ [PAUSE] Error:', err);
      toast.error('Error pausing session');
    } finally {
      setActionLoading(prev => ({ ...prev, [sessionId]: null }));
    }
  };

  const handleResumeSession = async (sessionId) => {
    setActionLoading(prev => ({ ...prev, [sessionId]: 'resuming' }));
    try {
      const result = await therapistApiService.resumeRealtimeSession(sessionId);
      if (result.success) {
        toast.success('Session resumed');
        await fetchRealtimeSessions();
        onSessionUpdate && onSessionUpdate();
      } else {
        toast.error(result.error || 'Failed to resume session');
      }
    } catch (err) {
      console.error('❌ [RESUME] Error:', err);
      toast.error('Error resuming session');
    } finally {
      setActionLoading(prev => ({ ...prev, [sessionId]: null }));
    }
  };

  const handleCompleteSession = async (sessionId) => {
    setActionLoading(prev => ({ ...prev, [sessionId]: 'completing' }));
    try {
      // basic summary/notes; rating/feedback can be added via separate UI later
      const result = await therapistApiService.completeRealtimeSession(
        sessionId,
        'Session completed successfully',
        'Treatment completed'
      );
      if (result.success) {
        toast.success('Session completed');
        await fetchRealtimeSessions();
        onSessionUpdate && onSessionUpdate();
      } else {
        toast.error(result.error || 'Failed to complete session');
      }
    } catch (err) {
      console.error('❌ [COMPLETE] Error:', err);
      toast.error('Error completing session');
    } finally {
      setActionLoading(prev => ({ ...prev, [sessionId]: null }));
    }
  };

  const handleTrackLive = (sessionId) => {
    setSelectedSessionId(sessionId);
    setTrackLiveModalOpen(true);
  };

  // ─────────────────────────────────────────────────────────────
  // Utilities (timing based on controller’s timing object)
  // ─────────────────────────────────────────────────────────────
  const formatMs = (ms) => {
    if (!ms && ms !== 0) return '--:--';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const toggleSessionExpansion = (sessionId) => {
    setExpandedSessions(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }));
  };

  // ─────────────────────────────────────────────────────────────
  // Render individual session card – Consultation schema v2.0
  // ─────────────────────────────────────────────────────────────
  const renderSessionCard = (session, listType) => {
    const isExpanded = expandedSessions[session._id];
    const loadingState = actionLoading[session._id];

    const sessionStatus = session.sessionStatus || session.status || 'scheduled';
    const isInProgress = sessionStatus === 'in_progress';
    const isPaused = sessionStatus === 'paused';
    const canPause = isInProgress;
    const canResume = isPaused;
    const canComplete = isInProgress || isPaused;

    const isTherapy = session.sessionType === 'therapy';

    const statusConfig = {
      active: {
        bg: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50',
        badge: 'bg-emerald-100 text-emerald-700',
        avatar: 'bg-gradient-to-br from-emerald-500 to-green-600'
      },
      upcoming: {
        bg: 'border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50',
        badge: 'bg-amber-100 text-amber-700',
        avatar: 'bg-gradient-to-br from-amber-500 to-amber-600'
      },
      completed: {
        bg: 'border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50',
        badge: 'bg-blue-100 text-blue-700',
        avatar: 'bg-gradient-to-br from-blue-500 to-cyan-600'
      },
      paused: {
        bg: 'border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50',
        badge: 'bg-purple-100 text-purple-700',
        avatar: 'bg-gradient-to-br from-purple-500 to-violet-600'
      }
    };

    const cfg = statusConfig[listType];

    const scheduledTime = session.scheduledTime
      ? session.scheduledTime
      : session.scheduledAt
      ? new Date(session.scheduledAt).toLocaleTimeString()
      : 'N/A';

    const startedTime = session.sessionStartTime
      ? new Date(session.sessionStartTime).toLocaleTimeString()
      : null;

    return (
      <motion.div
        key={session._id}
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`${cfg.bg} rounded-2xl p-6 shadow-lg border-2 hover:shadow-xl transition-all`}
      >
        <div className="flex items-center justify-between mb-4">
          {/* Left: Patient + basic info */}
          <div className="flex items-center space-x-4">
            <div
              className={`${cfg.avatar} w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg`}
            >
              {(session.patientName || 'P').charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {session.patientName || 'Unknown Patient'}
              </h3>
              <p className="text-xs text-slate-500">
                {session.providerType === 'therapist' ? 'Therapist' : 'Doctor'}:{' '}
                {session.therapistName || session.providerName || 'Unassigned'}
              </p>
              <p className="text-sm text-slate-600">
                {startedTime
                  ? `Started: ${startedTime}`
                  : `Scheduled: ${scheduledTime}`}
              </p>
            </div>
          </div>

          {/* Right: status + actions */}
          <div className="flex items-center space-x-3">
            <span
              className={`${cfg.badge} px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2`}
            >
              {listType === 'active' && (
                <Circle className="w-2 h-2 fill-current animate-pulse" />
              )}
              <span className="capitalize">{listType}</span>
            </span>

            {/* UPCOMING */}
            {listType === 'upcoming' && (
              <button
                onClick={() => handleStartSession(session._id)}
                disabled={!!loadingState}
                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-4 py-2 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingState === 'starting' ? (
                  <Activity className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                <span>{loadingState === 'starting' ? 'Starting…' : 'Start'}</span>
              </button>
            )}

            {/* ACTIVE */}
            {listType === 'active' && (
              <>
                <button
                  onClick={() => handleTrackLive(session._id)}
                  className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white px-4 py-2 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
                >
                  <Activity className="w-4 h-4" />
                  <span>Track Live</span>
                </button>

                {!isInProgress && !isPaused && (
                  <button
                    onClick={() => handleStartSession(session._id)}
                    disabled={!!loadingState}
                    className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-4 py-2 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl flex items-center space-x-2 disabled:opacity-50"
                  >
                    {loadingState === 'starting' ? (
                      <Activity className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    <span>Start</span>
                  </button>
                )}

                {canPause && (
                  <button
                    onClick={() => handlePauseSession(session._id)}
                    disabled={!!loadingState}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-4 py-2 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl flex items-center space-x-2 disabled:opacity-50"
                  >
                    {loadingState === 'pausing' ? (
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
                    disabled={!!loadingState}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl flex items-center space-x-2 disabled:opacity-50"
                  >
                    {loadingState === 'completing' ? (
                      <Activity className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    <span>Complete</span>
                  </button>
                )}
              </>
            )}

            {/* PAUSED */}
            {listType === 'paused' && (
              <>
                <button
                  onClick={() => handleResumeSession(session._id)}
                  disabled={!!loadingState}
                  className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-4 py-2 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl flex items-center space-x-2 disabled:opacity-50"
                >
                  {loadingState === 'resuming' ? (
                    <Activity className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  <span>Resume</span>
                </button>

                <button
                  onClick={() => handleCompleteSession(session._id)}
                  disabled={!!loadingState}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl flex items-center space-x-2 disabled:opacity-50"
                >
                  {loadingState === 'completing' ? (
                    <Activity className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  <span>Complete</span>
                </button>
              </>
            )}

            {/* Expand / collapse */}
            <button
              onClick={() => toggleSessionExpansion(session._id)}
              className="p-2 rounded-xl bg-white/60 hover:bg-white transition-all"
            >
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-slate-700" />
              ) : (
                <ChevronRight className="w-5 h-5 text-slate-700" />
              )}
            </button>
          </div>
        </div>

        {/* Timing / progress for active sessions */}
        {listType === 'active' && session.timing && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-600">Progress</span>
              <span className="font-semibold text-slate-800">
                {session.timing.progressPercentage}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 mb-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-green-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${session.timing.progressPercentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Elapsed: {formatMs(session.timing.elapsedTime)}</span>
              <span>Remaining: {formatMs(session.timing.remainingTime)}</span>
            </div>
          </div>
        )}

        {/* Session tags – sessionType, therapy, room, status */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
            {isTherapy ? 'Therapy' : 'Consultation'}
          </span>
          {isTherapy && session.therapyType && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">
              {session.therapyType}
            </span>
          )}
          {session.roomNumber && (
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold">
              Room {session.roomNumber}
            </span>
          )}
          <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
            Status: {sessionStatus}
          </span>
        </div>

        {/* Expanded section */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-slate-200 space-y-2 text-sm"
            >
              <div>
                <span className="text-slate-600">Estimated duration:</span>
                <span className="ml-2 font-semibold text-slate-800">
                  {session.estimatedDuration || 60} min
                </span>
              </div>
              {session.dayNumber && (
                <div>
                  <span className="text-slate-600">Day:</span>
                  <span className="ml-2 font-semibold text-slate-800">
                    {session.dayNumber}
                    {session.totalDays ? ` / ${session.totalDays}` : ''}
                  </span>
                </div>
              )}
              {session.participantCount > 0 && (
                <div>
                  <span className="text-slate-600">Participants:</span>
                  <span className="ml-2 font-semibold text-slate-800">
                    {session.participantCount}
                  </span>
                </div>
              )}
              <div>
                <span className="text-slate-600">Session ID:</span>
                <span className="ml-2 font-mono text-xs text-slate-800">
                  {session._id}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // Loading state
  // ─────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading realtime sessions…</p>
        </div>
      </div>
    );
  }

  const { activeSessions, pausedSessions, upcomingSessions, completedSessions } =
    realtimeData;

  const allEmpty =
    activeSessions.length === 0 &&
    pausedSessions.length === 0 &&
    upcomingSessions.length === 0 &&
    completedSessions.length === 0;

  return (
    <div className="space-y-8">
      {/* Active */}
      {activeSessions.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center space-x-2">
            <Circle className="w-3 h-3 fill-current text-emerald-500 animate-pulse" />
            <span>Active Sessions</span>
            <span className="text-sm font-normal text-slate-600">
              ({activeSessions.length})
            </span>
          </h3>
          <div className="space-y-4">
            {activeSessions.map(s => renderSessionCard(s, 'active'))}
          </div>
        </div>
      )}

      {/* Paused */}
      {pausedSessions.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center space-x-2">
            <Pause className="w-5 h-5 text-purple-500" />
            <span>Paused Sessions</span>
            <span className="text-sm font-normal text-slate-600">
              ({pausedSessions.length})
            </span>
          </h3>
          <div className="space-y-4">
            {pausedSessions.map(s => renderSessionCard(s, 'paused'))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcomingSessions.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <span>Upcoming Sessions</span>
            <span className="text-sm font-normal text-slate-600">
              ({upcomingSessions.length})
            </span>
          </h3>
          <div className="space-y-4">
            {upcomingSessions.map(s => renderSessionCard(s, 'upcoming'))}
          </div>
        </div>
      )}

      {/* Completed */}
      {completedSessions.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-blue-500" />
            <span>Completed Today</span>
            <span className="text-sm font-normal text-slate-600">
              ({completedSessions.length})
            </span>
          </h3>
          <div className="space-y-4">
            {completedSessions.slice(0, 5).map(s => renderSessionCard(s, 'completed'))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {allEmpty && (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center">
          <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">No sessions today</h3>
          <p className="text-slate-600">Your schedule is clear for the selected day.</p>
        </div>
      )}

      {/* Track Live Modal */}
      <TrackLiveModal
        sessionId={selectedSessionId}
        isOpen={trackLiveModalOpen}
        onClose={() => {
          setTrackLiveModalOpen(false);
          setSelectedSessionId(null);
        }}
        onUpdate={async () => {
          await fetchRealtimeSessions();
          onSessionUpdate && onSessionUpdate();
        }}
      />
    </div>
  );
};

export default RealtimeSessionList;
