// src/hooks/useTherapistWebSocket.js
import { useEffect, useCallback } from 'react';
import { useRealTime } from '../context/RealTimeContext';
import toast from 'react-hot-toast';

export const useTherapistWebSocket = (onSessionUpdate) => {
  const { isConnected, socket } = useRealTime();

  const handleSessionStarted = useCallback((data) => {
    toast.success(`Session started: ${data.sessionData?.patientName}`, {
      icon: '🔴',
      duration: 4000
    });
    
    if (onSessionUpdate) {
      onSessionUpdate('started', data);
    }
  }, [onSessionUpdate]);

  const handleSessionCompleted = useCallback((data) => {
    toast.success('Session completed successfully!', {
      icon: '✅',
      duration: 4000
    });
    
    if (onSessionUpdate) {
      onSessionUpdate('completed', data);
    }
  }, [onSessionUpdate]);

  const handleVitalsUpdate = useCallback((data) => {
    toast.success('Vitals recorded', {
      icon: '💓',
      duration: 2000
    });
    
    if (onSessionUpdate) {
      onSessionUpdate('vitals', data);
    }
  }, [onSessionUpdate]);

  useEffect(() => {
    if (socket && isConnected) {
      // Subscribe to therapist-specific events
      socket.on('session:started', handleSessionStarted);
      socket.on('session:completed', handleSessionCompleted);
      socket.on('session:vitals', handleVitalsUpdate);

      return () => {
        socket.off('session:started', handleSessionStarted);
        socket.off('session:completed', handleSessionCompleted);
        socket.off('session:vitals', handleVitalsUpdate);
      };
    }
  }, [socket, isConnected, handleSessionStarted, handleSessionCompleted, handleVitalsUpdate]);

  return {
    isConnected
  };
};
