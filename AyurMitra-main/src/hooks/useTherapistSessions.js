// src/hooks/useTherapistSessions.js
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

export const useTherapistSessions = (patientId = null) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('therapist_token') || localStorage.getItem('accessToken');
      const endpoint = patientId 
        ? `/api/therapists/sessions/patient/${patientId}`
        : '/api/therapists/sessions/today';
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }

      const data = await response.json();
      setSessions(patientId ? data.data.sessions : data.data.sessions);
      
    } catch (err) {
      console.error('Sessions fetch error:', err);
      setError(err.message);
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const startSession = useCallback(async (sessionId, startNotes = '') => {
    try {
      const token = localStorage.getItem('therapist_token') || localStorage.getItem('accessToken');
      const response = await fetch(`/api/therapists/sessions/${sessionId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ startNotes })
      });

      if (!response.ok) throw new Error('Failed to start session');

      await fetchSessions(); // Refresh sessions
      toast.success('Session started successfully! 🔴 LIVE');
      
      return true;
    } catch (err) {
      console.error('Start session error:', err);
      toast.error('Failed to start session');
      return false;
    }
  }, [fetchSessions]);

  const completeSession = useCallback(async (sessionId, sessionData) => {
    try {
      const token = localStorage.getItem('therapist_token') || localStorage.getItem('accessToken');
      const response = await fetch(`/api/therapists/sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sessionData)
      });

      if (!response.ok) throw new Error('Failed to complete session');

      await fetchSessions(); // Refresh sessions
      toast.success('Session completed successfully! ✅');
      
      return true;
    } catch (err) {
      console.error('Complete session error:', err);
      toast.error('Failed to complete session');
      return false;
    }
  }, [fetchSessions]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    loading,
    error,
    refresh: fetchSessions,
    startSession,
    completeSession
  };
};
