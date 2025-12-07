// src/hooks/useTherapistDashboard.js
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

export const useTherapistDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('therapist_token') || localStorage.getItem('accessToken');
      const response = await fetch('/api/therapists/dashboard/overview', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setDashboardData(data.data);
      
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err.message);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  return {
    dashboardData,
    loading,
    error,
    refresh: fetchDashboardData
  };
};
