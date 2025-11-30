// src/components/realtime/ActiveSessionTracker.jsx
import React, { useState, useEffect, useRef } from 'react';
import { X, RefreshCw, AlertTriangle } from 'lucide-react';
import realtimeSessionService from '../../services/realtimeSessionService';

const ActiveSessionTracker = ({ sessionId, sessionData, onClose }) => {
  const [session, setSession] = useState(sessionData || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  // ✅ Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ✅ Fetch session data when sessionId changes
  useEffect(() => {
    if (!sessionId) {
      setSession(null);
      setError(null);
      return;
    }

    // Use provided sessionData if available
    if (sessionData && sessionData.id === sessionId) {
      setSession(sessionData);
      return;
    }

    // Otherwise fetch from API
    const fetchSession = async () => {
      if (!isMountedRef.current) return;
      
      setLoading(true);
      setError(null);

      try {
        const response = await realtimeSessionService.getSessionDetails(sessionId);
        
        if (isMountedRef.current) {
          setSession(response.data || null);
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err.message || 'Failed to load session');
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchSession();
  }, [sessionId, sessionData]);

  // ✅ Manual refresh function
  const handleRefresh = async () => {
    if (!sessionId || loading) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await realtimeSessionService.getSessionDetails(sessionId);
      if (isMountedRef.current) {
        setSession(response.data || null);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message || 'Failed to refresh session');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // ✅ Helper functions
  const formatTime = (dateString) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'in_progress': return 'text-green-600 bg-green-50';
      case 'scheduled': return 'text-blue-600 bg-blue-50';
      case 'completed': return 'text-gray-600 bg-gray-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // ✅ Loading state
  if (loading && !session) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
        <div className="flex items-center justify-center h-32">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
            <span className="text-slate-600">Loading session...</span>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Error state
  if (error && !session) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Session Error</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <span className="text-red-600">{error}</span>
        </div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  // ✅ No session state
  if (!session) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Session Tracker</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>
        <p className="text-slate-600">No session selected</p>
      </div>
    );
  }

  // ✅ Main session display
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-blue-50">
        <h3 className="text-lg font-semibold text-slate-800">Active Session</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh session data"
          >
            <RefreshCw className={`w-4 h-4 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            title="Close tracker"
          >
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Session Overview */}
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-slate-800">Session Details</h4>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(session.status)}`}>
              {session.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500 font-medium">Patient:</span>
              <p className="font-semibold text-slate-800">
                {session.patientName || session.patientId?.name || 'Unknown Patient'}
              </p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Type:</span>
              <p className="font-semibold text-slate-800">
                {session.therapyType || session.type || 'General'}
              </p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Scheduled:</span>
              <p className="font-semibold text-slate-800">
                {formatTime(session.scheduledAt || session.scheduledFor)}
              </p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Duration:</span>
              <p className="font-semibold text-slate-800">
                {session.estimatedDuration || 60} min
              </p>
            </div>
          </div>
        </div>

        {/* Active session indicator */}
        {session.status === 'in_progress' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-emerald-800 font-medium text-sm">Session is currently active</span>
            </div>
          </div>
        )}

        {/* Last update */}
        <div className="text-xs text-slate-500 text-center">
          Last updated: {new Date(session.lastUpdate || session.updatedAt || Date.now()).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default ActiveSessionTracker;
