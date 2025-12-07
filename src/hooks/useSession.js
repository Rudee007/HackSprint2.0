import { useState, useEffect, useCallback } from 'react';
import { useRealTime } from '../context/RealTimeContext';
import realtimeSessionService from '../services/realtimeSessionService';

export const useSession = (sessionId = null) => {
  const { 
    currentSession, 
    sessionParticipants, 
    sessionCountdown,
    activeSessions,
    joinSession: contextJoinSession,
    leaveSession: contextLeaveSession,
    isConnected 
  } = useRealTime();

  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionStatus, setSessionStatus] = useState('scheduled');

  // Fetch session details when sessionId changes
  useEffect(() => {
    if (sessionId) {
      fetchSessionDetails(sessionId);
    }
  }, [sessionId]);

  // Update session status from active sessions map
  useEffect(() => {
    if (sessionId && activeSessions.has(sessionId)) {
      const sessionInfo = activeSessions.get(sessionId);
      setSessionStatus(sessionInfo.status || 'scheduled');
    }
  }, [sessionId, activeSessions]);

  // Fetch detailed session information
  const fetchSessionDetails = useCallback(async (id) => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await realtimeSessionService.getSessionDetails(id);
      if (response.data.success) {
        setSessionData(response.data.data);
        setSessionStatus(response.data.data.consultation?.sessionStatus || 'scheduled');
      }
    } catch (err) {
      console.error('Error fetching session details:', err);
      setError(err.response?.data?.error?.message || 'Failed to load session details');
    } finally {
      setLoading(false);
    }
  }, []);

  // Join a session
  const joinSession = useCallback(async (id) => {
    if (!id || !isConnected) return false;
    
    try {
      // Join via WebSocket
      const wsJoined = contextJoinSession(id);
      
      // Also join via API for tracking
      await realtimeSessionService.joinSession(id);
      
      return wsJoined;
    } catch (err) {
      console.error('Error joining session:', err);
      setError(err.response?.data?.error?.message || 'Failed to join session');
      return false;
    }
  }, [contextJoinSession, isConnected]);

  // Leave a session
  const leaveSession = useCallback(async (id) => {
    if (!id || !isConnected) return false;
    
    try {
      // Leave via WebSocket
      const wsLeft = contextLeaveSession(id);
      
      return wsLeft;
    } catch (err) {
      console.error('Error leaving session:', err);
      setError(err.response?.data?.error?.message || 'Failed to leave session');
      return false;
    }
  }, [contextLeaveSession, isConnected]);

  // Update session status
  const updateSessionStatus = useCallback(async (id, status, reason = '') => {
    if (!id) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await realtimeSessionService.updateSessionStatus(id, status, reason);
      if (response.data.success) {
        setSessionStatus(status);
        // Refresh session details
        await fetchSessionDetails(id);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error updating session status:', err);
      setError(err.response?.data?.error?.message || 'Failed to update session status');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchSessionDetails]);

  // Start session
  const startSession = useCallback(async (id) => {
    return updateSessionStatus(id, 'in_progress', 'Session started by provider');
  }, [updateSessionStatus]);

  // Pause session
  const pauseSession = useCallback(async (id) => {
    return updateSessionStatus(id, 'paused', 'Session paused by provider');
  }, [updateSessionStatus]);

  // Resume session
  const resumeSession = useCallback(async (id) => {
    return updateSessionStatus(id, 'in_progress', 'Session resumed by provider');
  }, [updateSessionStatus]);

  // End session
  const endSession = useCallback(async (id) => {
    return updateSessionStatus(id, 'completed', 'Session completed by provider');
  }, [updateSessionStatus]);

  // Cancel session
  const cancelSession = useCallback(async (id, reason = 'Cancelled by provider') => {
    return updateSessionStatus(id, 'cancelled', reason);
  }, [updateSessionStatus]);

  // Get remaining time for active session
  const getRemainingTime = useCallback(() => {
    if (sessionCountdown?.sessionId === sessionId) {
      return {
        remainingSeconds: sessionCountdown.remainingSeconds,
        remainingMinutes: sessionCountdown.remainingMinutes,
        isActive: sessionCountdown.remainingSeconds > 0
      };
    }
    return null;
  }, [sessionCountdown, sessionId]);

  // Format time helper
  const formatTime = useCallback((seconds) => {
    if (!seconds || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Check if session is active
  const isSessionActive = useCallback(() => {
    return ['in_progress', 'paused'].includes(sessionStatus);
  }, [sessionStatus]);

  // Check if session can be controlled
  const canControlSession = useCallback(() => {
    return ['scheduled', 'patient_arrived', 'in_progress', 'paused'].includes(sessionStatus);
  }, [sessionStatus]);

  // Get session summary
  const getSessionSummary = useCallback(() => {
    if (!sessionData) return null;
    
    const consultation = sessionData.consultation;
    return {
      id: consultation?._id,
      patientName: consultation?.patientId?.name || 'Unknown Patient',
      providerName: consultation?.providerId?.name || 'Unknown Provider',
      scheduledAt: consultation?.scheduledAt,
      status: sessionStatus,
      type: consultation?.type || 'consultation',
      estimatedDuration: consultation?.estimatedDuration || 60,
      actualDuration: consultation?.actualDuration,
      participantCount: sessionParticipants.length,
      remainingTime: getRemainingTime(),
      isActive: isSessionActive(),
      canControl: canControlSession()
    };
  }, [sessionData, sessionStatus, sessionParticipants, getRemainingTime, isSessionActive, canControlSession]);

  return {
    // Session data
    sessionData,
    sessionStatus,
    sessionParticipants,
    currentSession,
    
    // Session summary
    sessionSummary: getSessionSummary(),
    
    // Time management
    countdown: sessionCountdown,
    remainingTime: getRemainingTime(),
    formatTime,
    
    // Session controls
    joinSession,
    leaveSession,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    cancelSession,
    updateSessionStatus,
    
    // Status checks
    isActive: isSessionActive(),
    canControl: canControlSession(),
    
    // State
    loading,
    error,
    isConnected,
    
    // Utilities
    refreshSession: () => fetchSessionDetails(sessionId)
  };
};

// Custom hook for managing multiple sessions
export const useMultipleSessions = () => {
  const { activeSessions, isConnected } = useRealTime();
  const [sessionsData, setSessionsData] = useState(new Map());
  const [loading, setLoading] = useState(false);

  // Fetch data for all active sessions
  const refreshAllSessions = useCallback(async () => {
    if (!isConnected || activeSessions.size === 0) return;
    
    setLoading(true);
    try {
      const sessionIds = Array.from(activeSessions.keys());
      const responses = await Promise.allSettled(
        sessionIds.map(id => realtimeSessionService.getSessionDetails(id))
      );
      
      const newSessionsData = new Map();
      responses.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.data.success) {
          newSessionsData.set(sessionIds[index], result.value.data.data);
        }
      });
      
      setSessionsData(newSessionsData);
    } catch (err) {
      console.error('Error refreshing sessions:', err);
    } finally {
      setLoading(false);
    }
  }, [activeSessions, isConnected]);

  // Get session summaries for all active sessions
  const getSessionSummaries = useCallback(() => {
    const summaries = [];
    
    for (const [sessionId, sessionInfo] of activeSessions) {
      const sessionData = sessionsData.get(sessionId);
      const consultation = sessionData?.consultation;
      
      summaries.push({
        id: sessionId,
        patientName: consultation?.patientId?.name || sessionInfo.patientName || 'Unknown Patient',
        status: sessionInfo.status || 'scheduled',
        type: consultation?.type || sessionInfo.type || 'consultation',
        scheduledAt: consultation?.scheduledAt || sessionInfo.scheduledAt,
        estimatedDuration: consultation?.estimatedDuration || 60,
        participantCount: sessionInfo.participantCount || 0,
        lastUpdate: sessionInfo.timestamp || new Date()
      });
    }
    
    return summaries.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  }, [activeSessions, sessionsData]);

  return {
    activeSessions,
    sessionsData,
    sessionSummaries: getSessionSummaries(),
    refreshAllSessions,
    loading,
    isConnected
  };
};
